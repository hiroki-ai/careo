import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  // 認証チェック
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "ファイルがありません" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "ファイルサイズは10MB以下にしてください" }, { status: 400 });

  // PDF テキスト抽出
  let pdfText = "";
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse") as (buf: Buffer) => Promise<{ text: string }>;
    const data = await pdfParse(buffer);
    pdfText = data.text;
  } catch {
    return NextResponse.json({ error: "PDFの読み込みに失敗しました。テキストが含まれているPDFか確認してください。" }, { status: 400 });
  }

  if (!pdfText.trim()) {
    return NextResponse.json({ error: "PDFからテキストを抽出できませんでした。スキャン画像のみのPDFは非対応です。" }, { status: 400 });
  }

  // Claude でデータ抽出
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const prompt = `以下は就活生のPDFから抽出したテキストです。このテキストから企業の就活管理情報を抽出してJSON形式で返してください。

抽出するフィールド：
- name: 企業名（必須）
- industry: 業界・業種（わかる場合）
- status: 選考ステータス（以下から最も近いものを選ぶ）
  WISHLIST=気になる/未応募, APPLIED=応募済み, DOCUMENT=書類選考中,
  INTERVIEW_1=1次面接, INTERVIEW_2=2次面接, FINAL=最終面接,
  OFFERED=内定, REJECTED=不採用,
  INTERN_APPLYING=インターン応募, INTERN=インターン中
  （ステータス不明の場合は WISHLIST）
- notes: メモ・備考（面接日程・気づき・重要情報など。簡潔に）

ルール：
- 企業名が明確でないものは含めない
- 同じ企業の重複は除く
- 企業名以外のテキスト（学校名・個人名・サービス名等）は含めない
- 就活と無関係な情報（住所・電話番号等）はnotesに入れない

PDFテキスト：
${pdfText.slice(0, 6000)}

以下の形式でJSONのみを返してください（他の説明文は不要）：
{"companies":[{"name":"...","industry":"...","status":"WISHLIST","notes":"..."}]}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { text: string }).text
      .replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("JSON not found");

    const parsed = JSON.parse(match[0]) as { companies: { name: string; industry: string; status: string; notes: string }[] };
    const companies = (parsed.companies ?? []).filter(c => c.name?.trim());

    return NextResponse.json({ companies, extractedChars: pdfText.length });
  } catch {
    return NextResponse.json({ error: "AI解析に失敗しました。もう一度お試しください。" }, { status: 500 });
  }
}
