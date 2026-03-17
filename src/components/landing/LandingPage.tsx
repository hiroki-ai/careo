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

const features = [
  { icon: "📋", title: "全部まとまる管理機能", desc: "ES締切・面接日程・企業研究・反省メモを一か所に。スプレッドシートもNotionも要らない。" },
  { icon: "🤖", title: "AIが就活のPDCAを回す", desc: "選考状況をもとにAIが毎週自動で振り返り。「今週何をすべきか」を迷わず動ける。" },
  { icon: "🎯", title: "内定予測AI", desc: "選考データをもとにAIが内定確率を予測。弱点を可視化して改善アクションを提案。" },
  { icon: "💬", title: "就活AIアシスタント", desc: "選考状況を把握したAIが相談相手に。ES添削・面接対策・業界分析をチャットで。" },
  { icon: "📊", title: "企業管理・AI研究", desc: "志望企業を一覧管理。AIが企業研究を自動生成。選考ステータスをリアルタイムで追跡。" },
  { icon: "🔗", title: "就活サービス連携ガイド", desc: "リクナビ・OfferBox・Wantedlyなど、適切なタイミングで使うべきサービスを提案。" },
];

const faqs = [
  { q: "リクナビ・マイナビとの違いは？", a: "リクナビ・マイナビは求人情報を探すサービス。Careoは応募後の選考管理とAI分析に特化しています。両方を使うのがベストです。" },
  { q: "無料で使えますか？", a: "完全無料です。メールアドレスだけで登録でき、すべての機能をすぐに使えます。" },
  { q: "スマホでも使えますか？", a: "iPhone・Android両対応です。ホーム画面に追加するとアプリのように使えます。" },
  { q: "AIは何をしてくれるの？", a: "ES生成・企業研究・週次PDCA分析・内定予測・就活チャット相談など、就活のあらゆる場面でAIコーチがサポートします。" },
  { q: "就活コーチとして何が違うの？", a: "CareoのAIはあなたの選考状況・ES・面接履歴をすべて把握した上でアドバイスします。一般的な就活サイトの情報とは違い、あなた専用のコーチとして機能します。" },
];

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

      {/* Features */}
      <section className="px-6 py-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3">Features</p>
            <h2 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              就活管理の<span className="text-[#00c896]">すべてが</span>、ここに
            </h2>
            <p className="text-gray-500 text-base max-w-xl mx-auto">マイナビ・リクナビは情報提供ツール。CareoはAIコーチが就活を一緒に動かしてくれるコックピット。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#00c896]/30 hover:shadow-lg hover:shadow-[#00c896]/5 transition-all duration-300 group"
              >
                <span className="text-3xl mb-4 block">{f.icon}</span>
                <h3 className="font-bold text-[#0a1628] text-base mb-2 group-hover:text-[#00c896] transition-colors">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
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

      {/* How it works */}
      <section className="px-6 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3">How it works</p>
          <h2 className="text-3xl md:text-5xl font-bold mb-16 tracking-tight">
            3ステップで<span className="text-[#00c896]">始められる</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "無料登録", desc: "メールアドレスだけで即日開始。クレジットカード不要。" },
              { step: "02", title: "企業・ESを登録", desc: "応募企業とESを追加するだけ。AIが自動で整理してくれる。" },
              { step: "03", title: "AIに任せる", desc: "週次PDCAをAIが自動分析。次の一手まで教えてくれる。" },
            ].map((item, i) => (
              <div key={item.step} className="relative text-center">
                <div className="w-14 h-14 bg-[#00c896]/10 border border-[#00c896]/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                  <span className="text-[#00c896] font-bold text-lg">{item.step}</span>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-7 left-[calc(50%+36px)] right-0 h-px bg-gradient-to-r from-[#00c896]/30 to-transparent" />
                )}
                <h3 className="font-bold text-[#0a1628] text-lg mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="px-6 py-24">
        <div className="max-w-3xl mx-auto">
          <div className="bg-gradient-to-br from-[#0a1628] to-[#1a2f4e] rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00c896]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10">
              <p className="text-[#00c896] text-xs font-bold tracking-widest uppercase mb-6">Our Story</p>
              <blockquote className="text-xl md:text-2xl font-bold leading-relaxed mb-8">
                「自分が就活を始めて、<br className="hidden md:block" />
                <span className="text-[#00c896]">欲しいツールがなかった。</span><br className="hidden md:block" />
                だから作った。」
              </blockquote>
              <p className="text-white/70 text-sm leading-relaxed mb-6">
                Careoは、就活を始めた大学生が「自分のために」作った就活管理アプリです。
                スプレッドシートで管理するのが嫌で、NotionもAIもうまく使えなくて、
                「全部まとめてAIが動かしてくれるツール」を自分で開発しました。
              </p>
              <p className="text-white/70 text-sm leading-relaxed">
                就活の当事者が、就活の当事者のために作っている。
                だから「本当に必要な機能」しか入れていません。
              </p>
              <div className="mt-8 pt-6 border-t border-white/10 flex items-center gap-3">
                <div className="w-8 h-8 bg-[#00c896]/20 rounded-full flex items-center justify-center">
                  <span className="text-[#00c896] text-sm font-bold">C</span>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">Careo 開発者</p>
                  <p className="text-white/40 text-xs">就活中の大学生・一人で開発</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-24 bg-gray-50/60">
        <div className="max-w-2xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 tracking-tight">よくある質問</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="bg-white border border-gray-100 rounded-2xl p-6 hover:border-[#00c896]/30 transition-colors">
                <p className="font-bold text-[#0a1628] text-sm mb-2">Q. {faq.q}</p>
                <p className="text-gray-500 text-sm leading-relaxed">A. {faq.a}</p>
              </div>
            ))}
          </div>
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
