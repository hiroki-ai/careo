"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { RecentPost, UserReview } from "@/app/page";
import { LPChatBot } from "@/components/landing/LPChatBot";

// ─── Reveal wrapper ──────────────────────────────────────────────────────────
function Reveal({
  children,
  className,
  delay = 0,
  from = "bottom",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  from?: "bottom" | "left" | "right";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.08 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  const translate =
    from === "left" ? "translateX(-24px)" :
    from === "right" ? "translateX(24px)" :
    "translateY(24px)";
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : translate,
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// ─── FAQ with smooth animation ───────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className="w-full text-left bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden active:scale-[0.99] transition-transform"
    >
      <div className="flex items-center justify-between px-5 py-4 gap-3">
        <p className="font-semibold text-gray-900 text-sm leading-snug">{q}</p>
        <span
          className="text-[#00c896] text-xl shrink-0 transition-transform duration-300"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          +
        </span>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 0.32s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-4">
            <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
          </div>
        </div>
      </div>
    </button>
  );
}

// ─── Phone mockup ────────────────────────────────────────────────────────────
function PhoneMockup() {
  return (
    <div className="relative mx-auto w-[195px]">
      {/* Phone frame */}
      <div
        className="relative rounded-[32px] p-[2px] shadow-2xl shadow-black/50"
        style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.18), rgba(255,255,255,0.04))" }}
      >
        <div className="bg-[#0a0820] rounded-[30px] overflow-hidden border border-white/8">
          {/* Dynamic island */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-20 h-5 bg-black rounded-full" />
          </div>
          {/* App screen */}
          <div className="px-3 pb-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[7px] text-white/40">おはよう 👋</p>
                <p className="text-[10px] font-bold text-white leading-tight">ダッシュボード</p>
              </div>
              <div className="w-6 h-6 rounded-full bg-[#00c896] flex items-center justify-center">
                <span className="text-white text-[8px] font-black">K</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              {[
                { label: "選考中", value: "8", color: "text-teal-400", bg: "bg-teal-400/10 border border-teal-400/20" },
                { label: "ES待ち", value: "3", color: "text-amber-400", bg: "bg-amber-400/10 border border-amber-400/20" },
                { label: "内定", value: "2", color: "text-[#00c896]", bg: "bg-[#00c896]/10 border border-[#00c896]/20" },
                { label: "気になる", value: "12", color: "text-gray-400", bg: "bg-white/5 border border-white/10" },
              ].map((item) => (
                <div key={item.label} className={`${item.bg} rounded-xl p-2 text-center`}>
                  <p className="text-[6px] text-white/40">{item.label}</p>
                  <p className={`text-sm font-black ${item.color}`}>{item.value}</p>
                </div>
              ))}
            </div>

            {/* Coach */}
            <div className="bg-gradient-to-r from-[#00c896]/25 to-emerald-400/10 border border-[#00c896]/20 rounded-xl px-2.5 py-2 mb-2.5 flex items-center gap-2">
              <div className="w-5 h-5 rounded-full bg-[#00c896] flex items-center justify-center shrink-0">
                <span className="text-white text-[7px] font-black">K</span>
              </div>
              <p className="text-[7px] text-white/80 leading-snug">A社・B社のESに共通する強みを発見しました</p>
            </div>

            {/* Next action */}
            <div className="border-l-2 border-red-400 bg-red-400/10 rounded-r-xl px-2 py-1.5">
              <p className="text-[7px] font-black text-red-400 mb-0.5">🔥 緊急</p>
              <p className="text-[7px] text-white/70 leading-snug">トヨタ自動車 ES提出まで2日</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating insight */}
      <div className="absolute -right-12 top-10 bg-white rounded-2xl px-2.5 py-2 shadow-xl w-28 animate-float">
        <div className="flex items-start gap-1.5">
          <span className="text-sm shrink-0">🔮</span>
          <div>
            <p className="text-[8px] font-bold text-gray-900 leading-tight">カレオの気づき</p>
            <p className="text-[7px] text-gray-500 mt-0.5 leading-snug">A社・B社で共通の弱みを発見</p>
          </div>
        </div>
      </div>

      {/* AI badge */}
      <div
        className="absolute -left-12 bottom-14 rounded-xl px-2.5 py-1.5 animate-float-slow bg-gradient-to-br from-[#00c896] to-[#0ea5e9]"
      >
        <div className="flex items-center gap-1.5">
          <span className="text-white text-[9px] font-black">✓</span>
          <div>
            <p className="text-white text-[8px] font-bold leading-tight">AI分析完了</p>
            <p className="text-white/80 text-[7px]">週次PDCA更新</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Data ────────────────────────────────────────────────────────────────────
const painPoints = [
  "Notionやスプレッドシートがごちゃごちゃになってきた",
  "ES締切をカレンダーで管理して、それでも忘れたことがある",
  "「あれ、このES出したっけ？」が起きたことがある",
  "面接のフィードバック、どこに書いたか忘れた",
  "就活全体の進み具合が、なんとなく不安",
];

