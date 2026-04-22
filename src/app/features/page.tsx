"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

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

// ─── Data ────────────────────────────────────────────────────────────────────
const features = [
  {
    icon: "🎙️",
    title: "面接録音→AIフィードバック",
    desc: "オンライン面接を録音・アップロードするだけ。AIが回答品質をスコアリングし、設問ごとの分析・改善点・模範回答を提示。",
    grad: "from-rose-500/20 to-orange-400/10",
    border: "border-rose-100",
    isNew: true,
  },
  {
    icon: "🔑",
    title: "マイページID一括管理",
    desc: "30社以上のマイページID・パスワードを一元管理。ワンクリックでログインページを開ける。",
    grad: "from-indigo-500/20 to-blue-400/10",
    border: "border-indigo-100",
    isNew: true,
  },
  {
    icon: "📊",
    title: "ES通過率コミュニティデータ",
    desc: "匿名共有されたESデータからよく聞かれる設問の通過率がわかる。みんなのデータで就活を有利に。",
    grad: "from-teal-500/20 to-cyan-400/10",
    border: "border-teal-100",
    isNew: true,
  },
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
    icon: "📈",
    title: "進捗ダッシュボード",
    desc: "全企業の選考状況がひと目でわかる。",
    grad: "from-amber-400/20 to-orange-400/10",
    border: "border-amber-100",
  },
];

const funFeatures = [
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
];

const beforeItems = [
  "スプレッドシートで企業を管理。どこに何を書いたか分からなくなる",
  "締切を見落として焦る。カレンダーとNotionを行き来",
  "面接が終わっても何が悪かったか分からないまま",
  "「今週何をすればいいか」が毎週ゼロから考え直し",
  "ES提出前に自己分析と合っているか確認する方法がない",
];

const afterItems = [
  "企業・ES・面接・説明会・インターン・OB訪問・筆記試験がすべて一か所。全体像が常に見える",
  "説明会・インターン・ES締切を一元管理。3日前に自動通知で見落としゼロ",
  "毎週AIがPDCAを自動分析。「今週何をすべきか」が即わかる",
  "面接を録音するだけでAIがスコアリング。改善点と模範回答を自動フィードバック",
  "30社以上のマイページID・パスワードをワンクリックで一括管理",
  "匿名共有のES通過率データで、よく聞かれる設問の合格率がわかる",
  "ES提出前にAIが自己分析との整合性・文体・具体性を一括チェック",
  "面接・OB訪問・ESを横断した「点と点を繋ぐ気づき」をカレオが自動通知",
  "マイナビ・リクナビはそのまま使いながら、Chrome拡張でCareoに一発追加。乗り換え不要",
];

const comparisonRows = [
  { label: "求人情報・スカウト受信", careo: false, base: "△スカウトのみ", smart: false, riku: true, notion: false },
  { label: "選考進捗を一元管理", careo: true, base: false, smart: false, riku: false, notion: "△手動" },
  { label: "ES・面接・OB訪問・筆記を記録", careo: true, base: false, smart: false, riku: false, notion: "△手動" },
  { label: "週次PDCAをAIが自動分析", careo: true, base: false, smart: false, riku: false, notion: false },
  { label: "ES提出前AIチェック", careo: true, base: false, smart: false, riku: false, notion: false },
  { label: "データ横断の気づき通知", careo: true, base: false, smart: false, riku: false, notion: false },
  { label: "面接録音AIフィードバック", careo: true, base: false, smart: false, riku: false, notion: false },
  { label: "マイページID一括管理", careo: true, base: false, smart: false, riku: false, notion: false },
  { label: "ES通過率コミュニティデータ", careo: true, base: false, smart: false, riku: false, notion: false },
  { label: "全データを把握したAIコーチ", careo: true, base: "△", smart: false, riku: false, notion: false },
  { label: "ChatGPT連携（就活データを知ったAI）", careo: true, base: false, smart: false, riku: false, notion: false },
  { label: "キャリアセンターレポート出力", careo: true, base: false, smart: false, riku: false, notion: false },
  { label: "学生は完全無料", careo: true, base: true, smart: "△制限あり", riku: true, notion: true },
  { label: "広告・スカウト電話なし", careo: true, base: false, smart: true, riku: false, notion: true },
];

