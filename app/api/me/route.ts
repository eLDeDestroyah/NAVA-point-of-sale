import { NextResponse } from "next/server";

import { getCurrentUserProfile } from "@/services/auth.service";

export async function GET() {
  try {
    const user = await getCurrentUserProfile();

    if (!user) {
      return NextResponse.json({ user: null }, { status: 401 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Gagal memuat profil pengguna.",
      },
      { status: 500 },
    );
  }
}
