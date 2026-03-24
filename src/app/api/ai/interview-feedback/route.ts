import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { requireAuth } from "@/lib/apiAuth";

export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  // 認証チェック
  const { user, errorResponse: authError } = await requireAuth();
  if (authError) return authError;
  void user;

  // レート制限チェック
  const { allowed, retryAfter } = checkRateLimit(getClientIp(req), "interview-feedback");
  if (!allowed) {
    return NextResponse.json(
      { error: `リクエストが多すぎます。${retryAfter}秒後に再試行してください。` },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  try {
    const body = await req.json();
    const {
      interview,
      profile = {},
    }: {
      interview: {
        round: number;
        companyName: string;
        result: string;
        interviewers?: string;
        notes?: string;
        questions: { question: string; answer: string }[];
      };
      profile: {
        careerAxis?: string;
        gakuchika?: string;
        selfPr?: string;
        strengths?: string;
        weaknesses?: string;
      };
    } = body;

    if (!interview || !interview.companyName || !Array.isArray(interview.questions)) {
      return NextResponse.json({ error: "interview データが不正です" }, { status: 400 });
    }

    const resultLabel: Record<string, string> = { PASS: "通過", FAIL: "不通過", PENDING: "結果待ち" };
    const resultText = resultLabel[interview.result] ?? interview.result;
    const isFail = interview.result === "FAIL";

    const profileLines = [
      profile.careerAxis ? `就活の軸: ${profile.careerAxis.slice(0, 300)}` : "",
      profile.gakuchika ? `ガクチカ: ${profile.gakuchika.slice(0, 300)}` : "",
      profile.selfPr ? `自己PR: ${profile.selfPr.slice(0, 300)}` : "",
      profile.strengths ? `強み: ${profile.strengths.slice(0, 200)}` : "",
      profile.weaknesses ? `弱み: ${profile.weaknesses.slice(0, 200)}` : "",
    ].filter(Boolean).join("\n");

    const questionsText = interview.questions
      .slice(0, 10)
      .map((q, i) => `Q${i + 1}: ${q.question}\nA${i + 1}: ${q.answer || "（回答なし）"}`)
      .join("\n\n");

    const systemPrompt = `あなたは日本の就活面接に精通したキャリアコーチです。
日本の就活文化（STAR法・結論ファースト・具体的エピソード重視）を熟知し、学生の面接回答を的確にフィードバックします。

評価の方針:
- 回答の具体性・論理構成・企業への適合性を総合評価する
- ユーザーのプロフィール（ガクチカ・自己PR・強み・弱み・就活の軸）との整合性も評価する
- ${isFail ? "不通過のため「根本的な改善点」にフォーカスし、より良い回答例を提示する" : "通過のため「次の面接に向けた強化点」にフォーカスし、さらに高いレベルを目指す"}
- 批判的すぎず、前向きで建設的なフィードバックを心がける
- 日本語で回答すること`;

    const userPrompt = `以下の面接データをJSON形式で分析してください。マークダウン・説明文不要、JSONのみ返答。

【面接情報】
企業: ${interview.companyName}
${interview.round}次面接 / 結果: ${resultText}
${interview.interviewers ? `面接官: ${interview.interviewers}` : ""}
${interview.notes ? `メモ: ${interview.notes.slice(0, 200)}` : ""}

【ユーザープロフィール】
${profileLines || "（未入力）"}

【面接の質問と回答】
${questionsText}

以下の形式のJSONのみ返答:
{
  "overallScore": <1-100の整数>,
  "summary": "<総評 2-3文>",
  "strengths": ["<良かった点1>", "<良かった点2>"],
  "improvements": ["<改善点1>", "<改善点2>"],
  "questionFeedback": [
    {
      "question": "<質問文>",
      "answer": "<回答文>",
      "score": <1-10の整数>,
      "feedback": "<その回答へのコメント>",
      "suggestedAnswer": "<より良い回答の示唆（${isFail ? "不通過のため記載する" : "通過のため省略可・nullでOK"}）>"
    }
  ],
  "nextActionSuggestion": "<次回に向けた具体的なアドバイス1文>"
}`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const raw = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
    const match = raw.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ error: "AIの応答を解析できませんでした" }, { status: 500 });
    }

    const result = JSON.parse(match[0]);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[interview-feedback] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
