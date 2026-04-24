import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { UNIVERSITY_LPS, getUniversityLp } from "@/data/universities-lp";
import { CareoKun } from "@/components/landing/CareoKun";

export function generateStaticParams() {
  return UNIVERSITY_LPS.map((u) => ({ university: u.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ university: string }> }): Promise<Metadata> {
  const { university } = await params;
  const u = getUniversityLp(university);
  if (!u) return { title: "大学ページが見つかりません | Careo" };
  return {
    title: `${u.name}の就活管理 | Careo - ${u.shortName}生のための就活アプリ`,
    description: `${u.name}の就活生のためのCareo活用ガイド。${u.strongIndustries.join("・")}業界の選考管理・ES管理・面接ログを一元化、内定までを加速。`,
    openGraph: {
      title: `${u.name}の就活を、Careoで`,
      description: `${u.shortName}生が直面する${u.challenges[0]}を解決する就活管理アプリ。`,
    },
  };
}

export default async function UniversityLP({ params }: { params: Promise<{ university: string }> }) {
  const { university } = await params;
  const u = getUniversityLp(university);
  if (!u) notFound();

  return (
    <div className="min-h-screen font-zen-kaku" style={{ background: "#fcfbf8", color: "#0D0B21" }}>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-10 pb-12 md:px-5 md:pt-16 md:pb-16">
        <div className="absolute pointer-events-none" style={{ top: 40, right: -60, width: 300, height: 300, background: "radial-gradient(circle, rgba(0,200,150,0.22), transparent 65%)", filter: "blur(40px)" }} />
        <div className="absolute pointer-events-none" style={{ bottom: 0, left: -80, width: 280, height: 280, background: "radial-gradient(circle, rgba(255,200,100,0.2), transparent 65%)", filter: "blur(40px)" }} />
        <div className="relative max-w-3xl mx-auto">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 inline-block mb-4">
            ← Careoトップ
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#00c896]/30 text-[#00a87e] text-xs font-bold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00c896]" />
            {u.shortName}生のためのページ
          </div>
          <h1 className="font-klee text-3xl md:text-5xl font-bold leading-tight mb-4">
            {u.name}の就活を、<br />
            <span style={{ color: "#00a87e" }}>データで加速</span>。
          </h1>
          <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-6 max-w-2xl">
            {u.typicalPath}
          </p>
          <div className="flex flex-wrap gap-2.5 mb-6">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 font-bold px-7 py-3.5 rounded-xl text-white text-[15px]"
              style={{ background: "linear-gradient(135deg, #00c896, #00a87e)", boxShadow: "0 8px 24px rgba(0,200,150,0.35)" }}
            >
              無料ではじめる →
            </Link>
            <Link
              href="/diagnosis"
              className="inline-flex items-center gap-2 font-bold px-6 py-3.5 rounded-xl text-[14px] text-[#0D0B21] bg-white border border-gray-200"
            >
              3分で就活タイプ診断 →
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <span>✓ 学生は完全無料</span>
            <span>✓ 登録30秒</span>
            <span>✓ 大学メール不要</span>
          </div>
        </div>
      </section>

      {/* 強み業界 */}
      <section className="px-4 md:px-5 py-10 md:py-14" style={{ background: "#f5f3ee" }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="font-klee text-2xl md:text-3xl font-bold mb-5">
            {u.shortName}生が強い業界
          </h2>
          <div className="flex flex-wrap gap-2 mb-5">
            {u.strongIndustries.map((i) => (
              <span key={i} className="text-sm font-semibold px-4 py-2 rounded-full bg-white border border-[#00c896]/30 text-[#00a87e]">
                {i}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            Careo なら業界別勝率を自動計算。{u.shortName}生としてどの業界で通りやすいか、自分のデータから客観視できる。
          </p>
        </div>
      </section>

      {/* 課題 */}
      <section className="px-4 md:px-5 py-10 md:py-14">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-klee text-2xl md:text-3xl font-bold mb-5">
            {u.shortName}生が直面する<br className="sm:hidden" />3つの壁
          </h2>
          <div className="space-y-3">
            {u.challenges.map((c, i) => (
              <div key={c} className="flex items-start gap-3 bg-white border border-gray-100 rounded-2xl p-4">
                <div className="shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">{i + 1}</div>
                <p className="text-sm text-gray-800 leading-relaxed">{c}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Careoで解決 */}
      <section className="px-4 md:px-5 py-10 md:py-14" style={{ background: "#f5f3ee" }}>
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <CareoKun size={96} mood="cheer" />
          </div>
          <h2 className="font-klee text-2xl md:text-3xl font-bold mb-5 text-center">
            Careo なら、こう解決できる
          </h2>
          <div className="space-y-3">
            {u.careoTips.map((t, i) => (
              <div key={t} className="flex items-start gap-3 bg-white border border-[#00c896]/20 rounded-2xl p-4">
                <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ background: "linear-gradient(135deg, #00c896, #00a87e)" }}>{i + 1}</div>
                <p className="text-sm text-gray-800 leading-relaxed">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 md:px-5 py-14">
        <div className="max-w-3xl mx-auto rounded-3xl p-8 md:p-12 text-center" style={{ background: "linear-gradient(135deg, #00c896, #00a87e)" }}>
          <h2 className="font-klee text-2xl md:text-3xl font-bold text-white mb-3">
            {u.shortName}から、<br />内定までを一気に駆け抜けよう
          </h2>
          <p className="text-white/85 text-sm mb-6 max-w-lg mx-auto">
            登録は30秒。{u.shortName}生として必要な全機能が無料で使える。
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-white text-[#00a87e] font-black px-8 py-4 rounded-xl text-base shadow-xl"
          >
            無料で Careo を始める →
          </Link>
        </div>
      </section>

      {/* 他大学リンク */}
      <section className="px-4 md:px-5 py-10">
        <div className="max-w-3xl mx-auto">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">他大学のページ</p>
          <div className="flex flex-wrap gap-2">
            {UNIVERSITY_LPS.filter((x) => x.slug !== u.slug).map((o) => (
              <Link key={o.slug} href={`/for/${o.slug}`} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-600 hover:border-[#00c896]/40 hover:text-[#00a87e] transition-colors">
                {o.shortName}生向け →
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
