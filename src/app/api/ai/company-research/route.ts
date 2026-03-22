import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { requireAuth } from "@/lib/apiAuth";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;
  void user;

  const { allowed, retryAfter } = checkRateLimit(getClientIp(req), "company-research");
  if (!allowed) {
    return NextResponse.json(
      { error: `リクエストが多すぎます。${retryAfter}秒後に再試行してください。` },
      { status: 429 }
    );
  }

  const { companyName, industry, profile } = await req.json() as {
    companyName: string;
    industry?: string;
    profile?: {
      careerAxis?: string;
      targetIndustries?: string[];
      graduationYear?: number;
    };
  };

  if (!companyName) {
    return NextResponse.json({ error: "企業名は必須です" }, { status: 400 });
  }

  const profileContext = [
    profile?.careerAxis ? `就活の軸: ${profile.careerAxis.slice(0, 200)}` : "",
    profile?.targetIndustries?.length ? `志望業界: ${profile.targetIndustries.join("・")}` : "",
  ].filter(Boolean).join("\n");

  const prompt = `就活生向けに「${companyName}」${industry ? `（${industry}）` : ""}の企業研究をまとめてください。

${profileContext ? `【就活生のプロフィール】\n${profileContext}\n` : ""}
以下の構成でまとめ、JSONのみ返してください（説明文・マークダウン不要）：

{
  "overview": "事業概要・主要サービス（2〜3文）",
  "strengths": ["強み1", "強み2", "強み3"],
  "culture": "社風・働き方の特徴（2文）",
  "recentNews": ["注目トピック・動向1", "注目トピック・動向2"],
  "interviewPoints": ["面接でよく聞かれること1", "面接でよく聞かれること2", "面接でよく聞かれること3"],
  "whyUs": "志望動機を作るためのヒント（2文）"
}

情報が不明な場合は「情報が限られています」と記載してください。`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [{ role: "user", content: prompt }],
  });

  const text = (message.content[0] as { type: string; text: string }).text ?? "";
  const raw = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    return NextResponse.json({ error: "分析結果の取得に失敗しました" }, { status: 500 });
  }

  return NextResponse.json(JSON.parse(match[0]));
}
