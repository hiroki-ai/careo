"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import type { RecentPost } from "@/app/page";

// ─── Reveal wrapper (avoids calling hooks inside .map) ─────────────────────────
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
    from === "left" ? "translateX(-20px)" :
    from === "right" ? "translateX(20px)" :
    "translateY(20px)";
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translate(0,0)" : translate,
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
      }}
    >
      {children}
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
    title: "企業を登録する",
    desc: "受けたい企業をCareoに追加。5分でセットアップ完了。リクナビ・マイナビで見つけた企業を順次追加していくだけ。",
  },
  {
    icon: "📝",
    num: "02",
    title: "ES・面接・OB訪問を記録",
    desc: "書いたES、受けた面接、会ったOBのメモをCareoに。コピペするだけでOK。Notionからの移行もAIが自動でやってくれる。",
  },
  {
    icon: "🤖",
    num: "03",
    title: "あとはAIが全部整理する",
    desc: "カレオコーチが全データを把握して「今週何をすべきか」を毎週自動提案。締切も面接もESも、全部追いかけてくれる。",
  },
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
    desc: "全データを知ったAIが就活PDCAを自動分析。",
    grad: "from-[#00c896]/20 to-emerald-400/10",
    border: "border-emerald-100",
  },
  {
    icon: "✍️",
    title: "ES AIチェック",
    desc: "提出前に自己分析との整合性を一括確認。",
    grad: "from-purple-500/20 to-pink-400/10",
    border: "border-purple-100",
  },
  {
    icon: "📊",
    title: "進捗ダッシュボード",
    desc: "全企業の選考状況がひと目でわかる。",
    grad: "from-amber-400/20 to-orange-400/10",
    border: "border-amber-100",
  },
];

const chatMessages = [
  { from: "ai" as const, text: "A社・B社のESに共通する「チームワーク」の強みを発見しました。C社のESにも活かせそうです。" },
  { from: "ai" as const, text: "今週の優先タスク：トヨタ自動車のES締切まであと2日です。早めに提出確認を。" },
  { from: "user" as const, text: "C社の面接、どんな準備をすればいい？" },
  { from: "ai" as const, text: "OB訪問メモによると、C社はチームワークを重視する文化のようです。「協調しながら主体的に動く」エピソードを軸に準備しましょう。" },
];

const comparisonRows = [
  { label: "締切自動通知", notion: "❌", careo: "✅" },
  { label: "AIコーチング", notion: "❌", careo: "✅" },
  { label: "選考進捗管理", notion: "△ 手動", careo: "✅" },
  { label: "ES AIチェック", notion: "❌", careo: "✅" },
  { label: "自由なメモ・資料", notion: "✅", careo: "△" },
  { label: "完全無料", notion: "△ 制限あり", careo: "✅" },
];

const faqs = [
  {
    q: "無料で使えますか？",
    a: "はい、全機能を完全無料でご利用いただけます。クレジットカード不要。メールアドレスだけで今すぐ始められます。",
  },
  {
    q: "NotionのデータをCareoに移せますか？",
    a: "できます。CSVやPDFをアップロードするとAIが自動抽出して一括インポート。手入力ゼロで移行できます。",
  },
  {
    q: "BaseMeやSmartESとの違いは？",
    a: "BaseMe・SmartESは特定機能（スカウト・ES生成）に特化しています。Careoは就活全体のデータを把握したAIコーチが、横断した気づきを届けます。組み合わせて使うのがベスト。",
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

// ─── Sub-components ───────────────────────────────────────────────────────────
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
          className="text-[#00c896] text-xl shrink-0 transition-transform duration-200"
          style={{ transform: open ? "rotate(45deg)" : "rotate(0deg)" }}
        >
          +
        </span>
      </div>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
        </div>
      )}
    </button>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
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

