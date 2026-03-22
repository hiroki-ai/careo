"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Script from "next/script";

const DEFAULT_BADGE = "28卒向け・AI就活コーチ「カレオ」";
const DEFAULT_HERO_SUBTEXT = "企業・ES・面接・OB訪問・筆記試験をすべて一か所に。\nAIコーチ「カレオ」が全データを把握し、点と点を繋ぐ気づきを届ける。";
const DEFAULT_AFTER_ITEMS = [
  "企業・ES・面接・OB訪問・筆記試験がすべて一か所。全体像が常に見える",
  "締切3日前に自動通知。見落としゼロ",
  "毎週AIがPDCAを自動分析。「今週何をすべきか」が即わかる",
  "ES提出前にAIが自己分析との整合性・文体・具体性を一括チェック",
  "面接・OB訪問・ESを横断した「点と点を繋ぐ気づき」をカレオが自動通知",
];

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
      "description": "ES締切・面接日程・企業研究・OB訪問・筆記試験をAIが横断分析。就活のPDCAを自動で回す、28卒向けAI就活コーチアプリ。",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web, iOS, Android",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "JPY" },
      "audience": { "@type": "Audience", "audienceType": "大学生・就活生（28卒）" },
      "featureList": [
        "ES管理・AI提出前チェック", "面接ログ", "企業管理", "AIチャット（カレオコーチ）",
        "PDCA自動分析", "内定予測", "OB/OG訪問管理", "筆記試験管理",
        "クロスデータ気づき通知", "進捗ベンチマーク", "キャリアセンターレポート出力",
        "就活仲間グループ機能", "自己分析充実度トラッキング",
      ],
      "publisher": { "@type": "Organization", "name": "Careo" },
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "Careoとは何ですか？", "acceptedAnswer": { "@type": "Answer", "text": "CareoはAIを使った就活管理アプリです。ES締切・面接日程・企業研究・OB訪問・筆記試験を一か所で管理でき、AIが就活のPDCAを自動で分析します。他のツールにない「データを横断した気づき通知」が特徴です。28卒向けに開発されています。" } },
        { "@type": "Question", "name": "BaseMeやSmartESと何が違いますか？", "acceptedAnswer": { "@type": "Answer", "text": "BaseMe・SmartESは特定機能（スカウト・ES生成）に特化したサービスです。CareoはES・面接・OB訪問・企業管理・筆記試験のすべてのデータを把握したAIコーチが、データを横断した気づきを提供します。「点解決」ではなく「就活OSとして全体を管理・コーチング」するのがCareoの役割です。" } },
        { "@type": "Question", "name": "無料で使えますか？", "acceptedAnswer": { "@type": "Answer", "text": "はい、Careoは基本機能を無料で使えます。Pro版（¥980/月）ではES提出前AIチェック・キャリアセンターレポート出力など高度な機能が利用できます。" } },
        { "@type": "Question", "name": "スマホでも使えますか？", "acceptedAnswer": { "@type": "Answer", "text": "はい、iPhoneでもAndroidでも使えます。ホーム画面に追加するとアプリのように使えます。" } },
      ],
    },
  ],
};


const faqItems = [
  {
    q: "Careoは完全無料ですか？",
    a: "はい、現在は全機能を完全無料でご利用いただけます。企業管理・ES管理・面接ログ・OB訪問・筆記試験管理・AIコーチング・気づき通知など、すべての機能が無料です。",
  },
  {
    q: "スマホでも使えますか？",
    a: "はい、iPhoneでもAndroidでもブラウザから利用できます。ホーム画面に追加するとアプリのように使えます（PWA対応）。",
  },
  {
    q: "BaseMeやSmartESと何が違いますか？",
    a: "BaseMe・SmartESは特定機能（スカウト・ES生成）に特化しています。Careoは「ES・面接・OB訪問・企業管理を全部知ったAIコーチ」が特徴。データを横断した気づきを自動通知するのはCareoだけです。",
  },
  {
    q: "登録にクレジットカードは必要ですか？",
    a: "不要です。メールアドレスとパスワードだけで登録できます。広告メールやスカウト電話も一切ありません。",
  },
  {
    q: "データはどこに保存されますか？",
    a: "Supabase（PostgreSQL）を使ったセキュアなクラウドデータベースに保存されます。行レベルセキュリティ（RLS）により、自分のデータには自分だけがアクセスできます。",
  },
  {
    q: "28卒以外でも使えますか？",
    a: "はい、29卒・30卒の方もご利用いただけます。登録時に卒業予定年度を設定すると、その年度に合わせたAIコーチングが受けられます。",
  },
];

