"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, Send, Sparkles, User, Bot } from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: string;
}

const SUGGESTIONS = [
  "Barang apa yang paling untung minggu ini?",
  "Stok apa yang harus dibeli besok?",
  "Kenapa omzet kemarin turun?",
];

export default function ChatbotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? inputValue).trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    const currentHistory = messages.map((m) => ({
      sender: m.sender,
      text: m.text,
    }));

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputValue("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: currentHistory,
        }),
      });

      const data = await res.json();
      let botReply = data.reply;
      if (!res.ok || !botReply) {
        botReply = data.error || "Maaf, terjadi kendala saat memproses jawaban. Silakan coba lagi.";
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: botReply,
        timestamp: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: "Maaf, terjadi kesalahan koneksi saat menghubungi asisten AI.",
        timestamp: new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const hasMessages = messages.length > 0;

  return (
    <div className="flex h-[calc(100vh-2rem)] flex-col justify-between overflow-hidden">
      {/* AREA KONTEN / PESAN */}
      <div className="flex-1 overflow-y-auto px-4 py-4 md:px-8">
        {!hasMessages ? (
          /* TAMPILAN AWAL PERSIS SESUAI DESAIN GAMBAR */
          <div className="flex min-h-[75vh] flex-col items-center justify-center text-center">
            {/* Logo NAVA di Tengah */}
            <div className="relative mb-8 flex items-center justify-center">
              {/* Glow Effect Lingkaran Halus */}
              <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-tr from-emerald-500/20 via-[#0d5c4b]/30 to-emerald-200/20 blur-xl" />
              <div className="relative flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#0d5c4b] shadow-xl shadow-emerald-950/20">
                <span className="text-3xl font-black tracking-wider text-white">N</span>
              </div>
            </div>

            {/* Judul & Deskripsi */}
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 md:text-3xl">
              Apa yang ingin kamu ketahui?
            </h1>
            <p className="mt-2 text-sm text-slate-500 md:text-[15px]">
              Tanyakan apa saja tentang penjualan, stok, laba, atau kondisi tokomu.
            </p>

            {/* Rekomendasi Pertanyaan (Suggestions) */}
            <div className="mt-8 flex w-full max-w-2xl flex-col gap-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handleSendMessage(SUGGESTIONS[0])}
                  className="group flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 p-4 text-left shadow-xs backdrop-blur-xs transition hover:border-[#0d5c4b]/40 hover:bg-white hover:shadow-md"
                >
                  <span className="text-xs font-semibold text-slate-700 md:text-sm">
                    {SUGGESTIONS[0]}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#0d5c4b]" />
                </button>

                <button
                  type="button"
                  onClick={() => handleSendMessage(SUGGESTIONS[1])}
                  className="group flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 p-4 text-left shadow-xs backdrop-blur-xs transition hover:border-[#0d5c4b]/40 hover:bg-white hover:shadow-md"
                >
                  <span className="text-xs font-semibold text-slate-700 md:text-sm">
                    {SUGGESTIONS[1]}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#0d5c4b]" />
                </button>
              </div>

              <div className="w-full">
                <button
                  type="button"
                  onClick={() => handleSendMessage(SUGGESTIONS[2])}
                  className="group flex w-full items-center justify-between rounded-2xl border border-slate-200/80 bg-white/80 p-4 text-left shadow-xs backdrop-blur-xs transition hover:border-[#0d5c4b]/40 hover:bg-white hover:shadow-md"
                >
                  <span className="text-xs font-semibold text-slate-700 md:text-sm">
                    {SUGGESTIONS[2]}
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-[#0d5c4b]" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* DAFTAR CHAT JIKA SUDAH ADA INTERAKSI */
          <div className="mx-auto max-w-3xl space-y-4 pb-4 pt-2">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${
                  msg.sender === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {msg.sender === "bot" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0d5c4b] text-white shadow-xs">
                    <span className="text-xs font-bold">N</span>
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs md:max-w-[75%] ${
                    msg.sender === "user"
                      ? "bg-[#0d5c4b] text-white"
                      : "border border-slate-200/80 bg-white text-slate-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <div
                    className={`mt-1 text-right text-[10px] ${
                      msg.sender === "user" ? "text-emerald-200/70" : "text-slate-400"
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {msg.sender === "user" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-200 text-slate-700">
                    <User className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#0d5c4b] text-white">
                  <span className="text-xs font-bold">N</span>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-600 [animation-delay:-0.3s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-600 [animation-delay:-0.15s]" />
                    <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-600" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* FOOTER INPUT BAR PERSIS SEPERTI DI DESAIN GAMBAR */}
      <div className="mx-auto w-full max-w-3xl px-4 pb-2">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="relative flex items-center rounded-2xl border border-slate-200/90 bg-white p-2 shadow-[0_8px_30px_rgba(15,23,42,0.04)] focus-within:border-[#0d5c4b] focus-within:ring-2 focus-within:ring-[#0d5c4b]/10"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Tanyakan sesuatu tentang tokomu..."
            className="w-full bg-transparent px-4 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
          />

          <button
            type="submit"
            disabled={!inputValue.trim()}
            aria-label="Kirim pesan"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0d5c4b] text-white shadow-xs transition hover:bg-[#0a4d40] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send className="h-4 w-4 -rotate-12" />
          </button>
        </form>

        {/* Disclaimer Teks di Bawah */}
        <p className="mt-2 text-center text-[11px] text-slate-400">
          NAVA AI dapat membuat kesalahan. Periksa kembali informasi penting.
        </p>
      </div>
    </div>
  );
}
