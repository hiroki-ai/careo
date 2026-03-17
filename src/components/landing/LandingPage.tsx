"use client";

import Link from "next/link";
import Script from "next/script";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "name": "Careo",
      "url": "https://careo-sigma.vercel.app",
      "logo": { "@type": "ImageObject", "url": "https://careo-sigma.vercel.app/icon-new.svg" },
    },
    {
      "@type": "WebSite",
      "name": "Careo",
      "url": "https://careo-sigma.vercel.app",
      "publisher": { "@type": "Organization", "name": "Careo" },
    },
    {
      "@type": "WebApplication",
      "name": "Careo",
      "url": "https://careo-sigma.vercel.app",
      "description": "ES締切・面接日程・企業研究・反省メモをAIが整理。就活のPDCAを自動で回す、28卒向けAI就活コーチアプリ。",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web, iOS, Android",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "JPY" },
      "audience": { "@type": "Audience", "audienceType": "大学生・就活生（28卒）" },
      "featureList": ["ES管理", "面接ログ", "企業管理", "AIチャット", "PDCA自動分析", "内定予測"],
      "publisher": { "@type": "Organization", "name": "Careo" },
      "author": { "@type": "Organization", "name": "Careo" },
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "Careoとは何ですか？", "acceptedAnswer": { "@type": "Answer", "text": "CareoはAIを使った就活管理アプリです。ES締切・面接日程・企業研究・反省メモを一か所で管理でき、AIが就活のPDCAを自動で分析します。28卒向けに開発されています。" } },
        { "@type": "Question", "name": "リクナビ・マイナビとの違いは何ですか？", "acceptedAnswer": { "@type": "Answer", "text": "リクナビ・マイナビは求人情報を探すサービスです。Careoはすでに応募している企業の選考状況・ES・面接をAIで管理するツールです。両方を併用することを推奨しています。" } },
        { "@type": "Question", "name": "無料で使えますか？", "acceptedAnswer": { "@type": "Answer", "text": "はい、Careoは完全無料で使えます。メールアドレスで登録するだけで、全機能をすぐに利用できます。" } },
        { "@type": "Question", "name": "スマホでも使えますか？", "acceptedAnswer": { "@type": "Answer", "text": "はい、iPhoneでもAndroidでも使えます。ホーム画面に追加するとアプリのように使えます。" } },
      ],
    },
  ],
};


