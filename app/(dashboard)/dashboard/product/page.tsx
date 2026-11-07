"use client";

import { useState } from "react";
import { ChevronDown, Pencil, Plus, ScanLine, Search, Trash2, X } from "lucide-react";

import { Sidebar } from "@/components/dashboard/sidebar";

const products = [
  {
    name: "Indomie Goreng",
    code: "89927000123",
    badge: "IG",
    color: "bg-[#f7d5ad]",
    category: "Makanan",
    buyPrice: "Rp 2.730",
    sellPrice: "Rp 3.500",
    stock: "3 pcs",
    status: "Menipis",
    statusClass: "bg-[#fef3c7] text-[#b45309]",
  },
  {
    name: "Aqua 600ml",
    code: "89927000123",
    badge: "AQ",
    color: "bg-[#dbeafe]",
    category: "Minuman",
    buyPrice: "Rp 3.120",
    sellPrice: "Rp 4.000",
    stock: "18 pcs",
    status: "Aman",
    statusClass: "bg-[#dcfce7] text-[#166534]",
  },
  {
    name: "Kopi Kapal Api",
    code: "89927000123",
    badge: "KA",
    color: "bg-[#f5d0fe]",
    category: "Minuman",
    buyPrice: "Rp 1.950",
    sellPrice: "Rp 2.500",
    stock: "4 pcs",
    status: "Menipis",
    statusClass: "bg-[#fef3c7] text-[#b45309]",
  },
  {
    name: "Gula Pasir 1kg",
    code: "89927000123",
    badge: "GP",
    color: "bg-[#fce7f3]",
    category: "Sembako",
    buyPrice: "Rp 14.430",
    sellPrice: "Rp 18.500",
    stock: "0 pcs",
    status: "Habis",
    statusClass: "bg-[#fee2e2] text-[#b91c1c]",
  },
  {
    name: "Teh Pucuk 350ml",
    code: "89927000123",
    badge: "TP",
    color: "bg-[#f5d0fe]",
    category: "Minuman",
    buyPrice: "Rp 3.900",
    sellPrice: "Rp 5.000",
    stock: "12 pcs",
    status: "Aman",
    statusClass: "bg-[#dcfce7] text-[#166534]",
  },
  {
    name: "Roma Kelapa",
    code: "89927000123",
    badge: "RK",
    color: "bg-[#d1fae5]",
    category: "Makanan",
    buyPrice: "Rp 7.410",
    sellPrice: "Rp 9.500",
    stock: "9 pcs",
    status: "Aman",
    statusClass: "bg-[#dcfce7] text-[#166534]",
  },
];

function ProductBadge({ color, text }: { color: string; text: string }) {
  return (
    <div
      className={`flex h-10 w-10 items-center justify-center rounded-xl text-[11px] font-bold text-slate-700 ${color}`}
    >
      {text}
    </div>
  );
}

