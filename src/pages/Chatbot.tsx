"use client";

import {
  Button
} from "@/components/ui/button";
import {
  Card
} from "@/components/ui/card";
import {
  Input
} from "@/components/ui/input";
import {
  ScrollArea
} from "@/components/ui/scroll-area";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"; // For dropdowns & menus
import {
  AnimatePresence,
  motion
} from "framer-motion";
import {
  Bot,
  Copy,
  Edit3,
  Image as ImageIcon,
  MessageSquare,
  MoreVertical,
  Paperclip,
  Plus,
  RefreshCw,
  Send,
  Settings,
  Share2,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

// ✅ Replace this with your real DATTU logo
import DATTU_LOGO from "/public/Dattu Image.jpeg"; // placeholder comment

/* ------------------ COLOR PALETTE ------------------ */
const PALETTE = {
  softBlue: "#2B6CB0",
  slate: "#10243A",
  warmIvory: "#F6F8FB",
  steelGray: "#E6EDF5",
  tealAccent: "#2CA3A3",
  amber: "#F6A623",
  softRed: "#E04B4B",
  green: "#1E9A61",
};

interface Message {
  id: string;
  role: "user" | "bot";
  text: string;
  time?: string;
}

/* ------------------ UTILITIES ------------------ */
function nowTime(): string {
  const d = new Date();
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });
}

// Mock bot responses for simulation
async function simulateBotResponse(prompt: string, signal?: AbortSignal) {
  const responses = [
    "Sure — I can help with that. Could you provide more details?",
    "Got it. Here's a concise plan you can follow.",
    "I understand. Next steps: analyze the dataset, filter by date, and visualize.",
    "Thanks — I'll summarize the findings and propose actions.",
    "Okay — here's a high-level suggestion tailored to your needs.",
  ];

  const wait = (ms: number) =>
    new Promise<void>((res, rej) => {
      const t = setTimeout(() => res(), ms);
      if (signal)
        signal.addEventListener("abort", () => {
          clearTimeout(t);
          rej(new DOMException("Aborted", "AbortError"));
        });
    });

  await wait(700 + Math.random() * 800);
  if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const chosen = responses[Math.floor(Math.random() * responses.length)];
  return `${chosen} (Ref: "${prompt.slice(0, 120)}${prompt.length > 120 ? "…" : ""}")`;
}