const steps = [
  {
    icon: "🏢",
    num: "01",
    tag: "最初の1回だけ",
    title: "企業を登録する",
    desc: "受けたい企業をCareoに追加。5分でセットアップ完了。リクナビ・マイナビで見つけた企業を順次追加していくだけ。",
  },
  {
    icon: "📝",
    num: "02",
    tag: "就活のたびに",
    title: "ES・面接・OB訪問を記録",
    desc: "書いたES、受けた面接、会ったOBのメモをCareoに。コピペするだけでOK。Notionからの移行もAIが自動でやってくれる。",
  },
  {
    icon: "🤖",
    num: "03",
    tag: "自動で毎週",
    title: "あとはAIが全部整理する",
    desc: "AIコーチが全データを把握して「今週何をすべきか」を毎週自動提案。4種類のコーチキャラから好みのスタイルで伴走してもらえる。",
  },
];

const differenceItems = [
  {
    icon: "🔮",
    tag: "今すぐ使える",
    title: "点と点を繋ぐ気づき通知",
    desc: "「A社のESで強調した○○と、B社面接での詰められポイントが一致」— ES・面接・OB訪問を横断してカレオが自動通知",
  },
  {
    icon: "📋",
    tag: "今すぐ使える",
    title: "ES提出前AIチェック",
    desc: "自己分析との整合性・AIっぽい文体・過去ESとの重複を提出前に一括確認。内容の矛盾を事前にゼロにする",
  },
  {
    icon: "📈",
    tag: "近日公開",
    title: "進捗ベンチマーク",
    desc: "「同期のCareoユーザー平均応募数は12社。あなたは3社」— 匿名統計でリアルな立ち位置を可視化",
  },
  {
    icon: "🎓",
    tag: "近日公開",
    title: "キャリアセンター連携",
    desc: "就活の全データをPDF1枚にまとめ、大学のキャリアセンターに持参。支援を最大限引き出せる",
  },
  {
    icon: "👥",
    tag: "近日公開",
    title: "友達と就活グループ",
    desc: "就活仲間とグループを作り、お互いの進捗を匿名共有。切磋琢磨しながら就活を乗り越えよう",
  },
];

const beforeItems = [
  "Notion/スプレッドシートがごちゃごちゃ",
  "ES締切をカレンダーで管理→それでも忘れる",
  "ChatGPTに毎回ゼロから説明し直し",
  "面接のフィードバックがどこにあるかわからない",
  "就活全体が見えなくて漠然と不安",
];

const afterItems = [
  "企業・ES・面接・OB訪問が全部一か所",
  "締切3日前に自動通知。見落としゼロ",
  "カレオコーチが全データを把握して個人化提案",
  "面接の振り返りがすぐ呼び出せる",
  "今週やることが毎週自動で届く",
];

const features = [
  {
    icon: "📅",
    title: "締切自動通知",
    desc: "ES・面接の締切を3日前に通知。見落としゼロ。",
    grad: "from-blue-500/20 to-cyan-400/10",
    border: "border-blue-100",
  },
  {
    icon: "🤖",
    title: "AIコーチング",
    desc: "4キャラのAIコーチから選んで就活PDCAを自動分析。",
    grad: "from-[#00c896]/20 to-emerald-400/10",
    border: "border-emerald-100",
  },
  {
    icon: "✍️",
    title: "ES管理・AI添削",
    desc: "8業界テンプレで作成→AI添削→提出前チェックまで一気通貫。",
    grad: "from-purple-500/20 to-pink-400/10",
    border: "border-purple-100",
  },
  {
    icon: "💡",
    title: "自己分析 深掘り",
    desc: "12問の深掘り質問＋過去就活生の回答例で、軸を言語化。",
    grad: "from-orange-400/20 to-amber-300/10",
    border: "border-orange-100",
  },
  {
    icon: "📝",
    title: "SPI練習問題",
    desc: "言語・非言語の練習問題でスコアを記録。苦手分野を把握。",
    grad: "from-yellow-400/20 to-lime-300/10",
    border: "border-yellow-100",
  },
  {
    icon: "📊",
    title: "進捗ダッシュボード",
    desc: "全企業の選考状況がひと目でわかる。",
    grad: "from-amber-400/20 to-orange-400/10",
    border: "border-amber-100",
  },
];

const comparisonRows = [
  { label: "締切自動通知", notion: "❌", careo: "✅" },
  { label: "AIコーチング", notion: "❌", careo: "✅" },
  { label: "選考進捗管理", notion: "△ 手動", careo: "✅" },
  { label: "ES AI添削・チェック", notion: "❌", careo: "✅" },
  { label: "自己分析 深掘り12問", notion: "❌", careo: "✅" },
  { label: "SPI練習・スコア記録", notion: "❌", careo: "✅" },
  { label: "自由なメモ・資料", notion: "✅", careo: "△" },
  { label: "完全無料", notion: "△ 制限あり", careo: "✅" },
];

