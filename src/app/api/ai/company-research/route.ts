import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { requireAuth } from "@/lib/apiAuth";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { user: _authUser, errorResponse: authErr } = await requireAuth();
  if (authErr) return authErr;
  const { allowed, retryAfter } = checkRateLimit(getClientIp(req), "company-research");
  if (!allowed) {
    return NextResponse.json({ error: `リクエストが多すぎます。${retryAfter}秒後に再試行してください。` }, { status: 429 });
  }

  try {
    const { companyName, profile }: {
      companyName: string;
      profile?: {
        targetIndustries?: string[];
        targetJobs?: string[];
        careerAxis?: string;
        strengths?: string;
        gakuchika?: string;
      };
    } = await req.json();

    if (!companyName) return NextResponse.json({ error: "companyName required" }, { status: 400 });

    const personalContext = profile
      ? [
          profile.targetIndustries?.length ? `志望業界: ${profile.targetIndustries.join("・")}` : "",
          profile.targetJobs?.length ? `志望職種: ${profile.targetJobs.join("・")}` : "",
          profile.careerAxis ? `就活の軸: ${profile.careerAxis.slice(0, 100)}` : "",
          profile.strengths ? `強み: ${profile.strengths.slice(0, 80)}` : "",
          profile.gakuchika ? `ガクチカ概要: ${profile.gakuchika.slice(0, 80)}` : "",
        ].filter(Boolean).join("\n")
      : "";

    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1200,
      messages: [
        {
          role: "user",
          content: `就活生向けに「${companyName}」の企業研究をまとめてください。${personalContext ? `\n\n就活生のプロフィール（この情報を踏まえて志望動機・逆質問を個別最適化すること）:\n${personalContext}` : ""}

以下のJSON形式のみで返してください。マークダウンやコードブロックは使わず、JSONのみ出力してください。

{
  "business": "事業内容の説明（2〜3文）",
  "competitors": ["競合企業1", "競合企業2", "競合企業3"],
  "motivationAngles": ["志望動機の切り口1（具体的に）", "志望動機の切り口2", "志望動機の切り口3"],
  "strengths": ["企業の強み1", "企業の強み2", "企業の強み3"],
  "reverseQuestions": ["逆質問候補1（具体的に）", "逆質問候補2", "逆質問候補3"],
  "workStyle": "働き方・社風の特徴（1〜2文）",
  "watchOut": "注意点・選考で意識すべきこと（1文）"
}

存在しない企業や情報が少ない場合でも、業界・企業名から推測して必ずJSONを返すこと。`,
        },
      ],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    // マークダウンコードブロックを除去してからパース
    const cleaned = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("[company-research] no JSON in response:", text);
      return NextResponse.json({ error: "AIからの応答を解析できませんでした", raw: text }, { status: 500 });
    }

    try {
      const result = JSON.parse(jsonMatch[0]);
      return NextResponse.json(result);
    } catch (parseErr) {
      console.error("[company-research] parse error:", parseErr, text);
      return NextResponse.json({ error: "JSONパースエラー", raw: text }, { status: 500 });
    }
  } catch (err) {
    console.error("[company-research] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
