"use client";

import { useMemo, useState } from "react";
import {
  ChevronRight,
  Minus,
  Plus,
  ScanLine,
  Search,
  ShoppingBag,
  Wallet,
} from "lucide-react";

type ProductItem = {
  id: string;
  name: string;
  short: string;
  category: string;
  price: number;
  stock: number;
  accent: string;
};

type CartItem = {
  id: string;
  name: string;
  qty: number;
  price: number;
};

const products: ProductItem[] = [
  { id: "IG", name: "Indomie Goreng", short: "IG", category: "Makanan", price: 3500, stock: 3, accent: "bg-[#f5d5b6] text-[#7c4a2f]" },
  { id: "AQ", name: "Aqua 600ml", short: "AQ", category: "Minuman", price: 4000, stock: 18, accent: "bg-[#dfe7f6] text-[#496a8a]" },
  { id: "KA", name: "Kopi Kapal Api", short: "KA", category: "Minuman", price: 2500, stock: 4, accent: "bg-[#f6e8cd] text-[#ac6d1b]" },
  { id: "GP", name: "Gula Pasir 1kg", short: "GP", category: "Sembako", price: 18500, stock: 0, accent: "bg-[#f3dfe5] text-[#7c4d65]" },
  { id: "TP", name: "Teh Pucuk 350ml", short: "TP", category: "Minuman", price: 5000, stock: 12, accent: "bg-[#dbeee4] text-[#2d6d4c]" },
  { id: "RK", name: "Roma Kelapa", short: "RK", category: "Makanan", price: 9500, stock: 9, accent: "bg-[#e9defd] text-[#6a5a9f]" },
  { id: "MK", name: "Minyak Kita 1L", short: "MK", category: "Sembako", price: 17000, stock: 7, accent: "bg-[#f6e2c2] text-[#b06b1a]" },
  { id: "SU", name: "Susu Ultra 250ml", short: "SU", category: "Minuman", price: 7500, stock: 14, accent: "bg-[#dfeaf8] text-[#5478a7]" },
];

