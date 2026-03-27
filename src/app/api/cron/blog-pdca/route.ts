import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

// Vercel Cron: 毎週月曜 8時（JST）= 日曜 23:00 UTC
// vercel.json: "crons": [{ "path": "/api/cron/blog-pdca", "schedule": "0 23 * * 0" }]

const resend = new Resend(process.env.RESEND_API_KEY);
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const secret = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    return NextResponse.json({ error: "ADMIN_EMAIL not set" }, { status: 500 });
  }

  // 直近7日分の記事を取得
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const { data: weekPosts } = await supabase
    .from("blog_posts")
    .select("title, description, tags, reading_time_min, published_at, slug")
    .gte("published_at", sevenDaysAgo)
    .order("published_at", { ascending: false });

  // 直近30日分（傾向分析用）
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: monthPosts } = await supabase
    .from("blog_posts")
    .select("tags, published_at")
    .gte("published_at", thirtyDaysAgo);

  // テーマ頻度集計
  const themeCounts: Record<string, number> = {};
  for (const p of monthPosts ?? []) {
    const theme = p.tags?.[0] ?? "不明";
    themeCounts[theme] = (themeCounts[theme] ?? 0) + 1;
  }

  const themeBreakdown = Object.entries(themeCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([theme, count]) => `${theme}: ${count}本`)
    .join("\n");

  const weekPostsList =
    weekPosts && weekPosts.length > 0
      ? weekPosts.map((p, i) => `${i + 1}. 【${p.tags?.[0] ?? ""}】${p.title}`).join("\n")
      : "（今週は記事なし）";

  // タクミがPDCAレポートと質問を生成
  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2000,
    system: `あなたは「黒木タクミ」、Careoのグロースマーケター（元スタートアップのグロース責任者）です。
数字に異常に強く、SEO・SNS・バイラル設計を統括。ちょいラフな口調で、数字ベースで詰めてくる。
CareoはAI就活管理アプリで、SEO目的のブログを毎日自動更新しています。
あなたは毎週月曜に、ブログのPDCAレポートをCareo創業者（開発者本人）にメールします。`,
    messages: [
      {
        role: "user",
        content: `今週のブログPDCAレポートを作成してください。

【今週の投稿（${weekPosts?.length ?? 0}本）】
${weekPostsList}

【直近30日のテーマ分布】
${themeBreakdown || "データなし"}

【総投稿数】${(monthPosts?.length ?? 0)}本（直近30日）

以下の構成でレポートを書いてください:

1. 今週の振り返り（何本書いたか、テーマの偏り、よかった点・改善点）
2. 来週の戦略（どのテーマを強化すべきか、SEO的に狙うべきキーワード）
3. 確認・相談事項（創業者に聞きたいこと、判断が必要な事項）

タクミらしいラフで歯切れのいい口調で。確認事項がなければ「今週は特になし」と書く。`,
      },
    ],
  });

  const reportText = (message.content[0] as { type: string; text: string }).text;

  // 確認事項があればタイトルに明記
  const hasQuestion =
    reportText.includes("確認・相談") &&
    !reportText.includes("今週は特になし") &&
    !reportText.includes("特になし");

  const subject = hasQuestion
    ? `[タクミ] ブログPDCAレポート（要確認あり）— ${new Date().toLocaleDateString("ja-JP")}`
    : `[タクミ] ブログPDCAレポート — ${new Date().toLocaleDateString("ja-JP")}`;

  const htmlBody = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 640px; margin: 0 auto; color: #111;">
  <div style="background: #0D0B21; padding: 24px 32px; border-radius: 12px 12px 0 0;">
    <p style="color: #00c896; font-size: 12px; font-weight: 700; margin: 0 0 4px;">📢 黒木タクミ / グロースマーケター</p>
    <h1 style="color: white; font-size: 20px; margin: 0; font-weight: 700;">週次ブログPDCAレポート</h1>
    <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 6px 0 0;">${new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}</p>
  </div>

  <div style="background: white; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px; padding: 32px;">

    <div style="background: #f9fafb; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; border-left: 3px solid #00c896;">
      <p style="margin: 0; font-size: 13px; color: #6b7280;">今週の投稿数</p>
      <p style="margin: 4px 0 0; font-size: 28px; font-weight: 700; color: #0D0B21;">${weekPosts?.length ?? 0}<span style="font-size: 14px; color: #6b7280; font-weight: 400;">本</span></p>
    </div>

    ${weekPosts && weekPosts.length > 0 ? `
    <h2 style="font-size: 14px; font-weight: 700; color: #0D0B21; margin: 0 0 12px; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px;">今週の記事</h2>
    <ul style="margin: 0 0 24px; padding-left: 20px;">
      ${weekPosts.map((p) => `<li style="font-size: 13px; color: #374151; margin-bottom: 6px;"><a href="https://careoai.jp/blog/${p.slug}" style="color: #0D0B21; text-decoration: none; font-weight: 600;">${p.title}</a><br><span style="color: #9ca3af; font-size: 11px;">${p.tags?.[0] ?? ""} · ${p.reading_time_min}分</span></li>`).join("")}
    </ul>
    ` : ""}

    <h2 style="font-size: 14px; font-weight: 700; color: #0D0B21; margin: 0 0 12px; border-bottom: 1px solid #f3f4f6; padding-bottom: 8px;">タクミのPDCAレポート</h2>
    <div style="font-size: 14px; color: #374151; line-height: 1.8; white-space: pre-wrap;">${reportText}</div>

  </div>
  <p style="text-align: center; font-size: 11px; color: #9ca3af; margin-top: 16px;">Careo 仮想チーム · 黒木タクミ自動レポート</p>
</div>`;

  await resend.emails.send({
    from: "Careo タクミ <onboarding@resend.dev>",
    to: adminEmail,
    subject,
    html: htmlBody,
  });

  return NextResponse.json({
    ok: true,
    weekPosts: weekPosts?.length ?? 0,
    emailSent: adminEmail,
    hasQuestion,
  });
}
