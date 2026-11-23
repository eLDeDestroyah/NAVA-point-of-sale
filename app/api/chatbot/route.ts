import { NextRequest, NextResponse } from "next/server";
import { askNavaAssistant } from "@/services/chatbot.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, history } = body;

    if (!message || typeof message !== "string" || !message.trim()) {
      return NextResponse.json(
        { error: "Pesan tidak boleh kosong." },
        { status: 400 }
      );
    }

    const reply = await askNavaAssistant(message.trim(), history || []);
    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("API Chatbot Error:", error);
    return NextResponse.json(
      { error: error?.message || "Terjadi kesalahan pada chatbot." },
      { status: 500 }
    );
  }
}
