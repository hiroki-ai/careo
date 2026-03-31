import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { requireAuth } from "@/lib/apiAuth";
import { UserProfile } from "@/types";

export const maxDuration = 30;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface EsCheckResult {
  score: number; // 0-100
  readyToSubmit: boolean;
  checks: { passed: boolean; label: string; detail: string }[];
  summary: string;
  suggestions: string[];
}

export async function POST(req: NextRequest) {
  const { user: _authUser, errorResponse: authErr } = await requireAuth();
  if (authErr) return authErr;

  const { allowed, retryAfter } = checkRateLimit(getClientIp(req), "es-check");
  if (!allowed) {
    return NextResponse.json({ error: `リクエストが多すぎます。${retryAfter}秒後に再試行してください。` }, { status: 429 });
  }

  try {
    const {
      es,
      profile,
      companyName,
      previousEsAnswers,
    }: {
      es: { title: string; questions: { question: string; answer: string }[] };
      profile: UserProfile | null;
      companyName: string;
      previousEsAnswers?: string[]; // 同じユーザーの過去ES回答（重複チェック用）
    } = await req.json();

    const systemPrompt = `あなたはCareoというAI就活コーチアプリの「ES提出前チェック」機能です。
就活生がESを提出する前に、品質を多角的にチェックしてスコアと改善提案を返してください。

チェック項目:
1. 自己分析との一貫性 - 就活の軸・強み・ガクチカと回答内容が一致しているか
2. 具体性 - エピソード・数値・役割が具体的に書かれているか
3. 文字数バランス - 指定文字数に対して適切な量か（過少・過多）
4. AIっぽい文体 - "〜においては""〜であることから""しっかりと""貢献したい""活かしたい" など検出
5. 他社ESとの差別化 - 過去ESと同じ内容をコピペしていないか
6. 企業への志望動機の個別化 - ${companyName}固有の理由が書かれているか
7. 個性・熱意 - テンプレ的でなく本人の言葉・体験に根ざしているか。読んで熱意が伝わるか

スコア基準:
- 90+: 提出OK
- 75-89: 軽微な修正推奨
- 60-74: 要改善
- 60未満: 大幅修正が必要

JSON形式で返答:
{
  "score": 0-100,
  "readyToSubmit": true/false,
  "checks": [
    { "passed": true/false, "label": "チェック名", "detail": "具体的な指摘（40字以内）" }
  ],
  "summary": "総評（50字以内）",
  "suggestions": ["具体的な改善提案1（40字以内）", ...]
}`;

    const userMessage = `企業名: ${companyName}
ES名: ${es.title}

【自己分析】
- 就活の軸: ${profile?.careerAxis?.substring(0, 150) ?? "未入力"}
- 強み: ${profile?.strengths?.substring(0, 100) ?? "未入力"}
- ガクチカ: ${profile?.gakuchika?.substring(0, 150) ?? "未入力"}

【ES設問・回答】
${es.questions.map((q, i) => `
設問${i + 1}: ${q.question}
回答: ${q.answer || "(未回答)"}
字数: ${q.answer?.length ?? 0}字
`).join("\n")}

${previousEsAnswers && previousEsAnswers.length > 0 ? `
【過去ESの回答（重複チェック用・抜粋）】
${previousEsAnswers.slice(0, 3).map((a, i) => `過去ES${i + 1}: ${a.substring(0, 100)}...`).join("\n")}
` : ""}`;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = (response.content[0] as { type: string; text: string }).text;
    const raw = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
    const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw) as EsCheckResult;

    return NextResponse.json(json);
  } catch (e) {
    console.error("[es-check]", e);
    return NextResponse.json({
      score: 0,
      readyToSubmit: false,
      checks: [],
      summary: "チェックに失敗しました",
      suggestions: [],
    });
  }
}
