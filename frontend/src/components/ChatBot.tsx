import { useState, useRef, useEffect } from "react";
import { sendChatMessage, analyzeFile } from "../lib/api";

interface Message {
  role: "user" | "assistant";
  content: string;
  pdfUrl?: string;
}

export default function Chatbot() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am DATTU. How can I help you today?",
    },
  ]);
  const [userInput, setUserInput] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Main Send Logic
  const sendMessage = async () => {
    if (!userInput.trim() && !file) return;

    const userMessage: Message = {
      role: "user",
      content: userInput || `Uploaded: ${file?.name}`,
    };

    setMessages((prev) => [...prev, userMessage]);

    const historyForBackend = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setUserInput("");

    // ---------- FILE MODE ----------
    if (file) {
      const uploadedFile = file;
      setFile(null);

      // Show loading bubble
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Analyzing file…" },
      ]);

      try {
        const result = await analyzeFile(uploadedFile);

        const formatted = `
📄 **Summary:**\n${result.summary}
        `;

        const replyMessage: Message = {
          role: "assistant",
          content: formatted,
          pdfUrl: result.report_url, // include report URL
        };

        // Replace loading bubble
        setMessages((prev) => [...prev.slice(0, -1), replyMessage]);
      } catch (error) {
        setMessages((prev) => [
          ...prev.slice(0, -1),
          { role: "assistant", content: "Error analyzing file." },
        ]);
      }

      return;
    }

    // ---------- TEXT MODE ----------
    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "DATTU is thinking…" },
    ]);

    try {
      const reply = await sendChatMessage(userInput, historyForBackend);

      // Handle both string and object responses
      let content = "";
      if (typeof reply === "string") {
        content = reply;
      } else if (
        typeof reply === "object" &&
        reply !== null &&
        "answer" in reply
      ) {
        // Extract answer from the structured response
        content = reply.answer || "No response";
      } else {
        content = JSON.stringify(reply);
      }

      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "assistant",
          content: "Error contacting DATTU backend.",
        },
      ]);
    }
  };

  return (
    <div className="flex flex-col h-screen max-h-screen bg-gray-100">
      {/* HEADER */}
      <header className="flex-none bg-white border-b px-6 py-4 shadow-sm font-bold text-xl text-[#6e0a69]">
        DATTU Safety Chat
      </header>

      {/* CHAT WINDOW */}
      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex ${
              msg.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-lg px-4 py-3 rounded-xl shadow-sm whitespace-pre-line ${
                msg.role === "user"
                  ? "bg-[#6e0a69] text-white"
                  : "bg-white border text-gray-800"
              }`}
            >
              {msg.content}

              {/* Show PDF Download Button */}
              {msg.pdfUrl && (
                <a
                  href={`http://localhost:8000/${msg.pdfUrl}`}
                  target="_blank"
                  className="block mt-3 text-blue-600 underline"
                >
                  📥 Download Report PDF
                </a>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* INPUT AREA */}
      <footer className="flex-none p-4 bg-white border-t">
        <div className="flex items-center gap-2">
          {/* FILE UPLOAD BUTTON */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 bg-gray-200 rounded-lg"
          >
            📎
          </button>

          <input
            type="file"
            accept=".pdf,.xlsx,.csv,.docx"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) {
                setFile(f);
                setUserInput(f.name);
              }
            }}
          />

          {/* INPUT FIELD */}
          <input
            className="flex-1 border rounded-lg py-2 px-4 outline-none focus:border-[#6e0a69]"
            placeholder="Ask DATTU something..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />

          {/* SEND BUTTON */}
          <button
            onClick={sendMessage}
            className="px-4 py-2 bg-[#6e0a69] text-white rounded-lg"
          >
            Send
          </button>
        </div>
      </footer>
    </div>
  );
}