const faqs = [
  {
    q: "無料で使えますか？",
    a: "はい、全機能を完全無料でご利用いただけます。クレジットカード不要。メールアドレスだけで今すぐ始められます。学生向けの機能は今後も無料を基本方針とします。将来的に大学キャリアセンターや企業向けのサービスを追加する可能性があります。",
  },
  {
    q: "スマホでも使えますか？",
    a: "はい、iPhoneでもAndroidでもブラウザから利用できます。ホーム画面に追加するとアプリのように使えます（PWA対応）。",
  },
  {
    q: "NotionのデータをCareoに移せますか？",
    a: "できます。CSVやPDFをアップロードするとAIが自動抽出して一括インポート。手入力ゼロで移行できます。",
  },
  {
    q: "ChatGPTと何が違うんですか？",
    a: "ChatGPTはあなたの就活データを知りません。Careoは今まで書いた全てのES、面接記録、OB訪問の内容、企業のステータスを把握した上でアドバイスします。「あなたがA社に書いたガクチカと、今書いているB社のESで矛盾がある」ような指摘はCareoにしかできません。",
  },
  {
    q: "BaseMeやSmartESとの違いは？",
    a: "BaseMe・SmartESは特定機能（スカウト・ES生成）に特化しています。Careoは就活全体のデータを把握したAIコーチが、横断した気づきを届けます。組み合わせて使うのがベスト。",
  },
  {
    q: "マイナビやリクナビを使っていても使えますか？",
    a: "はい、Careoはマイナビ・リクナビの代替ではなく補完ツールです。就活サイトで企業を見つけて、管理・AI分析はCareoで。Chrome拡張機能（β）を使えば、就活サイト閲覧中にワンクリックでCareoに企業を追加できます。",
  },
];

const TAG_COLORS: Record<string, string> = {
  "ES対策": "bg-blue-50 text-blue-600",
  "面接対策": "bg-purple-50 text-purple-600",
  "自己分析": "bg-orange-50 text-orange-600",
  "OB/OG訪問": "bg-teal-50 text-teal-600",
  "インターン": "bg-green-50 text-green-600",
  "就活管理": "bg-indigo-50 text-indigo-600",
  "AI就活": "bg-[#00c896]/10 text-[#00a87e]",
  "筆記試験": "bg-yellow-50 text-yellow-600",
  "業界研究": "bg-rose-50 text-rose-600",
};

