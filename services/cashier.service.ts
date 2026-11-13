import { cookies } from "next/headers";

import { getSupabaseServerClient } from "@/lib/supabase";
import { seedDemoProductsForUser } from "@/services/product.service";
import type {
  BuyerStatus,
  CashierProductItem,
  CheckoutInput,
  CheckoutResult,
} from "@/types/cashier.type";

const SESSION_COOKIE_NAME = "nava_session";

async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

// Helper untuk inisial nama produk (contoh: "Indomie Goreng" -> "IG")
function getProductInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

// Helper untuk aksen warna badge produk
const CATEGORY_ACCENTS: Record<string, string> = {
  Makanan: "bg-[#f5d5b6] text-[#7c4a2f]",
  Minuman: "bg-[#dfe7f6] text-[#496a8a]",
  Sembako: "bg-[#f6e2c2] text-[#b06b1a]",
  "Rumah Tangga": "bg-[#e9defd] text-[#6a5a9f]",
};

function getAccentForCategory(category: string, index: number): string {
  if (CATEGORY_ACCENTS[category]) {
    return CATEGORY_ACCENTS[category];
  }
  const fallbackAccents = [
    "bg-[#f5d5b6] text-[#7c4a2f]",
    "bg-[#dfe7f6] text-[#496a8a]",
    "bg-[#f6e8cd] text-[#ac6d1b]",
    "bg-[#f3dfe5] text-[#7c4d65]",
    "bg-[#dbeee4] text-[#2d6d4c]",
    "bg-[#e9defd] text-[#6a5a9f]",
  ];
  return fallbackAccents[index % fallbackAccents.length];
}

/**
 * Mengambil daftar produk untuk kasir berdasarkan user yang sedang login.
 * Jika belum ada produk, otomatis mengisi data demo.
 */
export async function getCashierProducts(options?: {
  search?: string;
  category?: string;
}): Promise<CashierProductItem[]> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Sesi login tidak valid. Silakan login terlebih dahulu.");
  }

  const supabase = await getSupabaseServerClient();

  let query = supabase
    .from("products")
    .select("id, name, price, stock, status, image_path, category_id, user_id, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (options?.search) {
    query = query.ilike("name", `%${options.search.trim()}%`);
  }

  const { data: products, error } = await query;
  if (error) {
    throw new Error(error.message || "Gagal memuat produk kasir.");
  }

  if (!products || products.length === 0) {
    return [];
  }

  // Ambil data kategori
  const categoryIds = [...new Set(products.map((p) => p.category_id))];
  const categoryMap = new Map<string, string>();

  if (categoryIds.length > 0) {
    const { data: categories } = await supabase
      .from("categories")
      .select("id, category")
      .in("id", categoryIds);

    for (const cat of categories ?? []) {
      categoryMap.set(cat.id, cat.category);
    }
  }

  let mappedProducts: CashierProductItem[] = products.map((item, idx) => {
    const catName = categoryMap.get(item.category_id) || "Umum";
    return {
      id: item.id,
      name: item.name,
      short: getProductInitials(item.name),
      category: catName,
      price: Number(item.price) || 0,
      stock: Number(item.stock) || 0,
      accent: getAccentForCategory(catName, idx),
      image_path: item.image_path,
      status: item.status as "aman" | "habis" | "menipis",
    };
  });

  // Filter kategori di memori jika ada
  if (options?.category && options.category.toLowerCase() !== "semua") {
    const targetCat = options.category.toLowerCase();
    mappedProducts = mappedProducts.filter(
      (p) => p.category.toLowerCase() === targetCat
    );
  }

  return mappedProducts;
}

/**
 * Memproses transaksi kasir sesuai alur pada RULE.md & ERD:
 * 1. Ambil & validasi produk di database terlebih dahulu (cek stok dan harga terkini).
 * 2. Catat pembeli di tabel `buyers`.
 * 3. Catat transaksi di tabel `transactions`.
 * 4. Catat setiap item di tabel `product_buyer`.
 * 5. Catat riwayat pembayaran di tabel `history_product_buyer`.
 * 6. Kurangi stok produk di tabel `products` dan perbarui status ('aman'/'menipis'/'habis').
 */
