import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

// POST /api/admin/blog-fix?secret=xxx&slug=xxx[&date=2026-03-25]
// 既存記事の本文に外部リンクを追加し、オプションで公開日を変更する

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
  const newDate = req.nextUrl.searchParams.get("date"); // 例: "2026-03-25"

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const { data: post, error: fetchErr } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .single();

  if (fetchErr || !post) {
    return NextResponse.json({ error: "post not found", detail: fetchErr }, { status: 404 });
  }

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 8192,
    system: `あなたは就活ブログの編集者です。以下のルールで既存のHTML記事を修正してください。

【修正ルール】
1. 文章が途中で切れている場合は、文脈を読んで自然に続きを書き、記事を完結させる
2. 【最重要・必ず実行】記事の本文を読み、外部サイト・機関・サービスへのリンクが1つもない場合は、以下のURLリストを使って最低1つリンクを追加すること。記事の内容に関連するURLを選び、自然な文脈で <a href="URL" target="_blank" rel="noopener noreferrer">テキスト</a> として埋め込む。
   確定URL一覧:
   - マイナビ就活 → https://job.mynavi.jp/
   - リクナビ → https://job.rikunabi.com/
   - OfferBox → https://offerbox.jp/
   - キャリアパーク → https://careerpark.jp/
   - ビズリーチキャンパス → https://br-campus.jp/
   - 16Personalities（自己分析） → https://www.16personalities.com/ja
   - リクルートワークス研究所 → https://www.works-i.com/
   - マイナビ就職白書 → https://saponet.mynavi.jp/release/student/
   - 厚生労働省（就活・労働関係） → https://www.mhlw.go.jp/
   - 経団連（採用ルール） → https://www.keidanren.or.jp/
   - サイバーエージェント採用 → https://www.cyberagent.co.jp/careers/students/
   - 楽天グループ新卒採用 → https://corp.rakuten.co.jp/careers/graduates/
   - 内閣府・就活ルール → https://www.cas.go.jp/jp/seisaku/shushoku_katsudou_yousei/index.html
3. リンクが既にある箇所はそのまま維持する
4. 記事末尾には必ず <a href="https://careoai.jp/signup" class="blog-cta-link">Careoを無料で始める →</a> のCTAを置く
5. HTMLタグ・スタイル・構成はそのまま維持し、必要な修正のみ行う
6. 返答はHTMLのみ（説明文・コードブロックマーカー不要）`,
    messages: [
      {
        role: "user",
        content: `以下の記事（タイトル: ${post.title}）のHTMLを修正してください。\n\n${post.body}`,
      },
    ],
  });

  const fixedBody = (message.content[0] as { type: string; text: string }).text
    .replace(/```(?:html)?/gi, "")
    .replace(/```/g, "")
    .trim();

  const updatePayload: Record<string, string> = { body: fixedBody };
  if (newDate) {
    // JST 9:00 として保存
    updatePayload.published_at = `${newDate}T09:00:00+09:00`;
  }

  const { error: updateErr } = await supabase
    .from("blog_posts")
    .update(updatePayload)
    .eq("slug", slug);

  if (updateErr) {
    return NextResponse.json({ error: "update failed", detail: updateErr }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slug, chars: fixedBody.length, date_updated: newDate ?? null });
}