const TAG_GRADIENTS: Record<string, [string, string]> = {
  "ES対策":     ["#3b82f6", "#06b6d4"],
  "面接対策":   ["#8b5cf6", "#ec4899"],
  "自己分析":   ["#f97316", "#eab308"],
  "OB/OG訪問": ["#14b8a6", "#10b981"],
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

// ─── Mobile Voice Section ─────────────────────────────────────────────────────
const MOBILE_AVATAR_COLORS = [
  "from-blue-400 to-indigo-500",
  "from-emerald-400 to-teal-500",
  "from-[#00c896] to-emerald-600",
  "from-purple-400 to-pink-500",
  "from-orange-400 to-red-500",
];

const MOBILE_FALLBACK_VOICES = [
  {
    quote: "就活のデータがバラバラだったのがCareoで全部つながった感じ。カレオコーチの週次アドバイスが的確すぎて、毎週楽しみになってます。",
    display_name: "M.T.",
    university: "早稲田大学 · 就活生",
    rating: 5,
  },
  {
    quote: "Careoがあることで締切の見落としが完全になくなりました。ESのAIチェックも提出前に必ず使ってます。",
    display_name: "K.S.",
    university: "慶應義塾大学 · 就活生",
    rating: 5,
  },
  {
    quote: "無料でここまでできるのが信じられないレベルです。友達に紹介したら「大学生が作ったの？」って驚かれました。",
    display_name: "A.Y.",
    university: "上智大学 · 就活生",
    rating: 5,
  },
];

function MobileVoiceSection({ reviews }: { reviews: UserReview[] }) {
  const voices = reviews.length > 0 ? reviews : MOBILE_FALLBACK_VOICES;
  return (
    <section className="px-6 py-14 bg-gray-50">
      <Reveal className="mb-6">
        <p className="text-[#00c896] text-[10px] font-black tracking-widest uppercase mb-2">Voice</p>
        <h2 className="text-3xl font-black text-gray-900 leading-tight">使っている人の声</h2>
      </Reveal>
      <div className="space-y-3">
        {voices.slice(0, 3).map((item, i) => {
          const avatar = item.display_name.charAt(0).toUpperCase();
          const color = MOBILE_AVATAR_COLORS[i % MOBILE_AVATAR_COLORS.length];
          return (
            <Reveal key={i} delay={i * 60}>
              <div className="bg-white rounded-2xl p-5 border border-gray-100">
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <svg key={j} className={`w-3 h-3 ${j < item.rating ? "text-amber-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-700 leading-relaxed mb-4">&ldquo;{item.quote}&rdquo;</p>
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                    {avatar}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#0D0B21]">{item.display_name}</p>
                    {item.university && <p className="text-[10px] text-gray-400">{item.university}</p>}
                  </div>
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function MobileLandingPage({ recentPosts = [], userCount = 0, reviews = [] }: { recentPosts?: RecentPost[]; userCount?: number; reviews?: UserReview[] }) {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const h = () => {
      const sy = window.scrollY;
      setScrollY(sy);
    };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">

      {/* ── Sticky header ──────────────────────────────────────────────────── */}
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrollY > 50 ? "rgba(255,255,255,0.92)" : "transparent",
          backdropFilter: scrollY > 50 ? "blur(16px)" : "none",
          borderBottom: scrollY > 50 ? "1px solid rgba(0,0,0,0.06)" : "none",
        }}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <img src="/icon-192.png" alt="Careo" className="w-7 h-7 rounded-xl" />
            <span
              className="font-bold text-base tracking-tight transition-colors duration-300"
              style={{ color: scrollY > 50 ? "#0D0B21" : "#ffffff" }}
            >
              Careo
            </span>
          </div>
          <Link
            href="/signup"
            className="text-xs text-white font-bold px-4 py-2.5 rounded-xl bg-[#00c896] shadow-md shadow-[#00c896]/30 active:scale-95 transition-transform"
          >
            無料で始める
          </Link>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col justify-center px-6 pt-24 pb-20 bg-[#0D0B21] overflow-hidden">
        {/* ambient glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#00c896]/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-20 right-0 w-56 h-56 rounded-full bg-indigo-500/10 blur-[70px] pointer-events-none" />
        <div className="absolute top-20 left-0 w-40 h-40 rounded-full bg-[#00c896]/5 blur-[50px] pointer-events-none" />

        {/* badge */}
        <div className="inline-flex items-center gap-2 bg-[#00c896]/10 border border-[#00c896]/20 rounded-full px-3 py-1.5 mb-6 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00c896] animate-pulse" />
          <span className="text-[#00c896] text-xs font-semibold tracking-wide">あなたの就活を丸ごと知るAIコーチ「カレオ」</span>
        </div>

        {/* headline + カレオ */}
        <div className="relative mb-5 pr-44">
          <h1 className="font-black text-white leading-[1.1] tracking-tight" style={{ fontSize: "clamp(2.5rem,11vw,3.5rem)" }}>
            就活、<br />
            <span className="text-[#00c896]">全部知ってる。</span>
          </h1>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/kareo.png"
            alt="カレオ"
            className="absolute -right-4 bottom-0 w-48 h-auto animate-float drop-shadow-xl"
          />
        </div>

        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          ES・面接・OB訪問・筆記試験——あなたの就活データを全部把握したAIが、本当に必要なアドバイスだけを届ける。
        </p>

        <Link
          href="/signup"
          className="flex items-center justify-center gap-2 bg-[#00c896] text-white font-bold text-base px-6 py-4 rounded-2xl shadow-xl shadow-[#00c896]/40 active:scale-95 transition-transform w-full mb-3"
        >
          無料で始める →
        </Link>
        {/* 約束バナー */}
        <div className="border border-white/10 bg-white/5 rounded-2xl px-4 py-3 mb-5">
          <p className="text-[#00c896] text-[10px] font-bold tracking-widest uppercase mb-2">Careoからの約束</p>
          <div className="flex gap-3">
            {[
              { icon: "📵", text: "スカウト・営業電話なし" },
              { icon: "📧", text: "広告メールなし" },
              { icon: "🔒", text: "データ販売なし" },
            ].map(({ icon, text }) => (
              <div key={text} className="flex-1 flex flex-col items-center gap-1 bg-white/5 rounded-xl py-2 px-1">
                <span className="text-lg">{icon}</span>
                <span className="text-white text-[9px] font-semibold text-center leading-tight">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Phone mockup */}
        <div className="px-8">
          <PhoneMockup />
        </div>

        {/* scroll hint */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
          <div className="w-5 h-8 rounded-full border border-gray-500 flex items-start justify-center pt-1.5">
            <div className="w-1 h-1.5 rounded-full bg-gray-400 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ── Pain ───────────────────────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-gray-50">
        <Reveal className="mb-8">
          <p className="text-[#00c896] text-[10px] font-black tracking-widest uppercase mb-2">Before Careo</p>
          <h2 className="text-3xl font-black text-gray-900 leading-tight">
            こんな経験、<br />ない？
          </h2>
        </Reveal>

        <div className="space-y-4 mb-10">
          {painPoints.map((text, i) => (
            <Reveal key={text} delay={i * 70} from="left">
              <div className="flex items-start gap-3 bg-white rounded-2xl px-4 py-3.5 border border-gray-100 shadow-sm">
                <span className="w-5 h-5 rounded-full bg-red-50 border border-red-100 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-red-400 text-[10px] font-bold">✓</span>
                </span>
                <p className="text-gray-700 text-sm leading-relaxed">{text}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal>
          <div className="bg-[#0D0B21] rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-[#00c896]/20 blur-xl pointer-events-none" />
            <p className="text-white font-black text-lg mb-1 relative">全部、Careoで解決できる。</p>
            <p className="text-gray-400 text-xs relative">記録するだけで、あとはCareoが全部整理する。</p>
          </div>
        </Reveal>
      </section>

      {/* ── ChatGPT 差別化 ──────────────────────────────────────────────────── */}
      <section className="px-6 py-14 bg-white">
        <Reveal>
          <div className="rounded-2xl border border-[#00c896]/20 bg-gradient-to-br from-[#00c896]/5 to-emerald-50/50 p-6">
            <p className="text-[#00c896] text-[10px] font-black tracking-widest uppercase mb-3">Why Not ChatGPT?</p>
            <h2 className="text-2xl font-black text-[#0D0B21] leading-tight mb-6">
              ChatGPTとは違う、<br /><span className="text-[#00c896]">「記憶するAIコーチ」</span>
            </h2>
            <div className="space-y-3">
              <div className="bg-white/80 border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-bold text-gray-400">ChatGPT</span>
                  <span className="text-[9px] bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded-full">汎用AI</span>
                </div>
                <ul className="space-y-2">
                  {[
                    "あなたの就活データを知らない",
                    "毎回ゼロから説明し直しが必要",
                    "就活全体の矛盾に気づけない",
                  ].map((t) => (
                    <li key={t} className="flex gap-2 text-xs text-gray-500">
                      <span className="text-gray-300 shrink-0 font-bold">✕</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-gradient-to-br from-[#00c896]/8 to-emerald-50 border border-[#00c896]/25 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm font-bold text-[#0D0B21]">Careo カレオ</span>
                  <span className="text-[9px] bg-[#00c896]/15 text-[#00a87e] font-bold px-2 py-0.5 rounded-full">就活専用AI</span>
                </div>
                <ul className="space-y-2">
                  {[
                    "全就活データを把握して個人化提案",
                    "ES・面接・OB訪問を横断して記憶",
                    "「あなたのA社のES」を参照できる",
                  ].map((t) => (
                    <li key={t} className="flex gap-2 text-xs text-[#0D0B21]">
                      <span className="text-[#00c896] shrink-0 font-bold">✓</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {/* 具体的な通知例 */}
            <div className="bg-[#0D0B21]/4 border border-[#00c896]/15 rounded-xl p-4 mt-3">
              <p className="text-xs font-bold text-[#00a87e] mb-2">💡 こんな気づきをカレオが自動通知</p>
              <div className="space-y-1.5">
                {[
                  "「A社のESとB社の面接で矛盾を発見しました」",
                  "「OB訪問の情報をC社のESに活かせます」",
                  "「今週ES締切が3件集中しています」",
                ].map((t, i) => (
                  <p key={i} className="text-[11px] text-gray-600 leading-relaxed border-l-2 border-[#00c896]/30 pl-2.5 italic">{t}</p>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-gray-50">
        <Reveal className="mb-10">
          <p className="text-[#00c896] text-[10px] font-black tracking-widest uppercase mb-2">How it works</p>
          <h2 className="text-3xl font-black text-gray-900 leading-tight">
            使い方は、<br />
            <span className="text-[#00c896]">シンプル。</span>
          </h2>
        </Reveal>

        <div className="space-y-0">
          {steps.map((step, i) => (
            <Reveal key={step.num} delay={i * 120}>
              <div className="flex gap-4">
                {/* left: icon + connector */}
                <div className="flex flex-col items-center w-12 shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-[#00c896]/10 flex items-center justify-center text-2xl border border-[#00c896]/10">
                    {step.icon}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-0.5 flex-1 min-h-[32px] bg-gradient-to-b from-[#00c896]/30 to-transparent my-2" />
                  )}
                </div>
                {/* right: content */}
                <div className="pb-8 pt-0.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black text-[#00c896] tracking-widest">{step.num}</span>
                    <span className="text-[9px] bg-[#00c896]/10 text-[#00a87e] font-bold px-2 py-0.5 rounded-full">{step.tag}</span>
                  </div>
                  <h3 className="font-black text-gray-900 text-lg mt-0.5 mb-1.5 leading-snug">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── The Careo Difference ───────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-[#0D0B21] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-[#00c896]/6 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-indigo-600/5 blur-3xl" />
        </div>
        <div className="relative">
          <Reveal>
            <p className="text-[#00c896] text-[10px] font-black tracking-widest uppercase mb-2">The Careo Difference</p>
            <h2 className="text-3xl font-black text-white leading-tight mb-3">
              就活AIは「点」を解決する。<br />
              <span className="text-[#00c896]">Careoは「全体」をコーチする。</span>
            </h2>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              SmartESはES生成のみ。REALMEは面接練習のみ。BaseMeはスカウトのみ。<br />
              全データを知った上でアドバイスするAIは、Careoだけ。
            </p>
          </Reveal>

          <div className="space-y-3">
            {differenceItems.map((item, i) => (
              <Reveal key={item.title} delay={i * 70}>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-3">
                  <span className="text-2xl shrink-0 mt-0.5">{item.icon}</span>
                  <div className="min-w-0">
                    <span
                      className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full mb-1.5 ${
                        item.tag === "近日公開"
                          ? "bg-indigo-500/20 text-indigo-300"
                          : "bg-[#00c896]/20 text-[#00c896]"
                      }`}
                    >
                      {item.tag}
                    </span>
                    <h3 className="font-black text-white text-sm mb-1 leading-snug">{item.title}</h3>
                    <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-white">
        <Reveal className="mb-8">
          <p className="text-[#00c896] text-[10px] font-black tracking-widest uppercase mb-2">Features</p>
          <h2 className="text-3xl font-black text-gray-900 leading-tight">
            就活に必要なものが<br />全部ここにある。
          </h2>
        </Reveal>

        <div className="grid grid-cols-2 gap-3">
          {features.map((f, i) => (
            <Reveal key={f.title} delay={i * 60}>
              <div className={`bg-gradient-to-br ${f.grad} border ${f.border} rounded-2xl p-4 h-full`}>
                <span className="text-2xl mb-3 block">{f.icon}</span>
                <p className="font-black text-gray-900 text-sm mb-1.5 leading-snug">{f.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── 楽しくなる新機能 ────────────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-[#0D0B21] overflow-hidden">
        <Reveal className="mb-8">
          <p className="text-[#00c896] text-[10px] font-black tracking-widest uppercase mb-2">Fun & Engaging</p>
          <h2 className="text-3xl font-black text-white leading-tight">
            就活が、<br /><span className="text-[#00c896]">楽しくなる</span>仕掛け
          </h2>
          <p className="text-gray-400 text-sm mt-3 leading-relaxed">
            記録するのが楽しくなると、データが貯まる。<br />データが貯まると、AIの精度が上がる。
          </p>
        </Reveal>
        <div className="space-y-3">
          {[
            {
              emoji: "🏆",
              title: "内定でコンフェッティ演出",
              desc: "内定・インターン合格のステータスを記録するとお祝い演出。小さな達成を一緒に喜ぶ。",
              color: "from-amber-500/20 to-yellow-400/10 border-amber-500/20",
            },
            {
              emoji: "😊",
              title: "感情タグで面接を記録",
              desc: "面接後に「😊楽しかった」「🔥手応えあり」をワンタップ。感情パターンがAI分析に活かされる。",
              color: "from-purple-500/20 to-pink-400/10 border-purple-500/20",
            },
            {
              emoji: "🏅",
              title: "マイルストーンバッジ",
              desc: "「初ES提出」「初面接通過」「10社登録」など、就活の節目を達成バッジで可視化。",
              color: "from-[#00c896]/20 to-emerald-400/10 border-[#00c896]/20",
            },
            {
              emoji: "🗺️",
              title: "就活ジャーニーマップ",
              desc: "WISHLIST→応募→面接→内定まで、自分の就活の旅路がグラフで一目でわかる。",
              color: "from-blue-500/20 to-cyan-400/10 border-blue-500/20",
            },
            {
              emoji: "🏃",
              title: "週次コーチセッション",
              desc: "毎週AIが先週を振り返り、今週のフォーカスとアクションを3つ提案。感情データも分析に活用。",
              color: "from-indigo-500/20 to-violet-400/10 border-indigo-500/20",
            },
          ].map((item, i) => (
            <Reveal key={item.title} delay={i * 60}>
              <div className={`bg-gradient-to-br ${item.color} border rounded-2xl p-4 flex gap-3`}>
                <span className="text-3xl shrink-0">{item.emoji}</span>
                <div>
                  <p className="font-black text-white text-sm mb-1">{item.title}</p>
                  <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Before / After ─────────────────────────────────────────────────── */}
      <section className="px-6 py-14 bg-gray-50">
        <Reveal className="mb-8">
          <p className="text-[#00c896] text-[10px] font-black tracking-widest uppercase mb-2">Before / After</p>
          <h2 className="text-3xl font-black text-gray-900 leading-tight">
            Careoを使うと、<br /><span className="text-[#00c896]">何が変わる？</span>
          </h2>
        </Reveal>

        <div className="space-y-3">
          <Reveal from="left">
            <div className="bg-white border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">😮‍💨</span>
                <p className="font-black text-gray-600 text-sm">今まで</p>
              </div>
              <ul className="space-y-2.5">
                {beforeItems.map((t) => (
                  <li key={t} className="flex gap-2.5 text-xs text-gray-500">
                    <span className="text-gray-300 shrink-0 font-bold mt-0.5">−</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal from="right" delay={100}>
            <div className="bg-gradient-to-br from-[#00c896]/6 to-emerald-50 border border-[#00c896]/20 rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">🚀</span>
                <p className="font-black text-[#0D0B21] text-sm">Careoを使ったら</p>
              </div>
              <ul className="space-y-2.5">
                {afterItems.map((t) => (
                  <li key={t} className="flex gap-2.5 text-xs text-[#0D0B21]">
                    <span className="text-[#00c896] shrink-0 font-bold mt-0.5">✓</span>{t}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── Comparison ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-white">
        <Reveal className="mb-8">
          <p className="text-[#00c896] text-[10px] font-black tracking-widest uppercase mb-2">Compare</p>
          <h2 className="text-3xl font-black text-gray-900 leading-tight mb-2">
            Notionと<br />何が違うの？
          </h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Notionは自由度が高くて便利。<br />でも、就活専用AIは持っていない。
          </p>
        </Reveal>

        <Reveal>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-100">
              <div className="p-3" />
              <div className="p-3 text-center border-r border-gray-100">
                <p className="text-[11px] font-bold text-gray-400">Notion</p>
              </div>
              <div className="p-3 text-center bg-[#00c896]/5">
                <p className="text-[11px] font-bold text-[#00c896]">Careo</p>
              </div>
            </div>
            {comparisonRows.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-3 border-b border-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/40"}`}
              >
                <div className="p-3 border-r border-gray-50">
                  <p className="text-xs text-gray-700 font-medium leading-snug">{row.label}</p>
                </div>
                <div className="p-3 text-center border-r border-gray-50">
                  <p className="text-sm text-gray-400">{row.notion}</p>
                </div>
                <div className="p-3 text-center bg-[#00c896]/5">
                  <p className="text-sm">{row.careo}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 text-center mt-3 leading-relaxed px-2">
            Notionで書いた企業研究メモは消さなくてOK。<br />Careoは「管理・AI分析の部分だけ」担当します。
          </p>
        </Reveal>
      </section>

      {/* ── Social proof / mini CTA ────────────────────────────────────────── */}
      <section className="px-6 py-12 bg-gray-50">
        <Reveal>
          <div className="bg-gradient-to-br from-[#00c896]/8 to-emerald-50 border border-[#00c896]/15 rounded-3xl p-6 text-center">
            <p className="text-4xl font-black text-[#00c896] mb-1">無料</p>
            <p className="text-gray-900 font-bold text-base mb-1">全機能を完全無料で使える</p>
            <p className="text-gray-400 text-xs mb-6 leading-relaxed">
              クレジットカード不要。<br />メールアドレスだけで今すぐ始められる。
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-[#00c896] text-white font-bold px-6 py-3.5 rounded-xl shadow-lg shadow-[#00c896]/25 active:scale-95 transition-transform text-sm w-full"
            >
              今すぐ無料で始める →
            </Link>
          </div>

          {/* なぜ無料？ */}
          <div className="mt-4 bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-700 mb-1.5">💡 なぜ無料なのか</p>
            <p className="text-xs text-gray-500 leading-relaxed">
              学生向け機能は今後も無料を基本方針とします。将来的に大学キャリアセンター向けのB2Bサービスで収益化予定。
              <span className="text-[#00a87e] font-semibold">学生のデータが第三者に販売されることはありません。</span>
            </p>
            <Link href="/privacy" className="text-xs text-[#00a87e] font-semibold mt-1.5 inline-block">
              プライバシーポリシー →
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── Career Center ──────────────────────────────────────────────────── */}
      <section className="px-6 py-10 bg-white">
        <Reveal>
          <div className="rounded-2xl border border-[#00c896]/20 bg-gradient-to-br from-[#00c896]/5 to-emerald-50/40 p-5">
            <div className="flex items-start gap-3 mb-4">
              <span className="text-2xl shrink-0">🏫</span>
              <div>
                <span className="inline-block text-[9px] bg-indigo-500/15 text-indigo-500 font-bold px-2 py-0.5 rounded-full mb-1">大学・キャリアセンター向け</span>
                <h3 className="font-black text-[#0D0B21] text-base leading-snug">Careoは大学との連携を準備中</h3>
              </div>
            </div>
            <p className="text-gray-500 text-xs leading-relaxed mb-4">
              学生のCareoデータをPDF1枚にまとめ、キャリアセンターとの面談を効率化。現在、複数の大学と提携に向けた準備を進めています。
            </p>
            <Link
              href="/for-career-center"
              className="inline-flex items-center gap-1.5 text-sm font-bold text-[#00a87e] active:opacity-70 transition-opacity"
            >
              キャリアセンターご担当者様はこちら →
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ── Voice ──────────────────────────────────────────────────────────── */}
      <MobileVoiceSection reviews={reviews} />

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-white">
        <Reveal className="mb-8">
          <p className="text-[#00c896] text-[10px] font-black tracking-widest uppercase mb-2">FAQ</p>
          <h2 className="text-3xl font-black text-gray-900 leading-tight">よくある質問</h2>
        </Reveal>
        <div className="space-y-3">
          {faqs.map((faq) => (
            <FaqItem key={faq.q} q={faq.q} a={faq.a} />
          ))}
        </div>
      </section>

      {/* ── Blog Preview ───────────────────────────────────────────────────── */}
      {recentPosts.length > 0 && (
        <section className="px-5 py-14 bg-gray-50">
          <Reveal className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 bg-[#00c896]/8 text-[#00a87e] text-[10px] font-bold px-3 py-1 rounded-full mb-2">
                  <span className="w-1 h-1 bg-[#00c896] rounded-full animate-pulse" />
                  毎朝8時更新
                </div>
                <h2 className="text-2xl font-black text-gray-900">就活ブログ</h2>
              </div>
              <Link href="/blog" className="text-xs font-bold text-[#00a87e]">
                一覧 →
              </Link>
            </div>
          </Reveal>
          <div className="space-y-3">
            {recentPosts.map((post, i) => {
              const [c1, c2] = getThumbnailColors(post.tags);
              return (
              <Reveal key={post.id} delay={i * 80}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="block bg-white rounded-2xl border border-gray-100 overflow-hidden active:scale-[0.99] transition-transform"
                >
                  <div
                    className="relative w-full overflow-hidden"
                    style={{ aspectRatio: "1200/630", background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)` }}
                  >
                    <div style={{ position: "absolute", top: "-30%", right: "-10%", width: "55%", paddingBottom: "55%", borderRadius: "50%", background: "rgba(255,255,255,0.10)" }} />
                    <div style={{ position: "absolute", bottom: "-25%", left: "-8%", width: "42%", paddingBottom: "42%", borderRadius: "50%", background: "rgba(255,255,255,0.07)" }} />
                    <div className="absolute top-3 left-3">
                      <span className="text-[10px] font-bold text-white/90 bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                        {post.tags[0] ?? "就活"}
                      </span>
                    </div>
                    <div className="absolute inset-0 flex items-center px-4 pt-7 pb-8">
                      <p className="text-white font-bold text-xs leading-snug line-clamp-3 drop-shadow-sm">{post.title}</p>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 flex items-center gap-1.5 px-4 py-2 border-t border-white/20">
                      <img src="/icon-192.png" alt="" className="w-3 h-3 brightness-0 invert opacity-80" />
                      <span className="text-[9px] text-white/80 font-semibold">Careo</span>
                      <span className="text-[9px] text-white/50 ml-auto">{post.reading_time_min}分で読める</span>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      {post.tags.slice(0, 1).map((tag) => (
                        <span key={tag} className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TAG_COLORS[tag] ?? "bg-gray-100 text-gray-600"}`}>
                          {tag}
                        </span>
                      ))}
                      {i === 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#00c896]/10 text-[#00a87e]">NEW</span>
                      )}
                    </div>
                    <p className="text-sm font-bold text-gray-900 leading-snug line-clamp-2">{post.title}</p>
                    <p className="text-[10px] text-gray-400 mt-1.5">{post.reading_time_min}分で読める</p>
                  </div>
                </Link>
              </Reveal>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="px-6 py-24 bg-[#0D0B21] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#00c896]/15 blur-[120px]" />
        </div>
        <div className="relative">
          <Reveal>
            <p className="text-[#00c896] text-[10px] font-black tracking-widest uppercase mb-4">Get Started</p>
            <h2 className="font-black text-white leading-[1.1] mb-4" style={{ fontSize: "clamp(2.2rem,10vw,3rem)" }}>
              あとはCareoに<br />任せて、<br /><span className="text-[#00c896]">就活に集中。</span>
            </h2>
            <p className="text-gray-400 text-sm mb-10 leading-relaxed">
              管理に使っていた時間を、<br />企業研究と自己分析に使おう。
            </p>
            <Link
              href="/signup"
              className="flex items-center justify-center gap-2 bg-[#00c896] text-white font-bold text-base px-6 py-5 rounded-2xl shadow-2xl shadow-[#00c896]/30 active:scale-95 transition-transform mb-4"
            >
              無料で始める →
            </Link>
            <p className="text-gray-600 text-xs text-center">クレジットカード不要・30秒で登録</p>
          </Reveal>
        </div>
      </section>

      {/* ── SNS フォローセクション ───────────────────────────────────────────── */}
      <section className="px-5 py-14 bg-[#0a0820]">
        <p className="text-center text-xs font-bold text-gray-600 uppercase tracking-widest mb-1">Follow & Read</p>
        <h2 className="text-center text-lg font-black text-white mb-6">就活リアルを発信中</h2>
        <div className="flex flex-col gap-4">

          {/* X カード */}
          <a
            href="https://x.com/hiroki_careo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 active:scale-[.98] transition-transform"
          >
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-content-center flex-shrink-0 flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="black"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-sm">@hiroki_careo</div>
              <div className="text-gray-400 text-xs mt-0.5">就活ノウハウ・体験談を毎日投稿</div>
            </div>
            <span className="text-[#1d9bf0] text-xs font-bold flex-shrink-0">フォロー →</span>
          </a>

          {/* Note カード */}
          <a
            href="https://note.com/hiroki_careo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 active:scale-[.98] transition-transform"
          >
            <div className="w-10 h-10 bg-[#41c9b0] rounded-xl flex items-center justify-center flex-shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M20.24 0H3.76A3.76 3.76 0 0 0 0 3.76v16.48A3.76 3.76 0 0 0 3.76 24h16.48A3.76 3.76 0 0 0 24 20.24V3.76A3.76 3.76 0 0 0 20.24 0zM8.95 17.3H6.67V6.7h2.28zm7.08 0h-2.07l-3.36-6.86V17.3H8.32V6.7h2.28l3.16 6.44V6.7h2.27z"/></svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-bold text-sm">hiroki_careo</div>
              <div className="text-gray-400 text-xs mt-0.5">就活ノウハウ記事を週3本更新</div>
            </div>
            <span className="text-[#41c9b0] text-xs font-bold flex-shrink-0">読む →</span>
          </a>

        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="px-6 py-8 bg-[#080618] border-t border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <img src="/icon-192.png" alt="Careo" className="w-6 h-6 rounded-lg opacity-60" />
          <span className="font-bold text-sm text-gray-500">Careo</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 mb-5">
          <a href="https://x.com/hiroki_careo" target="_blank" rel="noopener noreferrer" className="text-gray-600 text-xs hover:text-gray-300 transition-colors flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.253 5.622 5.91-5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            X
          </a>
          <a href="https://note.com/hiroki_careo" target="_blank" rel="noopener noreferrer" className="text-gray-600 text-xs hover:text-gray-300 transition-colors flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M20.24 0H3.76A3.76 3.76 0 0 0 0 3.76v16.48A3.76 3.76 0 0 0 3.76 24h16.48A3.76 3.76 0 0 0 24 20.24V3.76A3.76 3.76 0 0 0 20.24 0zM8.95 17.3H6.67V6.7h2.28zm7.08 0h-2.07l-3.36-6.86V17.3H8.32V6.7h2.28l3.16 6.44V6.7h2.27z"/></svg>
            Note
          </a>
          {[
            { label: "利用規約", href: "/terms" },
            { label: "プライバシーポリシー", href: "/privacy" },
            { label: "比較ページ", href: "/compare" },
            { label: "ログイン", href: "/login" },
          ].map(({ label, href }) => (
            <Link key={href} href={href} className="text-gray-600 text-xs hover:text-gray-300 transition-colors">
              {label}
            </Link>
          ))}
        </div>
        <p className="text-gray-700 text-[10px]">© 2026 Careo. All rights reserved.</p>
      </footer>

      {/* LP カレオコーチ チャットボット */}
      <LPChatBot
        welcomeMessage={"やあ、Careo見つけてくれてありがとう！\n就活のこと、気軽に何でも聞いてみてね。"}
        suggestions={[
          "Careoって無料で使えるの？",
          "どんなことができるの？",
          "今すぐ始められる？",
          "ChatGPTと何が違うの？",
        ]}
      />
    </div>
  );
}
