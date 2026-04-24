import Link from "next/link";
import type { Metadata } from "next";
import { GLOSSARY } from "@/data/glossary";

export const metadata: Metadata = {
  title: "就活用語辞典 | Careo - 28卒・29卒の就活生のための用語集",
  description: "ガクチカ・ES・OB訪問・ケース面接など、就活でよく使われる用語を分かりやすく解説。新しい用語が出てくるたびに追加しています。",
  openGraph: {
    title: "就活用語辞典 | Careo",
    description: "就活でよく使う用語を30項目以上解説。毎月更新。",
  },
};

const CATEGORIES = ["基本", "選考", "ES", "面接", "業界", "インターン", "その他"] as const;

export default function GlossaryIndex() {
  return (
    <div className="min-h-screen font-zen-kaku py-8 md:py-12 px-4" style={{ background: "#fcfbf8", color: "#0D0B21" }}>
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 inline-block mb-4">
          ← Careoトップ
        </Link>

        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#00c896]/12 text-[#00a87e] text-xs font-bold mb-3">
            就活用語 {GLOSSARY.length}語収録
          </div>
          <h1 className="font-klee text-3xl md:text-5xl font-bold leading-tight mb-3">
            就活用語辞典
          </h1>
          <p className="text-sm md:text-base text-gray-600 leading-relaxed max-w-2xl">
            ガクチカ・ES・ケース面接・早期選考など、就活でよく聞く用語を分かりやすく解説。毎月新しい用語を追加。
          </p>
        </div>

        {CATEGORIES.map((cat) => {
          const items = GLOSSARY.filter((t) => t.category === cat);
          if (items.length === 0) return null;
          return (
            <section key={cat} className="mb-8">
              <h2 className="font-klee text-xl font-bold mb-3 flex items-center gap-2">
                <span className="w-1 h-6 rounded-full" style={{ background: "linear-gradient(180deg, #00c896, #00a87e)" }} />
                {cat}（{items.length}語）
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {items.map((t) => (
                  <Link
                    key={t.slug}
                    href={`/glossary/${t.slug}`}
                    className="group bg-white border border-gray-100 rounded-2xl p-4 hover:border-[#00c896]/40 hover:shadow-md transition-all"
                  >
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-base font-bold text-gray-900 group-hover:text-[#00a87e] transition-colors">{t.term}</span>
                      {t.reading && <span className="text-[10px] text-gray-400">{t.reading}</span>}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">{t.short}</p>
                  </Link>
                ))}
              </div>
            </section>
          );
        })}

        {/* CTA */}
        <div className="rounded-3xl p-6 md:p-8 text-center mt-10" style={{ background: "linear-gradient(135deg, #00c896, #00a87e)" }}>
          <h3 className="font-klee text-xl md:text-2xl font-bold text-white mb-2">
            用語を覚えたら、実践へ。
          </h3>
          <p className="text-white/85 text-xs md:text-sm mb-5">
            Careoなら企業管理・ES・面接・KPIまで全部ひとつに。
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-[#00a87e] font-black px-7 py-3.5 rounded-xl text-[15px] shadow-xl"
          >
            無料で Careo を始める →
          </Link>
        </div>
      </div>
    </div>
  );
}
