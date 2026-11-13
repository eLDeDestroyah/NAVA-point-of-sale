import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase";

const SESSION_COOKIE_NAME = "nava_session";

async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export type DashboardSummary = {
  shopName: string;
  userName: string;
  omzetToday: number;
  labaBersihToday: number;
  transaksiToday: number;
  rataRataToday: number;
  targetHarian: number;
  persentaseTarget: number;
  salesData: {
    "7 Hari": { label: string; value: number }[];
    "30 Hari": { label: string; value: number }[];
    "3 Bulan": { label: string; value: number }[];
  };
  lowStockProducts: {
    id: string;
    name: string;
    category: string;
    stock: string;
    status: "habis" | "menipis" | "aman";
  }[];
  alerts: {
    type: "danger" | "warning" | "success";
    title: string;
    desc: string;
  }[];
  recentTransactions: {
    id: string;
    time: string;
    customer: string;
    method: string;
    total: number;
    status: "lunas" | "kasbon";
  }[];
  assistantSummary: {
    highlight: string;
    description: string;
    potentialLoss: number;
  };
};

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Sesi login tidak valid.");
  }

  const supabase = await getSupabaseServerClient();

  // 1. Ambil data shop & user milik pengguna saat ini
  const { data: user } = await supabase
    .from("users")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  const { data: shop } = await supabase
    .from("shops")
    .select("id, name")
    .eq("user_id", userId)
    .maybeSingle();

  const shopName = shop?.name || "NAVA MART";
  const userName = user?.username || "Pengguna";

  // 2. Ambil data produk milik user ini saja
  const { data: userProducts } = await supabase
    .from("products")
    .select("id, name, price, buy_price, stock, status, categories(category)")
    .eq("user_id", userId);

  const productList = userProducts ?? [];
  const userProductIds = new Set(productList.map((p) => p.id));
  const productMap = new Map(productList.map((p) => [p.id, p]));

  // Jika user belum punya produk sama sekali, berarti akun baru/kosong
  let userBuyerIds = new Set<string>();
  let userProductBuyers: any[] = [];

  if (userProductIds.size > 0) {
    // 3. Ambil relasi product_buyer hanya untuk produk milik user ini
    const { data: pbs } = await supabase
      .from("product_buyer")
      .select("id, total, price, product_id, buyer_id, created_at")
      .in("product_id", Array.from(userProductIds));

    userProductBuyers = pbs ?? [];
    userBuyerIds = new Set(userProductBuyers.map((pb) => pb.buyer_id));
  }

  // 4. Ambil transactions & buyers yang berelasi dengan produk toko user ini saja
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

  // Waktu hari ini (rentang start of day sampai sekarang)
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // 5. Hitung omzet & transaksi hari ini
  let omzetToday = 0;
  let transaksiTodayCount = 0;

  for (const trx of transactions) {
    if (trx.transaction_id?.startsWith("KAS-OUT-")) continue;

    const trxDate = new Date(trx.created_at);
    if (trxDate >= startOfToday) {
      omzetToday += Number(trx.paid || 0);
      transaksiTodayCount += 1;
    }
  }

  // 6. Hitung Laba Bersih Hari Ini dari produk toko yang terjual hari ini
  // Rumus: (Harga Jual - Harga Beli) * qty
  let labaBersihToday = 0;
  for (const pb of userProductBuyers) {
    const pbDate = new Date(pb.created_at);
    if (pbDate >= startOfToday) {
      const prod = productMap.get(pb.product_id);
      const sellPrice = Number(pb.price || prod?.price || 0);
      const buyPrice = Number((prod as any)?.buy_price ?? 0);
      const qty = Number(pb.total || 1);

      const profitPerItem = Math.max(0, sellPrice - buyPrice);
      labaBersihToday += profitPerItem * qty;
    }
  }

  const rataRataToday = transaksiTodayCount > 0 ? Math.round(omzetToday / transaksiTodayCount) : 0;
  const targetHarian = 60;
  const persentaseTarget = Math.min(100, Math.round((transaksiTodayCount / targetHarian) * 100));

  // 7. Hitung Performa Penjualan real per user (7 Hari, 30 Hari, 3 Bulan)
  const days7Names = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  const sales7Days: { label: string; value: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    let dayTotal = 0;
    for (const trx of transactions) {
      if (trx.transaction_id?.startsWith("KAS-OUT-")) continue;
      const trxDate = new Date(trx.created_at);
      if (trxDate >= dayStart && trxDate <= dayEnd) {
        dayTotal += Number(trx.paid || 0);
      }
    }
    sales7Days.push({
      label: days7Names[d.getDay()],
      value: dayTotal,
    });
  }

  // 30 hari
  const sales30Days: { label: string; value: number }[] = [];
  const intervals = [30, 25, 20, 15, 10, 5, 1];
  for (const interval of intervals) {
    const d = new Date(now);
    d.setDate(d.getDate() - interval);
    const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    let val = 0;
    for (const trx of transactions) {
      if (trx.transaction_id?.startsWith("KAS-OUT-")) continue;
      const trxDate = new Date(trx.created_at);
      if (trxDate >= dayStart && trxDate <= dayEnd) {
        val += Number(trx.paid || 0);
      }
    }
    sales30Days.push({
      label: String(31 - interval),
      value: val,
    });
  }

  // 3 bulan terakhir
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const sales3Months: { label: string; value: number }[] = [];
  for (let i = 2; i >= 0; i--) {
    const m = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

    let monthTotal = 0;
    for (const trx of transactions) {
      if (trx.transaction_id?.startsWith("KAS-OUT-")) continue;
      const trxDate = new Date(trx.created_at);
      if (trxDate >= m && trxDate <= mEnd) {
        monthTotal += Number(trx.paid || 0);
      }
    }
    sales3Months.push({
      label: monthNames[m.getMonth()],
      value: monthTotal,
    });
  }

  // 8. Produk stok menipis / perlu dikulak (hanya dari produk toko user)
  const lowStockProducts: DashboardSummary["lowStockProducts"] = [];
  let potentialLoss = 0;
  let outOfStockCount = 0;

  for (const p of productList) {
    const stock = Number(p.stock || 0);
    const catName = (p.categories as any)?.category || "Umum";
    if (stock <= 0) {
      outOfStockCount++;
      potentialLoss += Number(p.price || 0) * 10;
      lowStockProducts.push({
        id: p.id,
        name: p.name,
        category: catName,
        stock: `${stock} pcs`,
        status: "habis",
      });
    } else if (stock < 5) {
      potentialLoss += Number(p.price || 0) * 5;
      lowStockProducts.push({
        id: p.id,
        name: p.name,
        category: catName,
        stock: `${stock} pcs`,
        status: "menipis",
      });
    }
  }

  // 9. Kasbon aktif & Alerts
  let kasbonPendingCount = 0;
  let totalKasbonAmount = 0;
  for (const b of buyers) {
    const totalPrice = Number(b.total_price || 0);
    const paid = Number(b.paid || 0);
    const remaining = Math.max(0, totalPrice - paid);
    if (b.status === "kasbon" && remaining > 0) {
      kasbonPendingCount++;
      totalKasbonAmount += remaining;
    }
  }

  const alerts: DashboardSummary["alerts"] = [];
  if (outOfStockCount > 0) {
    const habisItem = lowStockProducts.find((p) => p.status === "habis");
    alerts.push({
      type: "danger",
      title: `${outOfStockCount} produk habis`,
      desc: habisItem ? `${habisItem.name} perlu segera dikulak.` : "Beberapa produk perlu restock.",
    });
  } else {
    alerts.push({
      type: "success",
      title: "Stok produk aman",
      desc: "Tidak ada produk yang habis saat ini.",
    });
  }

  if (kasbonPendingCount > 0) {
    alerts.push({
      type: "warning",
      title: `${kasbonPendingCount} kasbon aktif`,
      desc: `Total piutang Rp ${totalKasbonAmount.toLocaleString("id-ID")} belum lunas.`,
    });
  }

  alerts.push({
    type: transaksiTodayCount >= targetHarian ? "success" : "warning",
    title: transaksiTodayCount >= targetHarian ? "Target tercapai!" : "Target harian",
    desc:
      transaksiTodayCount >= targetHarian
        ? "Target harian toko telah terlampaui."
        : `Kurang ${Math.max(0, targetHarian - transaksiTodayCount)} transaksi lagi hari ini.`,
  });

  // 10. Transaksi Terakhir (hanya transaksi milik toko user)
  const recentTransactions: DashboardSummary["recentTransactions"] = [];
  const latestTrxList = transactions.slice(0, 5);

  for (const trx of latestTrxList) {
    const buyer = buyerMap.get(trx.buyer_id);
    const trxDate = new Date(trx.created_at);
    const timeFormatted = trxDate.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const isKasbon = trx.type === "kasbon" || buyer?.status === "kasbon";

    recentTransactions.push({
      id: trx.transaction_id || `TRX-${trx.id.slice(0, 4)}`,
      time: timeFormatted,
      customer: buyer?.name || "Pelanggan umum",
      method: trx.type === "qris" ? "QRIS" : "Tunai",
      total: Number(trx.paid || buyer?.total_price || 0),
      status: isKasbon ? "kasbon" : "lunas",
    });
  }

  return {
    shopName,
    userName,
    omzetToday,
    labaBersihToday,
    transaksiToday: transaksiTodayCount,
    rataRataToday,
    targetHarian,
    persentaseTarget,
    salesData: {
      "7 Hari": sales7Days,
      "30 Hari": sales30Days,
      "3 Bulan": sales3Months,
    },
    lowStockProducts,
    alerts,
    recentTransactions,
    assistantSummary: {
      highlight: "Performa Toko",
      description:
        transaksiTodayCount > 0
          ? `Omzet hari ini tercatat Rp ${omzetToday.toLocaleString("id-ID")}.`
          : "Belum ada transaksi hari ini.",
      potentialLoss,
    },
  };
}
