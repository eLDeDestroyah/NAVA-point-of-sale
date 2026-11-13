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
    .select("id, name, address, balance")
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
    .select("id, name, address, balance")
    .single();

  if (error || !newShop) {
    return {
      id: "default-shop",
      name: "NAVA MART",
      address: "Jl. Melati No. 12, Bandung",
      balance: 0,
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

  // 1. Ambil transaksi
  const { data: transactions } = await supabase
    .from("transactions")
    .select("id, transaction_id, type, paid, buyer_id, created_at")
    .order("created_at", { ascending: false });

  // 2. Ambil data buyers
  const { data: buyers } = await supabase
    .from("buyers")
    .select("id, name, total_price, paid, status");

  const buyerMap = new Map((buyers ?? []).map((b) => [b.id, b]));

  // Hitung total transaksi masuk, keluar & QRIS
  let totalIncome = 0;
  let totalExpense = 0;
  let totalQris = 0;
  const cashFlows: CashRecord[] = [];

  for (const trx of transactions ?? []) {
    const buyer = buyerMap.get(trx.buyer_id);
    const nominal = Number(trx.paid || 0);

    // Jenis transaksi
    const isExpense = trx.transaction_id?.startsWith("KAS-OUT-") || buyer?.name?.startsWith("Pengeluaran Kas:");
    const isKasModal = !isExpense && (
      trx.transaction_id?.startsWith("KAS-") ||
      buyer?.name?.startsWith("Kas Masuk:") ||
      buyer?.name === "Kas Toko (Tambah Modal/Uang Masuk)"
    );
    const isCicilan = trx.transaction_id?.startsWith("CICIL-");
    // Transaksi kasbon dari kasir: pembayaran awal (bisa 0 jika full kasbon)
    const isKasbonAwal = trx.type === "kasbon";

    if (isExpense) {
      totalExpense += nominal;
    } else {
      if (trx.type === "qris") {
        totalQris += nominal;
      }
      // Transaksi kasbon awal dengan paid=0 tidak perlu masuk income
      // (cicilan akan dicatat sendiri lewat CICIL)
      if (!isKasbonAwal || nominal > 0) {
        totalIncome += nominal;
      }
    }

    // Skip kasbon awal dengan paid=0 dari riwayat kas (tidak ada nilai)
    if (isKasbonAwal && nominal === 0) continue;

    const dateFormatted = new Date(trx.created_at).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

    let displayDescription: string;
    let category: string;

    if (isExpense) {
      displayDescription = buyer?.name?.replace("Pengeluaran Kas: ", "") || `Pengeluaran Kas #${trx.transaction_id}`;
      category = "Pengeluaran";
    } else if (isKasModal) {
      displayDescription = buyer?.name?.replace("Kas Masuk: ", "") || `Kas Masuk #${trx.transaction_id}`;
      category = "Modal / Kas Masuk";
    } else if (isCicilan) {
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
      status: isExpense ? "Keluar" : "Masuk",
    });
  }

  // 3. Olah data kasbon pelanggan (kecuali entri kas internal)
  const debtors: BuyerDebt[] = [];
  let totalPiutangAktif = 0;

  for (const b of buyers ?? []) {
    // Lewati entri kas internal (modal masuk / pengeluaran)
    if (
      b.name?.includes("Kas Toko") ||
      b.name?.includes("Modal Toko") ||
      b.name?.startsWith("Kas Masuk:") ||
      b.name?.startsWith("Pengeluaran Kas:") ||
      b.name === "Kas Toko (Tambah Modal/Uang Masuk)" ||
      b.name === "Pengeluaran Kas Toko"
    ) {
      continue;
    }
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
        progressPercentage: totalPrice > 0 ? Math.min(100, Math.round((paid / totalPrice) * 100)) : 100,
      });
    }
  }

  // Current balance dihitung dari total kas uang masuk dikurangi uang keluar
  const calculatedNetBalance = Math.max(0, totalIncome - totalExpense);
  const shopBalance = Number((shop as any)?.balance || 0);
  const currentBalance = shopBalance > calculatedNetBalance ? shopBalance : calculatedNetBalance;

  return {
    currentBalance,
    lastUpdated: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) + " WIB",
    totalIncome,
    totalExpense,
    totalQris,
    totalPiutangAktif,
    cashFlows,
    debtors,
  };
}

/**
 * Tambah catatan keuangan (bisa jenis 'masuk' atau 'keluar')
 */
export async function addMoneyToShop(input: AddMoneyInput) {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Sesi login tidak valid.");
  }

  if (!input.nominal || input.nominal <= 0) {
    throw new Error("Nominal uang harus lebih dari 0.");
  }

  const isExpense = input.type === "keluar";

  const supabase = await getSupabaseServerClient();
  const shop = await ensureUserShop(userId);

  // 1. Catat entri kas ke tabel buyers & transactions
  const userDesc = input.keterangan?.trim();
  const desc = isExpense
    ? (userDesc ? `Pengeluaran Kas: ${userDesc}` : "Pengeluaran Kas Toko")
    : (userDesc ? `Kas Masuk: ${userDesc}` : "Kas Masuk: Tambah Modal Kas");

  const { data: cashBuyer, error: buyerError } = await supabase
    .from("buyers")
    .insert({
      name: desc,
      total_price: input.nominal,
      paid: input.nominal,
      status: "lunas",
    })
    .select("id")
    .single();

  if (buyerError || !cashBuyer) {
    throw new Error(buyerError?.message || "Gagal mencatat transaksi kas.");
  }

  const randomNum = Math.floor(1000 + Math.random() * 9000);
  const trxCode = isExpense ? `KAS-OUT-${randomNum}` : `KAS-${randomNum}`;

  const { error: trxError } = await supabase.from("transactions").insert({
    transaction_id: trxCode,
    type: "cash",
    paid: input.nominal,
    buyer_id: cashBuyer.id,
  });

  if (trxError) {
    throw new Error(trxError.message || "Gagal mencatat mutasi kas.");
  }

  // 2. Jika kolom balance di shops tersedia, perbarui juga
  try {
    const currentShopBalance = Number((shop as any)?.balance || 0);
    const updatedBalance = isExpense
      ? Math.max(0, currentShopBalance - input.nominal)
      : currentShopBalance + input.nominal;

    await supabase
      .from("shops")
      .update({ balance: updatedBalance })
      .eq("id", shop.id);
  } catch (err) {
    // Lewati jika kolom balance belum ditambahkan pada schema DB
  }

  return {
    success: true,
    type: input.type,
    added: input.nominal,
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

  // 1. Ambil data buyer
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

  // 2. Perbarui tabel buyers
  const { error: updateBuyerErr } = await supabase
    .from("buyers")
    .update({
      paid: newPaid,
      status: newStatus,
    })
    .eq("id", buyer.id);

  if (updateBuyerErr) {
    throw new Error(updateBuyerErr.message || "Gagal memperbarui data kasbon.");
  }

  // 3. Catat cicilan sebagai transaksi baru di tabel transactions
  //    Ini memastikan cicilan masuk ke riwayat kas & totalIncome
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

  // 4. Tambah saldo di tabel shops jika ada
  try {
    const shop = await ensureUserShop(userId);
    const currentBalance = Number(shop.balance || 0);
    await supabase
      .from("shops")
      .update({ balance: currentBalance + input.nominal })
      .eq("id", shop.id);
  } catch (e) {
    // optional
  }

  return {
    success: true,
    buyerId: buyer.id,
    newPaid,
    remaining: Math.max(0, totalPrice - newPaid),
    status: newStatus,
  };
}
