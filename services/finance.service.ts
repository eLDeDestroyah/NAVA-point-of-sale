import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase";
import type {
  AddMoneyInput,
  BuyerDebt,
  CashRecord,
  FinanceSummary,
  PayInstallmentInput,
} from "@/types/finance.type";

const SESSION_COOKIE_NAME = "nava_session";

async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

/**
 * Memastikan shop milik user ada. Jika belum ada, buat default.
 */
async function ensureUserShop(userId: string) {
  const supabase = await getSupabaseServerClient();
  const { data: existingShop } = await supabase
    .from("shops")
    .select("id, name, address")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingShop) {
    return existingShop;
  }

  const { data: newShop, error } = await supabase
    .from("shops")
    .insert({
      name: "NAVA MART",
      address: "Jl. Melati No. 12, Bandung",
      open: new Date().toISOString(),
      close: "21:00:00",
      user_id: userId,
    })
    .select("id, name, address")
    .single();

  if (error || !newShop) {
    return {
      id: "default-shop",
      name: "NAVA MART",
      address: "Jl. Melati No. 12, Bandung",
    };
  }

  return newShop;
}

/**
 * Mengambil ringkasan keuangan toko, riwayat arus kas, dan kasbon pelanggan
 */
export async function getFinanceSummary(): Promise<FinanceSummary> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Sesi login tidak valid.");
  }

  const supabase = await getSupabaseServerClient();
  const shop = await ensureUserShop(userId);

  // 1. Ambil ID produk milik user ini saja
  const { data: userProducts } = await supabase
    .from("products")
    .select("id")
    .eq("user_id", userId);

  const userProductIds = (userProducts ?? []).map((p) => p.id);

  let userBuyerIds = new Set<string>();
  if (userProductIds.length > 0) {
    const { data: pbs } = await supabase
      .from("product_buyer")
      .select("buyer_id")
      .in("product_id", userProductIds);

    userBuyerIds = new Set((pbs ?? []).map((pb) => pb.buyer_id));
  }

  // 2. Ambil transaksi penjualan hanya untuk buyer milik toko user
  let transactions: any[] = [];
  let buyers: any[] = [];

  if (userBuyerIds.size > 0) {
    const { data: trxs } = await supabase
      .from("transactions")
      .select("id, transaction_id, type, paid, buyer_id, created_at")
      .in("buyer_id", Array.from(userBuyerIds))
      .order("created_at", { ascending: false });

    transactions = trxs ?? [];

    const { data: byrs } = await supabase
      .from("buyers")
      .select("id, name, total_price, paid, status")
      .in("id", Array.from(userBuyerIds));

    buyers = byrs ?? [];
  }

  const buyerMap = new Map(buyers.map((b) => [b.id, b]));

  // 3. Ambil catatan kas manual (uang masuk / keluar) dari tabel cash_records milik toko user
  const { data: cashRecords } = await supabase
    .from("cash_records")
    .select("id, type, nominal, keterangan, created_at")
    .eq("shop_id", shop.id)
    .order("created_at", { ascending: false });

  // Hitung total dari transaksi penjualan & cicilan kasbon
  let totalIncome = 0;
  let totalQris = 0;
  const cashFlows: CashRecord[] = [];

  for (const trx of transactions) {
    const buyer = buyerMap.get(trx.buyer_id);
    const nominal = Number(trx.paid || 0);

    const isCicilan = trx.transaction_id?.startsWith("CICIL-");
    const isKasbonAwal = trx.type === "kasbon";

    if (isKasbonAwal && nominal === 0) continue;

    if (trx.type === "qris") {
      totalQris += nominal;
    }
    totalIncome += nominal;

    const dateFormatted = new Date(trx.created_at).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    let displayDescription: string;
    let category: string;

    if (isCicilan) {
      displayDescription = `Cicilan Kasbon - ${buyer?.name || "Pelanggan"} (#${trx.transaction_id})`;
      category = "Cicilan Kasbon";
    } else if (isKasbonAwal) {
      displayDescription = `Penjualan Kasbon #${trx.transaction_id} (${buyer?.name || "Pelanggan"})`;
      category = "Kasbon";
    } else {
      displayDescription = `Penjualan #${trx.transaction_id}`;
      category = "Penjualan";
    }

    cashFlows.push({
      id: trx.id,
      date: dateFormatted,
      description: displayDescription,
      category,
      method: trx.type === "qris" ? "QRIS" : "Tunai",
      nominal,
      status: "Masuk",
    });
  }

  // Hitung total dari cash_records (uang masuk / keluar manual)
  let totalCashIn = 0;
  let totalExpense = 0;

  for (const rec of cashRecords ?? []) {
    const nominal = Number(rec.nominal || 0);
    const dateFormatted = new Date(rec.created_at).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    if (rec.type === "masuk") {
      totalCashIn += nominal;
      cashFlows.push({
        id: rec.id,
        date: dateFormatted,
        description: rec.keterangan?.trim() || "Tambah Modal / Kas Masuk",
        category: "Modal / Kas Masuk",
        method: "Tunai",
        nominal,
        status: "Masuk",
      });
    } else {
      totalExpense += nominal;
      cashFlows.push({
        id: rec.id,
        date: dateFormatted,
        description: rec.keterangan?.trim() || "Pengeluaran Kas",
        category: "Pengeluaran",
        method: "Tunai",
        nominal,
        status: "Keluar",
      });
    }
  }

  // Urutkan riwayat kas berdasarkan tanggal terbaru
  cashFlows.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  totalIncome += totalCashIn;
  const currentBalance = Math.max(0, totalIncome - totalExpense);

  // 4. Olah data kasbon pelanggan milik toko user
  const debtors: BuyerDebt[] = [];
  let totalPiutangAktif = 0;

  for (const b of buyers) {
    const totalPrice = Number(b.total_price || 0);
    const paid = Number(b.paid || 0);
    const remaining = Math.max(0, totalPrice - paid);

    if (b.status === "kasbon" || remaining > 0) {
      totalPiutangAktif += remaining;
      debtors.push({
        id: b.id,
        name: b.name || "Pelanggan",
        total_price: totalPrice,
        paid,
        remaining,
        status: b.status as "kasbon" | "lunas",
        progressPercentage:
          totalPrice > 0
            ? Math.min(100, Math.round((paid / totalPrice) * 100))
            : 100,
      });
    }
  }

  return {
    currentBalance,
    lastUpdated:
      new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }) + " WIB",
    totalIncome,
    totalExpense,
    totalQris,
    totalPiutangAktif,
    cashFlows,
    debtors,
  };
}

