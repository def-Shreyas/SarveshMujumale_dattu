import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "bot";
  text: string;
}

export default function ChatbotUI() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "Hello! I'm your AI assistant. How can I help you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", text: input.trim() };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate bot response (replace with actual API call)
    setTimeout(() => {
      const botResponse: Message = {
        role: "bot",
        text: "I understand. How can I assist you further with this?",
      };
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col w-full h-full min-h-[calc(100vh-4rem)] bg-[#0f172a] text-white">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 border-b border-slate-700/50 bg-[#1e293b]/50 backdrop-blur-sm"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-linear-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30">
            <Bot className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-blue-400" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
              AI Assistant
            </h1>
            <p className="text-xs sm:text-sm text-white/80">Ask me anything</p>
          </div>
        </div>
      </motion.div>

      {/* Chat Messages */}
      <ScrollArea className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div ref={scrollRef} className="space-y-4 sm:space-y-5 lg:space-y-6">
          <AnimatePresence>
            {messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`flex gap-3 sm:gap-4 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "bot" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center"
                  >
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                  </motion.div>
                )}

                <motion.div
                  className={`max-w-[85%] sm:max-w-[75%] lg:max-w-[65%] xl:max-w-[55%] ${
                    message.role === "user" ? "order-first" : ""
                  }`}
                  whileHover={{ scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <Card
                    className={`rounded-2xl sm:rounded-3xl border-none shadow-lg ${
                      message.role === "user"
                        ? "bg-gradient-to-br from-[#38bdf8] to-[#06b6d4] text-white"
                        : "bg-[#1e293b] border border-slate-700/50 hover:border-sky-500/50 text-white"
                    } transition-all duration-300`}
                  >
                    <div className="px-4 py-3 sm:px-5 sm:py-4 lg:px-6 lg:py-5">
                      <p className="text-sm sm:text-base lg:text-lg leading-relaxed whitespace-pre-wrap break-words text-white">
                        {message.text}
                      </p>
                    </div>
                  </Card>
                  <p
                    className={`text-xs text-white/70 mt-1 px-2 ${
                      message.role === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    {message.role === "user" ? "You" : "AI Assistant"}
                  </p>
                </motion.div>

                {message.role === "user" && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-sky-500/20 to-cyan-500/20 border border-sky-500/30 flex items-center justify-center"
                  >
                    <User className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400" />
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing Indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex gap-3 sm:gap-4 justify-start"
            >
              <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              </div>
              <Card className="bg-[#1e293b] border border-slate-700/50 rounded-2xl sm:rounded-3xl">
                <div className="px-4 py-3 sm:px-5 sm:py-4 lg:px-6 lg:py-5">
                  <div className="flex gap-1.5 sm:gap-2">
                    <motion.div
                      className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-400"
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div
                      className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-400"
                      animate={{ y: [0, -8, 0] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: 0.2,
                      }}
                    />
                    <motion.div
                      className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-blue-400"
                      animate={{ y: [0, -8, 0] }}
                      transition={{
                        duration: 0.6,
                        repeat: Infinity,
                        delay: 0.4,
                      }}
                    />
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Message Input Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 lg:py-6 border-t border-slate-700/50 bg-[#1e293b]/50 backdrop-blur-sm"
      >
        <div className="flex gap-3 sm:gap-4 items-end">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              className="bg-[#0f172a] border border-slate-700/50 text-white placeholder:text-white/50 text-sm sm:text-base lg:text-lg py-5 sm:py-6 lg:py-7 px-4 sm:px-5 lg:px-6 rounded-xl sm:rounded-2xl focus-visible:border-blue-500 focus-visible:ring-blue-500/20 focus-visible:ring-2 transition-all duration-300 hover:border-slate-600"
              placeholder="Type your message..."
              disabled={isTyping}
            />
          </div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isTyping}
              className="bg-gradient-to-r from-[#38bdf8] to-[#06b6d4] text-white border-none px-5 sm:px-6 lg:px-8 py-5 sm:py-6 lg:py-7 rounded-xl sm:rounded-2xl hover:shadow-lg hover:shadow-sky-500/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed h-auto"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
            </Button>
          </motion.div>
        </div>
        <p className="text-xs text-white/70 mt-2 sm:mt-3 px-1">
          Press Enter to send, Shift+Enter for new line
        </p>
      </motion.div>
    </div>
  );
}
