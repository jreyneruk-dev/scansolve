"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Headphones, X, Send, Loader2, CheckCircle, Mail, MessageCircle, ChevronDown } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type Mode = "chat" | "email";

const WELCOME_MESSAGE: Message = {
  role: "assistant",
  content: "Hi! I'm the ScanSolve assistant. Ask me anything about how the platform works, setting up QR labels, managing issues, or getting started. I'm here to help!",
};

export function SupportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<Mode>("chat");

  // Chat state
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [inputText, setInputText] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Email state
  const [emailForm, setEmailForm] = useState({ name: "", email: "", message: "" });
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isChatLoading]);

  // Focus input when switching to chat mode
  useEffect(() => {
    if (isOpen && mode === "chat") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, mode]);

  const sendChatMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text || isChatLoading) return;

    const userMessage: Message = { role: "user", content: text };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText("");
    setIsChatLoading(true);
    setChatError(null);

    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      const data = await res.json();

      if (!res.ok) {
        setChatError(data.error ?? "Something went wrong. Please try again.");
      } else {
        setMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
      }
    } catch {
      setChatError("Connection error. Please check your internet and try again.");
    } finally {
      setIsChatLoading(false);
    }
  }, [inputText, isChatLoading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendChatMessage();
    }
  };

  const sendEmail = async () => {
    setIsEmailLoading(true);
    setEmailError(null);

    try {
      const res = await fetch("/api/support/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailForm),
      });

      const data = await res.json();

      if (!res.ok) {
        setEmailError(data.error ?? "Failed to send. Please try again.");
      } else {
        setEmailSent(true);
      }
    } catch {
      setEmailError("Connection error. Please email support@scansolve.co directly.");
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end gap-3">
      {/* Panel */}
      {isOpen && (
        <div
          className="w-[calc(100vw-2rem)] sm:w-[360px] max-h-[520px] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
          style={{ maxHeight: "min(520px, calc(100dvh - 100px))" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                <Headphones className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-semibold text-white text-sm">ScanSolve Support</span>
            </div>
            <button
              onClick={handleClose}
              aria-label="Close support chat"
              className="flex h-7 w-7 items-center justify-center rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors"
            >
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>

          {/* Mode tabs */}
          <div className="flex border-b border-slate-100 flex-shrink-0">
            <button
              onClick={() => setMode("chat")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                mode === "chat"
                  ? "text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Chat with AI
            </button>
            <button
              onClick={() => setMode("email")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
                mode === "email"
                  ? "text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50/50"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Mail className="h-3.5 w-3.5" />
              Email Us
            </button>
          </div>

          {/* Chat mode */}
          {mode === "chat" && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                        msg.role === "user"
                          ? "bg-indigo-600 text-white rounded-br-sm"
                          : "bg-slate-100 text-slate-800 rounded-bl-sm"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {/* Loading dots */}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3">
                      <div className="flex gap-1 items-center h-4">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Error */}
                {chatError && (
                  <div className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                    {chatError}
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-3 border-t border-slate-100 flex-shrink-0">
                <div className="flex gap-2 items-end">
                  <textarea
                    ref={inputRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask a question…"
                    rows={1}
                    className="flex-1 resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[44px] max-h-[120px] overflow-y-auto"
                    style={{ height: "auto" }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = "auto";
                      target.style.height = `${Math.min(target.scrollHeight, 120)}px`;
                    }}
                  />
                  <button
                    onClick={sendChatMessage}
                    disabled={!inputText.trim() || isChatLoading}
                    aria-label="Send message"
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  >
                    {isChatLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5 text-center">
                  Press Enter to send · Shift+Enter for new line
                </p>
              </div>
            </>
          )}

          {/* Email mode */}
          {mode === "email" && (
            <div className="flex-1 overflow-y-auto p-4 min-h-0">
              {emailSent ? (
                <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                    <CheckCircle className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">Message sent!</p>
                    <p className="text-xs text-slate-500 mt-1">
                      We&apos;ll get back to you at{" "}
                      <span className="font-medium">{emailForm.email}</span> within one business day.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setEmailSent(false);
                      setEmailForm({ name: "", email: "", message: "" });
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-700 font-medium mt-2"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Your name
                    </label>
                    <input
                      type="text"
                      value={emailForm.name}
                      onChange={(e) => setEmailForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Jane Smith"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Your email
                    </label>
                    <input
                      type="email"
                      value={emailForm.email}
                      onChange={(e) => setEmailForm((f) => ({ ...f, email: e.target.value }))}
                      placeholder="jane@yourcompany.com"
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent min-h-[44px]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      How can we help?
                    </label>
                    <textarea
                      value={emailForm.message}
                      onChange={(e) => setEmailForm((f) => ({ ...f, message: e.target.value }))}
                      placeholder="Describe your question or issue…"
                      rows={4}
                      className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>

                  {emailError && (
                    <div className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2">
                      {emailError}
                    </div>
                  )}

                  <button
                    onClick={sendEmail}
                    disabled={
                      isEmailLoading ||
                      !emailForm.name.trim() ||
                      !emailForm.email.trim() ||
                      !emailForm.message.trim()
                    }
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[44px]"
                  >
                    {isEmailLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Send message
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-slate-400 text-center">
                    Or email us directly at{" "}
                    <a
                      href="mailto:support@scansolve.co"
                      className="text-indigo-500 hover:text-indigo-600"
                    >
                      support@scansolve.co
                    </a>
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Trigger button */}
      <button
        onClick={() => setIsOpen((o) => !o)}
        aria-label={isOpen ? "Close support chat" : "Open support chat"}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 hover:bg-emerald-600 hover:shadow-emerald-500/50 hover:scale-105 active:scale-95 transition-all duration-150 flex-shrink-0"
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <Headphones className="h-6 w-6" />
        )}
      </button>
    </div>
  );
}