/**
 * Tambah catatan keuangan manual ke tabel cash_records
 */
export async function addMoneyToShop(input: AddMoneyInput) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Sesi login tidak valid.");
  }

  if (!input.nominal || input.nominal <= 0) {
    throw new Error("Nominal uang harus lebih dari 0.");
  }

  const supabase = await getSupabaseServerClient();
  const shop = await ensureUserShop(userId);

  const { error } = await supabase.from("cash_records").insert({
    shop_id: shop.id,
    type: input.type,
    nominal: input.nominal,
    keterangan: input.keterangan?.trim() || null,
  });

  if (error) {
    throw new Error(error.message || "Gagal menyimpan catatan keuangan.");
  }

  return {
    success: true,
    type: input.type,
    nominal: input.nominal,
    keterangan: input.keterangan,
  };
}

/**
 * Bayar cicilan kasbon pelanggan
 */
export async function payCustomerDebt(input: PayInstallmentInput) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Sesi login tidak valid.");
  }

  if (!input.nominal || input.nominal <= 0) {
    throw new Error("Nominal cicilan harus lebih dari 0.");
  }

  const supabase = await getSupabaseServerClient();

  const { data: buyer, error: buyerErr } = await supabase
    .from("buyers")
    .select("id, name, total_price, paid, status")
    .eq("id", input.buyerId)
    .single();

  if (buyerErr || !buyer) {
    throw new Error("Data pembeli tidak ditemukan.");
  }

  const currentPaid = Number(buyer.paid || 0);
  const totalPrice = Number(buyer.total_price || 0);
  const newPaid = currentPaid + input.nominal;
  const newStatus = newPaid >= totalPrice ? "lunas" : "kasbon";

  const { error: updateBuyerErr } = await supabase
    .from("buyers")
    .update({ paid: newPaid, status: newStatus })
    .eq("id", buyer.id);

  if (updateBuyerErr) {
    throw new Error(updateBuyerErr.message || "Gagal memperbarui data kasbon.");
  }

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const trxCode = `CICIL-${randomNum}`;

  const { error: trxErr } = await supabase.from("transactions").insert({
    transaction_id: trxCode,
    type: "cash",
    paid: input.nominal,
    buyer_id: buyer.id,
  });

  if (trxErr) {
    throw new Error(trxErr.message || "Gagal mencatat transaksi cicilan.");
  }

  return {
    success: true,
    buyerId: buyer.id,
    newPaid,
    remaining: Math.max(0, totalPrice - newPaid),
    status: newStatus,
  };
}
