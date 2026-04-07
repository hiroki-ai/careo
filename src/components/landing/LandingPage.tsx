"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import type { RecentPost, UserReview } from "@/app/page";
import { LPChatBot } from "@/components/landing/LPChatBot";

// ─── Constants ───────────────────────────────────────────────────────────────
const DEFAULT_BADGE = "あなたの就活を丸ごと知るAIコーチ「カレオ」";
const DEFAULT_HERO_SUBTEXT =
  "ES・面接・OB訪問・筆記試験——あなたの就活データを全部把握したAIが、\n本当に必要なアドバイスだけを届ける。ChatGPTにはできないことを、カレオはやる。";
const DEFAULT_AFTER_ITEMS = [
  "企業・ES・面接・説明会・インターン・OB訪問・筆記試験がすべて一か所。全体像が常に見える",
  "説明会・インターン・ES締切を一元管理。3日前に自動通知で見落としゼロ",
  "毎週AIがPDCAを自動分析。「今週何をすべきか」が即わかる",
  "ES提出前にAIが自己分析との整合性・文体・具体性を一括チェック",
  "面接・OB訪問・ESを横断した「点と点を繋ぐ気づき」をカレオが自動通知",
  "マイナビ・リクナビはそのまま使いながら、Chrome拡張でCareoに一発追加。乗り換え不要",
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "name": "Careo",
      "url": "https://careoai.jp",
      "logo": { "@type": "ImageObject", "url": "https://careoai.jp/icon-new.svg" },
    },
    {
      "@type": "WebSite",
      "name": "Careo",
      "url": "https://careoai.jp",
      "publisher": { "@type": "Organization", "name": "Careo" },
    },
    {
      "@type": "WebApplication",
      "name": "Careo",
      "url": "https://careoai.jp",
      "description": "ES締切・面接日程・企業研究・OB訪問・筆記試験をAIが横断分析。就活のPDCAを自動で回すAI就活コーチアプリ。",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "Web, iOS, Android",
      "offers": { "@type": "Offer", "price": "0", "priceCurrency": "JPY" },
      "audience": { "@type": "Audience", "audienceType": "大学生・就活生" },
      "featureList": [
        "ES管理・AI提出前チェック", "面接ログ", "企業管理", "AIチャット（カレオコーチ）",
        "PDCA自動分析", "内定予測", "OB/OG訪問管理", "筆記試験管理", "説明会・インターン日程管理",
        "クロスデータ気づき通知", "進捗ベンチマーク", "キャリアセンターレポート出力",
        "就活仲間グループ機能", "自己分析充実度トラッキング",
        "Chrome拡張機能（マイナビ・リクナビ連携）",
        "面接AIフィードバック（回答品質スコアリング）",
        "就活進捗異常検知",
      ],
      "publisher": { "@type": "Organization", "name": "Careo" },
    },
    {
      "@type": "FAQPage",
      "mainEntity": [
        { "@type": "Question", "name": "Careoとは何ですか？", "acceptedAnswer": { "@type": "Answer", "text": "CareoはAIを使った就活管理アプリです。ES締切・面接日程・企業研究・OB訪問・筆記試験を一か所で管理でき、AIが就活のPDCAを自動で分析します。他のツールにない「データを横断した気づき通知」が特徴で、卒業予定年度に合わせたAIコーチングが受けられます。" } },
        { "@type": "Question", "name": "BaseMeやSmartESと何が違いますか？", "acceptedAnswer": { "@type": "Answer", "text": "BaseMe・SmartESは特定機能（スカウト・ES生成）に特化したサービスです。CareoはES・面接・OB訪問・企業管理・筆記試験のすべてのデータを把握したAIコーチが、データを横断した気づきを提供します。「点解決」ではなく「就活OSとして全体を管理・コーチング」するのがCareoの役割です。" } },
        { "@type": "Question", "name": "無料で使えますか？", "acceptedAnswer": { "@type": "Answer", "text": "はい、Careoは全機能が完全無料です。クレジットカード不要で、メールアドレスだけで今すぐ始められます。" } },
        { "@type": "Question", "name": "スマホでも使えますか？", "acceptedAnswer": { "@type": "Answer", "text": "はい、iPhoneでもAndroidでも使えます。ホーム画面に追加するとアプリのように使えます。" } },
        { "@type": "Question", "name": "27卒・28卒・29卒でも使えますか？", "acceptedAnswer": { "@type": "Answer", "text": "はい、27卒・28卒・29卒・30卒など卒業予定年度を問わずご利用いただけます。登録時に卒業予定年度を設定すると、その年度・フェーズに合わせたAIコーチングが受けられます。" } },
      ],
    },
  ],
};

const faqItems = [
  {
    q: "Careoは完全無料ですか？",
    a: "はい、現在は全機能を完全無料でご利用いただけます。企業管理・ES管理・面接ログ・OB訪問・筆記試験管理・AIコーチング・気づき通知など、すべての機能が無料です。学生向けの機能は今後も無料を基本方針とします。将来的に大学キャリアセンターや企業向けのサービスを追加する可能性があります。",
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
    q: "27卒・28卒・29卒でも使えますか？",
    a: "はい、27卒・28卒・29卒・30卒など卒業予定年度を問わずご利用いただけます。登録時に卒業予定年度を設定すると、その年度・フェーズに合わせたAIコーチングが受けられます。",
  },
  {
    q: "ChatGPTと何が違うんですか？",
    a: "ChatGPTはあなたの就活データを知りません。Careoは今まで書いた全てのES、面接記録、OB訪問の内容、企業のステータスを把握した上でアドバイスします。「あなたがA社に書いたガクチカと、今書いているB社のESで矛盾がある」ような指摘はCareoにしかできません。",
  },
  {
    q: "マイナビやリクナビを使っていても使えますか？",
    a: "はい、Careoはマイナビ・リクナビの代替ではなく補完ツールです。就活サイトで企業を見つけて、管理・AI分析はCareoで。Chrome拡張機能（β）を使えば、就活サイト閲覧中にワンクリックでCareoに企業を追加できます。",
  },
];

