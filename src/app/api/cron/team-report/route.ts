import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import Anthropic from "@anthropic-ai/sdk";

const resend = new Resend(process.env.RESEND_API_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TEAMS = [
  {
    id: "product",
    name: "プロダクトチーム",
    emoji: "💻",
    members: "Ryo（エンジニア）+ Saki（デザイナー）",
    focus: "機能改善・バグ修正・UI/UX向上・技術的負債の解消",
    prompt: (userCount: number) => `
あなたはCareoのプロダクトチーム（Ryo：エンジニア、Saki：デザイナー）です。
今日のユーザー数：${userCount}人

【Careoの現状】
- 就活生向けAI就活管理アプリ（Next.js 16 / Supabase / Anthropic Claude Haiku）
- 主要機能：企業管理・ES管理・面接ログ・AI PDCA・AIコーチ・OB/OG訪問・筆記試験・内定比較・自己分析
- マネタイズ：大学キャリアセンターとのB2B提携（準備中）
- 課題：ユーザーがまだ少ない段階。プロダクトの完成度と使いやすさで差別化が必要。

今日の仕事：Careoで今すぐ取り組むべきプロダクト改善を3つ提案してください。
機能開発・バグ修正・UI改善・UX向上・パフォーマンス改善など何でもOK。
優先度順に並べ、それぞれ「何を・なぜ・どう直すか」を具体的に書いてください。

以下のJSON形式のみで出力（マークダウン・コードブロック不要）：
{
  "headline": "今日のプロダクト改善テーマ（30字以内）",
  "tasks": [
    { "priority": 1, "title": "タスクタイトル", "why": "なぜ今やるべきか（1〜2文）", "how": "具体的な対応方法（2〜3文）" },
    { "priority": 2, "title": "タスクタイトル", "why": "なぜ今やるべきか（1〜2文）", "how": "具体的な対応方法（2〜3文）" },
    { "priority": 3, "title": "タスクタイトル", "why": "なぜ今やるべきか（1〜2文）", "how": "具体的な対応方法（2〜3文）" }
  ]
}`,
  },
  {
    id: "growth",
    name: "ユーザー拡大チーム",
    emoji: "📢",
    members: "Nana（マーケティング）",
    focus: "X投稿・口コミ・SNS戦略・ユーザー獲得",
    prompt: (userCount: number) => `
あなたはCareoのユーザー拡大チーム（Nana：マーケティング）です。
今日のユーザー数：${userCount}人

【Careoの現状】
- 就活生向けAI就活管理アプリ（careoai.jp）
- 開発者：上智大学在籍の就活生本人
- 差別化：当事者開発・AIがPDCAを自動で回す・全就活データ一元管理
- 競合：マイナビ・リクナビ（企業広告モデル）。Careoは「就活生の完全な味方」として差別化
- 主なユーザー獲得チャネル：X（Twitter）での就活情報発信

今日の仕事：ユーザーを増やすための施策を3つ提案してください。
X投稿ネタ・バズりやすいコンテンツ案・口コミを生むアイデア・紹介施策など何でもOK。
優先度順に並べ、それぞれ「何を・なぜ・どう実行するか」を具体的に書いてください。
X投稿案は「そのまま投稿できる完成品」を含めること。

以下のJSON形式のみで出力（マークダウン・コードブロック不要）：
{
  "headline": "今日のユーザー拡大テーマ（30字以内）",
  "tasks": [
    { "priority": 1, "title": "タスクタイトル", "why": "なぜ今やるべきか（1〜2文）", "how": "具体的な実行方法（投稿案がある場合はそのまま使える完成品を含む）" },
    { "priority": 2, "title": "タスクタイトル", "why": "なぜ今やるべきか（1〜2文）", "how": "具体的な実行方法" },
    { "priority": 3, "title": "タスクタイトル", "why": "なぜ今やるべきか（1〜2文）", "how": "具体的な実行方法" }
  ]
}`,
  },
  {
    id: "sales",
    name: "キャリセン営業チーム",
    emoji: "🏫",
    members: "Hana（大学営業）",
    focus: "大学キャリアセンターへの提携営業・資料作成・アプローチ戦略",
    prompt: (userCount: number) => `
あなたはCareoのキャリセン営業チーム（Hana：大学営業担当）です。
今日のユーザー数：${userCount}人

【Careoの現状】
- 就活生向けAI就活管理アプリ（careoai.jp）
- 開発者：上智大学在籍の就活生本人（これが最大の武器）
- マネタイズ：大学キャリアセンターとのB2B提携
  - 上智大学：公認肩書き＋学内宣伝と引き換えに無償提供
  - 他大学：¥48万〜/年（学生数に応じてスライド）
- 営業方針：まず上智キャリアセンターの無償パイロットを通す
- キャリアセンター担当者へのLPあり：careoai.jp/for-career-center
- 問い合わせフォームあり（Supabase保存＋メール通知）

今日の仕事：キャリセン営業を前進させるための施策を3つ提案してください。
アプローチメール文面・商談準備・資料改善・信頼構築施策など何でもOK。
優先度順に並べ、それぞれ「何を・なぜ・どう実行するか」を具体的に書いてください。
メール文面などはそのまま使える完成品を含めること。

以下のJSON形式のみで出力（マークダウン・コードブロック不要）：
{
  "headline": "今日の営業テーマ（30字以内）",
  "tasks": [
    { "priority": 1, "title": "タスクタイトル", "why": "なぜ今やるべきか（1〜2文）", "how": "具体的な実行方法（メール文面などがある場合はそのまま使える完成品を含む）" },
    { "priority": 2, "title": "タスクタイトル", "why": "なぜ今やるべきか（1〜2文）", "how": "具体的な実行方法" },
    { "priority": 3, "title": "タスクタイトル", "why": "なぜ今やるべきか（1〜2文）", "how": "具体的な実行方法" }
  ]
}`,
  },
];

function getTodayTeam() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return TEAMS[dayOfYear % 3];
}

