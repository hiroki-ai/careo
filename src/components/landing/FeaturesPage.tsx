"use client";

import Link from "next/link";

const features = [
  { icon: "📋", title: "就活データを一元管理", desc: "企業・ES・面接ログ・OB/OG訪問・筆記試験・締切をすべて一か所に。スプレッドシートもNotionも要らない。" },
  { icon: "📊", title: "AIが就活のPDCAを回す", desc: "毎週AIが選考データ全体を分析し、スコアと改善アクションを自動生成。「今週何をすべきか」が即わかる。" },
  { icon: "🎯", title: "Next Action AIアドバイス", desc: "あなたの進捗・自己分析・就活フェーズをAIが把握し、今週やるべき具体的なアクションを3〜5個提案。" },
  { icon: "💬", title: "AIコーチ「カレオ」", desc: "あなたの全データを把握したAIコーチが相談相手に。面接対策・悩み相談・自己分析の言語化をチャットで。" },
  { icon: "🗓️", title: "締切カレンダー", desc: "ES締切・面接予定が自動でカレンダーに表示。締切3日前にブラウザ通知。見落としゼロ。" },
  { icon: "📝", title: "選考パイプライン管理", desc: "WISHLIST→応募→書類→面接→内定まで選考ステータスをリアルタイムで追跡。全体像が常に見える。" },
];

const faqs = [
  { q: "リクナビ・マイナビとの違いは？", a: "リクナビ・マイナビは求人情報を探すサービス。Careoは応募後の選考管理とAIコーチングに特化しています。両方を使うのがベストです。" },
  { q: "無料で使えますか？", a: "完全無料です。メールアドレスだけで登録でき、すべての機能をすぐに使えます。" },
  { q: "スマホでも使えますか？", a: "iPhone・Android両対応です。ホーム画面に追加するとアプリのように使えます。" },
  { q: "AIは何をしてくれるの？", a: "週次PDCA分析・Next Actionアドバイス・AIコーチとのチャット相談をサポートします。あなたの全データを把握した上でアドバイスするので、汎用的な就活サイトとは違う個別対応ができます。" },
  { q: "就活コーチとして何が違うの？", a: "CareoのAIはあなたの選考状況・ES・面接履歴・OB訪問・筆記試験すべてを把握した上でアドバイスします。一般的な就活情報ではなく、あなた専用のコーチとして機能します。" },
  { q: "他の就活サービスと併用できますか？", a: "もちろんです。リクナビ・マイナビ・OfferBoxなどで企業を探し、応募したらCareoで記録・管理する使い方がベストです。" },
];

export function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col text-[#0a1628] overflow-x-hidden">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/icon-new.svg" alt="Careo" className="w-8 h-8 rounded-xl" />
            <span className="font-bold text-lg tracking-tight text-[#0a1628]">Careo</span>
          </Link>
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

      {/* Page Hero */}
      <section className="text-center px-6 pt-32 pb-16">
        <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3">Features</p>
        <h1 className="text-4xl md:text-6xl font-bold leading-[1.15] mb-5 tracking-tight">
          就活管理の<span className="text-[#00c896]">すべてが</span>、ここに
        </h1>
        <p className="text-gray-500 text-base md:text-lg max-w-xl mx-auto leading-relaxed">
          マイナビ・リクナビは求人を探すツール。<br className="hidden md:block" />
          Careoは応募後の就活データを管理し、AIが毎週PDCAを回してくれるコックピット。
        </p>
      </section>

      {/* Features Grid */}
      <section className="px-6 pb-24">
        <div className="max-w-6xl mx-auto">
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

      {/* How it works */}
      <section className="px-6 py-24 bg-gray-50/60">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3">How it works</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-16 tracking-tight">
            3ステップで<span className="text-[#00c896]">始められる</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "無料登録", desc: "メールアドレスだけで即日開始。クレジットカード不要。" },
              { step: "02", title: "就活データを記録", desc: "企業・ES・面接・OB訪問・筆記試験を記録するだけ。スプレッドシート代わりに使える。" },
              { step: "03", title: "AIがPDCAを回す", desc: "週次PDCAをAIが自動分析。「今週何をすべきか」まで教えてくれる。" },
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
              <p className="text-white/70 text-sm leading-relaxed mb-4">
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

      {/* Footer */}
      <footer className="px-6 py-6 text-center text-xs text-gray-400 border-t border-gray-100">
        © 2025 Careo — 就活管理AIアプリ
        <Link href="/" className="text-[#00c896] hover:underline ml-2">トップに戻る</Link>
      </footer>
    </div>
  );
}
