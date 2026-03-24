import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
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

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  // Notion PDF はヘッダー・ナビゲーション等のノイズが多いため前処理でクリーニング
  const cleanedText = pdfText
    .replace(/\f/g, "\n")                        // ページ区切りを改行に
    .replace(/[ \t]{3,}/g, "  ")                 // 連続スペースを圧縮
    .replace(/\n{4,}/g, "\n\n\n")                // 連続改行を圧縮
    .trim();

  const prompt = `以下はPDFから抽出したテキストです。就活・インターン・企業研究に関連する情報をすべて抽出して、JSON形式で返してください。

抽出対象：
1. companies（企業・選考・インターン・気になる企業）
   - name: 企業名（必須）
   - industry: 業界（わかれば）
   - status: WISHLIST/APPLIED/DOCUMENT/INTERVIEW_1/INTERVIEW_2/FINAL/OFFERED/REJECTED/INTERN_APPLYING/INTERN（不明はWISHLIST）
   - notes: 締切・メモ等

2. obVisits（OB訪問・OGOG訪問・会社説明会・インターン参加記録）
   - companyName: 企業名（必須）
   - purpose: ob_visit/info_session/internship（不明はob_visit）
   - visitedAt: 日付（YYYY-MM-DD、不明は""）
   - personName: 訪問した人の名前（わかれば）
   - insights: 気づき・メモ
   - impression: positive/neutral/negative（不明は"neutral"）

3. tests（筆記試験・適性検査・Webテスト）
   - companyName: 企業名（必須）
   - testType: SPI/TG-WEB/玉手箱/CAB/GAB/SCOA/その他
   - testDate: 日付（YYYY-MM-DD、不明は""）
   - result: PASS/FAIL/PENDING（不明はPENDING）
   - notes: メモ

4. interviews（面接・選考記録）
   - companyName: 企業名（必須）
   - round: 面接回数（数値、不明は1）
   - scheduledAt: 日付（YYYY-MM-DD、不明は""）
   - result: PASS/FAIL/PENDING（不明はPENDING）
   - notes: 質問・フィードバック等のメモ

ルール：
- 企業名が明確なものだけ含める（略称・通称も可）
- 同一情報の重複は除く
- 就活・インターン・企業研究と無関係な情報は含めない
- 情報がない項目は空配列 []
- 企業名リストだけ書かれていてもcompaniesに全て含める（status: WISHLIST）

PDFテキスト（先頭15000文字）：
${cleanedText.slice(0, 15000)}

JSON形式のみで返答（説明文不要）：
{"companies":[...],"obVisits":[...],"tests":[...],"interviews":[...]}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3000,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { text: string }).text
      .replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("JSON not found");

    const parsed = JSON.parse(match[0]) as {
      companies?: unknown[];
      obVisits?: unknown[];
      tests?: unknown[];
      interviews?: unknown[];
    };

    return NextResponse.json({
      companies: parsed.companies ?? [],
      obVisits: parsed.obVisits ?? [],
      tests: parsed.tests ?? [],
      interviews: parsed.interviews ?? [],
      extractedChars: pdfText.length,
    });
  } catch {
    return NextResponse.json({ error: "AI解析に失敗しました。もう一度お試しください。" }, { status: 500 });
  }
}
