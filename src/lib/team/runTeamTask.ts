import Anthropic from "@anthropic-ai/sdk";
import { TEAM_MEMBERS, type TeamMember } from "./members";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CAREO_CONTEXT = `
【Careoの現状】
- 28卒向けAI就活管理アプリ（Next.js 16 / TypeScript / Tailwind CSS v4 / Supabase / Anthropic Claude Haiku）
- 開発者：上智大学 経済学部 28卒（現在2年生）・当事者が自ら作ったプロダクト
- URL: https://careo-sigma.vercel.app
- 主要機能：企業管理・ES管理・面接ログ・AI PDCA・カレオAIコーチ・OB/OG訪問ログ・筆記試験管理・内定比較・自己分析
- 現在のユーザー数：2人（開発者本人 + 友人1名）
- マネタイズ戦略：大学キャリアセンターとのB2B提携（無償パイロット → 有償契約）
- 当面の目標①：上智大学キャリアセンターへの無償パイロット提案を通す
- 当面の目標②：X個人アカウントで28卒就活情報を発信し認知を獲得する
- 競合：マイナビ・リクナビ（企業広告モデル）。Careoは「就活生の完全な味方」として差別化
- 差別化：当事者開発・AIがPDCAを自動で回す・全就活データ一元管理
`;

export interface TeamTaskResult {
  memberId: string;
  memberName: string;
  memberRole: string;
  memberEmoji: string;
  taskType: string;
  headline: string;
  body: string;
  deliverable: string;
  actionLabel: string;
}

export async function runTeamTask(memberId: string): Promise<TeamTaskResult> {
  const member = TEAM_MEMBERS.find((m) => m.id === memberId);
  if (!member) throw new Error(`Unknown member: ${memberId}`);

  const prompt = buildPrompt(member);

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1200,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = (response.content[0] as { type: string; text: string }).text
    .replace(/```(?:json)?\n?/g, "")
    .replace(/```/g, "")
    .trim();

  const json = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw);

  return {
    memberId: member.id,
    memberName: member.name,
    memberRole: member.role,
    memberEmoji: member.emoji,
    taskType: memberId,
    headline: json.headline,
    body: json.body,
    deliverable: json.deliverable,
    actionLabel: json.actionLabel,
  };
}

function buildPrompt(member: TeamMember): string {
  const header = `あなたはCareoの${member.role}「${member.name}」です。
性格：${member.personality}
フォーカス：${member.focus}
${CAREO_CONTEXT}
`;

  const tasks: Record<string, string> = {
    engineer: `${header}
今日の仕事：Careoで今すぐ改善すべき技術課題を1つ特定し、具体的な実装提案を行ってください。
技術スタック：Next.js 16 App Router / TypeScript / Tailwind CSS v4 / Supabase / Anthropic Claude Haiku

例：ローディングUXの改善・AIレスポンスのエラーハンドリング強化・モバイル表示の最適化・パフォーマンス改善など

以下のJSON形式のみで出力（マークダウン・コードブロック不要）：
{
  "headline": "今日の実装提案タイトル（30字以内）",
  "body": "課題の背景・なぜ今やるべきか（3〜4文）",
  "deliverable": "具体的な実装方法（対象ファイルパス・変更内容・コード例を含む、300字以内）",
  "actionLabel": "創業者へのアクション指示（1文・「〜を実装してください」など具体的に）"
}`,

    sales: `${header}
今日の仕事：以下のどちらかを実行してください。
① 今日のX投稿1本の下書き（28卒向け就活情報を届けながらCareoへの自然な認知につながる内容）
② 上智大学キャリアセンター担当者宛てのアプローチメール下書き（無償パイロット提案）

どちらが今のCareoにとってより重要かを自分で判断して実行してください。

以下のJSON形式のみで出力（マークダウン・コードブロック不要）：
{
  "headline": "今日のタスクタイトル（30字以内）",
  "body": "なぜこのタスクを選んだか・背景と意図（2〜3文）",
  "deliverable": "完成したX投稿文またはメール本文（そのままコピーして使える完成品）",
  "actionLabel": "創業者へのアクション指示（1文・「このまま投稿してください」または「このまま送信してください」）"
}`,

    designer: `${header}
今日の仕事：Careoの現在のUIで改善すべき点を1つ特定し、具体的な改善提案を行ってください。
対象候補：LP・ダッシュボード・企業管理・チャット画面・オンボーディング・サイドバー

28卒就活生の視点から「ここを直すと使いやすくなる・信頼感が上がる・離脱が減る」ポイントを選んでください。

以下のJSON形式のみで出力（マークダウン・コードブロック不要）：
{
  "headline": "今日のデザイン改善提案タイトル（30字以内）",
  "body": "現状の課題・ユーザーへの影響（3〜4文）",
  "deliverable": "具体的な改善内容（どのページの何を・どう変えるか・なぜそうするか、300字以内）",
  "actionLabel": "創業者へのアクション指示（1文・「〜を修正してください」など具体的に）"
}`,

    security: `${header}
今日の仕事：Careoのセキュリティ・データ管理・不正利用対策において、今すぐ取り組むべき課題を1つ特定し、具体的な対策を提案してください。

観点の例：
- APIの不正利用・クレジット消費攻撃への対策
- ユーザーデータのプライバシー保護（Anthropicへの送信データの最小化等）
- レート制限の強化（IP・ユーザー単位の上限設計）
- Proプラン設計（無料/有料の機能分離・利用制限の設計）
- 利用規約・プライバシーポリシーの整備
- Supabase RLSポリシーの漏れ確認
- 不正アカウント対策（メール認証・登録制限）

技術スタック：Next.js 16 App Router / TypeScript / Supabase / Anthropic Claude Haiku / Vercel

以下のJSON形式のみで出力（マークダウン・コードブロック不要）：
{
  "headline": "今日のセキュリティ改善提案タイトル（30字以内）",
  "body": "現状のリスク・なぜ今対処すべきか（3〜4文）",
  "deliverable": "具体的な対策内容（実装方法・変更箇所・理由、300字以内）",
  "actionLabel": "創業者へのアクション指示（1文・具体的に）"
}`,
  };

  return tasks[member.id] ?? tasks.engineer;
}

