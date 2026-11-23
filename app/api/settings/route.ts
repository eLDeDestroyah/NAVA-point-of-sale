import { NextResponse } from "next/server";
import { z } from "zod";

import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase";

const settingsSchema = z.object({
  username: z.string().trim().min(3).max(50),
  shopName: z.string().trim().min(2).max(80),
  shopAddress: z.string().trim().max(180),
});

async function getUserId() {
  const cookieStore = await cookies();
  return cookieStore.get("nava_session")?.value ?? null;
}

export async function GET() {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sesi login tidak valid." }, { status: 401 });
  }

  const supabase = await getSupabaseServerClient();
  const [{ data: user }, { data: shop }] = await Promise.all([
    supabase
      .from("users")
      .select("id, username, email, membership")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("shops")
      .select("id, name, address")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  if (!user) {
    return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
  }

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      membership: user.membership,
    },
    shop: {
      id: shop?.id ?? null,
      name: shop?.name ?? "NAVA MART",
      address: shop?.address ?? "",
    },
  });
}

export async function POST(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Sesi login tidak valid." }, { status: 401 });
  }

  const parsed = settingsSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Pengaturan tidak valid." },
      { status: 400 },
    );
  }

  const supabase = await getSupabaseServerClient();
  const { error: userError } = await supabase
    .from("users")
    .update({ username: parsed.data.username })
    .eq("id", userId);

  if (userError) {
    return NextResponse.json({ error: "Nama pengguna gagal disimpan." }, { status: 400 });
  }

  const { data: existingShop } = await supabase
    .from("shops")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingShop) {
    const { error: shopError } = await supabase
      .from("shops")
      .update({
        name: parsed.data.shopName,
        address: parsed.data.shopAddress || null,
      })
      .eq("id", existingShop.id)
      .eq("user_id", userId);

    if (shopError) {
      return NextResponse.json({ error: "Profil toko gagal disimpan." }, { status: 400 });
    }
  } else {
    const { error: shopError } = await supabase.from("shops").insert({
      name: parsed.data.shopName,
      address: parsed.data.shopAddress || null,
      open: new Date().toISOString(),
      close: "21:00:00",
      user_id: userId,
    });

    if (shopError) {
      return NextResponse.json({ error: "Profil toko gagal dibuat." }, { status: 400 });
    }
  }

  return NextResponse.json({ success: true });
}
