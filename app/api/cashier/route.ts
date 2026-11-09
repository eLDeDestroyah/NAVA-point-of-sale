import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createCashierTransaction,
  getCashierProducts,
} from "@/services/cashier.service";

const checkoutItemSchema = z.object({
  productId: z.string().min(1, "Product ID wajib diisi."),
  qty: z.number().int().min(1, "Jumlah produk minimal 1."),
});

const checkoutSchema = z.object({
  customerName: z.string().optional(),
  paymentMethod: z.enum(["cash", "qris", "kasbon", "tunai"]).transform((val) => {
    // Map "tunai" ke "cash" sesuai enum di database
    if (val === "tunai") return "cash";
    return val as "cash" | "qris" | "kasbon";
  }),
  paidAmount: z.number().optional(),
  items: z.array(checkoutItemSchema).min(1, "Keranjang belanja tidak boleh kosong."),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";
    const category = searchParams.get("category") ?? "";

    const products = await getCashierProducts({
      search,
      category,
    });

    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Gagal memuat produk kasir.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message || "Data transaksi tidak valid.",
        },
        { status: 400 }
      );
    }

    const result = await createCashierTransaction({
      customerName: parsed.data.customerName,
      paymentMethod: parsed.data.paymentMethod,
      paidAmount: parsed.data.paidAmount,
      items: parsed.data.items,
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat memproses transaksi kasir.",
      },
      { status: 400 }
    );
  }
}
