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
  const { allowed, retryAfter } = checkRateLimit(getClientIp(req), "interview-recording-feedback");
  if (!allowed) {
    return NextResponse.json(
      { error: `リクエストが多すぎます。${retryAfter}秒後に再試行してください。` },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  try {
    const body = await req.json();
    const { transcript, companyName, context } = body as {
      transcript: string;
      companyName?: string;
      context?: string;
    };

    if (!transcript || transcript.trim().length < 20) {
      return NextResponse.json(
        { error: "トランスクリプトが短すぎます。最低20文字以上入力してください。" },
        { status: 400 }
      );
    }

    const systemPrompt = `あなたは日本の就活面接に精通したキャリアコーチです。
面接の書き起こしテキスト（トランスクリプト）を分析し、詳細なフィードバックを提供します。

分析の方針:
- トランスクリプトから質問と回答のペアを特定する
- 各回答を「構成力」「具体性」「熱意」「論理性」の観点で評価する
- STAR法（状況・課題・行動・結果）に基づいた回答ができているか確認する
- 結論ファーストで話せているか確認する
- 日本の就活特有の評価基準（協調性・主体性・成長意欲）も考慮する
- 批判的すぎず、前向きで建設的なフィードバックを心がける
- 改善が必要な回答には具体的な改善例を提示する
- 日本語で回答すること`;

    const userPrompt = `以下の面接トランスクリプトを分析し、JSONのみで返答してください。マークダウン・説明文不要。

${companyName ? `【企業名】${companyName}` : ""}
${context ? `【補足情報】${context}` : ""}

【面接トランスクリプト】
${transcript.slice(0, 8000)}

以下の形式のJSONのみ返答:
{
  "overallScore": <1-100の整数。総合評価>,
  "summary": "<総評 3-4文。面接全体の印象>",
  "strengths": ["<良かった点1>", "<良かった点2>", "<良かった点3>"],
  "improvements": ["<改善点1>", "<改善点2>", "<改善点3>"],
  "questionAnalysis": [
    {
      "question": "<特定された質問>",
      "answer": "<回答の要約>",
      "score": <1-10の整数>,
      "feedback": "<その回答へのフィードバック>",
      "improvedAnswer": "<より良い回答例>"
    }
  ],
  "communicationScore": {
    "clarity": <1-100。明瞭さ>,
    "structure": <1-100。構成力>,
    "enthusiasm": <1-100。熱意・意欲>,
    "specificity": <1-100。具体性>
  },
  "tips": ["<具体的なアドバイス1>", "<具体的なアドバイス2>", "<具体的なアドバイス3>"]
}`;

    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 3000,
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
    console.error("[interview-recording-feedback] error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
