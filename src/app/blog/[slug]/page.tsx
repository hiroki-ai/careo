import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";

type Post = {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  tags: string[];
  reading_time_min: number;
  published_at: string;
  focus_keyphrase?: string;
  thumbnail_url?: string | null;
};

type Props = { params: Promise<{ slug: string }> };

const supabaseServer = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

async function getPost(slug: string): Promise<Post | null> {
  const { data } = await supabaseServer()
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .single();
  return data ?? null;
}

type RelatedPost = Omit<Post, "body">;

async function getRelated(post: Post): Promise<RelatedPost[]> {
  if (!post.tags.length) return [];
  const { data } = await supabaseServer()
    .from("blog_posts")
    .select("id, slug, title, description, tags, reading_time_min, published_at")
    .overlaps("tags", post.tags)
    .neq("slug", post.slug)
    .order("published_at", { ascending: false })
    .limit(3);
  return data ?? [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "記事が見つかりません | Careo" };
  return {
    title: `${post.title} | Careo就活ブログ`,
    description: post.description,
    keywords: [
      ...(post.focus_keyphrase ? [post.focus_keyphrase] : []),
      ...post.tags,
      "就活", "Careo", "就活管理",
    ].join(", "),
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://careoai.jp/blog/${post.slug}`,
      siteName: "Careo",
      locale: "ja_JP",
      type: "article",
      publishedTime: post.published_at,
      images: [{ url: `https://careoai.jp/blog/${post.slug}/opengraph-image`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [`https://careoai.jp/blog/${post.slug}/opengraph-image`],
    },
    alternates: { canonical: `https://careoai.jp/blog/${post.slug}` },
  };
}

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

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  const related: RelatedPost[] = await getRelated(post);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.published_at,
    url: `https://careoai.jp/blog/${post.slug}`,
    author: { "@type": "Organization", name: "Careo", url: "https://careoai.jp" },
    publisher: {
      "@type": "Organization",
      name: "Careo",
      url: "https://careoai.jp",
      logo: { "@type": "ImageObject", url: "https://careoai.jp/icon-192.png" },
    },
    keywords: post.tags.join(", "),
    timeRequired: `PT${post.reading_time_min}M`,
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
          <div className="max-w-4xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <img src="/icon-192.png" alt="Careo" className="w-6 h-6" />
              <span className="font-bold text-[#0D0B21] text-sm">Careo</span>
            </Link>
            <Link
              href="/signup"
              className="bg-[#0D0B21] hover:bg-[#1a1830] text-white text-xs font-bold px-4 py-2 rounded-full transition-colors"
            >
              無料で始める
            </Link>
          </div>
        </header>

        {/* ─── パンくず ─────────────────────────────── */}
        <div className="max-w-4xl mx-auto px-4 md:px-8 pt-5 pb-0">
          <nav className="flex items-center gap-1.5 text-xs text-gray-400">
            <Link href="/" className="hover:text-gray-600 transition-colors">Careo</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-gray-600 transition-colors">ブログ</Link>
            <span>/</span>
            <span className="text-gray-600 truncate max-w-[180px] md:max-w-xs">{post.title}</span>
          </nav>
        </div>

        {/* ─── 記事本体 ─────────────────────────────── */}
        <article className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">
          {/* タグ */}
          <div className="flex flex-wrap gap-1.5 mb-3 md:mb-4">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${tagStyle(tag)}`}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* タイトル */}
          <h1 className="text-[1.35rem] leading-snug md:text-[2rem] md:leading-tight font-bold text-[#0D0B21] tracking-tight mb-4">
            {post.title}
          </h1>

          {/* メタ情報 */}
          <div className="flex flex-wrap items-center gap-3 md:gap-5 text-xs text-gray-400 mb-6 md:mb-10 pb-5 md:pb-7 border-b border-gray-200">
            <div className="flex items-center gap-1.5">
              <img src="/icon-192.png" alt="" className="w-4 h-4" />
              <span className="font-semibold text-gray-600">Careo編集部</span>
            </div>
            <span>{formatDate(post.published_at)}</span>
            <div className="flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {post.reading_time_min}分で読める
            </div>
          </div>

          {/* ─── サムネイル ──────────────────────────── */}
          {post.thumbnail_url && (
            <div className="mb-8 md:mb-10 rounded-xl md:rounded-2xl overflow-hidden">
              <img
                src={post.thumbnail_url}
                alt={post.title}
                className="w-full h-auto"
                style={{ aspectRatio: "1200/630", objectFit: "cover" }}
              />
            </div>
          )}

          {/* ─── 本文 ──────────────────────────────── */}
          <div
            className="blog-body"
            dangerouslySetInnerHTML={{ __html: post.body }}
          />

          {/* ─── 記事末尾CTA ───────────────────────── */}
          <div className="mt-10 md:mt-14 bg-gradient-to-br from-[#0D0B21] to-[#1a1830] rounded-2xl md:rounded-3xl px-6 md:px-10 py-8 md:py-12 text-center">
            <div className="inline-flex items-center gap-2 border border-[#00c896]/40 bg-[#00c896]/10 text-[#00c896] text-xs font-semibold px-3 py-1.5 rounded-full mb-4 md:mb-5">
              完全無料・クレカ不要
            </div>
            <h2 className="text-white font-bold text-lg md:text-xl tracking-tight mb-3">
              この記事で学んだことを、実践しよう。
            </h2>
            <p className="text-white/60 text-sm mb-6 md:mb-7 max-w-sm mx-auto">
              CareoのAIコーチ「カレオ」が、あなたのES・面接・OB訪問データをすべて把握して、次の一手を教えてくれます。
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[#00c896] hover:bg-[#00a87e] text-white font-bold px-6 md:px-8 py-3 md:py-4 rounded-full text-sm transition-all hover:scale-105"
            >
              Careoを無料で始める
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </article>

        {/* ─── 関連記事 ─────────────────────────────── */}
        {related.length > 0 && (
          <section className="max-w-4xl mx-auto px-4 md:px-8 pb-16">
            <h2 className="font-bold text-[#0D0B21] text-lg mb-4 md:mb-5">関連記事</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={`/blog/${r.slug}`}
                  className="group bg-white rounded-xl md:rounded-2xl border border-gray-200 p-4 md:p-5 hover:border-[#00c896]/40 hover:shadow-md transition-all flex md:flex-col gap-3 md:gap-0"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap gap-1 mb-1.5 md:mb-2">
                      {r.tags.slice(0, 1).map((tag) => (
                        <span key={tag} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tagStyle(tag)}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs md:text-sm font-bold text-[#0D0B21] line-clamp-3 group-hover:text-[#00a87e] transition-colors leading-snug">
                      {r.title}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1.5 md:mt-2">{formatDate(r.published_at)}</p>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-7 md:mt-9">
              <Link href="/blog" className="text-sm font-semibold text-[#00a87e] hover:underline">
                記事一覧をすべて見る →
              </Link>
            </div>
          </section>
        )}
      </div>

      {/* ─── ブログ本文スタイル ──────────────────────── */}
      <style>{`
        /* ── モバイル基本（〜767px） ── */
        .blog-body h2 {
          font-size: 1.15rem;
          font-weight: 700;
          color: #0D0B21;
          margin-top: 2rem;
          margin-bottom: 0.875rem;
          padding-bottom: 0.4rem;
          border-bottom: 2px solid #00c896;
          letter-spacing: -0.01em;
          line-height: 1.5;
        }
        .blog-body h3 {
          font-size: 0.975rem;
          font-weight: 700;
          color: #0D0B21;
          margin-top: 1.75rem;
          margin-bottom: 0.625rem;
          line-height: 1.55;
        }
        .blog-body p {
          font-size: 0.9375rem;
          color: #374151;
          line-height: 1.95;
          margin-bottom: 1.125rem;
        }
        .blog-body ul, .blog-body ol {
          padding-left: 1.375rem;
          margin-bottom: 1.125rem;
        }
        .blog-body li {
          font-size: 0.9375rem;
          color: #374151;
          line-height: 1.85;
          margin-bottom: 0.35rem;
        }
        .blog-body ul li { list-style-type: disc; }
        .blog-body ol li { list-style-type: decimal; }
        .blog-body strong { color: #0D0B21; font-weight: 700; }
        .blog-body em { font-style: italic; color: #4B5563; }
        .blog-body blockquote {
          border-left: 3px solid #00c896;
          padding: 0.7rem 1rem;
          background: #f0fdf9;
          border-radius: 0 0.75rem 0.75rem 0;
          margin-bottom: 1.125rem;
          color: #1f6b59;
          font-size: 0.9rem;
        }
        .blog-body table {
          display: block;
          width: 100%;
          overflow-x: auto;
          -webkit-overflow-scrolling: touch;
          min-width: 400px;
          border-collapse: collapse;
          font-size: 0.8125rem;
          margin-bottom: 1.5rem;
        }
        .blog-body th {
          background: #0D0B21;
          color: white;
          font-weight: 700;
          padding: 0.55rem 0.75rem;
          text-align: left;
          font-size: 0.75rem;
          white-space: nowrap;
        }
        .blog-body td {
          padding: 0.55rem 0.75rem;
          border-bottom: 1px solid #e5e7eb;
          color: #374151;
          vertical-align: top;
          font-size: 0.8125rem;
        }
        .blog-body tr:nth-child(even) td { background: #f9fafb; }
        .blog-body tr:hover td { background: #f0fdf9; }
        .blog-stat-bar {
          background: #f9fafb;
          border-radius: 0.75rem;
          padding: 0.875rem 1rem;
          margin-bottom: 1.125rem;
        }
        .blog-stat-bar-item {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
        }
        .blog-stat-bar-label { font-size: 0.75rem; color: #374151; min-width: 90px; }
        .blog-stat-bar-track { flex: 1; background: #e5e7eb; border-radius: 9999px; height: 8px; overflow: hidden; }
        .blog-stat-bar-fill { height: 100%; background: linear-gradient(90deg, #00c896, #0ea5e9); border-radius: 9999px; }
        .blog-stat-bar-value { font-size: 0.75rem; font-weight: 700; color: #0D0B21; min-width: 36px; text-align: right; }
        .blog-cite { font-size: 0.8125rem; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 0.5rem; margin-top: 1rem; }
        .blog-cite a { color: #00a87e; text-decoration: underline; }
        .blog-cta-link {
          display: inline-flex;
          align-items: center;
          gap: 0.375rem;
          background: #00c896;
          color: white;
          font-weight: 700;
          padding: 0.5rem 1.25rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          text-decoration: none;
          transition: background 0.2s;
        }
        .blog-cta-link:hover { background: #00a87e; }

        /* ── デスクトップ（768px〜） ── */
        @media (min-width: 768px) {
          .blog-body h2 {
            font-size: 1.375rem;
            margin-top: 3rem;
            margin-bottom: 1.125rem;
            padding-bottom: 0.55rem;
          }
          .blog-body h3 {
            font-size: 1.1rem;
            margin-top: 2.25rem;
            margin-bottom: 0.75rem;
          }
          .blog-body p {
            font-size: 1rem;
            line-height: 2;
            margin-bottom: 1.375rem;
          }
          .blog-body ul, .blog-body ol {
            padding-left: 1.75rem;
            margin-bottom: 1.375rem;
          }
          .blog-body li {
            font-size: 1rem;
            line-height: 1.9;
            margin-bottom: 0.45rem;
          }
          .blog-body blockquote {
            padding: 0.875rem 1.5rem;
            font-size: 0.9375rem;
            margin-bottom: 1.375rem;
          }
          .blog-body table {
            min-width: unset;
            font-size: 0.9rem;
          }
          .blog-body th {
            padding: 0.65rem 1.125rem;
            font-size: 0.875rem;
            white-space: normal;
          }
          .blog-body td {
            padding: 0.65rem 1.125rem;
            font-size: 0.9rem;
          }
          .blog-stat-bar {
            padding: 1.125rem 1.5rem;
          }
          .blog-stat-bar-label { font-size: 0.875rem; min-width: 130px; }
          .blog-stat-bar-value { font-size: 0.875rem; min-width: 44px; }
        }
      `}</style>
    </>
  );
}
