import { NextResponse } from "next/server";

import {
  createProductForCurrentUser,
  getProductsForCurrentUser,
} from "@/services/product.service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? "1");
    const pageSize = Number(searchParams.get("pageSize") ?? "10");
    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category") ?? "";
    const status = searchParams.get("status") ?? "";

    const result = await getProductsForCurrentUser({
      page,
      pageSize,
      search,
      category,
      status,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Gagal memuat produk.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const product = await createProductForCurrentUser({
      name: typeof body.name === "string" ? body.name : "",
      category: typeof body.category === "string" ? body.category : "",
      price: Number(body.price ?? 0),
      buy_price: body.buy_price !== undefined ? Number(body.buy_price ?? 0) : undefined,
      stock: Number(body.stock ?? 0),
      status: typeof body.status === "string" ? body.status : undefined,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Produk gagal dibuat.",
      },
      { status: 400 },
    );
  }
}
