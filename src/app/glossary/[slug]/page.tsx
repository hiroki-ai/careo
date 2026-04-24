import Link from "next/link";
import { notFound } from "next/navigation";
import { GLOSSARY, getTermBySlug } from "@/data/glossary";
import type { Metadata } from "next";

export function generateStaticParams() {
  return GLOSSARY.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const term = getTermBySlug(slug);
  if (!term) return { title: "用語が見つかりません | Careo" };
  return {
    title: `${term.term}とは？意味・使い方 | Careo 就活用語辞典`,
    description: `${term.short} ${term.long.slice(0, 80)}`,
    openGraph: {
      title: `${term.term}とは？`,
      description: term.short,
    },
  };
}

export default async function GlossaryDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const term = getTermBySlug(slug);
  if (!term) notFound();

  const related = term.related
    ?.map((s) => getTermBySlug(s))
    .filter((t): t is NonNullable<typeof t> => !!t) ?? [];

  return (
    <div className="min-h-screen font-zen-kaku py-8 md:py-12 px-4" style={{ background: "#fcfbf8", color: "#0D0B21" }}>
      <div className="max-w-2xl mx-auto">
        <Link href="/glossary" className="text-xs text-gray-400 hover:text-gray-600 inline-block mb-4">
          ← 用語辞典トップ
        </Link>

        <article className="bg-white rounded-3xl p-6 md:p-10" style={{ border: "1px solid rgba(13,11,33,0.06)" }}>
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#00c896]/10 text-[#00a87e] text-[11px] font-bold mb-3">
            {term.category}
          </div>
          <h1 className="font-klee text-3xl md:text-4xl font-bold mb-2 leading-tight">
            {term.term}
          </h1>
          {term.reading && <p className="text-sm text-gray-400 mb-4">{term.reading}</p>}

          <p className="text-base text-gray-900 bg-[#00c896]/5 border border-[#00c896]/20 rounded-2xl p-4 mb-6 leading-relaxed font-semibold">
            {term.short}
          </p>

          <h2 className="font-klee text-xl font-bold mb-2">詳しく</h2>
          <p className="text-sm text-gray-700 leading-[1.9] mb-6">{term.long}</p>

          {related.length > 0 && (
            <>
              <h2 className="font-klee text-xl font-bold mb-3">関連用語</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {related.map((r) => (
                  <Link
                    key={r.slug}
                    href={`/glossary/${r.slug}`}
                    className="bg-gray-50 hover:bg-[#00c896]/10 rounded-xl p-3 transition-colors"
                  >
                    <div className="text-sm font-bold text-gray-900">{r.term}</div>
                    <div className="text-xs text-gray-500 line-clamp-1">{r.short}</div>
                  </Link>
                ))}
              </div>
            </>
          )}
        </article>

        <div className="rounded-3xl p-6 text-center mt-6" style={{ background: "linear-gradient(135deg, #00c896, #00a87e)" }}>
          <h3 className="font-klee text-lg md:text-xl font-bold text-white mb-2">
            {term.term}を就活で使いこなすなら、Careo。
          </h3>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-[#00a87e] font-black px-6 py-3 rounded-xl text-sm shadow-xl"
          >
            無料で Careo を始める →
          </Link>
        </div>
      </div>
    </div>
  );
}
