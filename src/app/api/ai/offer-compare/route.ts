import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { Company, UserProfile } from "@/types";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { allowed, retryAfter } = checkRateLimit(getClientIp(req), "offer-compare");
  if (!allowed) {
    return NextResponse.json(
      { error: `リクエストが多すぎます。${retryAfter}秒後に再試行してください。` },
      { status: 429 }
    );
  }

  try {
    const { companies, profile }: { companies: Company[]; profile: UserProfile | null } = await req.json();

    const careerAxis = profile?.careerAxis ?? "未設定";

    const companiesSummary = companies
      .map(
        (c, i) =>
          `企業${i + 1}: ${c.name}\n  業界: ${c.industry || "不明"}\n  メモ: ${c.notes || "なし"}`
      )
      .join("\n\n");

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      messages: [
        {
          role: "user",
          content: `あなたは就活コーチAIです。以下の内定企業を比較分析してください。

【就活軸】
${careerAxis}

【内定企業一覧】
${companiesSummary}

以下のJSON形式のみで返してください。他のテキストは一切含めないでください。

{
  "recommendation": "最もおすすめの企業名と理由（2〜3文）",
  "comparisons": [
    {
      "companyName": "企業名",
      "pros": ["メリット1", "メリット2", "メリット3"],
      "cons": ["デメリット1", "デメリット2"],
      "axisMatch": 80
    }
  ],
  "summary": "全体まとめ（1〜2文）"
}

axisMatchは就活軸との一致度（0〜100の整数）。
各企業の pros/cons は3〜4項目ずつ、具体的に書いてください。`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return NextResponse.json({ error: "No JSON", raw: text }, { status: 500 });
    return NextResponse.json(JSON.parse(jsonMatch[0]));
  } catch (err) {
    console.error("[offer-compare] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
