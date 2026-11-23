"use client";

import { useEffect, useState } from "react";
import { Download, TrendingUp, Wallet, Package, ReceiptText, Sparkles, ShieldCheck } from "lucide-react";

import type { DashboardSummary } from "@/services/dashboard.service";
import type { FinanceSummary } from "@/types/finance.type";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function exportCsv(dashboard: DashboardSummary, finance: FinanceSummary) {
  const rows = [
    ["Metrik", "Nilai"],
    ["Omzet hari ini", String(dashboard.omzetToday)],
    ["Laba bersih hari ini", String(dashboard.labaBersihToday)],
    ["Jumlah transaksi hari ini", String(dashboard.transaksiToday)],
    ["Saldo kas", String(finance.currentBalance)],
    ["Total pemasukan", String(finance.totalIncome)],
    ["Total pengeluaran", String(finance.totalExpense)],
    ["Piutang aktif", String(finance.totalPiutangAktif)],
  ];
  const csv = rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(",")).join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `laporan-nava-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReportPage() {
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [aiReport, setAiReport] = useState<{
    headline: string;
    summary: string;
    opportunities: string[];
    risks: string[];
  } | null>(null);
  const [aiError, setAiError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [dashboardResponse, financeResponse, aiResponse] = await Promise.all([
          fetch("/api/dashboard", { cache: "no-store" }),
          fetch("/api/finance", { cache: "no-store" }),
          fetch("/api/ai?mode=report", { cache: "no-store" }),
        ]);
        if (dashboardResponse.ok) setDashboard(await dashboardResponse.json());
        if (financeResponse.ok) setFinance(await financeResponse.json());
        if (aiResponse.ok) {
          const aiPayload = await aiResponse.json();
          setAiReport(aiPayload.data ?? null);
        } else {
          const aiPayload = await aiResponse.json();
          setAiError(aiPayload.error || "Insight laporan belum tersedia.");
        }
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  const cards = [
    { label: "Omzet hari ini", value: formatCurrency(dashboard?.omzetToday ?? 0), icon: TrendingUp, color: "text-emerald-700 bg-emerald-50" },
    { label: "Laba bersih", value: formatCurrency(dashboard?.labaBersihToday ?? 0), icon: Wallet, color: "text-blue-700 bg-blue-50" },
    { label: "Saldo kas", value: formatCurrency(finance?.currentBalance ?? 0), icon: ReceiptText, color: "text-orange-700 bg-orange-50" },
    { label: "Piutang aktif", value: formatCurrency(finance?.totalPiutangAktif ?? 0), icon: Package, color: "text-purple-700 bg-purple-50" },
  ];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Analitik toko</div>
          <h1 className="mt-1 text-[28px] font-bold text-slate-800">Laporan</h1>
        </div>
        <button
          type="button"
          disabled={!dashboard || !finance}
          onClick={() => dashboard && finance && exportCsv(dashboard, finance)}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          <Download className="h-4 w-4" /> Unduh CSV
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="rounded-[24px] border border-slate-200/80 bg-white p-5">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></div>
            <div className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400">{label}</div>
            <div className="mt-1 text-xl font-extrabold text-slate-800">{isLoading ? "Memuat..." : value}</div>
          </div>
        ))}
      </div>

      <section className="relative overflow-hidden rounded-[28px] border border-purple-100 bg-gradient-to-br from-white via-white to-purple-50/60 p-6">
        <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-purple-100/40 blur-3xl" />
        <div className="relative flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-purple-100 text-purple-700">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-purple-600">NAVA AI Insight</div>
                <h2 className="mt-1 text-lg font-bold text-slate-800">
                  {aiReport?.headline || "Analisis performa toko"}
                </h2>
              </div>
              <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600" aria-label="Output terverifikasi" />
            </div>

            {aiReport ? (
              <>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{aiReport.summary}</p>
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-700">Peluang</h3>
                    <ul className="mt-2 space-y-2">
                      {aiReport.opportunities.map((item) => (
                        <li key={item} className="flex gap-2 text-sm text-slate-700">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-700">Risiko</h3>
                    <ul className="mt-2 space-y-2">
                      {aiReport.risks.map((item) => (
                        <li key={item} className="flex gap-2 text-sm text-slate-700">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              <p className="mt-3 text-sm text-slate-500">
                {isLoading ? "NAVA AI sedang menganalisis laporan..." : aiError || "Insight laporan belum tersedia."}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[28px] border border-slate-200/80 bg-white p-6">
          <h2 className="text-base font-bold text-slate-800">Penjualan 7 hari</h2>
          <div className="mt-5 space-y-3">
            {(dashboard?.salesData["7 Hari"] ?? []).map((item) => (
              <div key={item.label} className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm">
                <span className="text-slate-500">{item.label}</span>
                <span className="font-bold text-slate-800">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </section>
        <section className="rounded-[28px] border border-slate-200/80 bg-white p-6">
          <h2 className="text-base font-bold text-slate-800">Produk yang perlu diperhatikan</h2>
          <div className="mt-5 space-y-3">
            {(dashboard?.lowStockProducts ?? []).map((product) => (
              <div key={product.id} className="flex items-center justify-between border-b border-slate-100 pb-3 text-sm">
                <span className="text-slate-700">{product.name}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${product.status === "habis" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>{product.stock}</span>
              </div>
            ))}
            {(dashboard?.lowStockProducts ?? []).length === 0 && <p className="text-sm text-slate-400">Tidak ada produk yang menipis atau habis.</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
