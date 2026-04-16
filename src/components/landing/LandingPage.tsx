"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import type { RecentPost, UserReview } from "@/app/page";
import { LPChatBot } from "@/components/landing/LPChatBot";

// ─── Constants ───────────────────────────────────────────────────────────────
const DEFAULT_BADGE = "あなたの就活を丸ごと知るAIコーチ「カレオ」";
const DEFAULT_HERO_SUBTEXT =
  "就活データ全体を把握したAIが、本当に必要なアドバイスだけを届ける。\nES・面接・OB訪問・筆記試験——すべてを知ったAIだからできること。";

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "name": "Careo",
      "url": "https://careoai.jp",
      "logo": { "@type": "ImageObject", "url": "https://careoai.jp/icon-192.png" },
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
        "自己分析充実度トラッキング",
        "Chrome拡張機能（マイナビ・リクナビ連携）",
        "面接録音AIフィードバック（録音・文字起こし・品質スコアリング）",
        "マイページID/パスワード一括管理",
        "ES通過率コミュニティデータ",
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
    a: "はい、全機能を完全無料でご利用いただけます。クレジットカード不要、メールアドレスだけで今すぐ始められます。学生向け機能は今後も無料を基本方針とします。",
  },
  {
    q: "ChatGPTと何が違うんですか？",
    a: "ChatGPTはあなたの就活データを知りません。Careoは今まで書いた全てのES、面接記録、OB訪問の内容、企業のステータスを把握した上でアドバイスします。面接録音をAIが分析してスコアリングしたり、ES通過率をコミュニティデータで確認することもChatGPTにはできません。",
  },
  {
    q: "スマホでも使えますか？",
    a: "はい、iPhoneでもAndroidでもブラウザから利用できます。ホーム画面に追加するとアプリのように使えます（PWA対応）。",
  },
  {
    q: "マイナビやリクナビを使っていても使えますか？",
    a: "はい、Careoはマイナビ・リクナビの代替ではなく補完ツールです。就活サイトで企業を見つけて、管理・AI分析はCareoで。Chrome拡張機能（β）を使えば、就活サイト閲覧中にワンクリックでCareoに企業を追加できます。",
  },
  {
    q: "27卒・28卒・29卒でも使えますか？",
    a: "はい、卒業予定年度を問わずご利用いただけます。登録時に卒業予定年度を設定すると、その年度・フェーズに合わせたAIコーチングが受けられます。",
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
              <img src="/icon-192.png" alt="" className="w-4 h-4 rounded" />
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

// ─── Main Component ───────────────────────────────────────────────────────────
export function LandingPage({ recentPosts = [], userCount = 0, reviews = [] }: { recentPosts?: RecentPost[]; userCount?: number; reviews?: UserReview[] }) {
  const [badgeText, setBadgeText] = useState(DEFAULT_BADGE);
  const [heroSubtext, setHeroSubtext] = useState(DEFAULT_HERO_SUBTEXT);
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());
  const [scrolled, setScrolled] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    fetch("/api/lp-settings")
      .then((r) => r.json())
      .then((s: Record<string, string>) => {
        if (s.badge_text) setBadgeText(s.badge_text);
        if (s.hero_subtext) setHeroSubtext(s.hero_subtext.replace(/\\n/g, "\n"));
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
            <img src="/icon-192.png" alt="Careo" className="w-8 h-8 rounded-xl" />
            <span className="font-black text-xl tracking-tight">
              <span className="text-[#0D0B21]">Care</span><span className="text-[#00c896]">o</span>
            </span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            {[
              { label: "機能詳細", href: "/features" },
              { label: "キャリアセンター", href: "/for-career-center" },
            ].map(({ label, href }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors"
              >
                {label}
              </Link>
            ))}
            {[
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
                <img src="/kareo/kareo-default.png" alt="カレオ" className="w-10 h-auto flex-shrink-0" />
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
              {/* 手書き風の名前 */}
              <p className="relative text-4xl xl:text-5xl text-[#00c896] mb-3 select-none handwriting-animate -rotate-3">
                カレオくん
              </p>
              <img
                src="/kareo/kareo-default.png"
                alt="カレオくん"
                className="relative w-[460px] xl:w-[560px] h-auto drop-shadow-2xl animate-float"
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

      {/* ── 約束バナー（スカウト・営業電話ゼロ） ───────────────────────────── */}
      <section className="px-6 py-10 bg-[#0D0B21]">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 rounded-2xl border border-white/8 bg-white/4 px-8 py-6">
            <div className="flex-1 text-center md:text-left">
              <p className="text-[#00c896] text-xs font-bold tracking-widest uppercase mb-2">Careoからの約束</p>
              <h2 className="text-xl md:text-2xl font-bold text-white leading-snug">
                スカウトメールも、営業電話も、<br className="hidden md:block" />
                <span className="text-[#00c896]">一切ありません。</span>
              </h2>
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                Careoに登録した情報が企業や第三者に渡ることはありません。<br className="hidden md:block" />
                就活データは、あなたとAIコーチだけのものです。
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 shrink-0">
              {[
                { icon: "📵", label: "スカウト・営業電話", sub: "登録後も一切なし" },
                { icon: "📧", label: "広告・迷惑メール", sub: "送りません" },
                { icon: "🔒", label: "データの第三者販売", sub: "絶対にしません" },
              ].map(({ icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center bg-white/6 rounded-xl px-4 py-3 min-w-[110px]">
                  <span className="text-2xl mb-1">{icon}</span>
                  <span className="text-white text-xs font-bold text-center leading-tight">{label}</span>
                  <span className="text-red-400 text-[10px] font-semibold mt-0.5 line-through opacity-70">{sub}</span>
                </div>
              ))}
            </div>
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
                    "面接録音を分析してフィードバックできない",
                    "ES通過率を企業横断で追跡できない",
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
                    "面接録音をAIが分析しスコアリング",
                    "ES通過率をコミュニティデータで可視化",
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
                  title: "ES・面接・録音・マイページを記録",
                  desc: "書いたES・受けた面接を記録。面接は録音するだけでAIがスコアリング。30社以上のマイページIDもワンクリック管理。",
                  tag: "就活のたびに",
                },
                {
                  step: "03",
                  icon: "🤖",
                  title: "AIがすべてを整理・分析",
                  desc: "AIコーチが全データを把握し「今週何をすべきか」を自動提案。面接録音のフィードバック、ES通過率のコミュニティデータも活用して最適なアドバイスを届ける。",
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
                icon: "🎙️",
                title: "面接録音→AIフィードバック",
                desc: "オンライン面接を録音・アップロードするだけ。AIが回答品質をスコアリングし、設問ごとの分析・コミュニケーションレーダーチャート・改善点と模範回答を提示。",
                tag: "New",
                highlight: true,
              },
              {
                icon: "🔑",
                title: "マイページID一括管理",
                desc: "30社以上のマイページID・パスワードを一元管理。ワンクリックでログインページを開ける。もうブックマークの山に埋もれない。",
                tag: "New",
              },
              {
                icon: "📊",
                title: "ES通過率コミュニティデータ",
                desc: "匿名共有されたESデータからよく聞かれる設問の通過率がわかる。みんなのデータで就活を有利に。",
                tag: "New",
              },
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
            ].map((item: { icon: string; title: string; desc: string; tag: string; highlight?: boolean }, i) => (
              <div
                key={item.title}
                className={`lp-dark-card border rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1 reveal reveal-delay-${(i % 3) + 1} ${
                  item.highlight
                    ? "border-[#00c896]/40 bg-gradient-to-br from-[#00c896]/10 to-transparent hover:border-[#00c896]/60"
                    : "border-white/10 hover:border-[#00c896]/30"
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      item.tag === "New"
                        ? "bg-amber-400/20 text-amber-300"
                        : "bg-[#00c896]/20 text-[#00c896]"
                    }`}>{item.tag}</span>
                    <h3 className="font-bold text-white mt-1">{item.title}</h3>
                  </div>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features link to more ──────────────────────────────────────── */}
      <section className="px-6 py-8 bg-white text-center">
        <Link
          href="/features"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#00a87e] hover:text-[#008f6a] hover:underline underline-offset-4 transition-colors"
        >
          Before/After比較・他サービスとの比較表・全機能一覧を見る
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </section>

      {/* ── Testimonials ───────────────────────────────────────────────────── */}
      <TestimonialsSection reviews={reviews} />

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
                "面接録音AIフィードバック",
                "マイページID一括管理",
                "ES通過率コミュニティデータ",
                "点と点を繋ぐ気づき通知",
                "キャリアセンターレポート出力",
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

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="px-6 py-8 border-t border-gray-100">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/icon-192.png" alt="Careo" className="w-6 h-6 rounded-lg" />
            <span className="font-bold text-sm text-[#0D0B21]">Careo</span>
            <span className="text-gray-300 text-xs ml-2">© 2026 — 就活管理AIアプリ</span>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-xs text-gray-400">
            <Link href="/features" className="hover:text-gray-700 transition-colors">機能詳細</Link>
            <Link href="/for-career-center" className="hover:text-gray-700 transition-colors">キャリアセンター向け</Link>
            <Link href="/blog" className="hover:text-gray-700 transition-colors">ブログ</Link>
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
          </div>
        </div>
      </footer>

      {/* LP カレオコーチ チャットボット */}
      <LPChatBot />
    </div>
  );
}
