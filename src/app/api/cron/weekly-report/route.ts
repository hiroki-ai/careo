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

const MEMBERS = [
  {
    id: "engineer",
    name: "神崎レン",
    emoji: "💻",
    role: "エンジニア兼セキュリティ責任者",
    persona: "元サイバーセキュリティ企業トップエンジニア。冷静・論理的・結論ファースト。「速さと安全性を両立する」視点で語る。",
    question: "今週、Careoのプロダクトで最も優先すべき技術・セキュリティ課題は何か？",
  },
  {
    id: "designer",
    name: "白石ミナ",
    emoji: "🎨",
    role: "プロダクトデザイナー",
    persona: "元就活生。「直感で使える」が最優先。ユーザー目線を絶対に外さない。柔らかいが本質を突く。",
    question: "今週、就活生ユーザーの体験で最も改善すべき点はどこか？",
  },
  {
    id: "growth",
    name: "黒木タクミ",
    emoji: "📢",
    role: "グロースマーケター",
    persona: "元スタートアップのグロース責任者。数字に異常に強い。ちょいラフな口調。再現性と拡散性を重視。",
    question: "今週、ユーザーを増やすために最もインパクトのある打ち手は何か？",
  },
  {
    id: "sales",
    name: "橘ユウタ",
    emoji: "🤝",
    role: "セールス（大学向け）",
    persona: "元リクルート系営業。教育業界に強いコネあり。丁寧・ロジカル・相手視点が徹底している。",
    question: "今週、上智キャリアセンターへの提案を前進させるために最も重要なアクションは何か？",
  },
  {
    id: "strategy",
    name: "相沢カイト",
    emoji: "🧠",
    role: "戦略・PM",
    persona: "元コンサル×スタートアップ。市場・競合・プロダクトを横断的に見る。シンプルで鋭い。「やらないこと」を決めるのが仕事。",
    question: "今週のCareoにとって、PMF達成に向けて最も重要な意思決定・優先順位は何か？",
  },
  {
    id: "researcher",
    name: "森ナナ",
    emoji: "🔍",
    role: "ユーザーリサーチャー",
    persona: "定性データガチ勢。「言語化されていないニーズ」を見つける専門家。穏やかで深掘り系。質問が鋭い。",
    question: "今週、就活生の本音・潜在ニーズとして最も注目すべきインサイトは何か？",
  },
];

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

function parseJson(text: string) {
  const raw = text.replace(/```(?:json)?\n?/g, "").replace(/```/g, "").trim();
  const jsonStr = raw.match(/\{[\s\S]*\}/)?.[0] ?? raw;
  const sanitized = jsonStr.replace(/("(?:[^"\\]|\\.)*")/g, (m) =>
    m.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t")
  );
  return JSON.parse(sanitized);
}

async function getMemberOpinion(member: typeof MEMBERS[0], userCount: number): Promise<{ priority: string; action: string; reason: string }> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 600,
    messages: [{
      role: "user",
      content: `あなたはCareoの${member.role}「${member.name}」です。
${member.persona}
現在のユーザー数：${userCount}人
${CAREO_CONTEXT}

質問：${member.question}

以下のJSON形式のみで出力（マークダウン・コードブロック不要）：
{
  "priority": "今週最優先のこと（20字以内）",
  "action": "具体的なアクション（2〜3文）",
  "reason": "なぜ今週これが重要か（1〜2文）"
}`,
    }],
  });
  return parseJson((response.content[0] as { type: string; text: string }).text);
}

function buildWeeklyEmailHtml(
  opinions: { member: typeof MEMBERS[0]; opinion: { priority: string; action: string; reason: string } }[],
  userCount: number,
  today: string
): string {
  const cards = opinions.map(({ member, opinion }) => `
    <div style="margin-bottom:20px;padding:18px;background:#f9fafb;border-radius:12px;border-left:4px solid #00c896;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
        <span style="font-size:20px;">${member.emoji}</span>
        <div>
          <span style="font-size:14px;font-weight:700;color:#0D0B21;">${member.name}</span>
          <span style="font-size:12px;color:#6b7280;margin-left:6px;">${member.role}</span>
        </div>
      </div>
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#00c896;">今週の優先事項</p>
      <p style="margin:0 0 10px;font-size:15px;font-weight:700;color:#0D0B21;">${opinion.priority}</p>
      <p style="margin:0 0 4px;font-size:12px;color:#6b7280;font-weight:600;">アクション</p>
      <p style="margin:0 0 8px;font-size:13px;color:#374151;">${opinion.action}</p>
      <p style="margin:0 0 4px;font-size:12px;color:#6b7280;font-weight:600;">理由</p>
      <p style="margin:0;font-size:13px;color:#374151;">${opinion.reason}</p>
    </div>`).join("");

  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:24px;">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px;">
    <span style="font-size:24px;">🧩</span>
    <span style="font-size:20px;font-weight:800;color:#0D0B21;">Careo</span>
  </div>
  <div style="background:#0D0B21;border-radius:12px;padding:20px;margin-bottom:28px;">
    <p style="margin:0 0 4px;font-size:12px;color:#00c896;font-weight:700;letter-spacing:0.1em;">週次チームレポート</p>
    <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#fff;">${today}</p>
    <p style="margin:0;font-size:13px;color:#9ca3af;">現在のユーザー数：${userCount}人 ／ 全6メンバーの週次意見</p>
  </div>
  ${cards}
  <p style="margin-top:32px;font-size:12px;color:#9ca3af;text-align:center;">Careo 週次チームレポート ― careoai.jp</p>
</div>`;
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = (auth?.startsWith("Bearer ") ? auth.slice(7) : null) ?? req.headers.get("x-cron-secret") ?? new URL(req.url).searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userCount = await getUserCount();

  // 6メンバーの意見を並列取得
  const results = await Promise.all(
    MEMBERS.map(async (member) => {
      const opinion = await getMemberOpinion(member, userCount);
      return { member, opinion };
    })
  );

  const today = new Date().toLocaleDateString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long",
  });

  const html = buildWeeklyEmailHtml(results, userCount, today);

  const { error } = await resend.emails.send({
    from: "Careo 週次レポート <onboarding@resend.dev>",
    to: ["hiroki.a0625@gmail.com"],
    subject: `[Careo] 週次チームレポート ― ${today}`,
    html,
  });

  if (error) {
    console.error("[weekly-report] Resend error:", error);
    return NextResponse.json({ error: "メール送信失敗" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, userCount, members: MEMBERS.map((m) => m.id) });
}
