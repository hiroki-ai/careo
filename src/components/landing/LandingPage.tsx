"use client";

import Link from "next/link";
import Script from "next/script";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "name": "Careo",
      "url": "https://careo-sigma.vercel.app",
      "description": "ES締切・面接日程・企業研究・反省メモをAIが整理。就活のPDCAを自動で回す、28卒向け就活管理アプリ。",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web, iOS, Android",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "JPY" },
      "audience": { "@type": "Audience", "audienceType": "大学生・就活生（28卒）" },
      "featureList": ["ES管理", "面接ログ", "企業管理", "AIチャット", "PDCA自動分析", "内定予測"],
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Careoとは何ですか？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "CareoはAIを使った就活管理アプリです。ES締切・面接日程・企業研究・反省メモを一か所で管理でき、AIが就活のPDCAを自動で分析します。28卒向けに開発されています。",
          },
        },
        {
          "@type": "Question",
          "name": "リクナビ・マイナビとの違いは何ですか？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "リクナビ・マイナビは求人情報を探すサービスです。Careoはすでに応募している企業の選考状況・ES・面接をAIで管理するツールです。両方を併用することを推奨しています。",
          },
        },
        {
          "@type": "Question",
          "name": "無料で使えますか？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "はい、Careoは完全無料で使えます。メールアドレスで登録するだけで、全機能をすぐに利用できます。",
          },
        },
        {
          "@type": "Question",
          "name": "スマホでも使えますか？",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "はい、iPhoneでもAndroidでも使えます。ホーム画面に追加するとアプリのように使えます。",
          },
        },
      ],
    },
  ],
};

const faqs = [
  {
    q: "リクナビ・マイナビとの違いは？",
    a: "リクナビ・マイナビは求人情報を探すサービス。Careoは応募後の選考管理とAI分析に特化しています。両方を使うのがベストです。",
  },
  {
    q: "無料で使えますか？",
    a: "完全無料です。メールアドレスだけで登録でき、すべての機能をすぐに使えます。",
  },
  {
    q: "スマホでも使えますか？",
    a: "iPhone・Android両対応です。ホーム画面に追加するとアプリのように使えます。",
  },
  {
    q: "AIは何をしてくれるの？",
    a: "ES生成・企業研究・週次PDCA分析・内定予測・就活チャット相談など、就活のあらゆる場面でAIがサポートします。",
  },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Script
        id="json-ld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <img src="/icon-new.svg" alt="Careo" className="w-7 h-7 rounded-lg" />
          <span className="font-bold text-lg text-gray-900">Careo</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 font-medium">
            ログイン
          </Link>
          <Link href="/signup" className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
            無料で始める
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 bg-gradient-to-b from-[#1a2f4e] to-[#1e3a5f]">
        <span className="inline-block bg-blue-400/20 text-blue-200 text-xs font-semibold px-3 py-1 rounded-full mb-6 border border-blue-400/30">
          28卒が使いながら開発中 🚀
        </span>
        <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
          28卒の就活は、<br />AIと始める。
        </h1>
        <p className="text-blue-200 text-lg md:text-xl mb-8 max-w-lg leading-relaxed">
          就活の管理、もうNotionでやらなくていい。<br />
          締切・面接・反省・企業研究——AIが整理して、<br className="hidden md:block" />
          次の一手まで教えてくれる。
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link href="/signup" className="bg-blue-500 hover:bg-blue-400 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-base">
            無料で始める
          </Link>
          <Link href="/login" className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3 rounded-xl transition-colors text-base border border-white/20">
            ログインする
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-3">
            就活管理のすべてが、ここに
          </h2>
          <p className="text-gray-500 text-center mb-12 text-sm">マイナビ・リクナビは情報提供ツール。CareoはAIが動かしてくれる就活コックピット。</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-2">全部まとまる管理機能</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                ES締切・面接日程・企業研究・反省メモを一か所に。スプレッドシートもNotionも要らない。
              </p>
            </div>
            {/* Feature 2 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-2">AIが就活のPDCAを回す</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                選考状況をもとにAIが毎週自動で振り返り。「今週何をすべきか」を迷わず動ける。
              </p>
            </div>
            {/* Feature 3 */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-2">28卒が使いながら作ってる</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                同じ就活生の視点で毎日アップデート。マイナビにはない、現場目線の機能が揃ってる。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 bg-white border-t border-gray-100">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">よくある質問</h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <div key={faq.q} className="border border-gray-100 rounded-xl p-5">
                <p className="font-semibold text-gray-900 text-sm mb-2">Q. {faq.q}</p>
                <p className="text-gray-500 text-sm leading-relaxed">A. {faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16 text-center bg-gray-50 border-t border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">就活、AIと一緒に始めよう</h2>
        <p className="text-gray-500 text-sm mb-8">無料で使えます。登録はメールアドレスだけ。</p>
        <Link href="/signup" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-10 py-3 rounded-xl transition-colors">
          無料で始める
        </Link>
      </section>

      {/* Support */}
      <section className="px-6 py-10 text-center bg-amber-50 border-t border-amber-100">
        <p className="text-sm text-amber-800 font-medium mb-1">☕ 開発を応援する</p>
        <p className="text-xs text-amber-600 mb-4">28卒の学生が一人で作っています。コーヒー1杯分の支援が開発の励みになります。</p>
        <a
          href="https://buymeacoffee.com/careo"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-500 text-amber-900 font-bold px-6 py-2.5 rounded-xl transition-colors text-sm"
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
