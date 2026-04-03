import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, getClientIp } from "@/lib/rateLimit";
import { requireAuth } from "@/lib/apiAuth";

export const maxDuration = 30;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ProofreadAnswer {
  questionIndex: number;
  question: string;
  original: string;
  improved: string;
  feedback: string; // 添削コメント（なぜ変えたか）
  points: string[]; // 具体的な改善ポイント
}

export interface EsProofreadResult {
  answers: ProofreadAnswer[];
  overallComment: string; // 全体コメント
}

export async function POST(req: NextRequest) {
  const { user: _authUser, errorResponse: authErr } = await requireAuth();
  if (authErr) return authErr;

  const { allowed, retryAfter } = checkRateLimit(getClientIp(req), "es-proofread");
  if (!allowed) {
    return NextResponse.json(
      { error: `リクエストが多すぎます。${retryAfter}秒後に再試行してください。` },
      { status: 429 }
    );
  }

  try {
    const {
      questions,
      companyName,
      industry,
    }: {
      questions: { question: string; answer: string }[];
      companyName: string;
      industry?: string;
    } = await req.json();

    const filledQuestions = questions.filter((q) => q.answer?.trim().length > 0);
    if (filledQuestions.length === 0) {
      return NextResponse.json({ error: "回答が入力されていません" }, { status: 400 });
    }

    const systemPrompt = `あなたはプロのES添削者です。就活生のエントリーシートを添削してください。

添削の方針:
1. 「AIっぽい表現」を人間らしい自分の言葉に書き換える
   - NG: "〜に貢献したい" → OK: "〜を実現したい"
   - NG: "〜を活かしたい" → OK: "〜を使って〜したい"
   - NG: "しっかりと" "積極的に" → 具体的な行動に置き換え
2. 抽象的な表現を具体的に
   - 数値・固有名詞・自分の役割を盛り込む
3. PREP法（結論→理由→具体例→結論）で構成を整える
4. 企業・業界に合ったキーワードを自然に入れる
5. 文字数制限がある場合は守る（元の文字数±10%以内）

改善した回答は「その人らしい言葉」で自然に書くこと。添削コメントは具体的・建設的に。

JSON形式で返答:
{
  "answers": [
    {
      "questionIndex": 0,
      "question": "設問文",
      "original": "元の回答",
      "improved": "添削後の回答",
      "feedback": "添削のポイント（50字以内）",
      "points": ["改善点1（30字以内）", "改善点2", ...]
    }
  ],
  "overallComment": "全体コメント（80字以内）"
}`;

    const userMessage = `企業名: ${companyName}${industry ? `\n業界: ${industry}` : ""}

【添削してほしいES設問・回答】
${filledQuestions.map((q, i) => `
設問${i + 1}: ${q.question}
回答（${q.answer.length}字）:
${q.answer}
`).join("\n")}`;

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const text = (response.content[0] as { type: string; text: string }).text;
    const raw = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
    const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw) as EsProofreadResult;

    return NextResponse.json(json);
  } catch (e) {
    console.error("[es-proofread]", e);
    return NextResponse.json(
      { error: "添削に失敗しました。しばらく待ってから再試行してください。" },
      { status: 500 }
    );
  }
}
