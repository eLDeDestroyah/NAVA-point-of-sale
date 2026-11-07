"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown, Pencil, Plus, Search, Trash2, X } from "lucide-react";

import { Sidebar } from "@/components/dashboard/sidebar";

type ProductRow = {
  id: string;
  name: string;
  price: number;
  stock: number;
  status: "aman" | "habis" | "menipis";
  category: string;
  image_path?: string | null;
  created_at?: string;
};

type CurrentUser = {
  id: string;
  username: string;
  email: string;
  membership: boolean;
  created_at: string;
};

type CategoryOption = {
  id: string;
  category: string;
};

const PRODUCT_STATUS_CLASS: Record<ProductRow["status"], string> = {
  aman: "bg-[#dcfce7] text-[#166534]",
  menipis: "bg-[#fef3c7] text-[#b45309]",
  habis: "bg-[#fee2e2] text-[#b91c1c]",
};

const PRODUCT_STATUS_LABEL: Record<ProductRow["status"], string> = {
  aman: "Aman",
  menipis: "Menipis",
  habis: "Habis",
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

function getProductBadge(name: string) {
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getProductColor(name: string) {
  const palette = [
    "bg-[#f7d5ad]",
    "bg-[#dbeafe]",
    "bg-[#f5d0fe]",
    "bg-[#fce7f3]",
    "bg-[#d1fae5]",
    "bg-[#fecaca]",
  ];

  const index = [...name].reduce((total, char) => total + char.charCodeAt(0), 0) % palette.length;
  return palette[index];
}

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
  const router = useRouter();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    category: "",
    price: "",
    stock: "",
  });

  const loadProducts = useCallback(
    async (nextPage = page, withLoading = true) => {
      if (withLoading) {
        setIsLoading(true);
      } else {
        setIsSearchLoading(true);
      }

      try {
        const params = new URLSearchParams({
          page: String(nextPage),
          pageSize: String(pageSize),
        });

        if (searchQuery.trim()) {
          params.set("search", searchQuery.trim());
        }

        if (selectedCategory !== "all") {
          params.set("category", selectedCategory);
        }

        if (selectedStatus !== "all") {
          params.set("status", selectedStatus);
        }

        const response = await fetch(`/api/products?${params.toString()}`, { cache: "no-store" });

        if (!response.ok) {
          throw new Error("Gagal memuat produk.");
        }

        const data = (await response.json()) as {
          data?: ProductRow[];
          total?: number;
          totalPages?: number;
          page?: number;
        };

        setProducts(data.data ?? []);
        setTotalItems(data.total ?? 0);
        setTotalPages(data.totalPages ?? 1);
        setPage(data.page ?? nextPage);
      } catch (error) {
        console.error(error);
        setProducts([]);
        setTotalItems(0);
        setTotalPages(1);
      } finally {
        if (withLoading) {
          setIsLoading(false);
        } else {
          setIsSearchLoading(false);
        }
      }
    },
    [page, pageSize, searchQuery, selectedCategory, selectedStatus],
  );

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      try {
        const [userResponse, categoryResponse] = await Promise.all([
          fetch("/api/me", { cache: "no-store" }),
          fetch("/api/categories", { cache: "no-store" }),
        ]);

        if (!userResponse.ok) {
          router.replace("/login");
          return;
        }

        const userData = (await userResponse.json()) as { user?: CurrentUser | null };
        const categoryData = (await categoryResponse.json()) as { categories?: CategoryOption[] };

        if (isMounted) {
          setCurrentUser(userData.user ?? null);
          setCategoryOptions(categoryData.categories ?? []);
        }
      } catch (error) {
        console.error(error);

        if (isMounted) {
          setCurrentUser(null);
          setCategoryOptions([]);
        }
      }
    }

    void fetchData();

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      setPage(1);
    }, 400);

    return () => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
    };
  }, [searchQuery, selectedCategory, selectedStatus]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const shouldShowLoading = !searchQuery.trim() && selectedCategory === "all" && selectedStatus === "all";
      void loadProducts(page, shouldShowLoading);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [page, loadProducts, searchQuery, selectedCategory, selectedStatus]);

  function formatNumberInput(value: string) {
    const digits = value.replace(/\D/g, "");
    if (!digits) {
      return "";
    }

    return Number(digits).toLocaleString("id-ID");
  }

  function handleFormattedNumberChange(field: "price" | "stock", value: string) {
    const nextValue = value.replace(/[^\d]/g, "");
    setForm((current) => ({
      ...current,
      [field]: formatNumberInput(nextValue),
    }));
  }

  function resetForm() {
    setForm({ name: "", category: "", price: "", stock: "" });
    setEditingId(null);
  }

  function openCreateModal() {
    resetForm();
    setIsEditMode(false);
    setIsModalOpen(true);
  }

  function openEditModal(product: ProductRow) {
    setEditingId(product.id);
    setForm({
      name: product.name,
      category: product.category,
      price: formatNumberInput(String(product.price)),
      stock: formatNumberInput(String(product.stock)),
    });
    setIsEditMode(true);
    setIsModalOpen(true);
  }

  async function handleSubmit() {
    const payload = {
      name: form.name.trim(),
      category: form.category.trim(),
      price: Number((form.price || "").replace(/\./g, "") || 0),
      stock: Number((form.stock || "").replace(/\./g, "") || 0),
    };

    if (!payload.name || !payload.category) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(editingId ? `/api/products/${editingId}` : "/api/products", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        alert(data.error || "Gagal menyimpan produk.");
        return;
      }

      setIsModalOpen(false);
      resetForm();
      await loadProducts();
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/products/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        alert(data.error || "Gagal menghapus produk.");
        return;
      }

      setDeleteTarget(null);
      await loadProducts();
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await fetch("/api/logout", { method: "POST" });
      router.replace("/login");
    } finally {
      setIsLoggingOut(false);
    }
  }

  const displayName = currentUser?.username?.trim() || "Pengguna";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase() || "U";

  const categorySelectValue = categoryOptions.some((item) => item.category === form.category)
    ? form.category
    : "__custom__";
  const globalLoadingMessage = isLoggingOut
    ? "Keluar..."
    : isDeleting
      ? "Menghapus produk..."
      : isSubmitting
        ? "Menyimpan produk..."
        : isSearchLoading
          ? "Mencari data..."
          : "Memuat data...";

  const showGlobalOverlay = (isLoading && !isSearchLoading) || isSubmitting || isDeleting || isLoggingOut;

  return (
    <div className="min-h-screen w-full bg-[#f3f3f1] text-slate-900">
      <div className="flex min-h-screen w-full">
        <Sidebar currentUser={currentUser} />

        <main className="ml-[250px] flex-1 p-6">
          <header className="mb-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut || isSubmitting || isDeleting}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut ? "Keluar..." : "Logout"}
            </button>
            <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-2 shadow-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0d5c4b] text-[11px] font-bold text-white">
                {initials}
              </div>
              <span className="pr-1 text-sm font-medium text-slate-700">{displayName}</span>
            </button>
          </header>

          <div className="rounded-[28px] border border-slate-200 bg-[#f5f5f2] p-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)]">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-[28px] font-semibold tracking-[-0.06em] text-slate-800">
                  Daftar Produk
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {isLoading
                    ? "Memuat produk..."
                    : `${totalItems} produk sesuai filter`}
                </p>
              </div>

              <button
                onClick={openCreateModal}
                disabled={isSubmitting || isDeleting || isLoggingOut}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0d5c4b] px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(13,92,75,0.22)] transition hover:bg-[#0a4d40] disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Plus className="h-4 w-4" />
                {isSubmitting ? "Menyimpan..." : "Tambah Produk"}
              </button>
            </div>

            <div className="mb-5 flex items-center gap-4">
              <div className="flex flex-1 items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-500 shadow-inner shadow-slate-100/80">
                <Search className="h-4 w-4" />
                <input
                  aria-label="Cari nama produk atau kategori"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full border-0 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                  placeholder="Cari nama produk atau kategori..."
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm outline-none"
              >
                <option value="all">Semua kategori</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.category}>
                    {category.category}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(event) => setSelectedStatus(event.target.value)}
                className="appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 shadow-sm outline-none"
              >
                <option value="all">Semua status</option>
                <option value="aman">Aman</option>
                <option value="menipis">Menipis</option>
                <option value="habis">Habis</option>
              </select>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span>
                  Halaman {page} dari {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    disabled={page <= 1 || isLoading}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Sebelumnya
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                    disabled={page >= totalPages || isLoading}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>

              <table className="min-w-full table-fixed border-separate border-spacing-0">
                <thead className="bg-[#f3f4f6] text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Produk</th>
                    <th className="px-4 py-3">Kategori</th>
                    <th className="px-4 py-3">Harga jual</th>
                    <th className="px-4 py-3">Sisa stok</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white text-[14px] text-slate-700">
                  {!isLoading && products.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                        Tidak ada produk yang cocok dengan filter saat ini.
                      </td>
                    </tr>
                  ) : (
                    products.map((product) => (
                      <tr key={product.id} className="border-t border-slate-200 align-middle">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <ProductBadge color={getProductColor(product.name)} text={getProductBadge(product.name)} />
                            <div>
                              <div className="font-semibold text-slate-800">{product.name}</div>
                              <div className="text-[11px] text-slate-400">{product.id.slice(0, 8).toUpperCase()}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-slate-600">{product.category}</td>
                        <td className="px-4 py-4 font-medium text-slate-700">{formatCurrency(product.price)}</td>
                        <td className="px-4 py-4 text-slate-600">{product.stock} pcs</td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${PRODUCT_STATUS_CLASS[product.status]}`}
                          >
                            {PRODUCT_STATUS_LABEL[product.status]}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => openEditModal(product)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#0d5c4b] text-[#0d5c4b] bg-[#ecfdf5] hover:bg-[#dffaf0]"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({ id: product.id, name: product.name })}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#ef4444]/20 bg-[#fef2f2] text-[#ef4444] hover:bg-[#fee2e2]"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {showGlobalOverlay && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/15 backdrop-blur-[1px]">
          <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/90 px-5 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.12)]">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#0d5c4b]" />
            <span className="text-sm font-medium text-slate-700">{globalLoadingMessage}</span>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#000000]/20 backdrop-blur-[1px]">
          <div className="w-[420px] rounded-[24px] border border-slate-200 bg-[#f4f4f2] p-6 shadow-[0_30px_80px_rgba(15,23,42,0.18)]">
            <h3 className="text-[22px] font-bold tracking-[-0.05em] text-slate-800">
              Hapus produk?
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Apakah Anda yakin ingin menghapus <span className="font-semibold text-slate-700">{deleteTarget.name}</span>?
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
                onClick={handleDelete}
                disabled={isDeleting}
                className="rounded-xl bg-[#d14343] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(209,67,67,0.2)] hover:bg-[#bf3838] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isDeleting ? "Menghapus..." : "Hapus"}
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
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
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

            {isSubmitting ? (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />
                <span>{isEditMode ? "Menyimpan perubahan..." : "Menyimpan produk..."}</span>
              </div>
            ) : null}

            <div className="mt-4 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Nama produk</label>
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 placeholder:text-slate-400 shadow-inner shadow-slate-100/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  placeholder="Contoh: Indomie Goreng"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">Kategori</label>
                <div className="space-y-3">
                  <div className="relative">
                    <select
                      value={categorySelectValue}
                      onChange={(event) => {
                        const nextValue = event.target.value;
                        setForm((current) => ({
                          ...current,
                          category: nextValue === "__custom__" ? "" : nextValue,
                        }));
                      }}
                      className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-3 pr-10 text-sm text-slate-700 shadow-inner shadow-slate-100/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    >
                      <option value="__custom__">Pilih kategori atau buat baru</option>
                      {categoryOptions.map((item) => (
                        <option key={item.id} value={item.category}>
                          {item.category}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                  </div>

                  <input
                    value={form.category}
                    onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 placeholder:text-slate-400 shadow-inner shadow-slate-100/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Masukkan kategori baru atau pilih dari daftar"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Harga jual</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.price}
                    onChange={(event) => handleFormattedNumberChange("price", event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 placeholder:text-slate-400 shadow-inner shadow-slate-100/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Stok</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={form.stock}
                    onChange={(event) => handleFormattedNumberChange("stock", event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-700 placeholder:text-slate-400 shadow-inner shadow-slate-100/80 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSubmit}
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