export function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col text-[#0a1628] overflow-x-hidden">
      <Script id="json-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <img src="/icon-new.svg" alt="Careo" className="w-8 h-8 rounded-xl" />
            <span className="font-bold text-lg tracking-tight text-[#0a1628]">Careo</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/features" className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors hidden sm:block">
              機能を見る
            </Link>
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors">
              ログイン
            </Link>
            <Link href="/signup" className="text-sm bg-[#00c896] hover:bg-[#00b586] text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-[#00c896]/25">
              無料で始める
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative text-center px-6 pt-24 pb-20">
        <div className="max-w-3xl mx-auto relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-[#00c896]/40 bg-[#00c896]/5 text-[#00a87e] text-xs font-semibold px-4 py-2 rounded-full mb-10 animate-fade-up">
            <span className="w-1.5 h-1.5 bg-[#00c896] rounded-full animate-pulse" />
            28卒向け・AI就活コーチ
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-[1.15] mb-6 animate-fade-up delay-100 tracking-tight">
            迷わず動ける、<br />
            <span className="text-[#00c896]">就活へ。</span>
          </h1>

          <p className="text-gray-500 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-up delay-200">
            CareoのAIはあなたの選考状況をすべて知っている。<br />
            だから「今週何をすべきか」が、いつでも明確になる。
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up delay-300">
            <Link href="/signup" className="inline-flex items-center justify-center gap-2 bg-[#00c896] hover:bg-[#00b586] text-white font-bold px-10 py-4 rounded-2xl text-base transition-colors shadow-xl shadow-[#00c896]/30">
              無料で始める
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link href="/login" className="inline-flex items-center justify-center text-gray-700 font-semibold px-10 py-4 rounded-2xl text-base border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all">
              ログインする
            </Link>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-12 mt-20 animate-fade-up delay-400 border-t border-gray-100 pt-10">
            {[
              { value: "6+", label: "AI機能" },
              { value: "無料", label: "完全無料" },
              { value: "28卒", label: "向け特化" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-[#0a1628]">{s.value}</p>
                <p className="text-gray-400 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before / After */}
      <section className="px-6 py-20 bg-gray-50/60">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">Before / After</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 tracking-tight">
            Careoを使うと、<span className="text-[#00c896]">何が変わる？</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-5">😮‍💨 使う前</p>
              <ul className="space-y-4">
                {[
                  "スプレッドシートで企業を管理。どこに何を書いたか分からなくなる",
                  "締切を見落として焦る。カレンダーとNotionを行き来",
                  "面接が終わっても何が悪かったか分からないまま",
                  "「今週何をすればいいか」が毎週ゼロから考え直し",
                  "ES下書きを何度も書き直す。自己PRを毎回コピペ修正",
                ].map((t) => (
                  <li key={t} className="flex gap-3 text-sm text-gray-500">
                    <span className="text-red-400 shrink-0 mt-0.5">✕</span>{t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gradient-to-br from-[#00c896]/5 to-emerald-50 border border-[#00c896]/20 rounded-2xl p-6">
              <p className="text-xs font-bold text-[#00a87e] uppercase tracking-wider mb-5">✨ Careoを使った後</p>
              <ul className="space-y-4">
                {[
                  "企業・ES・面接・締切がすべて一か所。いつでも全体像が見える",
                  "締切3日前に自動通知。見落としゼロ",
                  "面接後にメモを残せば、AIが通過率と改善点を分析",
                  "毎週「今週やること」をAIが自動提案。迷わず動ける",
                  "自己分析を一度入力すればAIが毎回ES文章を生成",
                ].map((t) => (
                  <li key={t} className="flex gap-3 text-sm text-[#0a1628]">
                    <span className="text-[#00c896] shrink-0 mt-0.5 font-bold">✓</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="px-6 py-24 bg-gray-50/60">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">Why Careo</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 tracking-tight">
            他のサービスと<span className="text-[#00c896]">何が違うの？</span>
          </h2>
          <p className="text-gray-500 text-center text-sm mb-12">全部使うのがベスト。Careoは「管理とコーチング」に特化しています。</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left pb-4 text-gray-400 font-medium w-1/3"></th>
                  <th className="pb-4 text-center">
                    <span className="bg-[#00c896] text-white text-xs font-bold px-3 py-1.5 rounded-lg">Careo</span>
                  </th>
                  <th className="pb-4 text-center text-gray-400 font-medium text-xs">リクナビ<br/>マイナビ</th>
                  <th className="pb-4 text-center text-gray-400 font-medium text-xs">Notion<br/>スプレッド</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { label: "求人情報を探す", careo: false, riku: true, notion: false },
                  { label: "選考進捗を一元管理", careo: true, riku: false, notion: "△" },
                  { label: "ES下書きをAIが生成", careo: true, riku: false, notion: false },
                  { label: "面接ログ・通過率分析", careo: true, riku: false, notion: "△" },
                  { label: "週次PDCAをAIが自動分析", careo: true, riku: false, notion: false },
                  { label: "あなたの状況を知るAIコーチ", careo: true, riku: false, notion: false },
                  { label: "締切アラート通知", careo: true, riku: "△", notion: false },
                ].map((row) => (
                  <tr key={row.label}>
                    <td className="py-3.5 text-gray-700 font-medium">{row.label}</td>
                    <td className="py-3.5 text-center">
                      {row.careo === true ? <span className="text-[#00c896] font-bold text-base">✓</span> : row.careo === false ? <span className="text-gray-200 text-base">✕</span> : <span className="text-gray-400 text-xs">{row.careo}</span>}
                    </td>
                    <td className="py-3.5 text-center">
                      {row.riku === true ? <span className="text-gray-400 text-base">✓</span> : row.riku === false ? <span className="text-gray-200 text-base">✕</span> : <span className="text-gray-400 text-xs">{row.riku}</span>}
                    </td>
                    <td className="py-3.5 text-center">
                      {row.notion === true ? <span className="text-gray-400 text-base">✓</span> : row.notion === false ? <span className="text-gray-200 text-base">✕</span> : <span className="text-gray-400 text-xs">{row.notion}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">※ リクナビ・マイナビとCareoは競合ではなく補完関係です。併用を推奨しています。</p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 md:py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-teal-50/40 to-emerald-50/60 pointer-events-none" />
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
            就活、<span className="text-[#00c896]">AIと一緒に</span>始めよう
          </h2>
          <p className="text-gray-500 text-base mb-10">無料で使えます。登録はメールアドレスだけ。</p>
          <Link href="/signup" className="inline-flex items-center gap-2 bg-[#00c896] hover:bg-[#00b586] text-white font-bold px-12 py-4 rounded-2xl text-base transition-colors shadow-xl shadow-[#00c896]/30">
            無料で始める
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Support */}
      <section className="px-6 py-10 border-t border-gray-100 text-center">
        <p className="text-sm text-gray-500 font-medium mb-1">☕ 開発を応援する</p>
        <p className="text-xs text-gray-400 mb-4">28卒の学生が一人で作っています。コーヒー1杯分の支援が開発の励みになります。</p>
        <a
          href="https://buymeacoffee.com/careo"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-700 font-bold px-6 py-2.5 rounded-xl transition-colors text-sm"
        >
          ☕ Buy me a coffee
        </a>
      </section>

      {/* Footer */}
      <footer className="px-6 py-6 text-center text-xs text-gray-400 border-t border-gray-100">
        © 2025 Careo — 就活管理AIアプリ
      </footer>
    </div>
  );
}
