import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

// POST /api/admin/blog-fix?secret=xxx&slug=20260325-vpqt5t
// 既存記事の不完全な本文を補完し、他社サービスへのリンクを追加する

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });

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
2. 【最重要】記事中に他社サービス・ツール・企業名が登場するテキストを探し、必ず実際のURLで <a href="URL" target="_blank" rel="noopener noreferrer">サービス名</a> にリンクせよ。以下は確定URL：
   - StrengthsFinder/CliftonStrengths → https://www.gallup.com/cliftonstrengths/
   - Notion → https://www.notion.so/ja-jp
   - マイナビ就活 → https://job.mynavi.jp/
   - リクナビ → https://job.rikunabi.com/
   - OpenES → https://job.rikunabi.com/openes/
   - OfferBox → https://offerbox.jp/
   - キャリアパーク → https://careerpark.jp/
   - ビズリーチキャンパス → https://br-campus.jp/
   - 適性診断AnalyzeU+ → https://offerbox.jp/
   - 16Personalities → https://www.16personalities.com/ja
   - リクルートワークス研究所 → https://www.works-i.com/
   - マイナビ就職白書 → https://saponet.mynavi.jp/release/student/
   - 厚生労働省 → https://www.mhlw.go.jp/
   - 経団連 → https://www.keidanren.or.jp/
3. リンクが既にある箇所はそのまま維持する
4. 記事末尾には必ず <a href="https://careoai.jp/signup" class="blog-cta-link">無料で始める →</a> のCTAを置く
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

  const { error: updateErr } = await supabase
    .from("blog_posts")
    .update({ body: fixedBody })
    .eq("slug", slug);

  if (updateErr) {
    return NextResponse.json({ error: "update failed", detail: updateErr }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slug, chars: fixedBody.length });
}
