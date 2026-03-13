import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const {
      question,
      companyName,
      companyIndustry,
      careerAxis,
      gakuchika,
      selfPr,
      strengths,
      otherAnswers,
      charLimit,
    }: {
      question: string;
      companyName: string;
      companyIndustry?: string;
      careerAxis?: string;
      gakuchika?: string;
      selfPr?: string;
      strengths?: string;
      otherAnswers?: { question: string; answer: string }[];
      charLimit?: number;
    } = await req.json();

    // 集合知を取得
    let aggregateSummary = "";
    try {
      const { data } = await supabase.rpc("get_careo_aggregate_insights");
      if (data) {
        const d = data as { offer_rate?: number; avg_interviews_before_offer?: number };
        if (d.offer_rate != null) aggregateSummary = `\n参考: Careoユーザーの内定率は${d.offer_rate}%、平均面接数${d.avg_interviews_before_offer}回。`;
      }
    } catch { /* skip */ }

    const selfAnalysis = [
      careerAxis ? `就活の軸: ${careerAxis}` : "",
      gakuchika ? `ガクチカ: ${gakuchika}` : "",
      selfPr ? `自己PR: ${selfPr}` : "",
      strengths ? `強み: ${strengths}` : "",
    ].filter(Boolean).join("\n\n");

    const otherAnswersText = otherAnswers?.length
      ? `\n同じESの他の設問と回答:\n${otherAnswers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join("\n\n")}`
      : "";

    const charLimitText = charLimit ? `\n文字数制限: ${charLimit}字以内` : "";

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: `就活ESの設問に対する回答を作成してください。

【企業情報】
企業名: ${companyName}
業界: ${companyIndustry || "不明"}

【設問】
${question}
${charLimitText}

【自己分析情報】
${selfAnalysis || "（未設定）"}
${otherAnswersText}
${aggregateSummary}

以下のJSON形式のみで返してください:
{
  "answer": "ES回答本文（設問に対する具体的な回答。文字数制限がある場合はそれ以内で）",
  "advice": "この回答を書く上でのポイント・アドバイス（2〜3点、箇条書き）",
  "keywords": ["採用担当が注目するキーワード1", "キーワード2", "キーワード3"]
}

回答は自己分析情報を最大限活用し、企業への志望動機・入社後の活躍イメージを盛り込んでください。
もし自己分析情報が未設定の場合は、一般的な優秀な就活生として回答してください。`,
      }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "No JSON", raw: text }, { status: 500 });
    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error("[es-generate] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
