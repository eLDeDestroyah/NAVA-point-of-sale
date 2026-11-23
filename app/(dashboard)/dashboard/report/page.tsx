"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Moon, Sparkles, Sun } from "lucide-react";
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from "chart.js";
import { Line } from "react-chartjs-2";

import type { DashboardSummary } from "@/services/dashboard.service";
import type { FinanceSummary } from "@/types/finance.type";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
);

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

type AiReport = {
  headline: string;
  summary: string;
  opportunities: string[];
  risks: string[];
};

export default function ReportPage() {
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [finance, setFinance] = useState<FinanceSummary | null>(null);
  const [aiReport, setAiReport] = useState<AiReport | null>(null);
  const [aiError, setAiError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<"7 Hari" | "30 Hari" | "3 Bulan">("7 Hari");

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
          const payload = await aiResponse.json();
          setAiReport(payload.data ?? null);
        } else {
          const payload = await aiResponse.json();
          setAiError(payload.error || "Insight laporan belum tersedia.");
        }
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, []);

  const salesData = dashboard?.salesData[chartPeriod] ?? [];

  const chartData = useMemo(
    () => ({
      labels: salesData.map((item) => item.label),
      datasets: [
        {
          label: "Penjualan",
          data: salesData.map((item) => item.value),
          borderColor: "#0b8f65",
          backgroundColor: "rgba(11, 143, 101, 0.10)",
          borderWidth: 3,
          pointBackgroundColor: "#ffffff",
          pointBorderColor: "#0b8f65",
          pointBorderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 7,
          tension: 0.38,
          fill: true,
        },
      ],
    }),
    [salesData],
  );

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: "index" as const,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#12372c",
          titleColor: "#a7f3d0",
          bodyColor: "#ffffff",
          padding: 12,
          cornerRadius: 10,
          displayColors: false,
          callbacks: {
            label: (context: { parsed: { y: number | null } }) =>
              formatCurrency(context.parsed.y ?? 0),
          },
        },
      },
      scales: {
        x: {
          grid: { display: false, drawBorder: false },
          ticks: {
            color: "#94a3b8",
            font: { size: 11, weight: 600 },
          },
          border: { display: false },
        },
        y: {
          beginAtZero: true,
          border: { display: false },
          grid: {
            color: "#edf2ef",
            drawBorder: false,
          },
          ticks: {
            color: "#94a3b8",
            font: { size: 10, weight: 600 },
            callback: (value: number | string) => {
              const amount = Number(value);
              if (amount >= 1_000_000) return `${amount / 1_000_000} jt`;
              if (amount >= 1_000) return `${amount / 1_000} rb`;
              return String(amount);
            },
          },
        },
      },
    }),
    [],
  );

  const debtors = finance?.debtors ?? [];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-emerald-800">
            {dashboard?.shopName || "NAVA MART"}
          </div>
          <h1 className="mt-1 text-[28px] font-bold tracking-tight text-slate-800">
            Selamat pagi, {dashboard?.userName || "Pemilik Toko"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Tema terang"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-emerald-700 shadow-sm"
          >
            <Sun className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Tema gelap"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 shadow-sm"
          >
            <Moon className="h-4 w-4" />
          </button>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-700 text-xs font-black text-white shadow-sm">
            {(dashboard?.userName || "AS").slice(0, 2).toUpperCase()}
          </div>
        </div>
      </div>

      <section className="rounded-[28px] border border-slate-200/80 bg-white px-5 py-5 shadow-[0_8px_30px_rgba(15,23,42,0.04)] sm:px-6">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Penjualan</h2>
            <p className="mt-0.5 text-xs text-slate-400">Perbandingan pendapatan berdasarkan periode</p>
          </div>
          <div className="flex shrink-0 rounded-full bg-slate-100 p-1" aria-label="Filter periode laporan">
            {(["7 Hari", "30 Hari", "3 Bulan"] as const).map((period) => (
              <button
                key={period}
                type="button"
                onClick={() => setChartPeriod(period)}
                aria-pressed={chartPeriod === period}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  chartPeriod === period
                    ? "bg-[#0b8f65] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>
        <div className="flex h-[280px] w-full">
          {isLoading ? (
            <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
              Memuat grafik penjualan...
            </div>
          ) : (
            <Line data={chartData} options={chartOptions} />
          )}
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_8px_30px_rgba(15,23,42,0.04)]">
        <div>
          <h2 className="text-[18px] font-bold text-slate-800">Ringkasan Kasbon</h2>
          <p className="mt-1 text-xs text-slate-400">Piutang pelanggan yang masih aktif</p>
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">
                <th className="pb-3 pr-4">Pelanggan</th>
                <th className="pb-3 pr-4">Total Kasbon</th>
                <th className="pb-3 pr-4">Terbayar</th>
                <th className="pb-3">Sisa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {debtors.map((debtor) => (
                <tr key={debtor.id} className="text-sm">
                  <td className="py-4 pr-4 font-semibold text-slate-700">{debtor.name}</td>
                  <td className="py-4 pr-4 text-slate-600">{formatCurrency(debtor.total_price)}</td>
                  <td className="py-4 pr-4 text-slate-600">{formatCurrency(debtor.paid)}</td>
                  <td className="py-4 font-semibold text-slate-700">{formatCurrency(debtor.remaining)}</td>
                </tr>
              ))}
              {debtors.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-slate-400">
                    Tidak ada kasbon aktif saat ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-[28px] border border-purple-100 bg-gradient-to-br from-white to-purple-50/50 p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800">
                {aiReport?.headline || "NAVA AI Insight"}
              </h2>
              <BarChart3 className="h-4 w-4 text-purple-500" />
            </div>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {aiReport?.summary || (isLoading ? "Menganalisis laporan toko..." : aiError)}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