export async function createCashierTransaction(
  input: CheckoutInput
): Promise<CheckoutResult> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Sesi login tidak valid. Silakan login terlebih dahulu.");
  }

  if (!input.items || input.items.length === 0) {
    throw new Error("Keranjang belanja masih kosong.");
  }

  const supabase = await getSupabaseServerClient();

  // 1. Ambil produk dari database terlebih dahulu untuk validasi harga & stok
  const productIds = input.items.map((i) => i.productId);
  const { data: dbProducts, error: productFetchError } = await supabase
    .from("products")
    .select("id, name, price, stock, status, user_id")
    .in("id", productIds)
    .eq("user_id", userId);

  if (productFetchError) {
    throw new Error(productFetchError.message || "Gagal mengambil data produk.");
  }

  const productMap = new Map((dbProducts ?? []).map((p) => [p.id, p]));

  // Validasi ketersediaan dan stok tiap item
  let calculatedTotalPrice = 0;
  const validatedItems: Array<{
    product: { id: string; name: string; price: number; stock: number };
    qty: number;
    price: number;
    subtotal: number;
  }> = [];

  for (const item of input.items) {
    const dbProduct = productMap.get(item.productId);
    if (!dbProduct) {
      throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
    }

    if (item.qty <= 0) {
      throw new Error(`Jumlah untuk produk "${dbProduct.name}" harus lebih dari 0.`);
    }

    if (item.qty > dbProduct.stock) {
      throw new Error(
        `Stok produk "${dbProduct.name}" tidak mencukupi (tersedia: ${dbProduct.stock}, diminta: ${item.qty}).`
      );
    }

    const price = Number(dbProduct.price) || 0;
    const subtotal = price * item.qty;
    calculatedTotalPrice += subtotal;

    validatedItems.push({
      product: {
        id: dbProduct.id,
        name: dbProduct.name,
        price,
        stock: Number(dbProduct.stock) || 0,
      },
      qty: item.qty,
      price,
      subtotal,
    });
  }

  // Tentukan nominal bayar & status buyer (kasbon / lunas)
  const isKasbon = input.paymentMethod === "kasbon";
  const paid = isKasbon
    ? Math.max(0, Number(input.paidAmount ?? 0))
    : Number(input.paidAmount && input.paidAmount >= calculatedTotalPrice ? input.paidAmount : calculatedTotalPrice);

  const buyerStatus: BuyerStatus = paid >= calculatedTotalPrice ? "lunas" : "kasbon";

  // 2. Simpan data pembeli ke tabel `buyers`
  const buyerName = input.customerName?.trim() || "Pelanggan Umum";
  const { data: buyer, error: buyerError } = await supabase
    .from("buyers")
    .insert({
      name: buyerName,
      total_price: Math.round(calculatedTotalPrice),
      paid: Math.round(paid),
      status: buyerStatus,
    })
    .select("id, name, total_price, paid, status")
    .single();

  if (buyerError || !buyer) {
    throw new Error(buyerError?.message || "Gagal mencatat data pembeli.");
  }

  // 3. Buat ID transaksi unik dan simpan ke tabel `transactions`
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const transactionCode = `TRX-${randomNum}`;

  const { data: transaction, error: trxError } = await supabase
    .from("transactions")
    .insert({
      transaction_id: transactionCode,
      type: input.paymentMethod, // 'cash' | 'qris' | 'kasbon'
      paid: Math.round(paid),
      buyer_id: buyer.id,
    })
    .select("id, transaction_id, type, paid, buyer_id, created_at")
    .single();

  if (trxError || !transaction) {
    throw new Error(trxError?.message || "Gagal membuat catatan transaksi.");
  }

  // 4, 5, 6. Simpan `product_buyer`, `history_product_buyer`, serta kurangi stok produk
  const resultItems = [];

  for (const item of validatedItems) {
    // 4. Catat di tabel `product_buyer`
    const { data: pbData, error: pbError } = await supabase
      .from("product_buyer")
      .insert({
        total: item.qty,
        price: item.price,
        product_id: item.product.id,
        buyer_id: buyer.id,
      })
      .select("id, total, price, product_id, buyer_id, created_at")
      .single();

    if (pbError || !pbData) {
      throw new Error(pbError?.message || `Gagal mencatat detail belanja ${item.product.name}.`);
    }

    // 5. Catat di tabel `history_product_buyer`
    const itemPaidAllocation =
      calculatedTotalPrice > 0
        ? (item.subtotal / calculatedTotalPrice) * Math.min(paid, calculatedTotalPrice)
        : 0;

    const { error: hpbError } = await supabase
      .from("history_product_buyer")
      .insert({
        paid: Math.round(itemPaidAllocation),
        product_buyer_id: pbData.id,
      });

    if (hpbError) {
      console.error("Gagal mencatat history_product_buyer:", hpbError);
    }

    // 6. Kurangi stok produk dan evaluasi status (habis / menipis / aman)
    const newStock = Math.max(0, item.product.stock - item.qty);
    let newStatus: "habis" | "menipis" | "aman" = "aman";
    if (newStock === 0) {
      newStatus = "habis";
    } else if (newStock < 5) {
      newStatus = "menipis";
    }

    const { error: updateStockError } = await supabase
      .from("products")
      .update({
        stock: newStock,
        status: newStatus,
      })
      .eq("id", item.product.id)
      .eq("user_id", userId);

    if (updateStockError) {
      console.error(`Gagal update stok produk ${item.product.name}:`, updateStockError);
    }

    resultItems.push({
      id: pbData.id,
      product_id: item.product.id,
      product_name: item.product.name,
      total: item.qty,
      price: item.price,
      subtotal: item.subtotal,
    });
  }

  return {
    transaction: {
      id: transaction.id,
      transaction_id: transaction.transaction_id,
      type: transaction.type as "cash" | "qris" | "kasbon",
      paid: Number(transaction.paid ?? paid),
      buyer_id: transaction.buyer_id,
      created_at: transaction.created_at,
    },
    buyer: {
      id: buyer.id,
      name: buyer.name,
      total_price: Number(buyer.total_price),
      paid: Number(buyer.paid),
      status: buyer.status as BuyerStatus,
    },
    items: resultItems,
    total_price: calculatedTotalPrice,
    paid,
    change: Math.max(0, paid - calculatedTotalPrice),
  };
}
