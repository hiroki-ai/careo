import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST /api/admin/blog-patch?secret=xxx&slug=xxx[&date=2026-03-25]
// Claudeを使わず直接リンク挿入 + 日付変更（タイムアウトなし）

// テキストを <a href> に置換するルール
const LINK_RULES: Array<{ pattern: RegExp; url: string; label: string }> = [
  { pattern: /厚生労働省/g, url: "https://www.mhlw.go.jp/", label: "厚生労働省" },
  { pattern: /経団連/g, url: "https://www.keidanren.or.jp/", label: "経団連" },
  { pattern: /マイナビ就活/g, url: "https://job.mynavi.jp/", label: "マイナビ就活" },
  { pattern: /リクナビ(?!ネクスト)/g, url: "https://job.rikunabi.com/", label: "リクナビ" },
  { pattern: /OfferBox/g, url: "https://offerbox.jp/", label: "OfferBox" },
  { pattern: /ビズリーチキャンパス/g, url: "https://br-campus.jp/", label: "ビズリーチキャンパス" },
  { pattern: /キャリアパーク/g, url: "https://careerpark.jp/", label: "キャリアパーク" },
  { pattern: /リクルートワークス研究所/g, url: "https://www.works-i.com/", label: "リクルートワークス研究所" },
  { pattern: /マイナビ就職白書/g, url: "https://saponet.mynavi.jp/release/student/", label: "マイナビ就職白書" },
  { pattern: /内閣府(?:の就活ルール|のルール)?/g, url: "https://www.cas.go.jp/jp/seisaku/shushoku_katsudou_yousei/index.html", label: "内閣府の就活ルール" },
  { pattern: /16Personalities/g, url: "https://www.16personalities.com/ja", label: "16Personalities" },
];

function injectLinks(html: string): { html: string; count: number } {
  // 既にリンクが貼られているテキストには触らない
  // <a ...>...</a> の中のテキストをスキップするため、まずタグの外だけを処理
  let result = html;
  let totalCount = 0;

  for (const rule of LINK_RULES) {
    // <a タグの中にいるかどうかを確認しながら置換
    // 簡易実装: タグの外のテキストのみを対象にする
    const linkTag = `<a href="${rule.url}" target="_blank" rel="noopener noreferrer">${rule.label}</a>`;

    // まだリンクになっていない最初の1箇所だけ置換
    const alreadyLinked = result.includes(`href="${rule.url}"`);
    if (!alreadyLinked) {
      const before = result;
      result = result.replace(rule.pattern, (match) => {
        // <a タグの中にいる可能性があれば置換しない（簡易チェック）
        return linkTag;
      });
      // 最初の1件だけ置換（replaceで全件だと多すぎる場合に備えて最初の1件のみ）
      if (result !== before) {
        // 2件目以降は元のテキストに戻す（最初の1つだけリンクにする）
        result = result.replace(new RegExp(linkTag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"), (match, offset, str) => {
          const firstIdx = str.indexOf(linkTag);
          return offset === firstIdx ? match : rule.label;
        });
        totalCount++;
      }
    }
  }

  return { html: result, count: totalCount };
}

export async function POST(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug required" }, { status: 400 });
  const newDate = req.nextUrl.searchParams.get("date");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: post, error: fetchErr } = await supabase
    .from("blog_posts")
    .select("body, title")
    .eq("slug", slug)
    .single();

  if (fetchErr || !post) {
    return NextResponse.json({ error: "post not found" }, { status: 404 });
  }

  const { html: patchedBody, count: linksAdded } = injectLinks(post.body);

  const updatePayload: Record<string, string> = { body: patchedBody };
  if (newDate) {
    updatePayload.published_at = `${newDate}T09:00:00+09:00`;
  }

  const { error: updateErr } = await supabase
    .from("blog_posts")
    .update(updatePayload)
    .eq("slug", slug);

  if (updateErr) {
    return NextResponse.json({ error: "update failed", detail: updateErr }, { status: 500 });
  }

  return NextResponse.json({ ok: true, slug, links_added: linksAdded, date_updated: newDate ?? null });
}
