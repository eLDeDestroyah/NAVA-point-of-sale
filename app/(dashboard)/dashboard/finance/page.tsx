"use client";

import { useEffect, useState } from "react";
import { Check, Plus, Search, Wallet, X } from "lucide-react";
import type { BuyerDebt, CashRecord, FinanceSummary } from "@/types/finance.type";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<"riwayat" | "kasbon">("riwayat");
  const [filterType, setFilterType] = useState<"semua" | "masuk" | "keluar">("semua");
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Tambah Catatan Keuangan (Masuk / Keluar)
  const [isAddMoneyModalOpen, setIsAddMoneyModalOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"masuk" | "keluar">("masuk");
  const [nominalInput, setNominalInput] = useState("");
  const [keteranganInput, setKeteranganInput] = useState("");
  const [isSubmittingMoney, setIsSubmittingMoney] = useState(false);

  // Modal Bayar Cicilan Kasbon
  const [selectedDebtor, setSelectedDebtor] = useState<BuyerDebt | null>(null);
  const [installmentNominal, setInstallmentNominal] = useState("");
  const [isSubmittingInstallment, setIsSubmittingInstallment] = useState(false);

  // Modal Tambah Kasbon Baru
  const [isAddDebtorModalOpen, setIsAddDebtorModalOpen] = useState(false);
  const [newDebtorName, setNewDebtorName] = useState("");
  const [newDebtorAmount, setNewDebtorAmount] = useState("");
  const [newDebtorPaid, setNewDebtorPaid] = useState("");
  const [isSubmittingDebtor, setIsSubmittingDebtor] = useState(false);

  async function loadFinanceData() {
    try {
      setIsLoading(true);
      const res = await fetch("/api/finance", { cache: "no-store" });
      const data = await res.json();
      if (res.ok) {
        setSummary(data);
      }
    } catch (error) {
      console.error("Gagal mengambil data keuangan:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadFinanceData();
  }, []);

  // Handle Submit Tambah Catatan Uang
  async function handleAddMoney(e: React.FormEvent) {
    e.preventDefault();
    const cleanNominal = Number(nominalInput.replace(/\D/g, ""));
    if (!cleanNominal || cleanNominal <= 0) {
      alert("Masukkan nominal uang yang valid.");
      return;
    }

    try {
      setIsSubmittingMoney(true);
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_money",
          type: transactionType,
          nominal: cleanNominal,
          keterangan: keteranganInput,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal menambah catatan uang.");
      }

      setIsAddMoneyModalOpen(false);
      setTransactionType("masuk");
      setNominalInput("");
      setKeteranganInput("");
      await loadFinanceData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsSubmittingMoney(false);
    }
  }

  // Handle Bayar Cicilan
  async function handlePayInstallment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDebtor) return;

    const cleanNominal = Number(installmentNominal.replace(/\D/g, ""));
    if (!cleanNominal || cleanNominal <= 0) {
      alert("Masukkan nominal pembayaran cicilan yang valid.");
      return;
    }

    try {
      setIsSubmittingInstallment(true);
      const res = await fetch("/api/finance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "pay_debt",
          buyerId: selectedDebtor.id,
          nominal: cleanNominal,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal membayar cicilan.");
      }

      setSelectedDebtor(null);
      setInstallmentNominal("");
      await loadFinanceData();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setIsSubmittingInstallment(false);
    }
  }

  const filteredCashFlows = (summary?.cashFlows ?? []).filter((item) => {
    if (filterType === "masuk") return item.status === "Masuk";
    if (filterType === "keluar") return item.status === "Keluar";
    return true;
  });

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[12px] font-bold uppercase tracking-[0.16em] text-emerald-800">
            NAVA MART
          </div>
          <h1 className="mt-1 text-[28px] font-bold tracking-tight text-slate-800">
            Selamat pagi, Andi
          </h1>
        </div>
      </div>

      {/* Hero Banner Saldo Kas (Hijau Gelap) */}
      <div className="relative overflow-hidden rounded-[32px] bg-[#0b5c46] p-7 text-white shadow-[0_20px_50px_rgba(11,92,70,0.2)]">
        <div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-emerald-200/80">
              Saldo kas saat ini
            </div>
            <div className="mt-2 text-[38px] font-extrabold tracking-tight">
              {summary ? formatCurrency(summary.currentBalance) : "Rp ..."}
            </div>
            <div className="mt-1 text-xs text-emerald-100/70">
              Terakhir diperbarui {summary?.lastUpdated || "--:-- WIB"}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddMoneyModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-white/15 px-5 py-3 text-sm font-semibold text-white backdrop-blur-xs transition hover:bg-white/25 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            <span>Catat Keuangan</span>
          </button>
        </div>

        {/* 3 Mini Cards di dalam Banner */}
        <div className="relative z-10 mt-7 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-200/80">
              Uang Masuk
            </div>
            <div className="mt-1 text-lg font-bold">
              {summary ? formatCurrency(summary.totalIncome) : "Rp 0"}
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-200/80">
              Uang Keluar
            </div>
            <div className="mt-1 text-lg font-bold">
              {summary ? formatCurrency(summary.totalExpense) : "Rp 0"}
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 p-4 backdrop-blur-xs">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-200/80">
              Non-Tunai QRIS
            </div>
            <div className="mt-1 text-lg font-bold">
              {summary ? formatCurrency(summary.totalQris) : "Rp 0"}
            </div>
          </div>
        </div>
      </div>

      {/* Pill Switcher Tab (Riwayat Kas / Kasbon Pelanggan) */}
      <div className="flex justify-center">
        <div className="inline-flex rounded-full border border-slate-200 bg-white p-1 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab("riwayat")}
            className={`rounded-full px-5 py-2 text-xs font-bold transition ${
              activeTab === "riwayat"
                ? "bg-[#0b5c46] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Riwayat Kas
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("kasbon")}
            className={`rounded-full px-5 py-2 text-xs font-bold transition ${
              activeTab === "kasbon"
                ? "bg-[#0b5c46] text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Kasbon Pelanggan
          </button>
        </div>
      </div>

      {/* KONTEN TAB 1: RIWAYAT UANG MASUK & KELUAR */}
      {activeTab === "riwayat" && (
        <div className="rounded-[30px] border border-slate-200/90 bg-white p-6 shadow-xs">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Riwayat Uang Masuk & Keluar
              </h2>
              <p className="text-xs text-slate-500">
                Semua pergerakan kas tokomu
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFilterType("semua")}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                  filterType === "semua"
                    ? "bg-[#0b5c46] text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Semua
              </button>
              <button
                type="button"
                onClick={() => setFilterType("masuk")}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                  filterType === "masuk"
                    ? "bg-[#0b5c46] text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => setFilterType("keluar")}
                className={`rounded-full px-4 py-1.5 text-xs font-bold transition ${
                  filterType === "keluar"
                    ? "bg-[#0b5c46] text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                Keluar
              </button>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Metode</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      Memuat data arus kas...
                    </td>
                  </tr>
                ) : filteredCashFlows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-400">
                      Belum ada pergerakan kas yang tercatat.
                    </td>
                  </tr>
                ) : (
                  filteredCashFlows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 text-xs text-slate-500">{row.date}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {row.description}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">{row.category}</td>
                      <td className="py-3.5 px-4 text-xs text-slate-600">{row.method}</td>
                      <td
                        className={`py-3.5 px-4 text-right font-bold ${
                          row.status === "Masuk" ? "text-emerald-700" : "text-rose-600"
                        }`}
                      >
                        {row.status === "Masuk" ? `+ ${formatCurrency(row.nominal)}` : `- ${formatCurrency(row.nominal)}`}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                            row.status === "Masuk"
                              ? "bg-emerald-100/70 text-emerald-800"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* KONTEN TAB 2: KASBON PELANGGAN */}
      {activeTab === "kasbon" && (
        <div className="rounded-[30px] border border-slate-200/90 bg-white p-6 shadow-xs">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center border-b border-slate-100 pb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-800">Kasbon Pelanggan</h2>
              <p className="text-xs text-slate-500">
                Total piutang aktif:{" "}
                <span className="font-bold text-emerald-800">
                  {summary ? formatCurrency(summary.totalPiutangAktif) : "Rp 0"}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-4">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Memuat data kasbon pelanggan...
              </div>
            ) : (summary?.debtors ?? []).length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Tidak ada kasbon pelanggan yang aktif saat ini.
              </div>
            ) : (
              summary?.debtors.map((debtor) => (
                <div
                  key={debtor.id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-4 transition hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-800 text-sm">
                        {debtor.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{debtor.name}</div>
                        <div className="text-xs text-slate-500">
                          Terbayar {formatCurrency(debtor.paid)} dari {formatCurrency(debtor.total_price)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Sisa utang</div>
                        <div className="font-bold text-rose-600">
                          {formatCurrency(debtor.remaining)}
                        </div>
                      </div>

                      {debtor.remaining > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDebtor(debtor);
                            setInstallmentNominal(String(debtor.remaining));
                          }}
                          className="rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-xs transition hover:bg-slate-100 active:scale-[0.98]"
                        >
                          Catat cicilan
                        </button>
                      ) : (
                        <span className="rounded-xl bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-800">
                          Lunas
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar Kasbon */}
                  <div className="mt-3 w-full rounded-full bg-slate-200 h-2 overflow-hidden">
                    <div
                      className="h-full bg-[#0b5c46] rounded-full transition-all duration-300"
                      style={{ width: `${debtor.progressPercentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: TAMBAH CATATAN KEUANGAN (Hanya Tambah Catatan Uang Saja) */}
      {isAddMoneyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-[460px] rounded-[32px] bg-white p-7 shadow-2xl">
            <button
              type="button"
              onClick={() => setIsAddMoneyModalOpen(false)}
              className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Pembukuan
            </div>
            <h2 className="mt-1 text-[22px] font-bold text-slate-800">
              Tambah catatan keuangan
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Catat pergerakan uang masuk atau uang keluar agar pembukuan tetap akurat.
            </p>

            <form onSubmit={handleAddMoney} className="mt-6 space-y-4">
              {/* Jenis Catatan (Masuk / Keluar) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Jenis Catatan
                </label>
                <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setTransactionType("masuk")}
                    className={`rounded-xl py-2.5 text-xs font-bold transition ${
                      transactionType === "masuk"
                        ? "bg-[#0b5c46] text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    + Uang Masuk
                  </button>
                  <button
                    type="button"
                    onClick={() => setTransactionType("keluar")}
                    className={`rounded-xl py-2.5 text-xs font-bold transition ${
                      transactionType === "keluar"
                        ? "bg-rose-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    - Uang Keluar
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nominal {transactionType === "keluar" ? "Pengeluaran" : "Pemasukan"}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-sm font-semibold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="text"
                    required
                    value={nominalInput}
                    onChange={(e) => {
                      const num = e.target.value.replace(/\D/g, "");
                      setNominalInput(num ? Number(num).toLocaleString("id-ID") : "");
                    }}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-base font-bold text-slate-800 outline-none focus:border-[#0b5c46] focus:bg-white"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Keterangan
                </label>
                <textarea
                  rows={3}
                  value={keteranganInput}
                  onChange={(e) => setKeteranganInput(e.target.value)}
                  placeholder={
                    transactionType === "keluar"
                      ? "Contoh: Belanja stok barang, biaya listrik, bayar operasional..."
                      : "Contoh: Tambahan modal kas, setoran tunai..."
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#0b5c46] focus:bg-white"
                />
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddMoneyModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMoney}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-md transition disabled:opacity-60 ${
                    transactionType === "keluar"
                      ? "bg-rose-600 shadow-rose-950/15 hover:bg-rose-700"
                      : "bg-[#0b5c46] shadow-emerald-950/15 hover:bg-[#094d3a]"
                  }`}
                >
                  <Check className="h-4 w-4" />
                  <span>
                    {isSubmittingMoney
                      ? "Menyimpan..."
                      : transactionType === "keluar"
                      ? "Catat Pengeluaran"
                      : "Simpan Pemasukan"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CATAT CICILAN KASBON PELANGGAN (Elemen Bayar Lagi) */}
      {selectedDebtor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-[460px] rounded-[32px] bg-white p-7 shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedDebtor(null)}
              className="absolute right-6 top-6 flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
              Kasbon Pelanggan
            </div>
            <h2 className="mt-1 text-[22px] font-bold text-slate-800">
              Bayar Cicilan Kasbon
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Menerima pembayaran cicilan dari{" "}
              <span className="font-bold text-slate-700">{selectedDebtor.name}</span>.
            </p>

            <div className="mt-4 rounded-2xl bg-emerald-50/70 p-4 border border-emerald-100">
              <div className="flex justify-between text-xs text-slate-600">
                <span>Total Pinjaman:</span>
                <span className="font-semibold">{formatCurrency(selectedDebtor.total_price)}</span>
              </div>
              <div className="mt-1 flex justify-between text-xs text-slate-600">
                <span>Sudah Terbayar:</span>
                <span className="font-semibold text-emerald-700">{formatCurrency(selectedDebtor.paid)}</span>
              </div>
              <div className="mt-2 flex justify-between text-sm font-bold text-rose-700 border-t border-emerald-200/60 pt-2">
                <span>Sisa Utang:</span>
                <span>{formatCurrency(selectedDebtor.remaining)}</span>
              </div>
            </div>

            <form onSubmit={handlePayInstallment} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Nominal Pembayaran Cicilan
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-sm font-semibold text-slate-400">
                    Rp
                  </span>
                  <input
                    type="text"
                    required
                    value={installmentNominal}
                    onChange={(e) => {
                      const num = e.target.value.replace(/\D/g, "");
                      setInstallmentNominal(num ? Number(num).toLocaleString("id-ID") : "");
                    }}
                    placeholder="0"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-4 text-base font-bold text-slate-800 outline-none focus:border-[#0b5c46] focus:bg-white"
                    autoFocus
                  />
                </div>
                <div className="mt-1.5 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setInstallmentNominal(Number(selectedDebtor.remaining).toLocaleString("id-ID"))}
                    className="text-[11px] font-semibold text-emerald-800 hover:underline"
                  >
                    Bayar Lunas ({formatCurrency(selectedDebtor.remaining)})
                  </button>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDebtor(null)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingInstallment}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#0b5c46] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-emerald-950/15 hover:bg-[#094d3a] disabled:opacity-60"
                >
                  <Check className="h-4 w-4" />
                  <span>{isSubmittingInstallment ? "Memproses..." : "Konfirmasi Pembayaran"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
