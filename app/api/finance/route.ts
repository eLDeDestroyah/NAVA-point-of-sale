import { NextResponse } from "next/server";
import {
  addMoneyToShop,
  getFinanceSummary,
  payCustomerDebt,
} from "@/services/finance.service";

export async function GET() {
  try {
    const summary = await getFinanceSummary();
    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Gagal memuat ringkasan keuangan.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === "add_money") {
      const result = await addMoneyToShop({
        type: body.type === "keluar" ? "keluar" : "masuk",
        nominal: Number(body.nominal || 0),
        keterangan: String(body.keterangan || ""),
      });
      return NextResponse.json(result, { status: 200 });
    }

    if (body.action === "pay_debt") {
      const result = await payCustomerDebt({
        buyerId: String(body.buyerId || ""),
        nominal: Number(body.nominal || 0),
      });
      return NextResponse.json(result, { status: 200 });
    }

    return NextResponse.json({ error: "Aksi tidak dikenali." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Gagal memproses keuangan.",
      },
      { status: 400 }
    );
  }
}
