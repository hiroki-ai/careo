import Anthropic from "@anthropic-ai/sdk";
import { type Pillar, PILLAR_PROMPTS, X_CHARACTER, getPillarByTime, selectPillar } from "./character";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export type GeneratedPost = {
  text: string;
  pillar: Pillar;
};

export async function generateXPost(
  pillarOverride?: Pillar,
  contextHint?: string
): Promise<GeneratedPost> {
  const jstHour = new Date(Date.now() + 9 * 60 * 60 * 1000).getUTCHours();
  const pillar = pillarOverride ?? getPillarByTime(jstHour);
  const pillarPrompt = PILLAR_PROMPTS[pillar];

  const systemPrompt = `${X_CHARACTER}

あなたは今からX（Twitter）の投稿文を1つ書きます。
投稿は就活生向けのリアルで共感できる内容にしてください。
絵文字は多用しすぎず、1〜3個程度に抑える。
文末に改行+ハッシュタグを置く場合は、ハッシュタグは最大2個まで。

【重要】投稿文のテキストのみを出力してください。前置き・説明・引用符は不要。`;

  const userPrompt = `${pillarPrompt}${contextHint ? `\n\n【今日のコンテキスト】${contextHint}` : ""}

上記の形式で今日のX投稿を1件書いてください。`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const text = (message.content[0] as { type: string; text: string }).text.trim();

  return { text, pillar };
}
