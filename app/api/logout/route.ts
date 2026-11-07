import { NextResponse } from "next/server";

import { logoutUser } from "@/services/auth.service";

export async function POST() {
  try {
    await logoutUser();
    return NextResponse.json({ success: true }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
