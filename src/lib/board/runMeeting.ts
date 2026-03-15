import Anthropic from "@anthropic-ai/sdk";
import { EXECUTIVES, getTodaysOwner } from "./executives";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface DiscussionMessage {
  name: string;
  role: string;
  message: string;
}

export interface MeetingResult {
  topicOwner: string;
  topic: string;
  topicOwnerOpening: string;
  discussion: DiscussionMessage[];
  conclusion: string;
  recommendedAction: string;
}

const CAREO_CONTEXT = `
【Careoとは】
- 28卒向けAI就活管理アプリ（Next.js + Supabase + Claude API）
- 開発者：上智大2年（4月から3年）・経済学部・これから就活本格始動する当事者が自ら作ったツール
- URL: https://careo-sigma.vercel.app
- 主要機能：企業管理・ES管理・面接ログ・AI PDCA・カレオAIチャット・OB/OG訪問ログ・筆記試験管理・内定比較・自己分析
- ターゲット：27卒・28卒の就活生
- キャッチコピー：「28卒の就活は、AIと始める。」
- 差別化：就活生本人が作っている・AIがPDCAを自動で回す・NotionやスプレッドシートよりAIが使いやすい
- 現状：リリース直後・ユーザー獲得フェーズ・無料提供中・マネタイズ未実施
`;

export async function runMeeting(sessionIndex: number): Promise<MeetingResult> {
  const owner = getTodaysOwner(sessionIndex);
  const others = EXECUTIVES.filter((e) => e.id !== owner.id);

  const membersDesc = EXECUTIVES.map(
    (e) => `- ${e.name}（${e.role}）: ${e.personality}`
  ).join("\n");

  const prompt = `
あなたはCareoのAI幹部会議のファシリテーターです。
以下の幹部6名がCareoの事業戦略について議論し、創業者へのGoサイン用提言をまとめます。

【幹部メンバー】
${membersDesc}

${CAREO_CONTEXT}

【今回の当番】
${owner.name}（${owner.role}）が議題を持ち込みます。
担当フォーカス: ${owner.focus}

【指示】
${owner.name}が今のCareoに最も重要だと思う戦略課題・機会について議題を提案し、他の幹部全員（${others.map(e => e.name).join("・")}）がそれぞれの専門性から意見を述べ、最終的に創業者へ具体的なGoアクションを提言してください。

・各幹部は2〜3文で自分の専門視点から意見を述べる（議論・反論・補強OK）
・結論は全員の意見を統合したもの
・推奨アクションは「創業者が今週中に実行できる具体的な1つのアクション」

以下のJSON形式のみで出力（マークダウン不要）：
{
  "topic": "議題タイトル（20字以内）",
  "topicOwnerOpening": "${owner.name}の議題提案（3〜4文）",
  "discussion": [
    {"name": "名前", "role": "役職名のみ", "message": "発言内容（2〜3文）"}
  ],
  "conclusion": "会議のまとめ（3〜4文）",
  "recommendedAction": "創業者へのGoアクション（1文・具体的に）"
}
`;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = (response.content[0] as { type: string; text: string }).text
    .replace(/```(?:json)?\n?/g, "")
    .replace(/```/g, "")
    .trim();

  const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw);

  return {
    topicOwner: owner.name,
    topic: json.topic,
    topicOwnerOpening: json.topicOwnerOpening,
    discussion: json.discussion,
    conclusion: json.conclusion,
    recommendedAction: json.recommendedAction,
  };
}
