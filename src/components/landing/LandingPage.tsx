"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Script from "next/script";

// ─── Constants ───────────────────────────────────────────────────────────────
const DEFAULT_BADGE = "28卒向け・AI就活コーチ「カレオ」";
const DEFAULT_HERO_SUBTEXT =
  "企業・ES・面接・OB訪問・筆記試験をすべて一か所に。\nAIコーチ「カレオ」が全データを把握し、点と点を繋ぐ気づきを届ける。";
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
        { "@type": "Question", "name": "無料で使えますか？", "acceptedAnswer": { "@type": "Answer", "text": "はい、Careoは全機能が完全無料です。クレジットカード不要で、メールアドレスだけで今すぐ始められます。" } },
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
    a: "はい、27卒・29卒・30卒の方もご利用いただけます。登録時に卒業予定年度を設定すると、その年度に合わせたAIコーチングが受けられます。",
  },
];

// ─── App Mockup ───────────────────────────────────────────────────────────────
function AppMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[380px]">
      {/* Main browser window */}
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-200/60 lp-mockup-window">
        {/* Browser chrome */}
        <div className="bg-gray-50 border-b border-gray-100 px-4 py-2.5 flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </div>
          <div className="flex-1 bg-white rounded-md px-3 py-0.5 text-[10px] text-gray-400 border border-gray-200 text-center truncate">
            careo-sigma.vercel.app
          </div>
        </div>
        {/* Dashboard content */}
        <div className="p-4 bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-900">ダッシュボード</p>
            <div className="flex items-center gap-1.5">
              <img src="/icon-new.svg" alt="" className="w-4 h-4 rounded" />
              <span className="text-[9px] font-bold text-[#0D0B21]">Careo</span>
            </div>
          </div>
          {/* Status cards */}
          <div className="grid grid-cols-4 gap-1.5 mb-3">
            {[
              { label: "選考中", value: "8", color: "text-teal-600", border: "border-teal-100", bg: "from-teal-50/60 to-emerald-50/40" },
              { label: "内定", value: "2", color: "text-emerald-600", border: "border-emerald-100", bg: "from-emerald-50 to-green-50" },
              { label: "ES待ち", value: "3", color: "text-amber-600", border: "border-amber-100", bg: "from-amber-50 to-orange-50" },
              { label: "気になる", value: "12", color: "text-gray-500", border: "border-gray-200", bg: "from-gray-50 to-slate-50" },
            ].map(item => (
              <div key={item.label} className={`bg-gradient-to-br ${item.bg} border ${item.border} rounded-xl p-2 text-center`}>
                <p className="text-[8px] text-gray-400 truncate">{item.label}</p>
                <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
              </div>
            ))}
          </div>
          {/* Coach banner */}
          <div className="bg-gradient-to-r from-[#00c896] to-[#00a87e] rounded-xl px-3 py-2.5 flex items-center gap-2 mb-3 lp-coach-shadow">
            <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white font-bold text-[9px]">K</span>
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-[9px]">今日のカレオコーチ</p>
              <p className="text-white/80 text-[8px] truncate">A社・B社のESに共通する強みを発見しました</p>
            </div>
          </div>
          {/* Next Actions */}
          <p className="text-[9px] font-semibold text-gray-700 mb-1.5">🎯 Next Action</p>
          <div className="space-y-1.5">
            {[
              { tag: "緊急", text: "トヨタ自動車 ES提出（2日後）", tagColor: "bg-red-100 text-red-700", rowColor: "border-l-red-400 bg-red-50/60" },
              { tag: "推奨", text: "ソニーグループ 面接準備", tagColor: "bg-yellow-100 text-yellow-700", rowColor: "border-l-yellow-400 bg-yellow-50/60" },
            ].map(item => (
              <div key={item.text} className={`border-l-4 ${item.rowColor} rounded-r-xl p-2 flex items-center gap-1.5`}>
                <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${item.tagColor}`}>{item.tag}</span>
                <p className="text-[8px] text-gray-800 truncate">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating insight notification */}
      <div className="absolute -right-3 md:-right-10 top-8 bg-white rounded-2xl border border-gray-100 px-3 py-2.5 w-44 animate-float z-10 lp-float-insight-shadow">
        <div className="flex items-start gap-2">
          <span className="text-base shrink-0">🔮</span>
          <div>
            <p className="text-[9px] font-bold text-gray-900 leading-tight">カレオからの気づき</p>
            <p className="text-[8px] text-gray-500 mt-0.5 leading-snug">A社・B社の面接で共通する弱みを発見</p>
          </div>
        </div>
      </div>

      {/* Floating PDCA badge */}
      <div className="absolute -left-3 md:-left-10 bottom-16 text-white rounded-xl px-3 py-2 animate-float-slow z-10 lp-float-badge">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold">✓</span>
          <div>
            <p className="text-[9px] font-bold">AI分析完了</p>
            <p className="text-[8px] opacity-80">週次PDCAを更新</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ target, prefix = "", suffix = "", label }: { target: number; prefix?: string; suffix?: string; label: string }) {
  const [count, setCount] = useState(0);
  const [triggered, setTriggered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setTriggered(true); obs.disconnect(); } },
      { threshold: 0.5 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!triggered) return;
    const duration = 1500;
    let start: number | null = null;
    const frame = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / duration, 1);
      setCount(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }, [triggered, target]);

  return (
    <div ref={ref} className="text-center">
      <p className="text-3xl md:text-4xl font-bold text-[#0D0B21] tabular-nums">{prefix}{count}{suffix}</p>
      <p className="text-gray-400 text-sm mt-1">{label}</p>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function LandingPage() {
  const [badgeText, setBadgeText] = useState(DEFAULT_BADGE);
  const [heroSubtext, setHeroSubtext] = useState(DEFAULT_HERO_SUBTEXT);
  const [afterItems, setAfterItems] = useState<string[]>(DEFAULT_AFTER_ITEMS);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);
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

  // スクロール連動ヘッダー
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // スクロールアニメーション
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.1 }
    );
    const els = document.querySelectorAll(".reveal");
    els.forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col text-[#0D0B21] overflow-x-hidden">
      <Script id="json-ld" type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "lp-header-scrolled" : ""}`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <img src="/icon-new.svg" alt="Careo" className="w-8 h-8 rounded-xl" />
            <span className="font-bold text-lg tracking-tight text-[#0D0B21]">Careo</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors hidden sm:block">
              ログイン
            </Link>
            <Link
              href="/signup"
              className="text-sm text-white font-bold px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-105 hover:shadow-lg lp-btn-primary"
            >
              無料で始める
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center px-6 pt-24 pb-16 overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-full lp-hero-glow" />
          <div className="absolute top-[10%] right-[5%] w-[500px] h-[500px] animate-blob delay-500 lp-hero-blob-1" />
          <div className="absolute bottom-[5%] left-[10%] w-[400px] h-[400px] animate-blob delay-1000 lp-hero-blob-2" />
          {/* Subtle dot grid */}
          <div className="absolute inset-0 lp-dot-grid" />
        </div>

        <div className="max-w-6xl mx-auto w-full relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* Left: Text */}
            <div>
              <div className="inline-flex items-center gap-2 border border-[#00c896]/30 bg-[#00c896]/6 text-[#00a87e] text-xs font-semibold px-4 py-2 rounded-full mb-8">
                <span className="w-1.5 h-1.5 bg-[#00c896] rounded-full animate-pulse" />
                {badgeText}
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6 tracking-tight">
                迷わず動ける、<br />
                <span className="relative inline-block">
                  <span className="bg-clip-text text-transparent lp-gradient-text-hero">
                    就活へ。
                  </span>
                </span>
              </h1>

              <p className="text-gray-500 text-lg md:text-xl mb-8 leading-relaxed max-w-xl">
                {heroSubtext.split("\n").map((line, i, arr) => (
                  <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                ))}
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-10">
                <Link
                  href="/signup"
                  className="inline-flex items-center justify-center gap-2 text-white font-bold px-8 py-4 rounded-2xl text-base transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 lp-btn-hero"
                >
                  無料で始める — 5分でセットアップ
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link href="/login" className="inline-flex items-center justify-center text-gray-600 font-semibold px-8 py-4 rounded-2xl text-base border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200">
                  ログインする
                </Link>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>📵</span>
                <span>広告メール・スカウト電話なし</span>
                <span className="mx-2">·</span>
                <span>💳</span>
                <span>クレカ不要・完全無料</span>
              </div>
            </div>

            {/* Right: App mockup */}
            <div className="relative hidden md:block px-8 lg:px-4">
              <AppMockup />
            </div>
          </div>

          {/* Stats row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16 mt-16 pt-10 border-t border-gray-100">
            <AnimatedCounter target={7} suffix="機能" label="就活データを一元管理" />
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-[#0D0B21]">完全無料</p>
              <p className="text-gray-400 text-sm mt-1">全機能を無料で使える</p>
            </div>
            <div className="text-center">
              <p className="text-3xl md:text-4xl font-bold text-[#0D0B21]">28卒</p>
              <p className="text-gray-400 text-sm mt-1">向け特化</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section className="px-6 py-24 bg-gray-50/60 reveal">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">How it works</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 tracking-tight">
            使い方は、<span className="text-[#00c896]">シンプル。</span>
          </h2>
          <p className="text-gray-400 text-sm text-center mb-16">記録するだけで、あとはCareoとAIが全部整理する。</p>

          <div className="relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-10 left-[16.67%] right-[16.67%] h-0.5 bg-gradient-to-r from-[#00c896]/20 via-[#00c896] to-[#00c896]/20 z-0" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  step: "01",
                  icon: "🏢",
                  title: "企業を登録する",
                  desc: "受けたい企業をCareoに追加。5分でセットアップ完了。リクナビ・マイナビで見つけた企業を順次追加していくだけ。",
                  tag: "最初の1回だけ",
                },
                {
                  step: "02",
                  icon: "📝",
                  title: "ES・面接・OB訪問を記録",
                  desc: "書いたES・受けた面接・OB訪問のメモを記録。Careoが締切を管理し、忘れないようリマインドする。",
                  tag: "就活のたびに",
                },
                {
                  step: "03",
                  icon: "🤖",
                  title: "AIがすべてを整理",
                  desc: "カレオコーチが全データを把握し「今週何をすべきか」を自動提案。データを横断した気づきを自動通知。",
                  tag: "自動で毎週",
                },
              ].map((item, i) => (
                <div key={item.step} className={`relative reveal reveal-delay-${i + 1}`}>
                  {/* Step circle */}
                  <div className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-5 text-3xl relative z-10 lp-step-icon">
                      {item.icon}
                    </div>
                    <span className="text-[10px] bg-[#00c896]/10 text-[#00a87e] font-bold px-3 py-1 rounded-full mb-2">{item.tag}</span>
                    <h3 className="font-bold text-[#0D0B21] mb-2 text-lg">{item.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── The Careo Difference (dark) ────────────────────────────────────── */}
      <section className="px-6 py-24 bg-[#0D0B21] text-white relative overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 pointer-events-none lp-dark-grid" />
        {/* Ambient glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[#00c896]/6 blur-3xl animate-blob delay-500" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-purple-600/4 blur-3xl animate-blob delay-1000" />
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="reveal">
            <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">The Careo Difference</p>
            <h2 className="text-3xl md:text-5xl font-bold text-center mb-4 tracking-tight leading-tight">
              就活AIは「点」で解決する。<br />
              <span className="bg-clip-text text-transparent lp-gradient-text-dark">Careoは「全体」をコーチングする。</span>
            </h2>
            <p className="text-gray-400 text-center text-sm mb-12 max-w-2xl mx-auto">
              SmartESはES生成のみ。REALMEは面接練習のみ。BaseMeはスカウトのみ。<br />
              どこにも「ES・面接・OB訪問・企業管理を全部知った上でアドバイスするAI」はなかった。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                tag: "AI機能",
              },
              {
                icon: "📈",
                title: "進捗ベンチマーク",
                desc: "「同じ時期のCareoユーザー平均応募数は12社。あなたは3社」— 匿名統計でリアルな進み具合を可視化",
                tag: "ネットワーク効果",
              },
            ].map((item, i) => (
              <div
                key={item.title}
                className={`lp-dark-card border border-white/10 rounded-2xl p-5 cursor-default transition-all duration-300 hover:border-[#00c896]/30 hover:-translate-y-1 reveal reveal-delay-${i + 1}`}
              >
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
                desc: "就活の全データを1枚のPDFにまとめ、大学のキャリアセンターに持参できる。大学側との連携をCareoが架け橋に。",
                tag: "大学連携",
              },
              {
                icon: "👥",
                title: "友達と就活グループ",
                desc: "就活仲間とグループを作り、お互いの進捗（応募数・面接数・PDCAスコア）を匿名で共有。ライバルと刺激し合える。",
                tag: "コミュニティ",
              },
            ].map((item, i) => (
              <div
                key={item.title}
                className={`lp-dark-card border border-white/10 rounded-2xl p-5 transition-all duration-300 hover:border-[#00c896]/30 hover:-translate-y-1 reveal reveal-delay-${i + 1}`}
              >
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

      {/* ── Before / After ─────────────────────────────────────────────────── */}
      <section className="px-6 py-24 bg-white reveal">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">Before / After</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 tracking-tight">
            Careoを使うと、<span className="text-[#00c896]">何が変わる？</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Before */}
            <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xl">😮‍💨</span>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">使う前</p>
              </div>
              <ul className="space-y-3.5">
                {[
                  "スプレッドシートで企業を管理。どこに何を書いたか分からなくなる",
                  "締切を見落として焦る。カレンダーとNotionを行き来",
                  "面接が終わっても何が悪かったか分からないまま",
                  "「今週何をすればいいか」が毎週ゼロから考え直し",
                  "ES提出前に自己分析と合っているか確認する方法がない",
                ].map((t) => (
                  <li key={t} className="flex gap-3 text-sm text-gray-500">
                    <span className="text-red-400 shrink-0 mt-0.5 font-bold">✕</span>{t}
                  </li>
                ))}
              </ul>
            </div>
            {/* After */}
            <div className="lp-after-card rounded-2xl p-6 border border-[#00c896]/20">
              <div className="flex items-center gap-2 mb-5">
                <span className="text-xl">✨</span>
                <p className="text-xs font-bold text-[#00a87e] uppercase tracking-wider">Careoを使った後</p>
              </div>
              <ul className="space-y-3.5">
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

      {/* ── 競合比較テーブル ────────────────────────────────────────────────── */}
      <section className="px-6 py-24 bg-gray-50/60 reveal">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">Why Careo</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 tracking-tight">
            他のサービスと<span className="text-[#00c896]">何が違うの？</span>
          </h2>
          <p className="text-gray-500 text-center text-sm mb-12">全部使うのがベスト。Careoは「管理とコーチング」に特化しています。</p>
          <div className="overflow-x-auto -mx-2 rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th scope="col" className="text-left py-4 px-5 text-gray-400 font-medium w-[30%]">機能</th>
                  <th className="py-4 px-3 text-center">
                    <span className="bg-[#00c896] text-white text-xs font-bold px-3 py-1.5 rounded-lg">Careo</span>
                  </th>
                  <th className="py-4 px-3 text-center text-gray-400 font-medium text-xs">BaseMe<br /><span className="text-[10px]">（AI就活）</span></th>
                  <th className="py-4 px-3 text-center text-gray-400 font-medium text-xs">SmartES<br /><span className="text-[10px]">（ES生成）</span></th>
                  <th className="py-4 px-3 text-center text-gray-400 font-medium text-xs">リクナビ<br />マイナビ</th>
                  <th className="py-4 px-3 text-center text-gray-400 font-medium text-xs">Notion<br />スプレッド</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { label: "求人情報・スカウト", careo: false, base: true, smart: false, riku: true, notion: false },
                  { label: "選考進捗を一元管理", careo: true, base: false, smart: false, riku: false, notion: "△" },
                  { label: "ES・面接・OB訪問・筆記を記録", careo: true, base: false, smart: false, riku: false, notion: "△" },
                  { label: "週次PDCAをAIが自動分析", careo: true, base: false, smart: false, riku: false, notion: false },
                  { label: "ES提出前AIチェック", careo: true, base: false, smart: false, riku: false, notion: false },
                  { label: "データ横断の気づき通知", careo: true, base: false, smart: false, riku: false, notion: false },
                  { label: "全データを把握したAIコーチ", careo: true, base: "△", smart: false, riku: false, notion: false },
                  { label: "キャリアセンターレポート出力", careo: true, base: false, smart: false, riku: false, notion: false },
                  { label: "学生は完全無料", careo: true, base: true, smart: true, riku: true, notion: true },
                  { label: "📵 広告・スカウト電話なし", careo: true, base: false, smart: true, riku: false, notion: true },
                ].map((row) => {
                  const cell = (v: boolean | string) =>
                    v === true ? <span className="text-[#00c896] font-bold text-base">✓</span>
                      : v === false ? <span className="text-gray-200 text-base">—</span>
                        : <span className="text-gray-400 text-xs font-medium">{v}</span>;
                  const careoCell = (v: boolean | string) =>
                    v === true ? <span className="text-[#00c896] font-bold text-base">✓</span>
                      : v === false ? <span className="text-gray-200 text-base">—</span>
                        : <span className="text-amber-500 text-xs font-medium">{v}</span>;
                  return (
                    <tr key={row.label} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3.5 px-5 text-gray-700 font-medium text-xs md:text-sm">{row.label}</td>
                      <td className="py-3.5 px-3 text-center bg-[#00c896]/3">{careoCell(row.careo)}</td>
                      <td className="py-3.5 px-3 text-center">{cell(row.base)}</td>
                      <td className="py-3.5 px-3 text-center">{cell(row.smart)}</td>
                      <td className="py-3.5 px-3 text-center">{cell(row.riku)}</td>
                      <td className="py-3.5 px-3 text-center">{cell(row.notion)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">
            ※ △: 部分的に対応。各サービスは目的が異なるため、組み合わせて使うのがベストです。
          </p>
        </div>
      </section>

      {/* ── 他サービスとの使い分け ──────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-white reveal">
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
                tip: "→ 応募したらCareoに企業を登録して管理",
              },
              {
                task: "ESを書く・添削する",
                icon: "✍️",
                services: [
                  { name: "就活会議", url: "https://syukatsu-kaigi.jp/" },
                  { name: "ワンキャリア", url: "https://www.onecareer.jp/" },
                  { name: "SmartES", url: "https://smartes.jp/" },
                ],
                tip: "→ 書いたESをCareoで提出前チェック＆記録",
              },
              {
                task: "自己分析を深める",
                icon: "💡",
                services: [
                  { name: "Claude", url: "https://claude.ai/" },
                  { name: "ChatGPT", url: "https://chatgpt.com/" },
                  { name: "StrengthsFinder", url: "https://www.gallup.com/cliftonstrengths/en/252137/home.aspx" },
                ],
                tip: "→ 言語化できたらCareoの自己分析に保存",
              },
            ].map((cat) => (
              <div key={cat.task} className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-[#00c896]/20 transition-colors hover:shadow-sm">
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
                <p className="text-[11px] text-[#00c896] font-medium border-t border-gray-100 pt-2">{cat.tip}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────────────── */}
      {/* 実際のユーザーの声に差し替えてください */}
      <section className="px-6 py-24 bg-gray-50/60 reveal">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">Voice</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 tracking-tight">
            使っている人の<span className="text-[#00c896]">声</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                quote: "就活のデータがバラバラだったのがCareoで全部つながった感じ。カレオコーチの週次アドバイスが的確すぎて、毎週楽しみになってます。",
                name: "M.T.",
                univ: "早稲田大学 · 28卒",
                avatar: "M",
                color: "from-blue-400 to-indigo-500",
              },
              {
                quote: "SmartESやリクナビと一緒に使っています。Careoがあることで締切の見落としが完全になくなりました。ESのAIチェックも提出前に必ず使ってます。",
                name: "K.S.",
                univ: "慶應義塾大学 · 28卒",
                avatar: "K",
                color: "from-emerald-400 to-teal-500",
              },
              {
                quote: "「大学生が一人で作ったの？」って友達に紹介したら驚かれました。無料でここまでできるのが信じられないレベルです。",
                name: "A.Y.",
                univ: "上智大学 · 28卒",
                avatar: "A",
                color: "from-[#00c896] to-emerald-600",
              },
            ].map((item, i) => (
              <div
                key={item.name}
                className={`bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#00c896]/20 hover:shadow-md transition-all duration-300 hover:-translate-y-1 reveal reveal-delay-${i + 1}`}
              >
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className="w-3.5 h-3.5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-5">&ldquo;{item.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${item.color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                    {item.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0D0B21]">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.univ}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section className="px-6 py-24 bg-white reveal">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">Pricing</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 tracking-tight">
            全機能、<span className="text-[#00c896]">完全無料。</span>
          </h2>
          <p className="text-gray-500 text-center text-sm mb-10">
            クレジットカード不要。メールアドレスだけで今すぐ始められます。
          </p>
          <div className="lp-pricing-card rounded-2xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs font-bold text-[#00a87e] uppercase tracking-wider mb-1">現在のプラン</p>
                <p className="text-4xl font-bold text-[#0D0B21]">¥0 <span className="text-base font-normal text-gray-400">/ 月</span></p>
              </div>
              <span className="lp-badge-green text-white text-xs font-bold px-4 py-2 rounded-full">
                全機能利用可能
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
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
            <Link
              href="/signup"
              className="block text-center text-white font-bold py-3.5 rounded-xl text-sm transition-all duration-200 hover:scale-[1.01] hover:shadow-xl lp-btn-pricing"
            >
              無料で始める →
            </Link>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">📵 広告メール・スカウト電話は一切ありません</p>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section className="px-6 py-24 bg-gray-50/60 reveal">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 tracking-tight">よくある質問</h2>
          <div className="space-y-2.5">
            {faqItems.map((item, i) => (
              <div
                key={i}
                className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${openFaq === i ? "border-[#00c896]/40 shadow-sm" : "border-gray-100 hover:border-gray-200"}`}
              >
                <button
                  type="button"
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

      {/* ── Our Story ──────────────────────────────────────────────────────── */}
      <section className="px-6 py-24 bg-[#0D0B21] text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none lp-dark-grid-subtle" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/3 w-72 h-72 rounded-full bg-[#00c896]/8 blur-3xl animate-float-slow" />
          <div className="absolute bottom-0 right-1/4 w-56 h-56 rounded-full bg-purple-500/6 blur-2xl animate-blob delay-1000" />
        </div>
        <div className="max-w-2xl mx-auto relative z-10 reveal">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">Our Story</p>
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3 leading-tight">
            同じ就活生として、<br />本当に使えるツールを作りたかった。
          </h2>
          <p className="text-gray-400 text-sm text-center mb-10">「Notion・スプレッドシート・ChatGPTを行き来する非効率さ」— その答えがCareoです。</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="lp-story-card rounded-2xl p-5">
              <p className="text-[#00c896] font-bold text-sm mb-2">👨‍💻 作った人</p>
              <p className="text-gray-300 text-sm leading-relaxed">
                上智大学在籍の28卒学生が開発。自分自身の就活経験から「これが欲しかった」を形にしました。
              </p>
            </div>
            <div className="lp-story-card rounded-2xl p-5">
              <p className="text-[#00c896] font-bold text-sm mb-2">💡 なぜ作ったか</p>
              <p className="text-gray-300 text-sm leading-relaxed">
                全データを知るAIコーチが欲しかった。Careoは自分が本当に使いたいと思って作った、就活のOSです。
              </p>
            </div>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-xs mb-4">開発の継続は皆さんのサポートで成り立っています</p>
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

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="px-6 py-24 md:py-32 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0 lp-cta-glow" />
          <div className="absolute top-0 left-0 w-full h-full lp-cta-dot-grid" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center reveal">
          <div className="inline-flex items-center gap-2 border border-[#00c896]/30 bg-[#00c896]/6 text-[#00a87e] text-xs font-semibold px-4 py-2 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-[#00c896] rounded-full animate-pulse" />
            今すぐ無料で使える
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-5 tracking-tight leading-[1.1]">
            就活、<span className="bg-clip-text text-transparent lp-gradient-text-green">AIと一緒に</span>始めよう
          </h2>
          <p className="text-gray-500 text-lg mb-4">完全無料。登録はメールアドレスだけ。</p>
          <p className="text-xs text-gray-400 mb-8">📵 広告メール・スカウト電話は一切ありません</p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 text-white font-bold px-12 py-4 rounded-2xl text-base transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 lp-btn-cta"
          >
            無料で始める
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="px-6 py-8 border-t border-gray-100">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/icon-new.svg" alt="Careo" className="w-6 h-6 rounded-lg" />
            <span className="font-bold text-sm text-[#0D0B21]">Careo</span>
            <span className="text-gray-300 text-xs ml-2">© 2026 — 就活管理AIアプリ</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-gray-400">
            <Link href="/login" className="hover:text-gray-700 transition-colors">ログイン</Link>
            <Link href="/signup" className="hover:text-gray-700 transition-colors">新規登録</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
