import { NextResponse } from "next/server";
import { z } from "zod";

import {
  answerQuestion,
  generateInsight,
  generateReportInsight,
  MAX_BODY_BYTES,
  MAX_QUESTION_LENGTH,
} from "@/services/ai.service";
import { getCurrentUserProfile } from "@/services/auth.service";

const chatRequestSchema = z.object({
  mode: z.literal("chat"),
  question: z.string().trim().min(1).max(MAX_QUESTION_LENGTH),
});

function getClientKey(request: Request, userId: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `${userId}:${forwarded || "unknown"}`;
}

function errorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Layanan AI gagal diproses.";
  if (
    !message.includes("Batas penggunaan") &&
    !message.includes("belum dikonfigurasi") &&
    !message.includes("melewati batas waktu") &&
    !(error instanceof z.ZodError) &&
    !(error instanceof SyntaxError) &&
    !message.includes("tidak valid") &&
    !message.includes("tidak sesuai")
  ) {
    return NextResponse.json(
      { error: "Layanan AI sementara tidak dapat memproses permintaan." },
      { status: 500 },
    );
  }

  const status =
    message.includes("Batas penggunaan") ? 429 :
    message.includes("belum dikonfigurasi") ? 503 :
    message.includes("melewati batas waktu") ? 504 :
    error instanceof z.ZodError ||
    error instanceof SyntaxError ||
    message.includes("tidak valid") ||
    message.includes("tidak sesuai") ||
    message.includes("Required") ? 400 : 500;

  return NextResponse.json({ error: message }, { status });
}

export async function GET(request: Request) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) {
      return NextResponse.json({ error: "Sesi login tidak valid." }, { status: 401 });
    }

    const mode = new URL(request.url).searchParams.get("mode");
    const key = getClientKey(request, user.id);
    if (mode === "report") {
      return NextResponse.json(
        { mode: "report", data: await generateReportInsight(key) },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { mode: "insight", data: await generateInsight(key) },
      { status: 200 },
    );
  } catch (error) {
    console.error("AI insight request failed:", error);
    return errorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUserProfile();
    if (!user) {
      return NextResponse.json({ error: "Sesi login tidak valid." }, { status: 401 });
    }

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Payload terlalu besar." }, { status: 413 });
    }

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Payload terlalu besar." }, { status: 413 });
    }

    const body = chatRequestSchema.parse(JSON.parse(rawBody) as unknown);
    return NextResponse.json(
      {
        mode: "chat",
        data: await answerQuestion(getClientKey(request, user.id), body.question),
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("AI chat request failed:", error);
    return errorResponse(error);
  }
}