export function LandingPage() {
  const [badgeText, setBadgeText] = useState(DEFAULT_BADGE);
  const [heroSubtext, setHeroSubtext] = useState(DEFAULT_HERO_SUBTEXT);
  const [afterItems, setAfterItems] = useState<string[]>(DEFAULT_AFTER_ITEMS);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    fetch("/api/lp-settings")
      .then((r) => r.json())
      .then((s: Record<string, string>) => {
        if (s.badge_text) setBadgeText(s.badge_text);
        if (s.hero_subtext) setHeroSubtext(s.hero_subtext.replace(/\\n/g, "\n"));
        if (s.after_items) {
          try {
            const parsed = JSON.parse(s.after_items);
            if (Array.isArray(parsed)) setAfterItems(parsed);
          } catch { /* デフォルト維持 */ }
        }
      })
      .catch(() => { /* デフォルト維持 */ });
  }, []);

  // スクロールアニメーション
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.12 }
    );
    const els = document.querySelectorAll(".reveal");
    els.forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col text-[#0D0B21] overflow-x-hidden">
      <Script id="json-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <img src="/icon-new.svg" alt="Careo" className="w-8 h-8 rounded-xl" />
            <span className="font-bold text-lg tracking-tight text-[#0D0B21]">Careo</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors hidden sm:block">
              ログイン
            </Link>
            <Link href="/signup" className="text-sm bg-[#00c896] hover:bg-[#00b586] text-white px-5 py-2.5 rounded-xl font-bold transition-colors shadow-lg shadow-[#00c896]/25">
              無料で始める
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="text-center px-6 pt-28 pb-20 bg-white">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 border border-[#00c896]/40 bg-[#00c896]/5 text-[#00a87e] text-xs font-semibold px-4 py-2 rounded-full mb-10">
            <span className="w-1.5 h-1.5 bg-[#00c896] rounded-full animate-pulse" />
            {badgeText}
          </div>

          <h1 className="text-5xl md:text-7xl font-bold leading-[1.15] mb-6 tracking-tight text-[#0D0B21]">
            迷わず動ける、<br />
            <span className="text-[#00c896]">就活へ。</span>
          </h1>

          <p className="text-gray-500 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
            {heroSubtext.split("\n").map((line, i, arr) => (
              <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
            ))}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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

          <div className="flex items-center justify-center gap-12 mt-20 border-t border-gray-100 pt-10">
            {[
              { value: "7機能", label: "就活データを一元管理" },
              { value: "完全無料", label: "全機能を無料で使える" },
              { value: "28卒", label: "向け特化" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl md:text-4xl font-bold text-[#0D0B21]">{s.value}</p>
                <p className="text-gray-400 text-sm mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 核心差別化: Careoだけが持つ「縦串」*/}
      <section className="px-6 py-20 bg-[#0D0B21] text-white relative overflow-hidden">
        {/* Ambient animations for dark section */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-[#00c896]/6 blur-3xl animate-blob delay-500" />
          <div className="absolute bottom-0 left-0 w-[320px] h-[320px] rounded-full bg-purple-600/5 blur-3xl animate-blob delay-1000" />
        </div>
        <div className="max-w-4xl mx-auto relative z-10">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">The Careo Difference</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 tracking-tight">
            就活AIは「点」で解決する。<br />
            <span className="text-[#00c896]">Careoは「全体」をコーチングする。</span>
          </h2>
          <p className="text-gray-400 text-center text-sm mb-12 max-w-2xl mx-auto">
            SmartESはES生成のみ。REALMEは面接練習のみ。BaseMeはスカウトのみ。<br />
            どこにも「ES・面接・OB訪問・企業管理を全部知った上でアドバイスするAI」はなかった。
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {[
              {
                icon: "🔮",
                title: "点と点を繋ぐ気づき",
                desc: "「A社のESで強調した○○と、B社面接での詰められポイントが一致している」— データを横断した洞察をカレオが自動通知",
                tag: "インサイト通知",
              },
              {
                icon: "📋",
                title: "ES提出前AIチェック",
                desc: "自己分析との整合性・AIっぽい文体・過去ESとの重複・企業固有の志望理由を提出前に一括確認",
                tag: "Pro機能",
              },
              {
                icon: "📈",
                title: "進捗ベンチマーク",
                desc: "「同じ時期のCareoユーザー平均応募数は12社。あなたは3社」— 匿名統計でリアルな進み具合を可視化",
                tag: "ネットワーク効果",
              },
            ].map((item) => (
              <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <span className="text-[10px] bg-[#00c896]/20 text-[#00c896] font-bold px-2 py-0.5 rounded-full">{item.tag}</span>
                    <h3 className="font-bold text-white mt-1">{item.title}</h3>
                  </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                icon: "🎓",
                title: "キャリアセンターレポート出力",
                desc: "就活の全データを1枚のPDFにまとめ、大学のキャリアセンターに持参できる（Pro機能）。大学側との連携をCareoが架け橋に。",
                tag: "大学連携",
              },
              {
                icon: "👥",
                title: "友達と就活グループ",
                desc: "就活仲間とグループを作り、お互いの進捗（応募数・面接数・PDCA スコア）を匿名で共有。ライバルと刺激し合える。",
                tag: "コミュニティ",
              },
            ].map((item) => (
              <div key={item.title} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <span className="text-[10px] bg-[#00c896]/20 text-[#00c896] font-bold px-2 py-0.5 rounded-full">{item.tag}</span>
                    <h3 className="font-bold text-white mt-1">{item.title}</h3>
                  </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
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
                  "ES提出前に自己分析と合っているか確認する方法がない",
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
                {afterItems.map((t) => (
                  <li key={t} className="flex gap-3 text-sm text-[#0D0B21]">
                    <span className="text-[#00c896] shrink-0 mt-0.5 font-bold">✓</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 競合比較テーブル（BaseMeを含む） */}
      <section className="px-6 py-24 bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">Why Careo</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 tracking-tight">
            他のサービスと<span className="text-[#00c896]">何が違うの？</span>
          </h2>
          <p className="text-gray-500 text-center text-sm mb-12">全部使うのがベスト。Careoは「管理とコーチング」に特化しています。</p>
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr>
                  <th className="text-left pb-4 text-gray-400 font-medium w-[30%]"></th>
                  <th className="pb-4 text-center">
                    <span className="bg-[#00c896] text-white text-xs font-bold px-3 py-1.5 rounded-lg">Careo</span>
                  </th>
                  <th className="pb-4 text-center text-gray-400 font-medium text-xs">BaseMe<br/><span className="text-[10px]">（AI就活）</span></th>
                  <th className="pb-4 text-center text-gray-400 font-medium text-xs">SmartES<br/><span className="text-[10px]">（ES生成）</span></th>
                  <th className="pb-4 text-center text-gray-400 font-medium text-xs">リクナビ<br/>マイナビ</th>
                  <th className="pb-4 text-center text-gray-400 font-medium text-xs">Notion<br/>スプレッド</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  { label: "求人情報・スカウト",                        careo: false, base: true,  smart: false, riku: true,  notion: false },
                  { label: "選考進捗を一元管理",                        careo: true,  base: false, smart: false, riku: false, notion: "△"  },
                  { label: "ES・面接・OB訪問・筆記を記録",              careo: true,  base: false, smart: false, riku: false, notion: "△"  },
                  { label: "週次PDCAをAIが自動分析",                    careo: true,  base: false, smart: false, riku: false, notion: false },
                  { label: "ES提出前AIチェック",                        careo: true,  base: false, smart: false, riku: false, notion: false },
                  { label: "データ横断の気づき通知",                    careo: true,  base: false, smart: false, riku: false, notion: false },
                  { label: "全データを把握したAIコーチ",                careo: true,  base: "△",  smart: false, riku: false, notion: false },
                  { label: "キャリアセンターレポート出力",              careo: true,  base: false, smart: false, riku: false, notion: false },
                  { label: "学生は完全無料",                            careo: true,  base: true,  smart: true,  riku: true,  notion: true  },
                  { label: "📵 広告・スカウト電話なし",                 careo: true,  base: false, smart: true,  riku: false, notion: true  },
                ].map((row) => {
                  const cell = (v: boolean | string) =>
                    v === true  ? <span className="text-[#00c896] font-bold text-base">✓</span>
                    : v === false ? <span className="text-gray-200 text-base">—</span>
                    : <span className="text-gray-400 text-xs font-medium">{v}</span>;
                  const careoCell = (v: boolean | string) =>
                    v === true  ? <span className="text-[#00c896] font-bold text-base">✓</span>
                    : v === false ? <span className="text-gray-200 text-base">—</span>
                    : <span className="text-amber-500 text-xs font-medium">{v}</span>;
                  return (
                    <tr key={row.label}>
                      <td className="py-3.5 text-gray-700 font-medium text-xs md:text-sm pr-2">{row.label}</td>
                      <td className="py-3.5 text-center bg-[#00c896]/3">{careoCell(row.careo)}</td>
                      <td className="py-3.5 text-center">{cell(row.base)}</td>
                      <td className="py-3.5 text-center">{cell(row.smart)}</td>
                      <td className="py-3.5 text-center">{cell(row.riku)}</td>
                      <td className="py-3.5 text-center">{cell(row.notion)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">
            ※ △: 部分的に対応。各サービスは目的が異なるため、組み合わせて使うのがベストです。
          </p>
        </div>
      </section>

      {/* 他サービスとの使い分け */}
      <section className="px-6 py-16 bg-gray-50/60">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">Use with others</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-2 tracking-tight">Careoは「管理とコーチング」に集中する</h2>
          <p className="text-gray-400 text-sm text-center mb-10">ES添削・自己分析・企業探しは専門サービスへ。Careoはそのデータを受け取ってPDCAを回す。</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                task: "企業を探す",
                icon: "🔍",
                services: [
                  { name: "リクナビ", url: "https://job.rikunabi.com/" },
                  { name: "マイナビ", url: "https://job.mynavi.jp/" },
                  { name: "OfferBox", url: "https://offerbox.jp/" },
                  { name: "BaseMe", url: "https://baseme.app/" },
                ],
                tip: "応募したらCareoに企業を登録して管理",
              },
              {
                task: "ESを書く・添削する",
                icon: "✍️",
                services: [
                  { name: "就活会議", url: "https://syukatsu-kaigi.jp/" },
                  { name: "ワンキャリア", url: "https://www.onecareer.jp/" },
                  { name: "SmartES", url: "https://smartes.jp/" },
                ],
                tip: "書いたESをCareoで提出前チェック＆記録",
              },
              {
                task: "自己分析を深める",
                icon: "💡",
                services: [
                  { name: "Claude", url: "https://claude.ai/" },
                  { name: "ChatGPT", url: "https://chatgpt.com/" },
                  { name: "StrengthsFinder", url: "https://www.gallup.com/cliftonstrengths/en/252137/home.aspx" },
                ],
                tip: "言語化できたらCareoの自己分析に保存",
              },
            ].map((cat) => (
              <div key={cat.task} className="bg-white rounded-2xl p-5 border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{cat.icon}</span>
                  <p className="font-bold text-sm text-[#0D0B21]">{cat.task}</p>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {cat.services.map(s => (
                    <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
                      className="text-xs bg-gray-50 border border-gray-200 text-gray-700 px-2.5 py-1 rounded-lg hover:bg-gray-100 transition-colors">
                      {s.name} ↗
                    </a>
                  ))}
                </div>
                <p className="text-[11px] text-[#00c896] font-medium border-t border-gray-100 pt-2">→ {cat.tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 全機能無料 */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">Pricing</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 tracking-tight">
            全機能、<span className="text-[#00c896]">完全無料。</span>
          </h2>
          <p className="text-gray-500 text-center text-sm mb-10">
            クレジットカード不要。メールアドレスだけで今すぐ始められます。
          </p>
          <div className="bg-gradient-to-br from-[#00c896]/5 to-emerald-50 border-2 border-[#00c896]/30 rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-bold text-[#00a87e] uppercase tracking-wider mb-1">現在のプラン</p>
                <p className="text-4xl font-bold text-[#0D0B21]">¥0 <span className="text-base font-normal text-gray-400">/ 月</span></p>
              </div>
              <span className="bg-[#00c896] text-white text-xs font-bold px-3 py-1.5 rounded-full">全機能利用可能</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
              {[
                "企業・ES・面接・OB訪問・筆記試験の管理",
                "カレオコーチAI（制限なし）",
                "ES提出前AIチェック",
                "週次PDCA自動分析",
                "点と点を繋ぐ気づき通知",
                "進捗ベンチマーク",
                "キャリアセンターレポート出力",
                "友達と就活グループ",
              ].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm text-[#0D0B21]">
                  <span className="text-[#00c896] font-bold shrink-0">✓</span>{f}
                </div>
              ))}
            </div>
            <Link href="/signup" className="block text-center bg-[#00c896] hover:bg-[#00b586] text-white font-bold py-3 rounded-xl text-sm transition-colors shadow-lg shadow-[#00c896]/20">
              無料で始める →
            </Link>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">📵 広告メール・スカウト電話は一切ありません</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-20 bg-gray-50/60">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 tracking-tight">
            よくある質問
          </h2>
          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <div
                key={i}
                className={`bg-white border rounded-2xl overflow-hidden transition-colors duration-200 ${
                  openFaq === i ? "border-[#00c896]/40 shadow-sm" : "border-gray-100"
                }`}
              >
                <button
                  className="w-full text-left px-6 py-4 flex items-center justify-between gap-4"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-semibold text-[#0D0B21] text-sm">{item.q}</span>
                  <span className={`text-[#00c896] shrink-0 transition-transform duration-200 ${openFaq === i ? "rotate-180" : ""}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-48" : "max-h-0"}`}>
                  <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                    {item.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="px-6 py-16 bg-[#0D0B21] text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-72 h-72 rounded-full bg-[#00c896]/8 blur-3xl animate-float-slow" />
          <div className="absolute bottom-0 right-1/4 w-56 h-56 rounded-full bg-purple-500/6 blur-2xl animate-blob delay-1000" />
        </div>
        <div className="max-w-2xl mx-auto relative z-10">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">Our Story</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">
            同じ就活生として、<br />本当に使えるツールを作りたかった。
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-[#00c896] font-bold text-sm mb-2">👨‍💻 作った人</p>
              <p className="text-gray-300 text-sm leading-relaxed">
                上智大学在籍の28卒学生が開発。自分自身の就活経験から「これが欲しかった」を形にしました。
              </p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-[#00c896] font-bold text-sm mb-2">💡 なぜ作ったか</p>
              <p className="text-gray-300 text-sm leading-relaxed">
                Notion・スプレッドシート・ChatGPTを行き来する非効率さに限界を感じて。全データを知るAIコーチが欲しかった。
              </p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-gray-400 text-xs mb-4">開発の継続は皆さんのサポートで成り立っています</p>
            <a
              href="https://buymeacoffee.com/careo"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-amber-900 font-bold px-6 py-2.5 rounded-xl transition-colors text-sm"
            >
              ☕ Buy me a coffee
            </a>
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
          <p className="text-gray-500 text-base mb-10">完全無料。登録はメールアドレスだけ。</p>
          <p className="text-xs text-gray-400 mb-6">📵 広告メール・スカウト電話は一切ありません</p>
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
        <div className="flex items-center justify-center gap-4 mb-3">
          <Link href="/login" className="hover:text-gray-600 transition-colors">ログイン</Link>
          <span>·</span>
          <Link href="/signup" className="hover:text-gray-600 transition-colors">新規登録</Link>
        </div>
        © 2026 Careo — 就活管理AIアプリ
      </footer>
    </div>
  );
}
