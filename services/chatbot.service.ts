import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase";

const SESSION_COOKIE_NAME = "nava_session";

async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export interface ChatMessage {
  role: "user" | "model";
  parts: [{ text: string }];
}

/**
 * Mengambil ringkasan context read-only toko KHUSUS milik user yang sedang login.
 * Keamanan: Hanya SELECT, tidak ada insert/update/delete sama sekali.
 */
export async function getStoreContextForCurrentStore(): Promise<{
  shopName: string;
  userName: string;
  productsSummary: string;
  salesSummary: string;
  debtsSummary: string;
  cashFlowSummary: string;
}> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error("Sesi pengguna tidak ditemukan. Silakan login terlebih dahulu.");
  }

  const supabase = await getSupabaseServerClient();

  // 1. Ambil data Toko & Pengguna (Hanya milik userId ini)
  const { data: userRecord } = await supabase
    .from("users")
    .select("username, email")
    .eq("id", userId)
    .single();

  const { data: shopRecord } = await supabase
    .from("shops")
    .select("id, name, address, target_omzet")
    .eq("user_id", userId)
    .single();

  const shopName = shopRecord?.name || "Toko NAVA";
  const userName = userRecord?.username || "Pemilik Toko";
  const shopId = shopRecord?.id;

  // 2. Ambil kategori pengguna untuk mapping nama kategori
  const { data: categories } = await supabase
    .from("categories")
    .select("id, category")
    .eq("user_id", userId);

  const categoryMap = new Map<string, string>();
  categories?.forEach((c) => {
    categoryMap.set(c.id, c.category);
  });

  // 3. Ambil data produk (Hanya milik userId ini)
  const { data: products, error: productError } = await supabase
    .from("products")
    .select("id, name, price, buy_price, stock, category_id, status")
    .eq("user_id", userId);

  if (productError) {
    console.error("Error fetching products for chatbot:", productError);
  }

  const productList = products || [];
  const totalProducts = productList.length;
  const outOfStock = productList.filter((p) => p.stock <= 0);
  const lowStock = productList.filter((p) => p.stock > 0 && p.stock <= 5);

  // Format ringkasan produk & margin untung (price - buy_price)
  const productSample = productList
    .map((p) => {
      const categoryName = categoryMap.get(p.category_id) || "Umum";
      const margin = Number(p.price) - Number(p.buy_price || 0);
      const marginPct =
        Number(p.price) > 0 ? Math.round((margin / Number(p.price)) * 100) : 0;
      return `- ${p.name} (Kategori: ${categoryName}): Harga Jual Rp ${Number(
        p.price
      ).toLocaleString("id-ID")}, Harga Beli Rp ${Number(
        p.buy_price || 0
      ).toLocaleString("id-ID")}, Margin Untung: Rp ${margin.toLocaleString(
        "id-ID"
      )} (${marginPct}%), Stok: ${p.stock} (${
        p.stock <= 0 ? "HABIS" : p.stock <= 5 ? "MENIPIS" : "AMAN"
      })`;
    })
    .join("\n");

  const productsSummary = `Total varian produk terdaftar: ${totalProducts} barang.
Produk Habis (${outOfStock.length} barang): ${
    outOfStock.map((p) => p.name).join(", ") || "Tidak ada"
  }
Produk Stok Menipis (<= 5 pcs, ${lowStock.length} barang): ${
    lowStock.map((p) => `${p.name} (sisa ${p.stock})`).join(", ") || "Tidak ada"
  }

Daftar Rincian Produk, Modal Beli, Harga Jual, dan Margin:
${productSample || "Belum ada produk yang didaftarkan."}`;

  // 4. Ambil Transaksi & Penjualan (Hanya transaksi yang berkaitan dengan produk milik user ini)
  let salesSummary = "Belum ada catatan penjualan.";
  let debtsSummary = "Tidak ada catatan kasbon pelanggan.";

  if (productList.length > 0) {
    const productIds = productList.map((p) => p.id);
    const { data: pbItems } = await supabase
      .from("product_buyer")
      .select("buyer_id, product_id, count")
      .in("product_id", productIds);

    const buyerIds = Array.from(
      new Set(pbItems?.map((pb) => pb.buyer_id) || [])
    );

    if (buyerIds.length > 0) {
      const { data: buyers } = await supabase
        .from("buyers")
        .select("id, name, created_at")
        .in("id", buyerIds);

      const { data: transactions } = await supabase
        .from("transactions")
        .select("id, buyer_id, total, status, payment_method, date")
        .in("buyer_id", buyerIds);

      const txList = transactions || [];
      const totalTx = txList.length;
      const lunasTx = txList.filter((t) => t.status === "lunas");
      const kasbonTx = txList.filter((t) => t.status === "kasbon");

      const totalOmzetLunas = lunasTx.reduce(
        (sum, t) => sum + Number(t.total || 0),
        0
      );
      const totalKasbon = kasbonTx.reduce(
        (sum, t) => sum + Number(t.total || 0),
        0
      );

      // Hitung produk paling laku (terlaris)
      const countMap: Record<string, number> = {};
      pbItems?.forEach((item) => {
        countMap[item.product_id] =
          (countMap[item.product_id] || 0) + (item.count || 1);
      });

      const topProducts = Object.entries(countMap)
        .map(([pid, qty]) => {
          const prod = productList.find((p) => p.id === pid);
          return {
            name: prod?.name || "Item",
            qty,
            margin: prod
              ? (Number(prod.price) - Number(prod.buy_price || 0)) * qty
              : 0,
          };
        })
        .sort((a, b) => b.qty - a.qty);

      const topProductStr = topProducts
        .slice(0, 5)
        .map(
          (tp, idx) =>
            `${idx + 1}. ${tp.name} (Terjual: ${tp.qty} pcs, Estimasi Laba Kotor: Rp ${tp.margin.toLocaleString("id-ID")})`
        )
        .join(", ");

      salesSummary = `Total transaksi: ${totalTx} transaksi.
Omzet transaksi lunas: Rp ${totalOmzetLunas.toLocaleString("id-ID")}.
Produk paling laris terjual: ${topProductStr || "Belum ada data terjual"}.`;

      if (kasbonTx.length > 0) {
        const buyerMap = new Map((buyers || []).map((b) => [b.id, b.name]));
        const kasbonDetails = kasbonTx
          .map(
            (k) =>
              `- ${buyerMap.get(k.buyer_id) || "Pelanggan"}: Rp ${Number(
                k.total
              ).toLocaleString("id-ID")} (Tanggal: ${k.date || "-"})`
          )
          .join("\n");
        debtsSummary = `Total kasbon/piutang belum lunas: Rp ${totalKasbon.toLocaleString(
          "id-ID"
        )} dari ${kasbonTx.length} transaksi kasbon.
Rincian kasbon:
${kasbonDetails}`;
      }
    }
  }

  // 5. Catatan Buku Kas (Pemasukan / Pengeluaran Toko jika ada)
  let cashFlowSummary = "Belum ada catatan buku kas tambahan.";
  if (shopId) {
    const { data: cashRecords } = await supabase
      .from("cash_records")
      .select("type, amount, note, date")
      .eq("shop_id", shopId)
      .order("date", { ascending: false })
      .limit(10);

    if (cashRecords && cashRecords.length > 0) {
      const pemasukan = cashRecords
        .filter((r) => r.type === "in")
        .reduce((sum, r) => sum + Number(r.amount || 0), 0);
      const pengeluaran = cashRecords
        .filter((r) => r.type === "out")
        .reduce((sum, r) => sum + Number(r.amount || 0), 0);
      cashFlowSummary = `Pemasukan kas tercatat: Rp ${pemasukan.toLocaleString(
        "id-ID"
      )}, Pengeluaran kas: Rp ${pengeluaran.toLocaleString("id-ID")}.
Catatan kas terbaru:
${cashRecords
  .map(
    (r) =>
      `- [${r.type === "in" ? "MASUK" : "KELUAR"}] Rp ${Number(
        r.amount
      ).toLocaleString("id-ID")} (${r.note || "Tanpa keterangan"})`
  )
  .join("\n")}`;
    }
  }

  return {
    shopName,
    userName,
    productsSummary,
    salesSummary,
    debtsSummary,
    cashFlowSummary,
  };
}

