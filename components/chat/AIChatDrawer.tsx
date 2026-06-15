"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, RefreshCw, MessageSquare, Loader } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AIChatDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    email: string | null;
    phoneNumber: string | null;
    walletAddress: string | null;
  };
}

export function AIChatDrawer({ isOpen, onClose, user }: AIChatDrawerProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello! I am your Paycon AI Copilot. I can help you fetch your Celo balances, view bills, check savings goals, or simulate payments. How can I help you today?`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isSending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/paycon/n8n-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to get response from AI");
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "No response received.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error("Chat error:", error);
      toast.error(error.message || "Something went wrong. Please try again.");
      
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I'm having trouble connecting to my brain right now. Please check n8n connection.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950 z-50 cursor-pointer"
          />

          {/* Drawer Container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-white/5 shadow-2xl z-50 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/5 bg-slate-950/50 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="relative w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Bot className="h-5 w-5" />
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Paycon AI Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-medium">via n8n Engine</span>
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-100 hover:bg-slate-700/60 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/40">
              {messages.map((msg) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 max-w-[85%] ${
                      isUser ? "ml-auto flex-row-reverse" : "mr-auto"
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                        isUser
                          ? "bg-slate-800 border-slate-700 text-slate-300"
                          : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      }`}
                    >
                      {isUser ? <User className="h-4.5 w-4.5" /> : <Bot className="h-4.5 w-4.5" />}
                    </div>

                    {/* Bubble */}
                    <div>
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed whitespace-pre-wrap ${
                          isUser
                            ? "bg-emerald-600/90 text-white rounded-tr-none shadow-[0_2px_8px_rgba(16,185,129,0.2)]"
                            : "bg-slate-800/80 border border-white/5 text-slate-200 rounded-tl-none"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-slate-500 mt-1 block px-1">
                        {msg.timestamp.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}

              {isSending && (
                <div className="flex gap-3 max-w-[85%] mr-auto">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Loader className="h-4.5 w-4.5 animate-spin" />
                  </div>
                  <div className="bg-slate-800/50 border border-white/5 text-slate-400 p-3 rounded-2xl rounded-tl-none text-xs flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    <span className="ml-1 text-[11px]">AI Copilot is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Panel */}
            <form
              onSubmit={handleSend}
              className="p-3 border-t border-white/5 bg-slate-950/80 backdrop-blur-xl flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask AI to pay a bill or check goals..."
                disabled={isSending}
                className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 disabled:opacity-50 transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-40 disabled:hover:bg-emerald-600 transition-all flex items-center justify-center"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
