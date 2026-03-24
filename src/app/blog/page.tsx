import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "就活ブログ | Careo — ES・面接・OB訪問・自己分析の実践ガイド",
  description:
    "ES書き方・面接対策・自己分析・OB訪問・筆記試験など、就活に役立つ実践ノウハウを毎日更新。AI就活管理アプリCareoが運営する就活ブログ。",
  openGraph: {
    title: "就活ブログ | Careo",
    description:
      "ES・面接・自己分析・OB訪問など、就活ノウハウを毎日更新。Careo公式ブログ。",
    url: "https://careoai.jp/blog",
    siteName: "Careo",
    locale: "ja_JP",
    type: "website",
  },
  alternates: { canonical: "https://careoai.jp/blog" },
};

type Post = {
  id: string;
  slug: string;
  title: string;
  description: string;
  tags: string[];
  reading_time_min: number;
  published_at: string;
};

const TAG_COLORS: Record<string, string> = {
  "ES対策": "bg-blue-50 text-blue-600 border-blue-100",
  "面接対策": "bg-purple-50 text-purple-600 border-purple-100",
  "自己分析": "bg-orange-50 text-orange-600 border-orange-100",
  "OB/OG訪問": "bg-teal-50 text-teal-600 border-teal-100",
  "インターン": "bg-green-50 text-green-600 border-green-100",
  "就活管理": "bg-indigo-50 text-indigo-600 border-indigo-100",
  "AI就活": "bg-[#00c896]/10 text-[#00a87e] border-[#00c896]/20",
  "筆記試験": "bg-yellow-50 text-yellow-600 border-yellow-100",
  "業界研究": "bg-rose-50 text-rose-600 border-rose-100",
};

function tagStyle(tag: string) {
  return TAG_COLORS[tag] ?? "bg-gray-50 text-gray-600 border-gray-200";
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

async function getPosts(): Promise<Post[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data } = await supabase
    .from("blog_posts")
    .select("id, slug, title, description, tags, reading_time_min, published_at")
    .order("published_at", { ascending: false })
    .limit(50);
  return data ?? [];
}

export default async function BlogPage() {
  const posts = await getPosts();

  // タグ一覧（重複除去）
  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags)));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Careo就活ブログ",
    url: "https://careoai.jp/blog",
    description: "ES・面接・自己分析・OB訪問など就活ノウハウを毎日更新",
    publisher: { "@type": "Organization", name: "Careo", url: "https://careoai.jp" },
    blogPost: posts.slice(0, 10).map((p) => ({
      "@type": "BlogPosting",
      headline: p.title,
      description: p.description,
      url: `https://careoai.jp/blog/${p.slug}`,
      datePublished: p.published_at,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-gray-50">
        {/* ─── ヘッダー ─────────────────────────────── */}
        <header className="border-b border-gray-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img src="/icon-new.svg" alt="Careo" className="w-6 h-6" />
              <span className="font-bold text-[#0D0B21] text-sm">Careo</span>
              <span className="text-gray-300 text-sm">/</span>
              <span className="text-gray-500 text-sm">ブログ</span>
            </Link>
            <Link
              href="/signup"
              className="bg-[#0D0B21] hover:bg-[#1a1830] text-white text-xs font-bold px-4 py-2 rounded-full transition-colors"
            >
              無料で始める
            </Link>
          </div>
        </header>

        {/* ─── ヒーロー ─────────────────────────────── */}
        <section className="bg-white border-b border-gray-200 py-14 px-5">
          <div className="max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 border border-[#00c896]/30 bg-[#00c896]/5 text-[#00a87e] text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00c896] animate-pulse" />
              毎朝8時に新記事を更新中
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#0D0B21] tracking-tight mb-3">
              就活ブログ
            </h1>
            <p className="text-gray-500 text-sm md:text-base max-w-xl">
              ES書き方・面接対策・自己分析・OB訪問・筆記試験など、就活の「なぜ」と「どうすれば」を毎日発信。
              <br className="hidden md:block" />
              AI就活管理アプリ Careo が運営しています。
            </p>

            {/* タグフィルター */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {allTags.map((tag) => (
                  <span
                    key={tag}
                    className={`text-xs font-medium px-3 py-1 rounded-full border ${tagStyle(tag)}`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ─── 記事一覧 ─────────────────────────────── */}
        <main className="max-w-5xl mx-auto px-5 py-12">
          {posts.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <p className="text-lg font-semibold mb-2">準備中です</p>
              <p className="text-sm">毎朝8時に記事が追加されます。</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5">
              {posts.map((post, i) => (
                <Link
                  key={post.id}
                  href={`/blog/${post.slug}`}
                  className="group bg-white rounded-2xl border border-gray-200 p-6 hover:border-[#00c896]/40 hover:shadow-md transition-all duration-200 flex flex-col"
                >
                  {/* タグ */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {post.tags.slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tagStyle(tag)}`}
                      >
                        {tag}
                      </span>
                    ))}
                    {i === 0 && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-[#00c896]/10 text-[#00a87e] border-[#00c896]/20">
                        NEW
                      </span>
                    )}
                  </div>

                  {/* タイトル */}
                  <h2 className="font-bold text-[#0D0B21] text-sm md:text-base leading-snug mb-2 group-hover:text-[#00a87e] transition-colors line-clamp-3">
                    {post.title}
                  </h2>

                  {/* 説明 */}
                  <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mb-4 flex-1">
                    {post.description}
                  </p>

                  {/* フッター */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">{formatDate(post.published_at)}</span>
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {post.reading_time_min}分で読める
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* ─── 登録バナー ────────────────────────── */}
          <div className="mt-16 bg-gradient-to-br from-[#0D0B21] to-[#1a1830] rounded-3xl px-8 py-10 text-center">
            <div className="inline-flex items-center gap-2 border border-[#00c896]/40 bg-[#00c896]/10 text-[#00c896] text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              完全無料・クレカ不要
            </div>
            <h2 className="text-white font-bold text-xl md:text-2xl tracking-tight mb-3">
              読むだけじゃなく、使ってみよう。
            </h2>
            <p className="text-white/60 text-sm mb-7 max-w-md mx-auto">
              Careoは就活のES・面接・OB訪問・筆記試験をすべて一か所で管理。
              全データを把握したAIコーチ「カレオ」が、あなただけのアドバイスを届けます。
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[#00c896] hover:bg-[#00a87e] text-white font-bold px-7 py-3.5 rounded-full text-sm transition-all hover:scale-105"
            >
              今すぐ無料で始める
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </main>
      </div>
    </>
  );
}
