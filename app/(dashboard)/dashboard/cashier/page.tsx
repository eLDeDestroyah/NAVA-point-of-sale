"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Minus,
  Plus,
  ScanLine,
  Search,
  ShoppingBag,
  Wallet,
} from "lucide-react";

import {
  PaymentSuccessModal,
  type TransactionReceiptData,
} from "@/components/dashboard/payment-success-modal";
import type { CashierProductItem } from "@/types/cashier.type";

type CartItem = {
  id: string;
  name: string;
  qty: number;
  price: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

const CATEGORIES = ["Semua", "Makanan", "Minuman", "Sembako", "Rumah Tangga"];

export default function CashierPage() {
  const [products, setProducts] = useState<CashierProductItem[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");

  const [paymentMethod, setPaymentMethod] = useState<"tunai" | "kasbon">("tunai");
  const [customerName, setCustomerName] = useState("");
  const [nominal, setNominal] = useState("0");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<TransactionReceiptData | null>(null);

  // 1. Ambil produk dari API cashier
  async function fetchProducts(search = "", category = "") {
    try {
      setIsLoadingProducts(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (category && category !== "Semua") params.set("category", category);

      const res = await fetch(`/api/cashier?${params.toString()}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (res.ok && data.products) {
        setProducts(data.products);
      }
    } catch (error) {
      console.error("Gagal memuat produk kasir:", error);
    } finally {
      setIsLoadingProducts(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);

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
    setCart((current) => {
      const existing = current.find((item) => item.id === productId);
      if (!existing && delta > 0) {
        const product = products.find((p) => p.id === productId);
        if (!product) return current;
        if (product.stock <= 0) {
          alert(`Stok produk "${product.name}" habis.`);
          return current;
        }
        return [
          ...current,
          { id: product.id, name: product.name, qty: 1, price: product.price },
        ];
      }

      return current
        .map((item) => {
          if (item.id === productId) {
            const product = products.find((p) => p.id === productId);
            const targetQty = item.qty + delta;
            if (product && targetQty > product.stock) {
              alert(`Stok maksimal "${product.name}" hanya ${product.stock}.`);
              return item;
            }
            return { ...item, qty: Math.max(0, targetQty) };
          }
          return item;
        })
        .filter((item) => item.qty > 0);
    });
  };

  // 2. Kirim transaksi ke backend saat kasir membayar
  const handlePayment = async () => {
    if (cart.length === 0) {
      alert("Keranjang masih kosong! Silakan pilih produk terlebih dahulu.");
      return;
    }

    try {
      setIsProcessingPayment(true);

      const payload = {
        customerName: customerName.trim() || undefined,
        paymentMethod: paymentMethod === "tunai" ? "cash" : "kasbon",
        paidAmount: Number(nominal) || subtotal,
        items: cart.map((c) => ({
          productId: c.id,
          qty: c.qty,
        })),
      };

      const res = await fetch("/api/cashier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resJson = await res.json();

      if (!res.ok || !resJson.success) {
        throw new Error(resJson.error || "Gagal memproses transaksi kasir.");
      }

      const txResult = resJson.data;

      setReceiptData({
        transactionId: `#${txResult.transaction.transaction_id}`,
        items: txResult.items.map((i: any) => ({
          name: i.product_name,
          qty: i.total,
          price: i.price,
        })),
        subtotal: txResult.total_price,
        paymentMethod,
        customerName: txResult.buyer.name,
        nominal: txResult.paid,
        change: txResult.change,
        date: new Date(txResult.transaction.created_at || Date.now()),
      });

      setIsSuccessModalOpen(true);

      // Refresh data produk agar sisa stok berkurang di tampilan
      await fetchProducts(searchQuery, selectedCategory);
    } catch (error) {
      console.error(error);
      alert(error instanceof Error ? error.message : "Terjadi kesalahan pembayaran.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCloseModal = () => {
    setIsSuccessModalOpen(false);
    setCart([]);
    setNominal("0");
    setCustomerName("");
  };

  // Keyboard shortcut F9 untuk Bayar
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "F9" && !isProcessingPayment && !isSuccessModalOpen) {
        event.preventDefault();
        handlePayment();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [cart, subtotal, paymentMethod, customerName, nominal, isProcessingPayment, isSuccessModalOpen]);

  // Filter produk berdasarkan kategori dan pencarian
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory =
        selectedCategory === "Semua" ||
        p.category.toLowerCase() === selectedCategory.toLowerCase();
      return matchSearch && matchCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  return (
    <div className="mx-auto max-w-[1600px]">
      <div className="grid gap-8 xl:grid-cols-[1.8fr_0.82fr]">
        <main className="rounded-[30px] border border-[#eae9e7] bg-[#f4f4f2] p-4 shadow-[0_20px_45px_rgba(15,23,42,0.03)]">
          {/* Kolom Pencarian */}
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-[#e4e3e1] bg-white px-4 py-3 shadow-inner shadow-slate-100/80">
            <Search className="h-5 w-5 text-slate-500" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Scan barcode atau cari nama produk..."
              className="w-full border-0 bg-transparent text-[15px] text-slate-800 outline-none placeholder:text-slate-400"
            />
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-600">
              F2
            </div>
          </div>

          {/* Kategori Filter */}
          <div className="mb-5 flex flex-wrap gap-3">
            {CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSelectedCategory(item)}
                className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                  selectedCategory === item
                    ? "border-[#0d5c4b] bg-[#0d5c4b] text-white shadow-[0_10px_25px_rgba(13,92,75,0.18)]"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                {item}
              </button>
            ))}
          </div>

          {/* Grid Produk */}
          {isLoadingProducts ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-sm text-slate-500">Memuat produk dari database...</div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/50 p-6 text-center">
              <p className="text-sm font-medium text-slate-600">Tidak ada produk ditemukan.</p>
              <p className="mt-1 text-xs text-slate-400">Silakan tambahkan produk atau ubah kata kunci filter.</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;
                return (
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
                        disabled={isOutOfStock}
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-white shadow-lg ${
                          isOutOfStock
                            ? "cursor-not-allowed bg-slate-300 shadow-none"
                            : "bg-[#0d5c4b] shadow-emerald-900/10 hover:bg-[#0a4d40]"
                        }`}
                        aria-label={`Tambah ${product.name}`}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-4 space-y-2">
                      <div>
                        <h3 className="text-[15px] font-semibold text-slate-800 line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-xs text-slate-500">{product.category}</p>
                      </div>

                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <div className="text-[17px] font-bold text-[#1f2d2a]">
                            {formatCurrency(product.price)}
                          </div>
                          <div
                            className={`text-[11px] font-medium ${
                              isOutOfStock
                                ? "text-rose-600"
                                : product.stock < 5
                                ? "text-amber-600"
                                : "text-slate-500"
                            }`}
                          >
                            {isOutOfStock ? "Stok Habis" : `Stok ${product.stock}`}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>

        {/* Sidebar Keranjang & Pembayaran Kasir */}
        <aside className="rounded-[30px] border border-[#eae9e7] bg-[#f4f4f2] p-5 shadow-[0_20px_45px_rgba(15,23,42,0.03)]">
          <div className="mb-4 flex items-center justify-between border-b border-slate-200/80 pb-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">Keranjang Belanja</h2>
              <p className="text-xs text-slate-500">{cart.length} item dipilih</p>
            </div>
            {cart.length > 0 && (
              <button
                type="button"
                onClick={() => setCart([])}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700"
              >
                Kosongkan
              </button>
            )}
          </div>

          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Belum ada produk di keranjang.
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-800">
                      {item.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatCurrency(item.price)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updateCartQty(item.id, -1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="w-5 text-center text-xs font-bold text-slate-800">
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateCartQty(item.id, 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Opsi & Data Pembayaran */}
          <div className="mt-5 space-y-4 border-t border-slate-200/80 pt-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Nama Pembeli (Opsional)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Pelanggan umum..."
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                Metode Pembayaran
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handlePaymentMethodChange("tunai")}
                  className={`rounded-xl border py-2 text-xs font-bold transition ${
                    paymentMethod === "tunai"
                      ? "border-[#0d5c4b] bg-[#0d5c4b] text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Tunai (Cash)
                </button>
                <button
                  type="button"
                  onClick={() => handlePaymentMethodChange("kasbon")}
                  className={`rounded-xl border py-2 text-xs font-bold transition ${
                    paymentMethod === "kasbon"
                      ? "border-[#0d5c4b] bg-[#0d5c4b] text-white"
                      : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  Kasbon
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">
                {paymentMethod === "kasbon" ? "Nominal Dibayar (DP/Cicilan)" : "Uang Diterima"}
              </label>
              <input
                type="number"
                min="0"
                value={nominal}
                onChange={(e) => setNominal(e.target.value)}
                placeholder="Masukkan nominal"
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-base font-semibold text-slate-800 outline-none placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center justify-between border-t border-slate-200/80 pt-3 text-[15px] text-slate-700">
              <span className="font-medium">Total pembayaran</span>
              <span className="text-[22px] font-bold text-slate-900">
                {formatCurrency(subtotal)}
              </span>
            </div>

            <button
              type="button"
              onClick={handlePayment}
              disabled={isProcessingPayment || cart.length === 0}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0d5c4b] px-4 py-3.5 text-base font-bold text-white shadow-[0_12px_22px_rgba(13,92,75,0.18)] transition hover:bg-[#0a4d40] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Wallet className="h-4 w-4" />
              <span>{isProcessingPayment ? "Memproses Transaksi..." : "Bayar Sekarang"}</span>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px]">F9</span>
            </button>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <ScanLine className="h-3.5 w-3.5" />
              <span>Transaksi tersimpan otomatis ke database</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Modal Pembayaran Berhasil */}
      <PaymentSuccessModal
        isOpen={isSuccessModalOpen}
        onClose={handleCloseModal}
        data={receiptData}
      />
    </div>
  );
}
