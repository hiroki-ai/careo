"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Data ────────────────────────────────────────────────────────────────────

const comparisonRows = [
  { label: "求人情報・スカウト", careo: false, base: true, smart: false, riku: true, notion: false, category: "企業探し" },
  { label: "選考進捗を一元管理", careo: true, base: false, smart: false, riku: false, notion: "△", category: "管理" },
  { label: "ES・面接・OB訪問・筆記を記録", careo: true, base: false, smart: false, riku: false, notion: "△", category: "管理" },
  { label: "週次PDCAをAIが自動分析", careo: true, base: false, smart: false, riku: false, notion: false, category: "AI" },
  { label: "ES提出前AIチェック", careo: true, base: false, smart: false, riku: false, notion: false, category: "AI" },
  { label: "データ横断の気づき通知", careo: true, base: false, smart: false, riku: false, notion: false, category: "AI" },
  { label: "全データを把握したAIコーチ", careo: true, base: "△", smart: false, riku: false, notion: false, category: "AI" },
  { label: "キャリアセンターレポート出力", careo: true, base: false, smart: false, riku: false, notion: false, category: "管理" },
  { label: "学生は完全無料", careo: true, base: true, smart: true, riku: true, notion: true, category: "コスト" },
  { label: "広告・スカウト電話なし", careo: true, base: false, smart: true, riku: false, notion: true, category: "コスト" },
];

const coexistCards = [
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
    desc: "スカウト・求人票はこれらで。応募数・進捗管理はCareoへ。",
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
    desc: "他社ES・添削はこれらで。提出前チェック・保存はCareoへ。",
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
    desc: "深掘りはこれらで。言語化した軸・強みをCareoのプロフィールへ。",
  },
];

const diffPoints = [
  {
    icon: "🧠",
    title: "全データを知るAIコーチ",
    sub: "点解決じゃなく、就活OS",
    desc: "ES・面接・OB訪問・筆記試験・企業ステータス──すべてのデータを把握したAIコーチ「カレオ」が、点と点をつないで気づきを届けます。SmartESはESだけ、BaseMeはスカウトだけ。Careoは全体を見ます。",
    color: "from-[#00c896]/15 to-[#00a87e]/5",
    border: "border-[#00c896]/20",
  },
  {
    icon: "🔗",
    title: "データが繋がると気づきが生まれる",
    sub: "横断分析は他にない",
    desc: "「OB訪問で聞いた話とESの志望動機が矛盾している」「先週の面接フィードバックが筆記試験の準備に活かせる」──Careoはこうした横断的な気づきを自動で通知します。",
    color: "from-purple-500/10 to-purple-400/5",
    border: "border-purple-200",
  },
  {
    icon: "🆓",
    title: "全機能が完全無料",
    sub: "28卒向けに開発",
    desc: "AIコーチング・PDCA分析・ES提出前チェック・気づき通知・キャリアセンターレポート──すべて無料。クレジットカード不要、広告なし、スカウト電話なし。就活生に余計な負担をかけません。",
    color: "from-amber-500/10 to-orange-400/5",
    border: "border-amber-200",
  },
];

const faqs = [
  {
    q: "Notionで管理していましたが、移行は大変ですか？",
    a: "移行ツールはありませんが、Careoは登録5分で使い始められます。Notionのデータを見ながら手入力するユーザーも多く、入力しながらAIアドバイスがもらえるため、すぐに価値を実感できます。",
  },
  {
    q: "BaseMeとCareoは併用できますか？",
    a: "はい、ぜひ併用してください。BaseMeで企業・OBを探して、応募したらCareoで管理する、というのが推奨スタイルです。BaseMeはスカウト・OBマッチング特化、CareoはログとAI分析特化です。",
  },
  {
    q: "SmartESとの違いは何ですか？",
    a: "SmartESはES生成・管理に特化しています。CareoはES管理に加えて選考管理・面接ログ・OB訪問管理・AIコーチング機能を提供します。就活全体をPDCAで回せるのがCareoの強みです。SmartESで書いたESをCareoに保存して提出前AIチェックをするのもおすすめです。",
  },
  {
    q: "リクナビ・マイナビとの違いは？",
    a: "リクナビ・マイナビは求人情報・エントリー管理のプラットフォームです。CareoはそれらでエントリーしたあとのプロセスをAIで管理・分析するツールです。これらと一緒に使うのが最も効果的です。",
  },
  {
    q: "AI機能はどのくらい使えますか？",
    a: "週次PDCA分析・ES提出前チェック・AIチャット（カレオ）・企業研究・次のアクション提案など、すべてのAI機能が無料で利用できます。利用制限（レート制限）はありますが、通常の就活利用では気にならないレベルです。",
  },
];