const initialCart: CartItem[] = [
  { id: "IG", name: "Indomie Goreng", qty: 2, price: 3500 },
  { id: "AQ", name: "Aqua 600ml", qty: 1, price: 4000 },
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function CashierPage() {
  const [paymentMethod, setPaymentMethod] = useState<"tunai" | "kasbon">("tunai");
  const [customerName, setCustomerName] = useState("");
  const [nominal, setNominal] = useState(String(initialCart.reduce((sum, item) => sum + item.price * item.qty, 0)));
  const [cart, setCart] = useState<CartItem[]>(initialCart);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.price * item.qty, 0),
    [cart],
  );

  const handlePaymentMethodChange = (method: "tunai" | "kasbon") => {
    setPaymentMethod(method);

    if (method === "tunai") {
      setNominal(String(subtotal));
    }
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart((current) =>
      current
        .map((item) =>
          item.id === productId
            ? { ...item, qty: Math.max(0, item.qty + delta) }
            : item,
        )
        .filter((item) => item.qty > 0),
    );
  };

  return (
    <div className="mx-auto max-w-[1600px]">
            {/* <header className="mb-6 flex items-center justify-between">
              <div className="text-[12px] font-black uppercase tracking-[0.18em] text-[#0d5c4b]">
                NAVA MART
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Notifikasi"
                  className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm"
                >
                  <ShoppingBag className="h-4 w-4" />
                </button>
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-[#dfeae5] bg-[#e9f3ef] text-sm font-bold text-[#0d5c4b] shadow-sm">
                  AS
                </div>
              </div>
            </header>

            <div className="mb-8 flex items-center justify-between gap-6">
              <h1 className="text-[2.2rem] font-light tracking-[-0.06em] text-slate-800">
                Selamat pagi, Andi
              </h1>
            </div> */}

            <div className="grid gap-8 xl:grid-cols-[1.8fr_0.82fr]">
              <main className="rounded-[30px] border border-[#eae9e7] bg-[#f4f4f2] p-4 shadow-[0_20px_45px_rgba(15,23,42,0.03)]">
                <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[#e4e3e1] bg-white px-4 py-3 shadow-inner shadow-slate-100/80">
                  <Search className="h-5 w-5 text-slate-500" />
                  <input
                    value=""
                    readOnly
                    placeholder="Scan barcode atau cari produk..."
                    className="w-full border-0 bg-transparent text-[15px] text-slate-500 outline-none placeholder:text-slate-400"
                  />
                  <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600">
                    F2
                  </div>
                </div>

                <div className="mb-5 flex flex-wrap gap-3">
                  {[
                    "Semua",
                    "Makanan",
                    "Minuman",
                    "Sembako",
                    "Rumah Tangga",
                  ].map((item, index) => (
                    <button
                      key={item}
                      type="button"
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                        index === 0
                          ? "border-[#0d5c4b] bg-[#0d5c4b] text-white shadow-[0_10px_25px_rgba(13,92,75,0.18)]"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className="rounded-[22px] border border-[#e6e4e1] bg-[#f7f7f6] p-3 shadow-[0_15px_30px_rgba(15,23,42,0.03)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-[14px] text-lg font-black ${product.accent}`}>
                          {product.short}
                        </div>

                        <button
                          type="button"
                          onClick={() => updateCartQty(product.id, 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0d5c4b] text-white shadow-lg shadow-emerald-900/10"
                          aria-label={`Tambah ${product.name}`}
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div>
                          <h3 className="text-[15px] font-semibold text-slate-800">{product.name}</h3>
                          <p className="text-xs text-slate-500">{product.category}</p>
                        </div>

                        <div className="flex items-end justify-between gap-3">
                          <div>
                            <div className="text-[17px] font-bold text-[#1f2d2a]">
                              {formatCurrency(product.price)}
                            </div>
                            <div className="text-[11px] text-slate-500">Stok {product.stock}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </main>

              <aside className="rounded-[28px] border border-[#eae7e5] bg-[#f8f8f7] p-5 shadow-[0_20px_40px_rgba(15,23,42,0.03)]">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700">
                    <div className="rounded-full border border-slate-200 bg-white p-2">
                      <ShoppingBag className="h-4 w-4" />
                    </div>
                    <span className="text-[14px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                      Transaksi Baru
                    </span>
                  </div>
                  <button type="button" className="rounded-full border border-slate-200 bg-white p-2 text-slate-500">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3">
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-2xl border border-[#eceae7] bg-white px-3 py-3"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef4f2] text-[13px] font-bold text-[#0d5c4b]">
                          {item.name
                            .split(" ")
                            .map((word) => word[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <div className="truncate text-[14px] font-medium text-slate-700">{item.name}</div>
                          <div className="text-xs text-slate-500">{formatCurrency(item.price)}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600"
                          aria-label={`Kurangi ${item.name}`}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="min-w-[18px] text-center text-sm font-semibold text-slate-700">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-slate-600"
                          aria-label={`Tambah ${item.name}`}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-4 rounded-[24px] border border-[#ece9e7] bg-white p-4">
                  <div className="text-[15px] font-semibold text-slate-700">Pembayaran</div>

                  <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                    {[
                      { key: "tunai", label: "Tunai" },
                      { key: "kasbon", label: "Kasbon" },
                    ].map((option) => (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => handlePaymentMethodChange(option.key as "tunai" | "kasbon")}
                        className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                          paymentMethod === option.key
                            ? "bg-[#0d5c4b] text-white shadow-[0_10px_18px_rgba(13,92,75,0.18)]"
                            : "bg-transparent text-slate-600"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {paymentMethod === "kasbon" && (
                    <div>
                      <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                        Nama
                      </label>
                      <input
                        value={customerName}
                        onChange={(event) => setCustomerName(event.target.value)}
                        placeholder="Masukkan nama"
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400"
                      />
                    </div>
                  )}

                  <div>
                    <label className="mb-2 block text-xs font-medium uppercase tracking-[0.12em] text-slate-500">
                      Nominal
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={nominal}
                      onChange={(event) => setNominal(event.target.value)}
                      placeholder="Masukkan nominal"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-base font-semibold text-slate-700 outline-none placeholder:text-slate-400"
                    />
                  </div>
                </div>

                <div className="mt-6 flex items-center justify-between text-[15px] text-slate-700">
                  <span>Total pembayaran</span>
                  <span className="text-[22px] font-bold text-slate-800">{formatCurrency(subtotal)}</span>
                </div>

                <button
                  type="button"
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d5c4b] px-4 py-3 text-base font-bold text-white shadow-[0_12px_22px_rgba(13,92,75,0.18)]"
                >
                  <span className="flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Bayar
                  </span>
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px]">F9</span>
                </button>

                <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500">
                  <ScanLine className="h-3.5 w-3.5" />
                  <span>Transaksi serap otomatis</span>
                </div>
              </aside>
            </div>
          </div>
  );
}