/**
 * Menanyakan ke model Gemini dengan system context toko yang ketat.
 */
export async function askNavaAssistant(
  userQuery: string,
  history: Array<{ sender: "user" | "bot"; text: string }> = []
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY belum dikonfigurasi di server.");
  }

  // Ambil data toko pengguna saat ini
  const context = await getStoreContextForCurrentStore();

  const systemInstruction = `Kamu adalah NAVA AI, asisten bisnis cerdas dan ramah untuk platform kasir POS NAVA.
Kamu sedang berbicara langsung dengan pemilik toko bernama "${context.userName}" pemilik toko "${context.shopName}".

ATURAN DAN BATASAN MUTLAK:
1. KAMU HANYA BOLEH MENJAWAB PERTANYAAN TERKAIT TOKO INI, BISNISNYA, PENJUALAN, STOK, LABA/MARGIN, KASBON, DAN FITUR POS NAVA.
2. JANGAN PERNAH MENJAWAB PERTANYAAN DI LUAR KONTEKS TOKO/WEBSITE INI (seperti pengetahuan umum, coding di luar toko, politik, hiburan, dll). Jika user bertanya hal di luar toko, tolak dengan sopan: "Maaf, sebagai asisten NAVA saya hanya dapat membantu hal-hal seputar operasional toko, penjualan, stok, dan keuangan ${context.shopName}."
3. SISTEM INI ADALAH READ-ONLY (HANYA MEMBACA DATA). Kamu TIDAK BISA dan TIDAK BOLEH mengubah, menghapus, atau menambahkan data database. Jelaskan bahwa transaksi dan perubahan data harus dilakukan langsung lewat menu Kasir/Produk.
4. JAWABLAH BERDASARKAN DATA TOKO TERKINI BERIKUT:
--- DATA TOKO ${context.shopName.toUpperCase()} ---
Nama Pemilik: ${context.userName}
Nama Toko: ${context.shopName}

[DATA PRODUK & STOK]
${context.productsSummary}

[DATA PENJUALAN]
${context.salesSummary}

[DATA KASBON / PIUTANG PELANGGAN]
${context.debtsSummary}

[DATA ARUS KAS / CATATAN KAS]
${context.cashFlowSummary}
---------------------------------

PANDUAN PERHITUNGAN:
- Laba Bersih / Keuntungan Kotor per produk = (Harga Jual - Harga Beli).
- Jika ditanya stok habis, stok menipis, atau produk apa saja yang ada, sebutkan nama-nama produk tersebut dari daftar data di atas dengan teliti.
- Berikan jawaban yang ringkas, jelas, terstruktur (bisa pakai bullet points), dan solutif bagi pemilik toko.
- Gunakan bahasa Indonesia yang ramah, profesional, dan menyemangati.`;

  // Format riwayat pesan untuk Gemini API
  const formattedContents: Array<{ role: "user" | "model"; parts: [{ text: string }] }> = [];

  // Masukkan percakapan sebelumnya (jika ada)
  const recentHistory = history.slice(-6);
  for (const h of recentHistory) {
    formattedContents.push({
      role: h.sender === "user" ? "user" : "model",
      parts: [{ text: h.text }],
    });
  }

  // Tambahkan query terakhir
  formattedContents.push({
    role: "user",
    parts: [{ text: userQuery }],
  });

  const payload = {
    system_instruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: formattedContents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000,
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API Error:", response.status, errorText);
    throw new Error("Gagal menghubungi layanan AI. Silakan coba beberapa saat lagi.");
  }

  const json = await response.json();
  const reply = json?.candidates?.[0]?.content?.parts?.[0]?.text;

  return reply || "Maaf, saya tidak dapat merumuskan jawaban saat ini.";
}