export default function ProductPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  return (
    <div className="min-h-screen w-full bg-[#f3f3f1] text-slate-900">
      <div className="flex min-h-screen w-full">
        <Sidebar />

        <main className="flex-1 p-6">
          <header className="mb-6 flex items-center justify-end">
            <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-2 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0d5c4b] text-[11px] font-bold text-white">
                AS
              </div>
              <span className="pr-1 text-sm font-medium text-slate-700">AS</span>
            </button>
          </header>

          <div className="rounded-[28px] border border-slate-200 bg-[#f5f5f2] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-[28px] font-semibold tracking-[-0.06em] text-slate-800">
                  Daftar Produk
                </h1>
                <p className="mt-1 text-sm text-slate-500">8 produk aktif di toko</p>
              </div>

              <button
                onClick={() => {
                  setIsEditMode(false);
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0d5c4b] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(13,92,75,0.22)] transition hover:bg-[#0a4d40]"
              >
                <Plus className="h-4 w-4" />
                Tambah Produk
              </button>
            </div>

            <div className="mb-5 flex items-center gap-4">
              <div className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-500 shadow-inner shadow-slate-100/80">
                <Search className="h-4 w-4" />
                <input
                  aria-label="Cari nama produk"
                  className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  placeholder="Cari nama produk atau barcode..."
                />
              </div>

              <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
                Semua kategori
                <ChevronDown className="h-4 w-4" />
              </button>

              <button className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm">
                Semua status
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <table className="min-w-full table-fixed border-separate border-spacing-0">
                <thead className="bg-[#f3f4f6] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Produk</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Harga beli</th>
                    <th className="px-4 py-3">Harga jual</th>
                    <th className="px-4 py-3">Sisa stok</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white text-[14px] text-slate-700">
                  {products.map((product) => (
                    <tr key={product.name} className="border-t border-slate-200 align-middle">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <ProductBadge color={product.color} text={product.badge} />
                          <div>
                            <div className="font-semibold text-slate-800">{product.name}</div>
                            <div className="text-[11px] text-slate-400">{product.code}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{product.category}</td>
                      <td className="px-4 py-4 font-medium text-slate-700">{product.buyPrice}</td>
                      <td className="px-4 py-4 font-medium text-slate-700">{product.sellPrice}</td>
                      <td className="px-4 py-4 text-slate-600">{product.stock}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${product.statusClass}`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => {
                              setIsEditMode(true);
                              setIsModalOpen(true);
                            }}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#0d5c4b] text-[#0d5c4b] bg-[#ecfdf5] hover:bg-[#dffaf0]"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(product.name)}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#ef4444]/20 bg-[#fef2f2] text-[#ef4444] hover:bg-[#fee2e2]"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#000000]/20 backdrop-blur-[1px]">
          <div className="w-[420px] rounded-[24px] border border-slate-200 bg-[#f4f4f2] p-6 shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
            <h3 className="text-[22px] font-bold tracking-[-0.05em] text-slate-800">
              Hapus produk?
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Apakah Anda yakin ingin menghapus <span className="font-semibold text-slate-700">{deleteTarget}</span>?
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                }}
                className="rounded-xl bg-[#d14343] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(209,67,67,0.2)] hover:bg-[#bf3838]"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#000000]/20 backdrop-blur-[1px]">
          <div className="w-[520px] rounded-[24px] border border-slate-200 bg-[#f4f4f2] p-6 shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[12px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Inventori
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h2 className="text-[24px] font-bold tracking-[-0.05em] text-slate-800">
              {isEditMode ? "Edit produk" : "Tambah produk baru"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {isEditMode
                ? "Perbarui informasi produk yang dipilih."
                : "Lengkapi informasi produk dan stok awal."}
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">SKU / Barcode</label>
                <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-inner shadow-slate-100/80">
                  <ScanLine className="h-4 w-4 text-slate-400" />
                  <input
                    className="w-full bg-transparent text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
                    placeholder="Scan atau masukkan barcode"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Nama produk</label>
                <input
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 placeholder:text-slate-400 shadow-inner shadow-slate-100/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Contoh: Indomie Goreng"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Kategori</label>
                <div className="relative">
                  <select className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-3 pr-10 text-sm text-slate-500 shadow-inner shadow-slate-100/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
                    <option>Pilih kategori</option>
                    <option>Makanan</option>
                    <option>Minuman</option>
                    <option>Sembako</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Harga beli</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 placeholder:text-slate-400 shadow-inner shadow-slate-100/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Rp 0"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Harga jual</label>
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 placeholder:text-slate-400 shadow-inner shadow-slate-100/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Rp 0"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Stok awal</label>
                {isEditMode ? (
                  <input
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 placeholder:text-slate-400 shadow-inner shadow-slate-100/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    defaultValue="12"
                  />
                ) : (
                  <div className="flex min-h-[48px] items-center rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 shadow-inner shadow-slate-100/80">
                    0
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                className="rounded-xl bg-[#0d5c4b] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(13,92,75,0.22)] hover:bg-[#0a4d40]"
              >
                {isEditMode ? "Simpan Perubahan" : "Simpan Produk"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
