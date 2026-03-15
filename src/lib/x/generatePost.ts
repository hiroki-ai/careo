import Anthropic from "@anthropic-ai/sdk";
import {
  DEVELOPER_PROFILE,
  BRAND_VOICE,
  HASHTAGS,
  PILLAR_PROMPTS,
  PILLAR_WEIGHTS,
  type PostPillar,
} from "./character";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 重み付きランダムでピラーを選ぶ
export function selectPillar(overrideWeights?: Partial<Record<PostPillar, number>>): PostPillar {
  const weights = { ...PILLAR_WEIGHTS, ...overrideWeights };
  const entries = Object.entries(weights) as [PostPillar, number][];
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let rand = Math.random() * total;
  for (const [pillar, weight] of entries) {
    rand -= weight;
    if (rand <= 0) return pillar;
  }
  return "empathy";
}

// 時間帯に合わせたピラー調整
export function selectPillarByTime(): PostPillar {
  const hour = new Date().getHours();
  // 朝7-9時: 共感・モチベ系
  if (hour >= 7 && hour < 10) return selectPillar({ empathy: 60, developer: 20, trend: 10, target: 5, feature: 5 });
  // 昼12-14時: トレンド・情報系
  if (hour >= 12 && hour < 15) return selectPillar({ trend: 50, target: 25, feature: 15, empathy: 5, developer: 5 });
  // 夜21-23時: 共感・ターゲット・開発者
  return selectPillar({ empathy: 35, target: 25, developer: 20, feature: 10, trend: 10 });
}

// ハッシュタグを組み立てる
function buildHashtags(pillar: PostPillar): string {
  const tags = [...HASHTAGS.core];

  if (pillar === "trend") {
    tags.push(...HASHTAGS.year, HASHTAGS.tips[0]);
  } else if (pillar === "feature" || pillar === "target") {
    tags.push(HASHTAGS.tool[0], HASHTAGS.tool[1]);
  } else if (pillar === "developer") {
    tags.push(...HASHTAGS.year, HASHTAGS.tool[0]);
  } else {
    tags.push(HASHTAGS.year[0], HASHTAGS.tips[0]);
  }

  // 重複除去
  return [...new Set(tags)].join(" ");
}

export interface GeneratedPost {
  text: string;
  pillar: PostPillar;
  hashtags: string;
  fullText: string; // text + hashtags（280字以内）
}

export async function generatePost(pillar?: PostPillar): Promise<GeneratedPost> {
  const selectedPillar = pillar ?? selectPillarByTime();
  const pillarPrompt = PILLAR_PROMPTS[selectedPillar];
  const hashtags = buildHashtags(selectedPillar);

  const systemPrompt = `
あなたはCareoというAI就活ツールの開発者です。
${DEVELOPER_PROFILE}
${BRAND_VOICE}

【出力ルール】
- 投稿本文のみを出力する。前置き・説明・タイトルは不要
- ハッシュタグは含めない（別途付与する）
- 日本語のみ
- 改行を効果的に使う
- 最大200文字以内に収める（ハッシュタグ分を残す）
- URLは含めない（必要な場合は "[URL]" とだけ書く）
`;

  const userPrompt = `
以下の指示に従ってX（旧Twitter）の投稿を1つ作ってください。

${pillarPrompt}

出力は投稿本文のみ。説明不要。
`;

  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [{ role: "user", content: userPrompt }],
    system: systemPrompt,
  });

  const text = (message.content[0] as { type: string; text: string }).text
    .trim()
    .replace(/\[URL\]/g, "https://careo-sigma.vercel.app");

  // 280字チェック（超えたらハッシュタグを削る）
  const fullText = `${text}\n\n${hashtags}`;
  const finalText = fullText.length <= 280 ? fullText : text.slice(0, 270 - hashtags.length) + "\n\n" + hashtags;

  return {
    text,
    pillar: selectedPillar,
    hashtags,
    fullText: finalText,
  };
}