export default function FeaturesPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white flex flex-col text-[#0D0B21] overflow-x-hidden">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm" : ""
        }`}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/icon-192.png" alt="Careo" className="w-8 h-8 rounded-xl" />
            <span className="font-bold text-lg tracking-tight text-[#0D0B21]">Careo</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors">
              トップ
            </Link>
            <Link href="/compare" className="text-sm text-gray-500 hover:text-gray-900 font-medium transition-colors">
              他サービス比較
            </Link>
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
              className="text-sm text-white font-bold px-5 py-2.5 rounded-xl bg-[#00c896] hover:bg-[#00b586] transition-all duration-200 hover:scale-105 hover:shadow-lg shadow-[#00c896]/30"
            >
              無料で始める
            </Link>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-16 px-6 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[10%] right-[5%] w-[400px] h-[400px] rounded-full bg-[#00c896]/8 blur-3xl" />
          <div className="absolute bottom-[5%] left-[10%] w-[300px] h-[300px] rounded-full bg-indigo-500/5 blur-3xl" />
        </div>
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <Reveal>
            <div className="inline-flex items-center gap-2 border border-[#00c896]/30 bg-[#00c896]/6 text-[#00a87e] text-xs font-semibold px-4 py-2 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-[#00c896] rounded-full animate-pulse" />
              All Features
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Careoの<span className="text-[#00c896]">全機能</span>
            </h1>
            <p className="text-gray-500 text-lg max-w-xl mx-auto leading-relaxed">
              就活に必要なものが全部ここにある。ES・面接・OB訪問・筆記試験を一元管理し、AIが全体をコーチングする。
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── All Features Grid ──────────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-gray-50/60">
        <div className="max-w-5xl mx-auto">
          <Reveal className="mb-10 text-center">
            <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3">Core Features</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">就活に必要なものが全部ここにある</h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f: { icon: string; title: string; desc: string; grad: string; border: string; isNew?: boolean }, i) => (
              <Reveal key={f.title} delay={i * 60}>
                <div className={`bg-gradient-to-br ${f.grad} border ${f.border} rounded-2xl p-6 h-full relative`}>
                  {f.isNew && (
                    <span className="absolute top-3 right-3 text-[10px] font-bold bg-amber-400 text-white px-2.5 py-1 rounded-full shadow-sm">New</span>
                  )}
                  <span className="text-3xl mb-4 block">{f.icon}</span>
                  <p className="font-bold text-gray-900 text-base mb-2">{f.title}</p>
                  <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Fun & Engaging ─────────────────────────────────────────────────── */}
      <section className="px-6 py-24 bg-[#0D0B21]">
        <div className="max-w-5xl mx-auto">
          <Reveal className="mb-12 text-center">
            <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3">Fun & Engaging</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
              記録するのが、<span className="text-[#00c896]">楽しくなる</span>。
            </h2>
            <p className="text-gray-400 text-base mt-3 max-w-xl mx-auto">
              情報を入力するのが楽しく、簡単で、見やすい。データが貯まるほど、AIの精度が上がる好循環。
            </p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {funFeatures.map((item, i) => (
              <Reveal key={item.title} delay={i * 60}>
                <div className={`border ${item.color} rounded-2xl p-5 hover:scale-[1.02] transition-transform duration-200`}>
                  <span className="text-3xl mb-3 block">{item.emoji}</span>
                  <p className="font-bold text-white text-sm mb-2">{item.title}</p>
                  <p className="text-gray-400 text-xs leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Before / After ─────────────────────────────────────────────────── */}
      <section className="px-6 py-24 bg-white">
        <div className="max-w-4xl mx-auto">
          <Reveal className="text-center mb-12">
            <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3">Before / After</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Careoを使うと、<span className="text-[#00c896]">何が変わる？</span>
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Reveal from="left">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-xl">😮‍💨</span>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">使う前</p>
                </div>
                <ul className="space-y-3.5">
                  {beforeItems.map((t) => (
                    <li key={t} className="flex gap-3 text-sm text-gray-500">
                      <span className="text-red-400 shrink-0 mt-0.5 font-bold">✕</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
            <Reveal from="right" delay={100}>
              <div className="bg-gradient-to-br from-[#00c896]/6 to-emerald-50 border border-[#00c896]/20 rounded-2xl p-6">
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
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Comparison Table ───────────────────────────────────────────────── */}
      <section className="px-6 py-24 bg-gray-50/60">
        <div className="max-w-4xl mx-auto">
          <Reveal className="text-center mb-12">
            <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3">Why Careo</p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              他のサービスと<span className="text-[#00c896]">何が違うの？</span>
            </h2>
            <p className="text-gray-500 text-sm mt-3">全部使うのがベスト。Careoは「管理とコーチング」に特化しています。</p>
          </Reveal>
          <Reveal>
            <div className="overflow-x-auto -mx-2 rounded-2xl border border-gray-200 bg-white">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th scope="col" className="text-left py-4 px-5 text-gray-400 font-medium w-[30%]">機能</th>
                    <th className="py-4 px-3 text-center">
                      <span className="bg-[#00c896] text-white text-xs font-bold px-3 py-1.5 rounded-lg">Careo</span>
                    </th>
                    <th className="py-4 px-3 text-center text-gray-400 font-medium text-xs">BaseMe<br /><span className="text-[10px]">(AI就活)</span></th>
                    <th className="py-4 px-3 text-center text-gray-400 font-medium text-xs">SmartES<br /><span className="text-[10px]">(ES生成)</span></th>
                    <th className="py-4 px-3 text-center text-gray-400 font-medium text-xs">リクナビ<br />マイナビ</th>
                    <th className="py-4 px-3 text-center text-gray-400 font-medium text-xs">Notion<br />スプレッド</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {comparisonRows.map((row) => {
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
          </Reveal>
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

      {/* ── Use with Others ────────────────────────────────────────────────── */}
      <section className="px-6 py-16 bg-white">
        <div className="max-w-3xl mx-auto">
          <Reveal className="text-center mb-10">
            <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3">Use with others</p>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Careoは「管理とコーチング」に集中する</h2>
            <p className="text-gray-400 text-sm mt-2">ES添削・自己分析・企業探しは専門サービスへ。Careoはそのデータを受け取ってPDCAを回す。</p>
          </Reveal>
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
              <Reveal key={cat.task}>
                <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:border-[#00c896]/20 transition-colors hover:shadow-sm h-full">
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
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ──────────────────────────────────────────────────────── */}
      <section className="px-6 py-24 md:py-32 bg-[#0D0B21] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-[#00c896]/15 blur-[120px]" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <Reveal>
            <div className="inline-flex items-center gap-2 border border-[#00c896]/30 bg-[#00c896]/6 text-[#00a87e] text-xs font-semibold px-4 py-2 rounded-full mb-8">
              <span className="w-1.5 h-1.5 bg-[#00c896] rounded-full animate-pulse" />
              今すぐ無料で使える
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-5 tracking-tight leading-[1.1] text-white">
              就活、<span className="text-[#00c896]">AIと一緒に</span>始めよう
            </h2>
            <p className="text-gray-400 text-lg mb-8">完全無料。登録はメールアドレスだけ。</p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 bg-[#00c896] hover:bg-[#00b586] text-white font-bold px-12 py-4 rounded-2xl text-base transition-all duration-200 hover:scale-105 hover:-translate-y-0.5 shadow-xl shadow-[#00c896]/30"
            >
              無料で始める
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="px-6 py-8 border-t border-gray-100">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/icon-192.png" alt="Careo" className="w-6 h-6 rounded-lg" />
            <span className="font-bold text-sm text-[#0D0B21]">Careo</span>
            <span className="text-gray-300 text-xs ml-2">© 2026</span>
          </div>
          <div className="flex items-center gap-5 text-xs text-gray-400">
            <Link href="/" className="hover:text-gray-700 transition-colors">トップ</Link>
            <Link href="/compare" className="hover:text-gray-700 transition-colors">他サービス比較</Link>
            <Link href="/blog" className="hover:text-gray-700 transition-colors">ブログ</Link>
            <a href="https://x.com/hiroki_careo" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 transition-colors">X</a>
            <a href="https://note.com/hiroki_careo" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700 transition-colors">Note</a>
            <Link href="/terms" className="hover:text-gray-700 transition-colors">利用規約</Link>
            <Link href="/privacy" className="hover:text-gray-700 transition-colors">プライバシーポリシー</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
