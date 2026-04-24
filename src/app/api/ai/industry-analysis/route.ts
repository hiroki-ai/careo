import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { requireAuth } from "@/lib/apiAuth";
import { checkAndConsumeAiUsage } from "@/lib/aiUsageLimit";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;

  const { allowed, retryAfter } = checkRateLimit(getClientIp(req), "industry-analysis");
  if (!allowed) {
    return NextResponse.json(
      { error: `リクエストが多すぎます。${retryAfter}秒後に再試行してください。` },
      { status: 429 }
    );
  }
  const usage = await checkAndConsumeAiUsage(user.id, "industry-analysis");
  if (!usage.allowed) {
    return NextResponse.json({
      error: "業界分析は有料プラン限定機能です。",
      limitExceeded: true, feature: "industry-analysis", limit: usage.limit,
    }, { status: 402 });
  }

  const { companies, profile } = await req.json() as {
    companies?: Array<{ name: string; industry?: string; status: string }>;
    profile?: { careerAxis?: string; targetIndustries?: string[] };
  };

  if (!companies?.length) {
    return NextResponse.json({ error: "企業データが必要です" }, { status: 400 });
  }

  // 業界ごとに集計
  const byIndustry = companies.reduce<Record<string, string[]>>((acc, c) => {
    const industry = c.industry?.trim() || "未設定";
    if (!acc[industry]) acc[industry] = [];
    acc[industry].push(`${c.name}(${c.status})`);
    return acc;
  }, {});

  const portfolioText = Object.entries(byIndustry)
    .map(([ind, cos]) => `- ${ind}: ${cos.join("、")} (${cos.length}社)`)
    .join("\n");

  const prompt = `あなたは新卒採用コンサルティングファームで企業側の採用戦略と学生側のキャリア設計の両方に関わってきたプロのキャリアアドバイザーです。就活生の企業ポートフォリオを、採用市場の構造・業界特性・リスク分散の観点から分析してください。

評価の視点：
- 業界ポートフォリオの分散度（リスク集中 vs 軸の一貫性）
- 志望軸と実際に応募している業界のズレ
- 採用市場の構造（業界ごとの採用時期・チャネル・競争率）から見た抜けている選択肢
- 本人が気づきにくい盲点（隣接業界・転職市場での評価）

【選考中の企業ポートフォリオ】
${portfolioText}

${profile?.careerAxis ? `【就活の軸】\n${profile.careerAxis.slice(0, 200)}\n` : ""}${profile?.targetIndustries?.length ? `【志望業界（本人入力）】\n${profile.targetIndustries.join("・")}\n` : ""}
以下の形式でJSONのみ返してください（説明文・マークダウン不要）：

{
  "portfolio": [
    { "industry": "業界名", "count": 社数, "companies": ["企業名1", "企業名2"] }
  ],
  "diversityScore": 0〜100の整数（業界の多様性スコア）,
  "dominantIndustry": "最も多い業界名",
  "risks": ["リスク・懸念点1（1文）", "リスク・懸念点2（1文）"],
  "strengths": ["強み・良い点1（1文）"],
  "advice": "全体へのアドバイス（2〜3文）",
  "blindspot": "見落としている可能性のある業界・視点（1〜2文）"
}`;

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
