"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart2,
  CheckCircle2,
  MessageSquareText,
  Package,
  Settings,
  ShoppingBag,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DashboardSummary } from "@/services/dashboard.service";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

const QUICK_ACCESS = [
  { label: "Kasir", sub: "Mulai transaksi", icon: ShoppingBag, href: "/dashboard/cashier", color: "text-emerald-600 bg-emerald-50" },
  { label: "Produk", sub: "Kelola stok", icon: Package, href: "/dashboard/product", color: "text-blue-600 bg-blue-50" },
  { label: "Keuangan", sub: "Lihat detail", icon: Wallet, href: "/dashboard/finance", color: "text-orange-500 bg-orange-50" },
  { label: "Laporan", sub: "Lihat analitik", icon: BarChart2, href: "/dashboard", color: "text-purple-600 bg-purple-50" },
  { label: "Chatbot", sub: "Fitur pintar", icon: MessageSquareText, href: "/dashboard", color: "text-sky-600 bg-sky-50" },
  { label: "Pengaturan", sub: "Lihat detail", icon: Settings, href: "/dashboard", color: "text-slate-500 bg-slate-100" },
];

function LineChart({ data }: { data: { label: string; value: number }[] }) {
  const chartData = (data && data.length > 0 ? data : [{ label: "-", value: 0 }]).map((d) => ({
    name: d.label,
    omzet: d.value,
  }));

  const formatYAxis = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}jt`;
    if (v >= 1_000) return `${Math.round(v / 1_000)}rb`;
    return String(v);
  };

  const formatTooltip = (v: number) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

  return (
    <ResponsiveContainer width="100%" height={160}>
      <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#0b5c46" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#0b5c46" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="4 3" stroke="#f1f5f9" vertical={false} />
        <XAxis
          dataKey="name"
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={formatYAxis}
          tick={{ fontSize: 10, fill: "#94a3b8" }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip
          formatter={(v) => {
            const num = typeof v === "number" ? v : Number(v ?? 0);
            return [formatTooltip(num), "Omzet"];
          }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e2e8f0",
            fontSize: 12,
            boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
          }}
        />
        <Area
          type="monotone"
          dataKey="omzet"
          stroke="#0b5c46"
          strokeWidth={2.5}
          fill="url(#areaGrad)"
          dot={{ r: 4, fill: "#fff", stroke: "#0b5c46", strokeWidth: 2 }}
          activeDot={{ r: 5, fill: "#0b5c46" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState<"7 Hari" | "30 Hari" | "3 Bulan">("7 Hari");

  useEffect(() => {
    async function loadData() {
      try {
        setIsLoading(true);
        const res = await fetch("/api/dashboard", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        }
      } catch (err) {
        console.error("Gagal memuat dashboard:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const omzetToday = summary?.omzetToday ?? 0;
  const labaBersihToday = summary?.labaBersihToday ?? 0;
  const transaksiToday = summary?.transaksiToday ?? 0;
  const rataRataToday = summary?.rataRataToday ?? 0;
  const targetHarian = summary?.targetHarian ?? 60;
  const persentaseTarget = summary?.persentaseTarget ?? 0;

  const currentChartData = summary?.salesData?.[chartPeriod] ?? [];

  return (
    <div className="mx-auto max-w-[1600px] space-y-6 pb-10">
      {/* ── HEADER ── */}
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-800">
          {summary?.shopName || "NAVA MART"}
        </div>
        <h1 className="mt-1 text-[28px] font-bold tracking-tight text-slate-800">
          Selamat pagi, {summary?.userName || "Pemilik Toko"}
        </h1>
      </div>

      {/* ── ROW 1: Hero Laba Bersih + 2 side cards ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Hero Card (Laba Bersih) */}
        <div className="relative col-span-1 overflow-hidden rounded-[28px] bg-[#0b5c46] p-6 text-white shadow-[0_12px_40px_rgba(11,92,70,0.22)] lg:col-span-2">
          <div className="absolute right-6 top-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
            <TrendingUp className="h-6 w-6 text-white/80" />
          </div>

          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-200/80">
            Laba Bersih Hari Ini (Harga Jual - Harga Beli)
          </div>
          <div className="mt-2 text-[36px] font-extrabold tracking-tight">
            {isLoading ? "Memuat..." : formatCurrency(labaBersihToday)}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/20 px-2.5 py-1 font-bold text-emerald-200">
              <ArrowUpRight className="h-3 w-3" />
              +12,4%
            </span>
            <span className="text-emerald-100/60">dibanding kemarin</span>
          </div>

          {/* 3 mini stats */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: "Omzet", value: formatCurrency(omzetToday) },
              { label: "Transaksi", value: String(transaksiToday) },
              { label: "Rata-rata", value: formatCurrency(rataRataToday) },
            ].map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-emerald-200/70">
                  {s.label}
                </div>
                <div className="mt-1 text-base font-bold">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: 2 stacked cards */}
        <div className="flex flex-col gap-4">
          {/* Laba Bersih Card */}
          <div className="flex flex-1 flex-col justify-between rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Laba Bersih
                </div>
                <div className="mt-1.5 text-2xl font-extrabold text-slate-800">
                  {formatCurrency(labaBersihToday)}
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50">
                <Wallet className="h-5 w-5 text-orange-500" />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <ArrowUpRight className="h-3.5 w-3.5" />
              8,2% dari kemarin
            </div>
          </div>

          {/* Transaksi Card */}
          <div className="flex flex-1 flex-col justify-between rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-xs">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Transaksi
                </div>
                <div className="mt-1.5 text-2xl font-extrabold text-slate-800">
                  {transaksiToday}
                </div>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50">
                <BarChart2 className="h-5 w-5 text-blue-500" />
              </div>
            </div>
            <div className="mt-3">
              <div className="mb-1.5 flex justify-between text-[11px] text-slate-400">
                <span>Target harian: {targetHarian}</span>
                <span className="font-semibold text-slate-600">
                  {persentaseTarget}%
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-[#0b5c46] transition-all"
                  style={{ width: `${persentaseTarget}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ROW 2: Sales Chart + AI Summary ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Chart */}
        <div className="col-span-1 rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-bold text-slate-800">Penjualan</h2>
              <p className="text-xs text-slate-400">
                Performa omzet{" "}
                {chartPeriod === "7 Hari"
                  ? "7 hari terakhir"
                  : chartPeriod === "30 Hari"
                  ? "30 hari terakhir"
                  : "3 bulan terakhir"}
              </p>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 p-1">
              {(["7 Hari", "30 Hari", "3 Bulan"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setChartPeriod(p)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    chartPeriod === p
                      ? "bg-[#0b5c46] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <LineChart data={currentChartData} />
          </div>
        </div>

        {/* AI Summary */}
        <div className="flex flex-col rounded-[28px] border border-purple-100 bg-gradient-to-br from-white to-purple-50/40 p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100">
              <Sparkles className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-[10px] font-bold tracking-widest text-purple-500">NAVA AI</span>
          </div>
          <h3 className="mt-3 text-sm font-bold text-slate-800">Ringkasan dari Asisten</h3>
          <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
            {summary?.assistantSummary?.description ||
              "Penjualan toko terpantau aktif. Pastikan stok barang yang menipis segera dilakukan kulakan."}
          </p>
          <div className="mt-4 flex items-start gap-2.5 rounded-2xl bg-amber-50 px-3.5 py-3 border border-amber-100">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <p className="text-xs font-semibold text-amber-700">
              Potensi kehilangan omzet{" "}
              <span className="text-amber-800">
                {formatCurrency(summary?.assistantSummary?.potentialLoss || 320000)}
              </span>
            </p>
          </div>
          <Link
            href="/dashboard/product"
            className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#0b5c46] hover:underline"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            Lihat daftar kulakan
          </Link>
        </div>
      </div>

      {/* ── ROW 3: Quick Access ── */}
      <div className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-800">Akses cepat</h2>
            <p className="text-xs text-slate-400">Semua kebutuhan toko dalam satu tempat</p>
          </div>
          <span className="text-xs font-bold text-emerald-700">
            Semua fitur <ArrowRight className="inline-block h-3.5 w-3.5" />
          </span>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {QUICK_ACCESS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group flex flex-col items-center gap-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-4 text-center transition hover:border-slate-200 hover:bg-white hover:shadow-sm active:scale-[0.97]"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${item.color}`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-800">{item.label}</div>
                <div className="mt-0.5 text-[10px] text-emerald-600">{item.sub}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ── ROW 4: Low Stock + Alerts ── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Low stock table */}
        <div className="col-span-1 rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-xs lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">Stok Perlu Dikulak</h2>
              <p className="text-xs text-slate-400">Prioritas berdasarkan kecepatan penjualan</p>
            </div>
            <Link
              href="/dashboard/product"
              className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
            >
              Lihat semua <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="pb-3">Produk</th>
                  <th className="pb-3">Kategori</th>
                  <th className="pb-3">Sisa</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(summary?.lowStockProducts ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-xs text-slate-400">
                      Semua stok produk saat ini dalam kondisi aman.
                    </td>
                  </tr>
                ) : (
                  summary?.lowStockProducts.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="py-3 font-semibold text-emerald-700">{p.name}</td>
                      <td className="py-3 text-xs text-slate-500">{p.category}</td>
                      <td className="py-3 text-xs text-slate-700">{p.stock}</td>
                      <td className="py-3">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            p.status === "habis"
                              ? "bg-red-100 text-red-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {p.status === "habis" ? "Habis" : "Menipis"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts */}
        <div className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-800">Yang perlu kamu tahu</h2>
          <p className="text-xs text-slate-400">Peringatan penting hari ini</p>
          <div className="mt-5 space-y-3">
            {(summary?.alerts ?? []).map((a, idx) => (
              <div
                key={idx}
                className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-100 p-3.5 transition hover:bg-slate-50"
              >
                <div
                  className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                    a.type === "danger"
                      ? "bg-red-100"
                      : a.type === "warning"
                      ? "bg-amber-100"
                      : "bg-emerald-100"
                  }`}
                >
                  {a.type === "success" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle
                      className={`h-4 w-4 ${
                        a.type === "danger" ? "text-red-500" : "text-amber-500"
                      }`}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-800">{a.title}</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">{a.desc}</div>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-slate-300" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ROW 5: Recent Transactions ── */}
      <div className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-bold text-slate-800">Transaksi Terakhir</h2>
            <p className="text-xs text-slate-400">Diperbarui secara real-time</p>
          </div>
          <Link
            href="/dashboard/cashier"
            className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:underline"
          >
            Lihat semua <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="pb-3">ID</th>
                <th className="pb-3">Waktu</th>
                <th className="pb-3">Pelanggan</th>
                <th className="pb-3">Metode</th>
                <th className="pb-3 text-right">Total</th>
                <th className="pb-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(summary?.recentTransactions ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-xs text-slate-400">
                    Belum ada riwayat transaksi.
                  </td>
                </tr>
              ) : (
                summary?.recentTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 font-mono text-xs font-bold text-slate-700">
                      #{t.id}
                    </td>
                    <td className="py-3.5 text-xs text-slate-500">{t.time}</td>
                    <td className="py-3.5 text-xs font-semibold text-slate-700">{t.customer}</td>
                    <td className="py-3.5 text-xs text-slate-500">{t.method}</td>
                    <td className="py-3.5 text-right text-xs font-bold text-slate-800">
                      {formatCurrency(t.total)}
                    </td>
                    <td className="py-3.5 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                          t.status === "lunas"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-rose-100 text-rose-700"
                        }`}
                      >
                        {t.status === "lunas" ? "Lunas" : "Kasbon"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
