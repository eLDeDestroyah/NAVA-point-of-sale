import { NextResponse } from "next/server";

import {
  deleteProductForCurrentUser,
  updateProductForCurrentUser,
} from "@/services/product.service";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const product = await updateProductForCurrentUser(id, {
      name: typeof body.name === "string" ? body.name : "",
      category: typeof body.category === "string" ? body.category : "",
      price: Number(body.price ?? 0),
      stock: Number(body.stock ?? 0),
      status: typeof body.status === "string" ? body.status : undefined,
    });

    return NextResponse.json(product, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Produk gagal diperbarui.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    await deleteProductForCurrentUser(id);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Produk gagal dihapus.",
      },
      { status: 400 },
    );
  }
}
