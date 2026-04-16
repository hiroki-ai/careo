import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuth } from "@/lib/apiAuth";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // Auth check
  const auth = await requireAuth();
  if (!auth.user) {
    return auth.errorResponse;
  }

  // Rate limit
  const ip = req.headers.get("x-forwarded-for") || "unknown";
  const { allowed } = checkRateLimit(ip, "transcribe");
  if (!allowed) {
    return NextResponse.json({ error: "レート制限に達しました。1分後に再試行してください。" }, { status: 429 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Gemini API key is not configured" }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("audio") as File | null;

    if (!file) {
      return NextResponse.json({ error: "音声ファイルが必要です" }, { status: 400 });
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: "ファイルサイズは20MB以下にしてください" }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64Data = Buffer.from(bytes).toString("base64");

    // Determine MIME type
    const mimeType = file.type || "audio/webm";

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent([
      {
        inlineData: {
          mimeType,
          data: base64Data,
        },
      },
      {
        text: `この音声は日本語の就職活動の面接録音です。以下のルールに従って文字起こししてください：

1. 面接官と候補者の発言を区別してください
2. フォーマット：
   面接官: 〇〇〇
   自分: 〇〇〇
3. 「えーと」「あの」などのフィラーは適度に省略して読みやすくしてください
4. 専門用語や企業名はできるだけ正確に書いてください
5. 聞き取れない部分は（聞き取り不明）と記載してください

テキストのみを出力してください。説明やメタ情報は不要です。`,
      },
    ]);

    const transcript = result.response.text();

    return NextResponse.json({ transcript });
  } catch (error) {
    console.error("Transcription error:", error);
    const message = error instanceof Error ? error.message : "文字起こしに失敗しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
