import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { requireAuth } from "@/lib/apiAuth";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;
  void user;

  const { allowed, retryAfter } = checkRateLimit(getClientIp(req), "company-suggest");
  if (!allowed) {
    return NextResponse.json(
      { error: `リクエストが多すぎます。${retryAfter}秒後に再試行してください。` },
      { status: 429 }
    );
  }

  const { profile, companies } = await req.json() as {
    profile?: {
      careerAxis?: string;
      targetIndustries?: string[];
      targetJobs?: string[];
      selfPr?: string;
      strengths?: string;
    };
    companies?: Array<{
      name: string;
      industry?: string;
      status: string;
    }>;
  };

  const activeCompanies = (companies ?? []).filter(c => c.status !== "REJECTED");
  const rejectedCompanies = (companies ?? []).filter(c => c.status === "REJECTED");
  const allNames = (companies ?? []).map(c => c.name);

  const profileLines = [
    profile?.careerAxis ? `就活の軸: ${profile.careerAxis.slice(0, 300)}` : "",
    profile?.targetIndustries?.length ? `志望業界: ${profile.targetIndustries.join("・")}` : "",
    profile?.targetJobs?.length ? `志望職種: ${profile.targetJobs.join("・")}` : "",
    profile?.selfPr ? `自己PR（抜粋）: ${profile.selfPr.slice(0, 150)}` : "",
    profile?.strengths ? `強み: ${profile.strengths.slice(0, 150)}` : "",
  ].filter(Boolean).join("\n");

  const companiesContext = [
    activeCompanies.length > 0
      ? `現在選考中・気になる企業:\n${activeCompanies.map(c => `- ${c.name}${c.industry ? `（${c.industry}）` : ""} [${c.status}]`).join("\n")}`
      : "",
    rejectedCompanies.length > 0
      ? `不採用になった企業:\n${rejectedCompanies.map(c => `- ${c.name}${c.industry ? `（${c.industry}）` : ""}`).join("\n")}`
      : "",
  ].filter(Boolean).join("\n\n");

  const prompt = `就活生の自己分析・選考状況をもとに、次に受けるべきおすすめ企業を5社提案してください。

【就活生のプロフィール】
${profileLines || "（情報なし）"}

${companiesContext ? `【選考状況】\n${companiesContext}\n` : ""}
【提案のポイント】
- 就活の軸・強みに合った企業
- 不採用企業があれば、その経験を活かせる類似・代替企業も含める
- 登録済み企業（${allNames.length > 0 ? allNames.join("、") : "なし"}）は提案しない
- 日本の新卒採用文脈で現実的な企業

以下の形式でJSONのみ返してください（説明文・マークダウン不要）：

{
  "suggestions": [
    {
      "name": "企業名",
      "industry": "業界",
      "reason": "この企業を勧める理由（就活の軸・強みとの接点を1〜2文で）",
      "tag": "類似企業" | "代替候補" | "軸にマッチ" | "成長企業" | "穴場"
    }
  ]
}`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 900,
    messages: [{ role: "user", content: prompt }],
  });

  const text = (message.content[0] as { type: string; text: string }).text ?? "";
  const raw = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) {
    return NextResponse.json({ error: "提案の取得に失敗しました" }, { status: 500 });
  }

  return NextResponse.json(JSON.parse(match[0]));
}
