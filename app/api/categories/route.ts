import { NextResponse } from "next/server";

import { getCategoriesForCurrentUser } from "@/services/product.service";

export async function GET() {
  try {
    const categories = await getCategoriesForCurrentUser();
    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Gagal memuat kategori.",
      },
      { status: 500 },
    );
  }
}