async function getUserCount(): Promise<number> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { count } = await supabase
    .from("user_profiles")
    .select("*", { count: "exact", head: true });
  return count ?? 0;
}

function buildEmailHtml(team: (typeof TEAMS)[0], result: { headline: string; tasks: { priority: number; title: string; why: string; how: string }[] }, userCount: number, today: string): string {
  const taskRows = result.tasks
    .map(
      (t) => `
      <div style="margin-bottom:20px;padding:16px;background:#f9fafb;border-radius:10px;border-left:4px solid #00c896;">
        <p style="margin:0 0 4px;font-size:13px;color:#6b7280;">優先度 ${t.priority}</p>
        <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#0D0B21;">${t.title}</p>
        <p style="margin:0 0 4px;font-size:13px;color:#6b7280;font-weight:600;">なぜ今やるべきか</p>
        <p style="margin:0 0 10px;font-size:14px;color:#374151;">${t.why}</p>
        <p style="margin:0 0 4px;font-size:13px;color:#6b7280;font-weight:600;">どう実行するか</p>
        <p style="margin:0;font-size:14px;color:#374151;white-space:pre-wrap;">${t.how}</p>
      </div>`
    )
    .join("");

  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:24px;">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px;">
    <span style="font-size:24px;">${team.emoji}</span>
    <span style="font-size:20px;font-weight:800;color:#0D0B21;">Careo</span>
  </div>
  <div style="background:#0D0B21;border-radius:12px;padding:20px;margin-bottom:24px;">
    <p style="margin:0 0 4px;font-size:12px;color:#00c896;font-weight:700;letter-spacing:0.1em;">${today} の提案</p>
    <p style="margin:0 0 4px;font-size:18px;font-weight:700;color:#fff;">${team.emoji} ${team.name}</p>
    <p style="margin:0;font-size:13px;color:#9ca3af;">${team.members} ／ 現在のユーザー数：${userCount}人</p>
  </div>
  <h2 style="margin:0 0 16px;font-size:18px;color:#0D0B21;">${result.headline}</h2>
  ${taskRows}
  <p style="margin-top:32px;font-size:12px;color:#9ca3af;text-align:center;">Careo 自動レポート ― careoai.jp</p>
</div>`;
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret") ?? new URL(req.url).searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const team = getTodayTeam();
  const userCount = await getUserCount();

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    messages: [{ role: "user", content: team.prompt(userCount) }],
  });

  const rawText = (response.content[0] as { type: string; text: string }).text
    .replace(/```(?:json)?\n?/g, "")
    .replace(/```/g, "")
    .trim();
  const jsonStr = rawText.match(/\{[\s\S]*\}/)?.[0] ?? rawText;
  // 文字列値内の改行をエスケープしてJSONパースエラーを防ぐ
  const sanitized = jsonStr.replace(/("(?:[^"\\]|\\.)*")/g, (m) =>
    m.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")
  );
  const result = JSON.parse(sanitized);

  const today = new Date().toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = buildEmailHtml(team, result, userCount, today);

  const { error } = await resend.emails.send({
    from: "Careo チームレポート <onboarding@resend.dev>",
    to: ["hiroki.a0625@gmail.com"],
    subject: `[Careo] ${team.emoji} ${team.name}の提案 ― ${today}`,
    html,
  });

  if (error) {
    console.error("[team-report] Resend error:", error);
    return NextResponse.json({ error: "メール送信失敗" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, team: team.id, userCount });
}