// ─── Contact Section ──────────────────────────────────────────────────────────
function ContactSection() {
  const [form, setForm] = useState({ name: "", email: "", category: "question", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setStatus("done");
      setForm({ name: "", email: "", category: "question", message: "" });
    } else {
      const data = await res.json().catch(() => ({}));
      setErrorMsg(data.error ?? "送信に失敗しました。しばらく経ってから再度お試しください。");
      setStatus("error");
    }
  }

  return (
    <section className="px-6 py-20 md:py-28 bg-gray-50/60">
      <div className="max-w-2xl mx-auto reveal">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 border border-gray-200 bg-white text-gray-500 text-xs font-semibold px-4 py-2 rounded-full mb-5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            お問い合わせ
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#0D0B21] tracking-tight mb-3">
            ご意見・ご要望をお聞かせください
          </h2>
          <p className="text-gray-500 text-sm">バグ報告・機能要望・ご質問など、なんでもお気軽にどうぞ。</p>
        </div>

        {status === "done" ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-sm">
            <div className="w-14 h-14 rounded-full bg-[#00c896]/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-[#00c896]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-bold text-[#0D0B21] text-lg mb-1">送信しました！</p>
            <p className="text-gray-500 text-sm">お問い合わせありがとうございます。内容を確認次第ご返信します。</p>
            <button
              onClick={() => setStatus("idle")}
              className="mt-6 text-xs text-gray-400 hover:text-gray-600 underline underline-offset-2 transition-colors"
            >
              別のお問い合わせをする
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  お名前 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="山田 太郎"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00c896]/40 focus:border-[#00c896] transition-all placeholder-gray-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                  メールアドレス <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00c896]/40 focus:border-[#00c896] transition-all placeholder-gray-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">カテゴリ</label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#00c896]/40 focus:border-[#00c896] transition-all bg-white"
              >
                <option value="question">質問・相談</option>
                <option value="feature">機能要望</option>
                <option value="bug">バグ報告</option>
                <option value="other">その他</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                メッセージ <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="ご意見・ご要望・バグの内容などをご記入ください"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#00c896]/40 focus:border-[#00c896] transition-all placeholder-gray-300 resize-none"
              />
              <p className="text-right text-xs text-gray-300 mt-1">{form.message.length} / 2000</p>
            </div>

            {status === "error" && (
              <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{errorMsg}</p>
            )}

            <button
              type="submit"
              disabled={status === "sending"}
              className="w-full bg-[#0D0B21] hover:bg-[#1a1830] disabled:opacity-50 text-white font-bold py-3 rounded-xl text-sm transition-all duration-200 hover:scale-[1.01] flex items-center justify-center gap-2"
            >
              {status === "sending" ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  送信中...
                </>
              ) : (
                "送信する"
              )}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

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
            careoai.jp
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
            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 bg-white/20">
              <img src="/kareo-coach-avatar.svg" alt="カレオコーチ" className="w-full h-full object-cover" />
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

// ─── Testimonials Section ─────────────────────────────────────────────────────
const AVATAR_COLORS = [
  "from-blue-400 to-indigo-500",
  "from-emerald-400 to-teal-500",
  "from-[#00c896] to-emerald-600",
  "from-purple-400 to-pink-500",
  "from-orange-400 to-red-500",
  "from-sky-400 to-blue-500",
];

const FALLBACK_VOICES = [
  {
    quote: "就活のデータがバラバラだったのがCareoで全部つながった感じ。カレオコーチの週次アドバイスが的確すぎて、毎週楽しみになってます。",
    display_name: "M.T.",
    university: "早稲田大学 · 就活生",
    rating: 5,
  },
  {
    quote: "SmartESやリクナビと一緒に使っています。Careoがあることで締切の見落としが完全になくなりました。ESのAIチェックも提出前に必ず使ってます。",
    display_name: "K.S.",
    university: "慶應義塾大学 · 就活生",
    rating: 5,
  },
  {
    quote: "「大学生が一人で作ったの？」って友達に紹介したら驚かれました。無料でここまでできるのが信じられないレベルです。",
    display_name: "A.Y.",
    university: "上智大学 · 就活生",
    rating: 5,
  },
];

function TestimonialsSection({ reviews }: { reviews: UserReview[] }) {
  const voices = reviews.length > 0 ? reviews : FALLBACK_VOICES;
  return (
    <section className="px-6 py-24 bg-gray-50/60 reveal">
      <div className="max-w-4xl mx-auto">
        <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">Voice</p>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 tracking-tight">
          使っている人の<span className="text-[#00c896]">声</span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {voices.map((item, i) => {
            const avatar = item.display_name.charAt(0).toUpperCase();
            const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
            return (
              <div
                key={i}
                className={`bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#00c896]/20 hover:shadow-md transition-all duration-300 hover:-translate-y-1 reveal reveal-delay-${(i % 3) + 1}`}
              >
                <div className="flex gap-0.5 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className={`w-3.5 h-3.5 ${j < item.rating ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-5">&ldquo;{item.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                    {avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0D0B21]">{item.display_name}</p>
                    {item.university && <p className="text-xs text-gray-400">{item.university}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Blog Preview Section ─────────────────────────────────────────────────────
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

const TAG_GRADIENTS: Record<string, [string, string]> = {
  "ES対策":     ["#3b82f6", "#06b6d4"],
  "面接対策":   ["#8b5cf6", "#ec4899"],
  "自己分析":   ["#f97316", "#eab308"],
  "OB\OG訪問": ["#14b8a6", "#10b981"],
  "インターン": ["#22c55e", "#16a34a"],
  "就活管理":   ["#6366f1", "#8b5cf6"],
  "AI就活":     ["#00c896", "#0ea5e9"],
  "筆記試験":   ["#eab308", "#f97316"],
  "業界研究":   ["#f43f5e", "#e11d48"],
};
function getThumbnailColors(tags: string[]): [string, string] {
  for (const tag of tags) {
    if (TAG_GRADIENTS[tag]) return TAG_GRADIENTS[tag];
  }
  return ["#6366f1", "#8b5cf6"];
}
function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
}

function BlogPreviewSection({ posts }: { posts: RecentPost[] }) {
  if (posts.length === 0) return null;
  return (
    <section className="px-6 py-20 md:py-24 bg-gray-50/60" id="blog">
      <div className="max-w-5xl mx-auto reveal">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 border border-[#00c896]/30 bg-[#00c896]/6 text-[#00a87e] text-xs font-semibold px-4 py-2 rounded-full mb-4">
              <span className="w-1.5 h-1.5 bg-[#00c896] rounded-full animate-pulse" />
              毎朝8時更新
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0D0B21] tracking-tight">
              就活ブログ
            </h2>
            <p className="text-gray-500 text-sm mt-2">ES・面接・自己分析・OB訪問のノウハウを毎日発信</p>
          </div>
          <Link
            href="/blog"
            className="hidden md:flex items-center gap-1.5 text-sm font-semibold text-[#00a87e] hover:underline underline-offset-4"
          >
            記事一覧
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {posts.map((post, i) => {
            const [c1, c2] = getThumbnailColors(post.tags);
            return (
            <Link
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-[#00c896]/40 hover:shadow-md transition-all duration-200 flex flex-col"
            >
              {/* CSS生成サムネイル */}
              <div
                className="relative w-full overflow-hidden flex-shrink-0"
                style={{
                  aspectRatio: "1200/630",
                  background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
                }}
              >
                <div style={{ position: "absolute", top: "-30%", right: "-10%", width: "55%", paddingBottom: "55%", borderRadius: "50%", background: "rgba(255,255,255,0.10)" }} />
                <div style={{ position: "absolute", bottom: "-25%", left: "-8%", width: "42%", paddingBottom: "42%", borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
                <div className="absolute top-3 left-3">
                  <span className="text-[10px] font-bold text-white/90 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {post.tags[0] ?? "就活"}
                  </span>
                </div>
                <div className="absolute inset-0 flex items-center px-4 pt-7 pb-8">
                  <p className="text-white font-bold text-xs leading-snug line-clamp-3 drop-shadow-sm">
                    {post.title}
                  </p>
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {post.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${tagStyle(tag)}`}>
                      {tag}
                    </span>
                  ))}
                  {i === 0 && (
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-[#00c896]/10 text-[#00a87e] border-[#00c896]/20">
                      NEW
                    </span>
                  )}
                </div>
                <p className="font-bold text-[#0D0B21] text-sm leading-snug mb-3 group-hover:text-[#00a87e] transition-colors line-clamp-3 flex-1">
                  {post.title}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">{formatDate(post.published_at)}</span>
                  <span className="text-xs text-gray-400">{post.reading_time_min}分</span>
                </div>
              </div>
            </Link>
            );
          })}
        </div>

        <div className="text-center mt-8 md:hidden">
          <Link href="/blog" className="text-sm font-semibold text-[#00a87e] hover:underline">
            記事一覧をすべて見る →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function LandingPage({ recentPosts = [], userCount = 0, reviews = [] }: { recentPosts?: RecentPost[]; userCount?: number; reviews?: UserReview[] }) {
  const [badgeText, setBadgeText] = useState(DEFAULT_BADGE);
  const [heroSubtext, setHeroSubtext] = useState(DEFAULT_HERO_SUBTEXT);
  const [afterItems, setAfterItems] = useState<string[]>(DEFAULT_AFTER_ITEMS);
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());
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
          <nav className="hidden md:flex items-center gap-6">
            {[
              { label: "機能", href: "#features" },
              { label: "比較", href: "#compare" },
              { label: "大学連携", href: "#university" },
              { label: "料金", href: "#pricing" },
              { label: "FAQ", href: "#faq" },
            ].map(({ label, href }) => (
              <a
                key={href}
                href={href}
                className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors"
              >
                {label}
              </a>
            ))}
            <Link href="/blog" className="text-sm text-[#00a87e] hover:text-[#008f6a] font-semibold transition-colors">
              ブログ
            </Link>
          </nav>
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
              <div className="flex items-center gap-3 mb-8">
                <img src="/kareo.png" alt="カレオ" className="w-10 h-auto flex-shrink-0" />
                <div className="inline-flex items-center gap-2 border border-[#00c896]/30 bg-[#00c896]/6 text-[#00a87e] text-xs font-semibold px-4 py-2 rounded-full">
                  <span className="w-1.5 h-1.5 bg-[#00c896] rounded-full animate-pulse" />
                  {badgeText}
                </div>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-6 tracking-tight">
                就活、<br />
                <span className="relative inline-block">
                  <span className="bg-clip-text text-transparent lp-gradient-text-hero">
                    全部知ってる。
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

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                <span className="flex items-center gap-1"><span>📵</span><span>広告・スカウト電話なし</span></span>
                <span className="hidden sm:block">·</span>
                <span className="flex items-center gap-1"><span>💳</span><span>クレカ不要・完全無料</span></span>
                <span className="hidden sm:block">·</span>
                <span className="flex items-center gap-1"><span>🔒</span><span>データは暗号化保存・第三者販売なし</span></span>
              </div>

            </div>

            {/* Right: カレオ mascot hero */}
            <div className="relative hidden md:flex flex-col items-center justify-center px-4">
              {/* Glow behind mascot */}
              <div className="absolute w-80 h-80 rounded-full bg-[#00c896]/12 blur-3xl" />
              <img
                src="/kareo.png"
                alt="カレオ"
                className="relative w-[420px] xl:w-[500px] h-auto drop-shadow-2xl animate-float"
              />
              {/* Speech bubble */}
              <div className="relative -mt-4 bg-white border border-[#00c896]/25 rounded-2xl rounded-tl-none px-5 py-3 shadow-lg max-w-xs">
                <p className="text-sm font-semibold text-[#0D0B21] leading-relaxed">
                  就活データを全部知ってるから、<br />
                  <span className="text-[#00a87e]">本当に必要なアドバイス</span>ができるよ！
                </p>
                <div className="absolute -top-3 left-0 w-4 h-4 bg-white border-l border-t border-[#00c896]/25 rotate-[-35deg] rounded-tl-sm" />
              </div>
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
              <p className="text-3xl md:text-4xl font-bold text-[#0D0B21]">全卒年</p>
              <p className="text-gray-400 text-sm mt-1">対応</p>
            </div>
            {userCount >= 100 && (
              <AnimatedCounter target={userCount} suffix="人" label="が利用中" />
            )}
          </div>
        </div>
      </section>

      {/* ── ChatGPT差別化セクション ─────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-white reveal">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-2xl border border-[#00c896]/25 bg-gradient-to-br from-[#00c896]/5 to-emerald-50/60 p-8">
            <div className="text-center mb-8">
              <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3">Why Not ChatGPT?</p>
              <h2 className="text-2xl md:text-3xl font-bold text-[#0D0B21] tracking-tight leading-snug">
                ChatGPTとは違う、<br />
                <span className="text-[#00c896]">「記憶するAIコーチ」</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white/70 border border-gray-200 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base font-bold text-gray-400">ChatGPT</span>
                  <span className="text-xs bg-gray-100 text-gray-500 font-semibold px-2 py-0.5 rounded-full">汎用AI</span>
                </div>
                <ul className="space-y-2.5">
                  {[
                    "あなたの就活データを知らない",
                    "毎回ゼロから説明し直しが必要",
                    "「あなたのA社のES」を参照できない",
                    "就活全体の矛盾に気づけない",
                  ].map((t) => (
                    <li key={t} className="flex gap-2 text-sm text-gray-500">
                      <span className="text-gray-300 shrink-0 font-bold mt-0.5">✕</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gradient-to-br from-[#00c896]/8 to-emerald-50 border border-[#00c896]/25 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base font-bold text-[#0D0B21]">Careo カレオ</span>
                  <span className="text-xs bg-[#00c896]/15 text-[#00a87e] font-semibold px-2 py-0.5 rounded-full">就活専用AI</span>
                </div>
                <ul className="space-y-2.5">
                  {[
                    "全就活データを把握して個人化提案",
                    "ES・面接・OB訪問を横断して記憶",
                    "過去のESを参照して矛盾を指摘",
                    "「あなたの場合」に最適化したアドバイス",
                  ].map((t) => (
                    <li key={t} className="flex gap-2 text-sm text-[#0D0B21]">
                      <span className="text-[#00c896] shrink-0 font-bold mt-0.5">✓</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* 具体的な通知例 */}
            <div className="bg-[#0D0B21]/4 border border-[#00c896]/15 rounded-xl p-4 mb-5">
              <p className="text-xs font-bold text-[#00a87e] mb-2.5">💡 こんな気づきを、カレオが自動通知します</p>
              <div className="space-y-2">
                {[
                  "「A社のESで書いた強みと、B社の面接で詰められたポイントが一致しています。次の面接前に確認しましょう」",
                  "「OB訪問で聞いた情報を、C社のES志望動機に活かせるポイントがあります」",
                  "「今週はES締切が3件集中しています。優先順位を整理しましょう」",
                ].map((t, i) => (
                  <p key={i} className="text-xs text-gray-600 leading-relaxed border-l-2 border-[#00c896]/30 pl-3 italic">{t}</p>
                ))}
              </div>
            </div>
            <p className="text-center text-xs text-gray-500 leading-relaxed">
              過去のES・面接記録・OB訪問情報を横断して、<br className="hidden md:block" />
              「あなたの場合」に最適化したアドバイスを生成
            </p>
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section id="features" className="px-6 py-24 bg-gray-50/60 reveal">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">How it works</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 tracking-tight">
            使い方は、<span className="text-[#00c896]">シンプル。</span>
          </h2>
          <p className="text-gray-400 text-sm text-center mb-16">記録するだけで、あとはCareoが全部整理する。</p>

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
                  title: "ES・面接・説明会・インターンを記録",
                  desc: "書いたES・受けた面接・参加した説明会やインターン日程を記録。Careoが締切・日程を管理し、忘れないようリマインドする。",
                  tag: "就活のたびに",
                },
                {
                  step: "03",
                  icon: "🤖",
                  title: "AIがすべてを整理",
                  desc: "AIコーチが全データを把握し「今週何をすべきか」を自動提案。4種類のコーチキャラクターから選べるので、自分に合ったスタイルで就活を伴走してもらえる。",
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
                icon: "✍️",
                title: "ES管理・AI添削・チェック",
                desc: "8業界テンプレで作成 → AI添削で人間らしい文章に → 提出前に自己分析との整合性・文体・重複を一括チェック。3ステップ完結。",
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
                icon: "💡",
                title: "自己分析 深掘り12問",
                desc: "「10年後のなりたい姿」「しんどかった瞬間」など12問の深掘り質問＋過去就活生の回答例で、軸・ガクチカ・自己PRを迷わず言語化。",
                tag: "自己分析",
              },
              {
                icon: "📝",
                title: "SPI練習・スコア記録",
                desc: "言語・非言語の練習問題をランダム出題。正答率・成績を毎回記録し、苦手分野を把握。試験種別ごとの記録管理も。",
                tag: "筆記試験対策",
              },
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
          <p className="text-center text-xs text-gray-400 mt-6">
            💡 NotionやスプレッドシートのデータはCSV・PDFで一括インポートできます。切り替えコストほぼゼロ。
          </p>
        </div>
      </section>

      {/* ── 競合比較テーブル ────────────────────────────────────────────────── */}
      <section id="compare" className="px-6 py-24 bg-gray-50/60 reveal">
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
                  { label: "求人情報・スカウト受信", careo: false, base: "△スカウトのみ", smart: false, riku: true, notion: false },
                  { label: "選考進捗を一元管理", careo: true, base: false, smart: false, riku: false, notion: "△手動" },
                  { label: "ES・面接・OB訪問・筆記を記録", careo: true, base: false, smart: false, riku: false, notion: "△手動" },
                  { label: "週次PDCAをAIが自動分析", careo: true, base: false, smart: false, riku: false, notion: false },
                  { label: "ES提出前AIチェック", careo: true, base: false, smart: false, riku: false, notion: false },
                  { label: "データ横断の気づき通知", careo: true, base: false, smart: false, riku: false, notion: false },
                  { label: "全データを把握したAIコーチ", careo: true, base: "△", smart: false, riku: false, notion: false },
                  { label: "ChatGPT連携（就活データを知ったAI）", careo: true, base: false, smart: false, riku: false, notion: false },
                  { label: "キャリアセンターレポート出力", careo: true, base: false, smart: false, riku: false, notion: false },
                  { label: "学生は完全無料", careo: true, base: true, smart: "△制限あり", riku: true, notion: true },
                  { label: "広告・スカウト電話なし", careo: true, base: false, smart: true, riku: false, notion: true },
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
          <div className="text-center mt-6">
            <Link
              href="/compare"
              className="inline-flex items-center gap-2 text-sm text-[#00c896] font-semibold hover:underline"
            >
              他サービスとの詳細比較・Careoが選ばれる理由を見る →
            </Link>
          </div>
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

      {/* ── 楽しくなる新機能 ─────────────────────────────────────────────────── */}
      <section className="px-6 py-24 bg-[#0D0B21] reveal">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">Fun &amp; Engaging</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 tracking-tight text-white">
            記録するのが、<span className="text-[#00c896]">楽しくなる</span>。
          </h2>
          <p className="text-gray-400 text-base text-center mb-12 max-w-xl mx-auto">
            情報を入力するのが楽しく、簡単で、見やすい。<br />
            データが貯まるほど、AIの精度が上がる好循環。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                emoji: "🎉",
                title: "内定でコンフェッティ",
                desc: "内定・インターン合格を記録すると画面いっぱいにお祝い演出。一人でも「やった！」を一緒に喜べる。",
                color: "border-amber-500/20 bg-amber-500/5",
              },
              {
                emoji: "😊",
                title: "感情タグ記録",
                desc: "面接後に「😊楽しかった」「🔥手応えあり」をワンタップ。感情の傾向がAIの週次分析に活用される。",
                color: "border-purple-500/20 bg-purple-500/5",
              },
              {
                emoji: "🏅",
                title: "マイルストーンバッジ",
                desc: "「初ES提出」「初面接通過」「10社登録」など、12種類の達成バッジで就活の進捗を可視化。",
                color: "border-[#00c896]/20 bg-[#00c896]/5",
              },
              {
                emoji: "🗺️",
                title: "就活ジャーニーマップ",
                desc: "WISHLIST→応募→面接→内定まで、自分の就活の旅路がグラフで一目でわかる。「ここまで来た」が実感できる。",
                color: "border-blue-500/20 bg-blue-500/5",
              },
              {
                emoji: "🏃",
                title: "週次コーチセッション",
                desc: "毎週AIが先週を振り返り、今週のフォーカスとアクション3つを提案。感情タグデータも分析に活用。",
                color: "border-indigo-500/20 bg-indigo-500/5",
              },
              {
                emoji: "💬",
                title: "今日のひとこと",
                desc: "あなたの就活状況を把握したAIが、毎日パーソナライズされた一言を届ける。開くのが楽しみになる。",
                color: "border-pink-500/20 bg-pink-500/5",
              },
            ].map((item) => (
              <div key={item.title} className={`border ${item.color} rounded-2xl p-5 hover:scale-[1.02] transition-transform duration-200`}>
                <span className="text-3xl mb-3 block">{item.emoji}</span>
                <p className="font-bold text-white text-sm mb-2">{item.title}</p>
                <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[#00c896] hover:bg-[#00b586] text-white font-bold px-8 py-4 rounded-2xl text-base transition-colors"
            >
              無料で始める → <span className="text-sm font-normal opacity-80">5分でセットアップ</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────────────── */}
      <TestimonialsSection reviews={reviews} />

      {/* ── 大学キャリアセンター連携 ─────────────────────────────────────────── */}
      <section id="university" className="px-6 py-24 bg-white reveal">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">University Partnership</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3 tracking-tight">
            大学キャリアセンターと、<span className="text-[#00c896]">つながる。</span>
          </h2>
          <p className="text-gray-500 text-sm text-center mb-3 max-w-xl mx-auto">
            Careoは大学のキャリアセンターと連携し、学生一人ひとりにより的確な就活サポートを届けることを目指しています。
          </p>
          <div className="flex items-center justify-center gap-2 mb-12">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
              現在、提携大学を準備中
            </span>
          </div>

          {/* 仕組みの図 */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-6">
            {[
              { icon: "🎓", label: "学生", desc: "就活データをCareoに記録・相談予約もCareoから" },
              { icon: "↔", label: "", desc: "", isArrow: true },
              { icon: "📱", label: "Careo", desc: "プラットフォームで安全に連携" },
              { icon: "↔", label: "", desc: "", isArrow: true },
              { icon: "🏫", label: "キャリアセンター", desc: "学生の状況を把握してサポート（月額SaaS）" },
            ].map((item, i) =>
              item.isArrow ? (
                <div key={i} className="text-2xl text-gray-300 hidden md:block">→</div>
              ) : (
                <div key={i} className="flex-1 max-w-[200px] text-center bg-gray-50 border border-gray-100 rounded-2xl p-5">
                  <div className="text-3xl mb-2">{item.icon}</div>
                  <p className="font-bold text-sm text-[#0D0B21] mb-1">{item.label}</p>
                  <p className="text-xs text-gray-400">{item.desc}</p>
                </div>
              )
            )}
          </div>

          {/* 将来的な企業連携への示唆 */}
          <div className="flex items-center justify-center mb-8">
            <div className="inline-flex items-center gap-2 text-xs text-gray-400 bg-gray-50 border border-gray-100 px-4 py-2 rounded-full">
              <span className="text-gray-300">↓</span>
              <span>将来的には<span className="font-semibold text-gray-600">企業</span>も加わり、採用インフラへと発展予定</span>
            </div>
          </div>

          {/* 特徴3点 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            {[
              {
                icon: "🔒",
                title: "学生がコントロール",
                desc: "キャリアセンターへの情報開示はデフォルト公開ですが、項目ごとに非公開に設定できます。選考中の企業・ES内容・フェーズなど、見せたくない情報は自分で管理できます。",
              },
              {
                icon: "🏫",
                title: "自分の大学だけに共有",
                desc: "データが共有されるのは、あなたが在籍する大学のキャリアセンターのみ。他大学やCareoの外部に個人データが出ることはありません。",
              },
              {
                icon: "💬",
                title: "キャリアセンターから連絡も",
                desc: "キャリアセンターのスタッフがCareoを通じてメッセージを送ることができます。的確なタイミングで個別サポートを受けられます。",
              },
            ].map((item) => (
              <div key={item.title} className="bg-gray-50/70 border border-gray-100 rounded-2xl p-6">
                <p className="text-2xl mb-3">{item.icon}</p>
                <p className="font-bold text-[#0D0B21] text-sm mb-2">{item.title}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* 提携予定バナー */}
          <div className="rounded-2xl border border-[#00c896]/20 bg-[#00c896]/4 p-6 text-center">
            <p className="text-sm font-bold text-[#0D0B21] mb-1">提携大学、順次拡大予定</p>
            <p className="text-xs text-gray-500 mb-4">
              現在、複数の大学キャリアセンターと提携に向けた準備を進めています。
              提携が実現した際にはアプリ内でお知らせします。
            </p>
            <div className="inline-flex items-center gap-2 text-xs text-gray-400 bg-white border border-gray-100 px-4 py-2 rounded-full mb-4">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              準備中 — 正式提携はまだありません
            </div>
            <div>
              <Link
                href="/for-career-center"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#00a87e] hover:text-[#00c896] transition-colors"
              >
                🏫 キャリアセンターご担当者様はこちら →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing ────────────────────────────────────────────────────────── */}
      <section id="pricing" className="px-6 py-24 bg-gray-50/60 reveal">
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

          {/* なぜ無料？ */}
          <div className="mt-5 bg-white border border-gray-200 rounded-2xl p-5">
            <p className="text-xs font-bold text-gray-700 mb-2">💡 なぜ無料なのか</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              Careoは<strong className="text-gray-700">学生向け機能を今後も無料で提供し続けること</strong>を基本方針としています。
              将来的には、大学のキャリアセンター向けに就活支援ダッシュボード（B2Bサービス）を展開し、そこからの収益でサービスを維持する予定です。
              <span className="text-[#00a87e] font-semibold">学生のデータが第三者企業に販売されることはありません。</span>
            </p>
            <Link href="/privacy" className="text-xs text-[#00a87e] font-semibold hover:underline mt-2 inline-block">
              プライバシーポリシーを確認する →
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section id="faq" className="px-6 py-24 bg-gray-50/60 reveal">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">FAQ</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 tracking-tight">よくある質問</h2>
          <div className="space-y-2.5">
            {faqItems.map((item, i) => (
              <div
                key={i}
                className={`bg-white border rounded-2xl overflow-hidden transition-all duration-200 ${openFaqs.has(i) ? "border-[#00c896]/40 shadow-sm" : "border-gray-100 hover:border-gray-200"}`}
              >
                <button
                  type="button"
                  className="w-full text-left px-6 py-4 flex items-center justify-between gap-4"
                  onClick={() => setOpenFaqs(prev => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next; })}
                >
                  <span className="font-semibold text-[#0D0B21] text-sm">{item.q}</span>
                  <span className={`text-[#00c896] shrink-0 transition-transform duration-200 ${openFaqs.has(i) ? "rotate-180" : ""}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaqs.has(i) ? "max-h-48" : "max-h-0"}`}>
                  <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-3">
                    {item.a}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust ──────────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-white reveal">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">Trust</p>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-3 tracking-tight">
            安心して使えるサービスを、<br className="hidden md:block" />真剣に作っています。
          </h2>
          <p className="text-gray-500 text-sm text-center mb-10">
            学生が開発しているからこそ、信頼される設計にこだわりました。
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: "📄",
                title: "利用規約・プライバシーポリシーを整備",
                body: "登録前にご確認いただける利用規約とプライバシーポリシーを公開。データの取り扱い方針を明示しています。",
                links: [
                  { label: "利用規約", href: "/terms" },
                  { label: "プライバシーポリシー", href: "/privacy" },
                ],
              },
              {
                icon: "🔒",
                title: "データは自分だけが見られる",
                body: "Supabaseの行レベルセキュリティ（RLS）により、自分のデータには自分だけがアクセスできます。他のユーザーには一切見えません。",
                links: [],
              },
              {
                icon: "🎓",
                title: "就活生目線で誠実に運営",
                body: "広告メール・スカウト電話なし。データを第三者に販売しません。同じ就活生として、使いたいと思えるサービスだけを目指しています。",
                links: [],
              },
            ].map((item) => (
              <div key={item.title} className="bg-gray-50/70 border border-gray-100 rounded-2xl p-6">
                <p className="text-2xl mb-3">{item.icon}</p>
                <p className="font-bold text-[#0D0B21] text-sm mb-2">{item.title}</p>
                <p className="text-gray-500 text-xs leading-relaxed">{item.body}</p>
                {item.links.length > 0 && (
                  <div className="flex gap-3 mt-3">
                    {item.links.map((l) => (
                      <Link key={l.label} href={l.href} target="_blank" className="text-xs text-[#00c896] hover:underline font-medium">
                        {l.label} →
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Our Story ──────────────────────────────────────────────────────── */}
      <section className="px-6 py-24 md:py-32 bg-[#0D0B21] text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none lp-dark-grid-subtle" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-[#00c896]/6 blur-3xl animate-float-slow" />
          <div className="absolute bottom-1/4 right-1/5 w-72 h-72 rounded-full bg-purple-500/5 blur-3xl animate-blob delay-1000" />
          <div className="absolute top-1/2 right-0 w-64 h-64 rounded-full bg-[#00c896]/4 blur-3xl animate-float-slow delay-2000" />
        </div>

        <div className="max-w-3xl mx-auto relative z-10">

          {/* ── セクションヘッダー ── */}
          <div className="text-center mb-16 reveal">
            <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-4">Our Story</p>
            <h2 className="text-3xl md:text-4xl font-bold leading-tight mb-5">
              就活の「非効率」を、<br />
              <span className="bg-clip-text text-transparent lp-gradient-text-dark">終わらせたかった。</span>
            </h2>
            <p className="text-gray-400 text-base leading-relaxed max-w-xl mx-auto">
              Careoは、就活を戦略的に乗り越えたいすべての学生のために<br className="hidden md:block" />
              同じ立場の学生が本気で作ったプロダクトです。
            </p>
          </div>

          {/* ── ストーリーライン ── */}
          <div className="space-y-5 mb-14">

            {/* 01 きっかけ */}
            <div className="lp-story-card rounded-2xl p-6 md:p-8 reveal reveal-delay-1">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#00c896]/15 flex items-center justify-center text-lg">
                  😤
                </div>
                <div>
                  <p className="text-[#00c896] text-xs font-bold tracking-widest uppercase mb-2">01 — きっかけ</p>
                  <h3 className="text-white font-bold text-lg mb-3 leading-snug">
                    ツールを行き来するだけで、<br className="hidden md:block" />時間が溶けていく。
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    就活を始めた当初、企業管理はスプレッドシート、自己分析はNotion、ES添削はChatGPT——
                    それぞれのツールは優秀でも、<strong className="text-gray-200">データがバラバラで連携ゼロ</strong>。
                    「先週の面接で何を言ったか」「どの企業のESが提出済みか」をたどるだけで
                    30分消える、そんな状況でした。
                    就活の本質である「考える・準備する・振り返る」ではなく、
                    <strong className="text-gray-200">「管理する」ことに膨大な時間を奪われていた</strong>のです。
                  </p>
                </div>
              </div>
            </div>

            {/* 02 本質的な問題 */}
            <div className="lp-story-card rounded-2xl p-6 md:p-8 reveal reveal-delay-2">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-purple-500/15 flex items-center justify-center text-lg">
                  🔍
                </div>
                <div>
                  <p className="text-purple-400 text-xs font-bold tracking-widest uppercase mb-2">02 — 本質的な問題</p>
                  <h3 className="text-white font-bold text-lg mb-3 leading-snug">
                    AIに相談しても、<br className="hidden md:block" />「あなたの就活」を知らない。
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    ChatGPTは優秀ですが、<strong className="text-gray-200">あなたが何社受けていて、どの面接でつまずいたか、志望軸は何か</strong>——
                    そういった文脈を知りません。毎回ゼロから説明し直す必要があり、
                    「パーソナライズされたアドバイス」にはほど遠い状態でした。
                    本当に必要なのは、自分のすべてのデータを把握した上で
                    「あなたの就活」に最適化して動いてくれるAIコーチだと気づきました。
                  </p>
                </div>
              </div>
            </div>

            {/* 03 Careoという答え */}
            <div className="rounded-2xl p-6 md:p-8 reveal reveal-delay-3" style={{background: "linear-gradient(135deg, rgba(0,200,150,0.07), rgba(16,185,129,0.1))", border: "1px solid rgba(0,200,150,0.2)"}}>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#00c896]/20 flex items-center justify-center text-lg">
                  ✨
                </div>
                <div>
                  <p className="text-[#00c896] text-xs font-bold tracking-widest uppercase mb-2">03 — Careoという答え</p>
                  <h3 className="text-white font-bold text-lg mb-3 leading-snug">
                    就活のすべてを一か所に。<br className="hidden md:block" />データを知るAIが、隣に立つ。
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    企業管理・ES・面接ログ・自己分析・OB訪問・筆記試験——
                    <strong className="text-gray-200">就活に必要なすべてを一つのプラットフォームに集約</strong>することで、
                    AIがあなたの全データをコンテキストとして持ちながら動けるようになります。
                    「○○社の面接が近いね。前回の面接で志望動機が浅いと言われていたから、
                    今日はそこを一緒に深めよう」——そんなパーソナルなサポートを、
                    誰でも無料で受けられる世界を作りたかった。
                    それが<strong className="text-[#00c896]">Careo</strong>です。
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* ── 開発者プロフィール ── */}
          <div className="lp-story-card rounded-2xl p-6 md:p-8 mb-10 reveal">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-5">
              <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-[#00c896]/15 flex items-center justify-center text-2xl">
                👨‍💻
              </div>
              <div className="flex-1">
                <p className="text-[#00c896] text-xs font-bold tracking-widest uppercase mb-1">Developer</p>
                <p className="text-white font-bold text-base mb-2">上智大学在籍の学生が、ひとりで開発</p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  デザイン・フロントエンド・バックエンド・AI連携・インフラまで、すべてを一人で担当。
                  自分が使いたいと思うプロダクトを、妥協なく作り続けています。
                  就活生ユーザーの声をもとに毎週アップデートを重ねており、
                  <strong className="text-gray-200">「開発者自身が最もヘビーなユーザー」</strong>というスタンスで開発しています。
                </p>
              </div>
            </div>
          </div>

          {/* ── 理念一言 ── */}
          <div className="text-center mb-10 reveal">
            <p className="text-gray-500 text-xs uppercase tracking-widest mb-3">Our Mission</p>
            <p className="text-xl md:text-2xl font-bold text-white leading-relaxed">
              「就活の成否を、情報格差や運ではなく<br className="hidden md:block" />
              <span className="bg-clip-text text-transparent lp-gradient-text-dark">戦略と準備の差で決まるものに。」</span>
            </p>
          </div>

          {/* ── Buy Me a Coffee ── */}
          <div className="rounded-2xl p-6 md:p-8 reveal" style={{background: "linear-gradient(135deg, rgba(251,191,36,0.08), rgba(245,158,11,0.12))", border: "1px solid rgba(251,191,36,0.2)"}}>
            <div className="flex flex-col md:flex-row items-center gap-5 text-center md:text-left">
              <div className="flex-shrink-0 text-4xl">☕</div>
              <div className="flex-1">
                <p className="text-amber-400 text-xs font-bold tracking-widest uppercase mb-1">Support the Dev</p>
                <p className="text-white font-bold text-base mb-1">開発を続けられるのは、皆さんのサポートのおかげです</p>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Careoは完全無料で提供しています。広告なし、制限なし。
                  もし「役に立った」と思ったら、コーヒー1杯分のサポートが開発継続の大きな力になります。
                </p>
              </div>
              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                <a
                  href="https://buymeacoffee.com/careo"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-amber-900 font-bold px-6 py-3 rounded-xl transition-colors text-sm whitespace-nowrap"
                >
                  ☕ Buy me a coffee
                </a>
                <p className="text-amber-500/60 text-xs">¥150〜 / 何度でも</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── Blog Preview ────────────────────────────────────────────────────── */}
      <BlogPreviewSection posts={recentPosts} />

      {/* ── Contact ─────────────────────────────────────────────────────────── */}
      <ContactSection />

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

      {/* ── SNS フォローセクション ───────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-gray-50/60 reveal">
        <div className="max-w-3xl mx-auto">
          <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Follow & Read</p>
          <h2 className="text-center text-xl font-black text-[#0D0B21] mb-8">就活リアルを発信中</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* X カード */}
            <a
              href="https://x.com/hiroki_careo"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-4 bg-[#0D0B21] rounded-2xl p-6 hover:scale-[1.02] transition-transform duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="black"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                </div>
                <div>
                  <div className="text-white font-bold text-sm">@hiroki_careo</div>
                  <div className="text-gray-500 text-xs">毎日更新</div>
                </div>
                <span className="ml-auto text-gray-600 text-xs group-hover:text-white transition-colors">フォロー →</span>
              </div>
              <div className="flex flex-col gap-2">
                {["就活ノウハウ・体験談を毎日投稿", "OB訪問・ES・面接の生の話", "Careo開発ログも発信中"].map(t => (
                  <div key={t} className="flex items-center gap-2 text-gray-400 text-xs">
                    <span className="text-[#1d9bf0]">✓</span>{t}
                  </div>
                ))}
              </div>
            </a>

            {/* Note カード */}
            <a
              href="https://note.com/hiroki_careo"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col gap-4 bg-white border border-gray-200 rounded-2xl p-6 hover:scale-[1.02] hover:border-[#41c9b0]/40 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#41c9b0] rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M20.24 0H3.76A3.76 3.76 0 0 0 0 3.76v16.48A3.76 3.76 0 0 0 3.76 24h16.48A3.76 3.76 0 0 0 24 20.24V3.76A3.76 3.76 0 0 0 20.24 0zM8.95 17.3H6.67V6.7h2.28zm7.08 0h-2.07l-3.36-6.86V17.3H8.32V6.7h2.28l3.16 6.44V6.7h2.27z"/></svg>
                </div>
                <div>
                  <div className="text-[#0D0B21] font-bold text-sm">hiroki_careo</div>
                  <div className="text-gray-400 text-xs">週3本更新</div>
                </div>
                <span className="ml-auto text-gray-400 text-xs group-hover:text-[#41c9b0] transition-colors">読む →</span>
              </div>
              <div className="flex flex-col gap-2">
                {["2000〜3000字の就活ノウハウ記事", "ES・面接・OB訪問の実践テクニック", "Careoの使い方・開発秘話も掲載"].map(t => (
                  <div key={t} className="flex items-center gap-2 text-gray-500 text-xs">
                    <span className="text-[#41c9b0]">✓</span>{t}
                  </div>
                ))}
              </div>
            </a>

          </div>
        </div>
      </section>

      {/* ── キャリアセンター向けフローティングボタン ─────────────────────────── */}
      <Link
        href="/for-career-center"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-white text-[#0D0B21] text-xs font-bold px-4 py-2.5 rounded-full border border-gray-200 shadow-lg hover:border-[#00c896]/40 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200"
      >
        <span className="text-base">🏫</span>
        <span className="hidden sm:inline">大学・キャリアセンターの方へ</span>
        <span className="sm:hidden">大学の方へ</span>
      </Link>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="px-6 py-8 border-t border-gray-100">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/icon-new.svg" alt="Careo" className="w-6 h-6 rounded-lg" />
            <span className="font-bold text-sm text-[#0D0B21]">Careo</span>
            <span className="text-gray-300 text-xs ml-2">© 2026 — 就活管理AIアプリ</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-gray-400">
            <a href="https://x.com/hiroki_careo" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 transition-colors flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
              X
            </a>
            <a href="https://note.com/hiroki_careo" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 transition-colors flex items-center gap-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M20.24 0H3.76A3.76 3.76 0 0 0 0 3.76v16.48A3.76 3.76 0 0 0 3.76 24h16.48A3.76 3.76 0 0 0 24 20.24V3.76A3.76 3.76 0 0 0 20.24 0zM8.95 17.3H6.67V6.7h2.28zm7.08 0h-2.07l-3.36-6.86V17.3H8.32V6.7h2.28l3.16 6.44V6.7h2.27z"/></svg>
              Note
            </a>
            <Link href="/terms" className="hover:text-gray-700 transition-colors">利用規約</Link>
            <Link href="/privacy" className="hover:text-gray-700 transition-colors">プライバシーポリシー</Link>
            <Link href="/login" className="hover:text-gray-700 transition-colors">ログイン</Link>
            <Link href="/signup" className="hover:text-gray-700 transition-colors">新規登録</Link>
          </div>
        </div>
      </footer>

      {/* LP カレオコーチ チャットボット */}
      <LPChatBot />
    </div>
  );
}