// ─── Components ───────────────────────────────────────────────────────────────

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="border border-gray-200 rounded-2xl overflow-hidden cursor-pointer hover:border-[#00c896]/40 transition-colors"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between px-6 py-5 gap-4">
        <p className="font-semibold text-gray-900 text-sm md:text-base leading-snug">{q}</p>
        <span className={`text-[#00c896] font-bold text-xl transition-transform duration-200 shrink-0 ${open ? "rotate-45" : ""}`}>+</span>
      </div>
      {open && (
        <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100">
          {a}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ComparePage() {
  const cell = (v: boolean | string) =>
    v === true ? <span className="text-[#00c896] font-bold text-lg">✓</span>
      : v === false ? <span className="text-gray-200 text-lg">—</span>
        : <span className="text-amber-500 text-xs font-semibold">{v}</span>;

  const careoCell = (v: boolean | string) =>
    v === true ? <span className="text-[#00c896] font-bold text-lg">✓</span>
      : v === false ? <span className="text-gray-300 text-lg">—</span>
        : <span className="text-amber-500 text-xs font-semibold">{v}</span>;

  return (
    <div className="min-h-screen bg-white">

      {/* ── ナビ ────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-new.svg" alt="Careo" className="w-7 h-7" />
            <span className="font-bold text-[#0D0B21] text-lg">Careo</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              ログイン
            </Link>
            <Link
              href="/signup"
              className="bg-[#00c896] hover:bg-[#00a87e] text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
            >
              無料で始める
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#0D0B21] via-[#0f1629] to-[#1a2f4e] text-white px-6 py-24 md:py-32">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#00c896]/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-5">
            就活管理アプリ 徹底比較
          </p>
          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight tracking-tight">
            就活管理、まだ<br className="md:hidden" />
            <span className="text-[#00c896]">バラバラ</span>にやってますか？
          </h1>
          <p className="text-gray-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            Notion・BaseMe・SmartES・リクナビ──それぞれ優れたサービスです。<br />
            でも、<strong className="text-white">データが繋がらないと気づきは生まれない</strong>。<br />
            Careoはすべての就活データを一か所に集め、AIがPDCAを回します。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="bg-[#00c896] hover:bg-[#00a87e] text-white font-bold text-base px-8 py-4 rounded-xl transition-colors"
            >
              無料で始める（登録5分）
            </Link>
            <a
              href="#compare"
              className="bg-white/10 hover:bg-white/20 text-white font-semibold text-base px-8 py-4 rounded-xl transition-colors border border-white/20"
            >
              比較表を見る ↓
            </a>
          </div>
          <p className="text-gray-500 text-xs mt-5">クレジットカード不要・広告なし・スカウト電話なし</p>
        </div>
      </section>

      {/* ── Careoが選ばれる理由 ──────────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-gray-50/60">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">Why Careo</p>
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-4 tracking-tight">
            Careoにしかできないこと
          </h2>
          <p className="text-gray-500 text-center text-sm mb-14 max-w-xl mx-auto">
            「点解決」ではなく「就活OS」。すべてのデータを把握したAIコーチが、横断的な気づきを届けます。
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {diffPoints.map((p) => (
              <div
                key={p.title}
                className={`bg-gradient-to-br ${p.color} rounded-2xl p-7 border ${p.border}`}
              >
                <div className="text-4xl mb-4">{p.icon}</div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{p.sub}</p>
                <h3 className="font-bold text-gray-900 text-lg mb-3 leading-snug">{p.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 比較テーブル ────────────────────────────────────────────────────── */}
      <section id="compare" className="px-6 py-20 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">Comparison</p>
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-4 tracking-tight">
            他サービスと<span className="text-[#00c896]">何が違うの？</span>
          </h2>
          <p className="text-gray-500 text-center text-sm mb-12 max-w-xl mx-auto">
            各サービスは目的が異なります。組み合わせて使うのがベスト。
            CareoはそのハブとしてAIで全体を管理します。
          </p>
          <div className="overflow-x-auto -mx-2 rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th scope="col" className="text-left py-4 px-5 text-gray-400 font-medium w-[32%]">機能</th>
                  <th className="py-4 px-4 text-center">
                    <span className="bg-[#00c896] text-white text-xs font-bold px-3 py-1.5 rounded-lg">Careo</span>
                  </th>
                  <th className="py-4 px-4 text-center text-gray-400 font-medium text-xs">BaseMe<br /><span className="text-[10px] text-gray-300">（AI就活）</span></th>
                  <th className="py-4 px-4 text-center text-gray-400 font-medium text-xs">SmartES<br /><span className="text-[10px] text-gray-300">（ES生成）</span></th>
                  <th className="py-4 px-4 text-center text-gray-400 font-medium text-xs">リクナビ<br /><span className="text-[10px] text-gray-300">マイナビ</span></th>
                  <th className="py-4 px-4 text-center text-gray-400 font-medium text-xs">Notion<br /><span className="text-[10px] text-gray-300">スプレッド</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {comparisonRows.map((row) => (
                  <tr key={row.label} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-5 text-gray-700 font-medium text-xs md:text-sm">{row.label}</td>
                    <td className="py-3.5 px-4 text-center bg-[#00c896]/3">{careoCell(row.careo)}</td>
                    <td className="py-3.5 px-4 text-center">{cell(row.base)}</td>
                    <td className="py-3.5 px-4 text-center">{cell(row.smart)}</td>
                    <td className="py-3.5 px-4 text-center">{cell(row.riku)}</td>
                    <td className="py-3.5 px-4 text-center">{cell(row.notion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">
            ※ △: 部分的に対応。各サービスの公開情報をもとに作成（2025年現在）。
          </p>
        </div>
      </section>

      {/* ── 共存モデル ───────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">Ecosystem</p>
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-4 tracking-tight">
            他サービスと<span className="text-[#00c896]">共存する</span>Careo
          </h2>
          <p className="text-gray-500 text-center text-sm mb-6 max-w-xl mx-auto">
            Careoは競合ではなく、就活エコシステムのハブです。
            専門サービスで活動して、データをCareoに集める。AIが全体を分析します。
          </p>

          {/* フロー図 */}
          <div className="max-w-3xl mx-auto mb-14">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
              <div className="grid grid-cols-3 gap-3 md:gap-5 items-center text-center">
                <div className="space-y-2">
                  <div className="text-2xl">🔍</div>
                  <p className="text-xs font-bold text-gray-700">企業を探す</p>
                  <div className="space-y-1">
                    {["リクナビ", "OfferBox", "BaseMe"].map(s => (
                      <p key={s} className="text-[11px] text-gray-400 bg-gray-50 rounded-lg px-2 py-1">{s}</p>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="text-gray-300 text-2xl">→</div>
                  <div className="bg-[#00c896] rounded-2xl p-4 shadow-lg w-full">
                    <div className="text-white text-xs font-bold text-center mb-1">Careo</div>
                    <div className="text-white/80 text-[10px] text-center leading-relaxed">全データ集約<br />AI分析・PDCA</div>
                  </div>
                  <div className="text-gray-300 text-2xl">←</div>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl">✍️</div>
                  <p className="text-xs font-bold text-gray-700">ESを書く</p>
                  <div className="space-y-1">
                    {["就活会議", "SmartES", "ワンキャリア"].map(s => (
                      <p key={s} className="text-[11px] text-gray-400 bg-gray-50 rounded-lg px-2 py-1">{s}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* カード */}
          <div className="grid md:grid-cols-3 gap-5">
            {coexistCards.map((cat) => (
              <div
                key={cat.task}
                className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#00c896]/30 transition-all hover:shadow-md"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{cat.icon}</span>
                  <p className="font-bold text-sm text-[#0D0B21]">{cat.task}</p>
                </div>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">{cat.desc}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {cat.services.map(s => (
                    <a
                      key={s.name}
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs bg-gray-50 border border-gray-200 text-gray-700 px-2.5 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      {s.name} ↗
                    </a>
                  ))}
                </div>
                <p className="text-[11px] text-[#00c896] font-bold border-t border-gray-100 pt-3">
                  → {cat.tip}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Careoの魅力 ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">Features</p>
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-4 tracking-tight">
            Careoの<span className="text-[#00c896]">主な機能</span>
          </h2>
          <p className="text-gray-500 text-center text-sm mb-14 max-w-xl mx-auto">
            これだけあって全部無料。28卒の就活を全力でサポートします。
          </p>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-5">
            {[
              { icon: "🏢", title: "企業・選考管理", desc: "WISHLIST→応募→書類→面接→内定までの全フローをカンバン形式で管理。締切3日前に自動通知。" },
              { icon: "📝", title: "ES管理＋AIチェック", desc: "ESを企業ごとに保存。提出前にAIが自己分析との整合性・文体・具体性を一括チェック。" },
              { icon: "🎤", title: "面接ログ", desc: "質問・回答・感触・フィードバックを記録。AIが次の面接に向けた改善点を提案。" },
              { icon: "👥", title: "OB/OG訪問管理", desc: "訪問前の質問リスト・訪問後の気づきを記録。ESや面接への活かし方をAIが提案。" },
              { icon: "📊", title: "週次PDCA分析", desc: "全データを元にAIが週次でPDCAを自動分析。「今週何をすべきか」が即わかる。" },
              { icon: "🔗", title: "横断データ気づき通知", desc: "「OB訪問の話とESに矛盾がある」「面接フィードバックを筆記対策に活かせる」など、AIが自動で通知。" },
              { icon: "💬", title: "AIコーチ「カレオ」", desc: "全データを把握したAIコーチにいつでも相談。「次どこに注力すべきか」「ESの書き直し方」など何でも聞ける。" },
              { icon: "📈", title: "内定予測スコア", desc: "選考データをもとにAIが内定獲得確率をスコアリング。弱点を特定して改善策を提案。" },
              { icon: "📋", title: "キャリアセンターレポート", desc: "活動状況をレポート形式で出力。キャリアセンターへの相談前に活用できます。" },
            ].map((f) => (
              <div key={f.title} className="bg-gray-50/60 rounded-2xl p-6 border border-gray-100 hover:border-[#00c896]/20 hover:bg-[#00c896]/3 transition-all">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── よくある質問 ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-gray-50/60">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">FAQ</p>
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-12 tracking-tight">
            よくある質問
          </h2>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <FAQItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="px-6 py-24 bg-gradient-to-br from-[#0D0B21] to-[#1a2f4e]">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-4">Get Started Free</p>
          <h2 className="text-2xl md:text-4xl font-bold text-white mb-4 tracking-tight leading-tight">
            今すぐCareoで<br className="md:hidden" />就活を一元管理する
          </h2>
          <p className="text-gray-300 text-sm md:text-base mb-8 max-w-md mx-auto leading-relaxed">
            登録5分・完全無料。AI就活コーチ「カレオ」が<br />就活全体を把握して、あなたを支えます。
          </p>
          <Link
            href="/signup"
            className="inline-block bg-[#00c896] hover:bg-[#00a87e] text-white font-bold text-lg px-10 py-4 rounded-xl transition-colors shadow-lg shadow-[#00c896]/30"
          >
            無料で始める
          </Link>
          <div className="flex items-center justify-center gap-5 mt-6 text-gray-500 text-xs">
            <span>✓ 完全無料</span>
            <span>✓ 登録5分</span>
            <span>✓ カード不要</span>
            <span>✓ 広告なし</span>
          </div>
        </div>
      </section>

      {/* ── フッター ─────────────────────────────────────────────────────────── */}
      <footer className="bg-[#0D0B21] px-6 py-8 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-new.svg" alt="Careo" className="w-6 h-6" />
            <span className="text-white font-bold">Careo</span>
          </Link>
          <div className="flex items-center gap-6 text-gray-500 text-xs">
            <Link href="/" className="hover:text-gray-300 transition-colors">ホーム</Link>
            <Link href="/terms" className="hover:text-gray-300 transition-colors">利用規約</Link>
            <Link href="/privacy" className="hover:text-gray-300 transition-colors">プライバシーポリシー</Link>
          </div>
          <p className="text-gray-600 text-xs">© 2025 Careo</p>
        </div>
      </footer>
    </div>
  );
}
