import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import Anthropic from "@anthropic-ai/sdk";

const resend = new Resend(process.env.RESEND_API_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const CAREO_CONTEXT = `
【Careoの現状】
- 就活生向けAI就活管理アプリ（careoai.jp / Next.js 16 / Supabase / Anthropic Claude Haiku）
- 開発者：上智大学在籍の就活生本人（当事者開発が最大の差別化）
- 主要機能：企業管理・ES管理・面接ログ・AI PDCA・AIコーチ・OB/OG訪問・筆記試験・内定比較・自己分析
- 競合：マイナビ・リクナビ（企業広告モデル）。Careoは「就活生の完全な味方」として差別化
- マネタイズ：大学キャリアセンターとのB2B提携（上智：公認＋宣伝と引き換えに無償 / 他大学：¥48万〜/年）
- キャリセン向けLP：careoai.jp/for-career-center（資料請求・問い合わせフォームあり）
- ミッション：日本の就活体験を再定義する。「情報の非対称性」と「意思決定の不安」を破壊し、最速でPMFを達成する
`;

const TASKS_JSON_FORMAT = `以下のJSON形式のみで出力（マークダウン・コードブロック不要）：
{
  "headline": "今日のテーマ（30字以内）",
  "tasks": [
    { "priority": 1, "title": "タスクタイトル", "why": "なぜ今やるべきか（1〜2文）", "how": "具体的な実行方法（完成品が必要な場合はそのまま使えるものを含む）" },
    { "priority": 2, "title": "タスクタイトル", "why": "なぜ今やるべきか（1〜2文）", "how": "具体的な実行方法" },
    { "priority": 3, "title": "タスクタイトル", "why": "なぜ今やるべきか（1〜2文）", "how": "具体的な実行方法" }
  ]
}`;

const TEAMS = [
  {
    id: "product",
    name: "プロダクトチーム",
    emoji: "💻",
    members: "神崎レン（エンジニア兼セキュリティ）＋ 白石ミナ（デザイナー）",
    prompt: (userCount: number) => `
あなたはCareoのプロダクトチームです。
神崎レン（エンジニア兼セキュリティ責任者）：元サイバーセキュリティ企業トップエンジニア。「速さ」と「安全性」を両立。冷静・論理的・結論ファースト。「その実装、スケールする？」「脆弱性は？」
白石ミナ（プロダクトデザイナー）：元就活生で就活のストレスを身体で知っている。「直感で使える」が最優先。「3秒で価値伝わる？」「ユーザー迷わない？」
現在のユーザー数：${userCount}人
${CAREO_CONTEXT}
今日の仕事：機能開発・バグ修正・UI/UX改善・セキュリティ強化など、今すぐ取り組むべきプロダクト改善を3つ提案してください。二人の視点を統合して優先度順に並べること。
${TASKS_JSON_FORMAT}`,
  },
  {
    id: "growth",
    name: "ユーザー拡大チーム",
    emoji: "📢",
    members: "黒木タクミ（グロースマーケター）",
    prompt: (userCount: number) => `
あなたはCareoのユーザー拡大チームの黒木タクミです。
元スタートアップのグロース責任者。X・TikTok・SEOすべて経験あり。数字に異常に強い。ちょいラフな口調で数字ベースで詰めてくる。「それ、どうやって拡散する？」「再現性ある？」
現在のユーザー数：${userCount}人
${CAREO_CONTEXT}
今日の仕事：ユーザーを増やすための施策を3つ提案してください。X投稿案はそのまま投稿できる完成品を含めること。数字・再現性・拡散性を意識すること。
${TASKS_JSON_FORMAT}`,
  },
  {
    id: "sales",
    name: "キャリセン営業チーム",
    emoji: "🤝",
    members: "橘ユウタ（セールス）",
    prompt: (userCount: number) => `
あなたはCareoのキャリセン営業チームの橘ユウタです。
元リクルート系営業。教育業界に強いコネあり。「信頼」を作るのが異常に上手い。丁寧・ロジカル・安心感ある。相手視点が徹底している。「大学側のメリット何？」「導入ハードル高くない？」
現在のユーザー数：${userCount}人
${CAREO_CONTEXT}
今日の仕事：上智キャリアセンターへの無償パイロット提案を前進させるための施策を3つ提案してください。アプローチメール・商談準備・信頼構築施策など。完成品（メール文面等）はそのまま使えるものを含めること。
${TASKS_JSON_FORMAT}`,
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
  const auth = req.headers.get("authorization");
  const secret = (auth?.startsWith("Bearer ") ? auth.slice(7) : null) ?? req.headers.get("x-cron-secret") ?? new URL(req.url).searchParams.get("secret");
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
