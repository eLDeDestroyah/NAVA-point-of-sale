import { NextResponse } from "next/server";
import { getDashboardSummary } from "@/services/dashboard.service";

export async function GET() {
  try {
    const summary = await getDashboardSummary();
    return NextResponse.json(summary, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Gagal memuat ringkasan dashboard.",
      },
      { status: 500 }
    );
  }
}