export function MobileLandingPage({ recentPosts = [] }: { recentPosts?: RecentPost[] }) {
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
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
            <img src="/icon-new.svg" alt="Careo" className="w-7 h-7 rounded-xl" />
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
      <section className="relative min-h-screen flex flex-col justify-center px-6 pt-28 pb-20 bg-[#0D0B21] overflow-hidden">
        {/* ambient glows */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#00c896]/20 blur-[100px] pointer-events-none" />
        <div className="absolute bottom-20 right-0 w-56 h-56 rounded-full bg-indigo-500/10 blur-[70px] pointer-events-none" />
        <div className="absolute top-20 left-0 w-40 h-40 rounded-full bg-[#00c896]/5 blur-[50px] pointer-events-none" />

        {/* badge */}
        <div className="inline-flex items-center gap-2 bg-[#00c896]/10 border border-[#00c896]/20 rounded-full px-3 py-1.5 mb-6 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00c896] animate-pulse" />
          <span className="text-[#00c896] text-xs font-semibold tracking-wide">あなたの就活を丸ごと知るAIコーチ「カレオ」</span>
        </div>

        {/* headline */}
        <h1 className="font-black text-white leading-[1.1] tracking-tight mb-5" style={{ fontSize: "clamp(2.5rem,11vw,3.5rem)" }}>
          就活、<br />
          ひとりで<br />
          <span className="text-[#00c896]">抱えすぎて</span><br />
          ない？
        </h1>

        <p className="text-gray-400 text-sm leading-relaxed mb-8">
          企業・ES・面接・OB訪問・筆記試験をすべて一か所に。<br />
          あなたのデータを全て把握したAIコーチ「カレオ」が、点と点を繋ぎ、ChatGPTにはできない個人化アドバイスを届ける。
        </p>

        <Link
          href="/signup"
          className="flex items-center justify-center gap-2 bg-[#00c896] text-white font-bold text-base px-6 py-4 rounded-2xl shadow-xl shadow-[#00c896]/40 active:scale-95 transition-transform w-full mb-3"
        >
          無料で始める →
        </Link>
        <p className="text-gray-600 text-xs mb-14">クレジットカード不要・30秒で登録</p>

        {/* stat cards */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { value: "7", unit: "機能" },
            { value: "完全", unit: "無料" },
            { value: "AI", unit: "コーチング" },
          ].map(({ value, unit }) => (
            <div key={unit} className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center backdrop-blur-sm">
              <p className="text-[#00c896] text-xl font-black leading-none mb-1">{value}</p>
              <p className="text-gray-400 text-[9px] font-medium">{unit}</p>
            </div>
          ))}
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

        {/* Bridge card */}
        <Reveal>
          <div className="bg-[#0D0B21] rounded-2xl p-5 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-[#00c896]/20 blur-xl pointer-events-none" />
            <p className="text-white font-black text-lg mb-1 relative">全部、Careoで解決できる。</p>
            <p className="text-gray-400 text-xs relative">記録するだけで、あとはCareoが全部整理する。</p>
          </div>
        </Reveal>
      </section>

      {/* ── How it works ───────────────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-white">
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
                  <span className="text-[10px] font-black text-[#00c896] tracking-widest">{step.num}</span>
                  <h3 className="font-black text-gray-900 text-lg mt-0.5 mb-1.5 leading-snug">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── AI coach mockup ────────────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-[#0D0B21] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-12 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-[#00c896]/10 blur-[90px]" />
        </div>
        <div className="relative">
          <Reveal>
            <p className="text-[#00c896] text-[10px] font-black tracking-widest uppercase mb-2">AI Coach</p>
            <h2 className="text-3xl font-black text-white leading-tight mb-2">
              AIが全部<br />把握してる。
            </h2>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              就活の状況を全部知ったAIが、<br />あなた専用のアドバイスをくれる。
            </p>
          </Reveal>

          {/* Chat UI */}
          <Reveal delay={100}>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-5 space-y-3">
              {/* top bar */}
              <div className="flex items-center gap-2.5 pb-3 border-b border-white/10">
                <div className="w-7 h-7 rounded-full bg-[#00c896] flex items-center justify-center">
                  <span className="text-white text-[9px] font-black">AI</span>
                </div>
                <div>
                  <p className="text-white text-xs font-bold">カレオコーチ</p>
                  <p className="text-green-400 text-[9px]">● オンライン</p>
                </div>
              </div>

              {chatMessages.map((msg, i) => (
                <div key={i} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"} items-end gap-2`}>
                  {msg.from === "ai" && (
                    <div className="w-5 h-5 rounded-full bg-[#00c896] flex items-center justify-center shrink-0 mb-0.5">
                      <span className="text-white text-[7px] font-black">AI</span>
                    </div>
                  )}
                  <div
                    className="text-xs leading-relaxed rounded-2xl px-3.5 py-2.5"
                    style={{
                      maxWidth: "82%",
                      background: msg.from === "ai" ? "rgba(255,255,255,0.08)" : "#00c896",
                      color: msg.from === "ai" ? "rgba(255,255,255,0.85)" : "#ffffff",
                      borderRadius: msg.from === "ai" ? "4px 16px 16px 16px" : "16px 4px 16px 16px",
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* typing indicator */}
              <div className="flex items-end gap-2">
                <div className="w-5 h-5 rounded-full bg-[#00c896] flex items-center justify-center shrink-0">
                  <span className="text-white text-[7px] font-black">AI</span>
                </div>
                <div className="bg-white/8 rounded-2xl rounded-tl-sm px-3.5 py-2.5 flex gap-1 items-center" style={{ background: "rgba(255,255,255,0.08)" }}>
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          </Reveal>
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

      {/* ── Comparison ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-gray-50">
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
            {/* header */}
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
      <section className="px-6 py-12 bg-white">
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
        </Reveal>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-gray-50">
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
        <section className="px-5 py-14 bg-white">
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
            {recentPosts.map((post, i) => (
              <Reveal key={post.id} delay={i * 80}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="block bg-white rounded-2xl border border-gray-100 overflow-hidden active:scale-[0.99] transition-transform"
                >
                  {/* サムネイル */}
                  <div className="w-full aspect-[1200/630] overflow-hidden bg-[#0D0B21]">
                    <img
                      src={`/blog/${post.slug}/opengraph-image`}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
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
            ))}
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

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="px-6 py-8 bg-[#080618] border-t border-white/5">
        <div className="flex items-center gap-2 mb-4">
          <img src="/icon-new.svg" alt="Careo" className="w-6 h-6 rounded-lg opacity-60" />
          <span className="font-bold text-sm text-gray-500">Careo</span>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 mb-5">
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
    </div>
  );
}
