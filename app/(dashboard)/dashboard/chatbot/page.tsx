"use client";

import { FormEvent, useEffect, useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; text: string };

export default function ChatbotPage() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", text: "Halo! Saya NAVA AI. Tanyakan stok, penjualan, kas, atau kasbon toko Anda." },
  ]);
  const [suggestions, setSuggestions] = useState<string[]>([
    "Produk apa yang perlu segera direstok?",
    "Bagaimana kondisi kas toko hari ini?",
  ]);
  const [isSending, setIsSending] = useState(false);

  async function submitQuestion(event: FormEvent) {
    event.preventDefault();
    const text = question.trim();
    if (!text || isSending) return;

    setQuestion("");
    setMessages((current) => [...current, { role: "user", text }]);
    setIsSending(true);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "chat", question: text }),
      });
      const payload = (await response.json()) as {
        data?: { answer: string; suggestions: string[] };
        error?: string;
      };
      if (!response.ok || !payload.data) {
        throw new Error(payload.error || "Jawaban AI gagal dimuat.");
      }
      setMessages((current) => [...current, { role: "assistant", text: payload.data!.answer }]);
      setSuggestions(payload.data.suggestions);
    } catch (error) {
      setMessages((current) => [
        ...current,
        { role: "assistant", text: error instanceof Error ? error.message : "Terjadi kesalahan." },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  useEffect(() => {
    document.title = "Chatbot | NAVA";
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">
          <Sparkles className="h-4 w-4" /> NAVA AI
        </div>
        <h1 className="mt-2 text-[28px] font-bold tracking-tight text-slate-800">Asisten toko</h1>
        <p className="mt-1 text-sm text-slate-500">Jawaban dibuat dari data toko Anda dan tidak dapat mengubah data atau menjalankan perintah.</p>
      </div>

      <div className="rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-xs">
        <div className="min-h-[360px] space-y-4">
          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === "user" ? "justify-end" : ""}`}>
              {message.role === "assistant" && <Bot className="mt-1 h-5 w-5 shrink-0 text-emerald-700" />}
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${message.role === "user" ? "bg-emerald-700 text-white" : "bg-slate-100 text-slate-700"}`}>
                {message.text}
              </div>
            </div>
          ))}
          {isSending && <div className="text-sm text-slate-400">NAVA AI sedang menganalisis data toko...</div>}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button key={suggestion} type="button" onClick={() => setQuestion(suggestion)} className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
              {suggestion}
            </button>
          ))}
        </div>

        <form onSubmit={submitQuestion} className="mt-4 flex gap-2">
          <input value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={1200} placeholder="Tanyakan kondisi toko..." className="min-w-0 flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
          <button type="submit" disabled={isSending || !question.trim()} aria-label="Kirim pertanyaan" className="rounded-xl bg-emerald-700 px-4 text-white disabled:opacity-50">
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