/* ------------------ MAIN COMPONENT ------------------ */
export default function ChatbotUI() {
  const [messages, setMessages] = useState<Message[]>([{
    id: "m0",
    role: "bot",
    text: "Hello! I'm DATTU — your AI assistant. How can I help you today?",
    time: nowTime()
  }]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingId, setTypingId] = useState<string | null>(null);
  const [lastPromptForRegenerate, setLastPromptForRegenerate] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /* ------------------ EFFECTS ------------------ */
  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight + 200;
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /* ------------------ MESSAGE HANDLERS ------------------ */
  const pushMessage = (m: Message) => setMessages((prev) => [...prev, m]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      role: "user",
      text: trimmed,
      time: nowTime()
    };
    pushMessage(userMsg);
    setInput("");
    setLastPromptForRegenerate(trimmed);

    const botTypingId = `t_${Date.now()}`;
    setTypingId(botTypingId);
    setIsTyping(true);

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const botText = await simulateBotResponse(trimmed, abortControllerRef.current.signal);
      const botMsg: Message = {
        id: `b_${Date.now()}`,
        role: "bot",
        text: botText,
        time: nowTime()
      };
      pushMessage(botMsg);
    } catch (err) {
      if ((err as any)?.name === "AbortError") {
        pushMessage({
          id: `b_abort_${Date.now()}`,
          role: "bot",
          text: "Generation stopped.",
          time: nowTime()
        });
      } else {
        pushMessage({
          id: `b_err_${Date.now()}`,
          role: "bot",
          text: "Sorry — something went wrong.",
          time: nowTime()
        });
      }
    } finally {
      setIsTyping(false);
      setTypingId(null);
      abortControllerRef.current = null;
    }
  };

  const stopTyping = () => {
    abortControllerRef.current?.abort();
    setIsTyping(false);
    setTypingId(null);
  };

  const regenerate = async () => {
    if (!lastPromptForRegenerate) return;
    const userMsg: Message = {
      id: `u_regen_${Date.now()}`,
      role: "user",
      text: "(regenerate) " + lastPromptForRegenerate,
      time: nowTime()
    };
    pushMessage(userMsg);

    setIsTyping(true);
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      const botText = await simulateBotResponse(lastPromptForRegenerate, abortControllerRef.current.signal);
      const botMsg: Message = {
        id: `b_regen_${Date.now()}`,
        role: "bot",
        text: botText,
        time: nowTime()
      };
      pushMessage(botMsg);
    } catch {
      pushMessage({
        id: `b_err_${Date.now()}`,
        role: "bot",
        text: "Failed to regenerate response.",
        time: nowTime()
      });
    } finally {
      setIsTyping(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard ✔️");
    } catch {
      toast.error("Unable to copy text");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* ------------------ DROPDOWN ACTIONS ------------------ */
  const handleUploadPhoto = () => toast.info("Photo uploaded ✔️ (mock)");
  const handleAttachFile = () => toast.info("File attached ✔️ (mock)");
  const handlePremadeInsert = (text: string) => setInput(text);
  const handleCopyChatLink = () => toast.success("Chat link copied ✔️");
  const handleExportPDF = () => toast.success("Exported as PDF ✔️");
  const handleDeleteChat = () => {
    if (confirm("Delete entire chat?")) {
      setMessages([]);
      toast.success("Chat deleted");
    }
  };
  const handleRenameChat = () => {
    const name = prompt("Enter new chat name:");
    if (name) toast.success("Renamed!");
  };

  /* ------------------ GROUP MESSAGES ------------------ */
  const grouped = (() => {
    const groups: Array<{ role: Message["role"]; items: Message[] }> = [];
    for (const m of messages) {
      const last = groups[groups.length - 1];
      if (!last || last.role !== m.role) groups.push({ role: m.role, items: [m] });
      else last.items.push(m);
    }
    return groups;
  })();

  /* ------------------ UI ------------------ */
  return (
    <div
      style={{
        backgroundColor: PALETTE.warmIvory,
        color: PALETTE.slate
      }}
      className="flex flex-col w-full h-full min-h-[calc(100vh-4rem)]"
    >
      {/* HEADER */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-4 border-b flex items-center justify-between"
        style={{
          borderColor: `${PALETTE.slate}20`,
          backgroundColor: PALETTE.warmIvory,
        }}
      >
        {/* Left side */}
        <div className="flex items-center gap-3">
          <div
            className="p-2 rounded-lg flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${PALETTE.softBlue}20 0%, ${PALETTE.tealAccent}20 100%)`,
              border: `1px solid ${PALETTE.softBlue}30`,
            }}
          >
            <Bot style={{ color: PALETTE.softBlue }} className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: PALETTE.slate }}>
              DATTU Chat Console
            </h1>
            <p style={{ color: `${PALETTE.slate}BF` }} className="text-sm">
              Ask Anything • Powered by Safety Intelligence
            </p>
          </div>
        </div>

        {/* Right side icons */}
        <div className="flex items-center gap-3">
          {/* Share button dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button
                variant="ghost"
                style={{ color: PALETTE.softBlue }}
                className="p-2 rounded-full hover:bg-[#E6EDF5]"
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              align="end"
              className="bg-white border shadow-lg rounded-md p-2 text-sm"
            >
              <DropdownMenu.Item
                className="flex items-center gap-2 p-2 rounded hover:bg-[#E6EDF5]"
                onClick={handleCopyChatLink}
              >
                <Copy className="w-4 h-4 text-[#2B6CB0]" /> Copy Chat Link
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="flex items-center gap-2 p-2 rounded hover:bg-[#E6EDF5]"
                onClick={handleExportPDF}
              >
                <RefreshCw className="w-4 h-4 text-[#2CA3A3]" /> Export to PDF
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>

          {/* Three dots menu */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <Button
                variant="ghost"
                className="p-2 rounded-full hover:bg-[#E6EDF5]"
                style={{ color: PALETTE.slate }}
              >
                <MoreVertical className="w-5 h-5" />
              </Button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Content
              align="end"
              className="bg-white border shadow-lg rounded-md p-2 text-sm"
            >
              <DropdownMenu.Item
                className="flex items-center gap-2 p-2 rounded hover:bg-[#E6EDF5]"
                onClick={handleDeleteChat}
              >
                <Trash2 className="w-4 h-4 text-[#E04B4B]" /> Delete Chat
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="flex items-center gap-2 p-2 rounded hover:bg-[#E6EDF5]"
                onClick={handleRenameChat}
              >
                <Edit3 className="w-4 h-4 text-[#2B6CB0]" /> Rename Chat
              </DropdownMenu.Item>
              <DropdownMenu.Item
                className="flex items-center gap-2 p-2 rounded hover:bg-[#E6EDF5]"
                onClick={() => toast("Settings opened (mock)")}
              >
                <Settings className="w-4 h-4 text-[#2CA3A3]" /> Settings
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>
      </motion.div>

      {/* Chat messages */}
      <ScrollArea className="flex-1 px-6 py-4">
        <div ref={scrollRef} className="space-y-5">
          <AnimatePresence initial={false}>
            {grouped.map((g, gi) => (
              <div key={gi} className={`${g.role === "user" ? "text-right" : ""}`}>
                {g.items.map((m) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-3 flex gap-3"
                    style={{ justifyContent: g.role === "user" ? "flex-end" : "flex-start" }}
                  >
                    {/* Avatars */}
                    {m.role === "bot" && (
                      <div
                        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${PALETTE.softBlue}20, ${PALETTE.tealAccent}20)`,
                          border: `1px solid ${PALETTE.softBlue}30`,
                        }}
                      >
                        <Bot className="w-5 h-5" style={{ color: PALETTE.softBlue }} />
                      </div>
                    )}

                    {/* Message */}
                    <Card
                      className="rounded-2xl border-none shadow max-w-[70%]"
                      style={{
                        background:
                          m.role === "user"
                            ? `linear-gradient(135deg, ${PALETTE.softBlue}, ${PALETTE.tealAccent})`
                            : PALETTE.steelGray,
                        color: m.role === "user" ? "#fff" : PALETTE.slate,
                      }}
                    >
                      <div className="p-4 text-sm">{m.text}</div>
                    </Card>

                    {m.role === "user" && (
                      <div
                        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                        style={{
                          background: `linear-gradient(135deg, ${PALETTE.softBlue}20, ${PALETTE.tealAccent}20)`,
                        }}
                      >
                        <User className="w-5 h-5" style={{ color: PALETTE.softBlue }} />
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator with DATTU logo */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 items-center"
            >
              <img
                src={DATTU_LOGO}
                alt="DATTU"
                className="w-10 h-10 rounded-full object-cover border border-[#2B6CB0]/40 shadow"
              />
              <div
                className="flex gap-1 items-center px-4 py-3 rounded-xl"
                style={{
                  backgroundColor: PALETTE.steelGray,
                  color: PALETTE.slate,
                }}
              >
                <motion.span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: PALETTE.softBlue }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: PALETTE.tealAccent }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
                <motion.span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: PALETTE.softBlue }}
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                />
                <div className="ml-2 text-sm text-[#10243A]/70">DATTU is typing...</div>
                <button
                  onClick={stopTyping}
                  className="ml-3 p-1 hover:bg-[#E6EDF5] rounded-md"
                  title="Stop"
                >
                  <X className="w-4 h-4" style={{ color: PALETTE.softRed }} />
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 py-4 border-t flex items-end gap-3"
        style={{ borderColor: `${PALETTE.slate}10`, backgroundColor: PALETTE.warmIvory }}
      >
        {/* + Menu */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              className="p-3 rounded-full hover:bg-[#E6EDF5] transition"
              style={{ color: PALETTE.softBlue }}
            >
              <Plus className="w-6 h-6" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content
            align="start"
            className="bg-white border shadow-lg rounded-md p-2 text-sm"
          >
            <DropdownMenu.Item
              className="flex items-center gap-2 p-2 rounded hover:bg-[#E6EDF5]"
              onClick={handleUploadPhoto}
            >
              <ImageIcon className="w-4 h-4 text-[#2B6CB0]" /> Upload Photo
            </DropdownMenu.Item>
            <DropdownMenu.Item
              className="flex items-center gap-2 p-2 rounded hover:bg-[#E6EDF5]"
              onClick={handleAttachFile}
            >
              <Paperclip className="w-4 h-4 text-[#2CA3A3]" /> Attach File
            </DropdownMenu.Item>

            {/* Premade texts submenu */}
            <DropdownMenu.Sub>
              <DropdownMenu.SubTrigger className="flex items-center gap-2 p-2 rounded hover:bg-[#E6EDF5]">
                <MessageSquare className="w-4 h-4 text-[#2B6CB0]" /> Premade Text
              </DropdownMenu.SubTrigger>
              <DropdownMenu.SubContent className="bg-white border shadow-lg rounded-md p-2 text-sm">
                {[
                  "Summarize this report",
                  "Generate safety improvement plan",
                  "List top 3 unsafe acts",
                  "Create visualization summary",
                ].map((txt, i) => (
                  <DropdownMenu.Item
                    key={i}
                    className="p-2 rounded hover:bg-[#E6EDF5]"
                    onClick={() => handlePremadeInsert(txt)}
                  >
                    {txt}
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.SubContent>
            </DropdownMenu.Sub>
          </DropdownMenu.Content>
        </DropdownMenu.Root>

        {/* Input field */}
        <div className="flex-1 relative">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Anything"
            disabled={isTyping}
            className="text-base py-3 px-4 rounded-xl"
            style={{
              backgroundColor: "#fff",
              border: `1px solid ${PALETTE.slate}20`,
              color: PALETTE.slate,
            }}
          />
        </div>

        <Button
          onClick={sendMessage}
          disabled={!input.trim() || isTyping}
          className="px-5 py-3 rounded-xl text-white"
          style={{
            background: `linear-gradient(90deg, ${PALETTE.softBlue}, ${PALETTE.tealAccent})`,
          }}
        >
          <Send className="w-5 h-5" />
        </Button>
      </motion.div>
    </div>
  );
}
