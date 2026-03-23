"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Data ────────────────────────────────────────────────────────────────────

// 各サービスの正直な強み
const serviceProfiles = [
  {
    name: "BaseMe",
    tag: "スカウト型就活 × AI",
    url: "https://baseme.app/",
    color: "from-blue-500/10 to-blue-400/5",
    border: "border-blue-200",
    strengths: [
      "企業からスカウトが届くので能動的な応募が不要",
      "120社以上の優良企業と直接つながれる",
      "ES生成・学チカ作成・面接練習がAIで完結",
      "学生は完全無料",
    ],
    limitation: "求人検索・応募型には対応していない。登録する企業数は少なめ。",
    careoUse: "BaseMeでもらったスカウトをCareoに登録し、選考進捗を管理する",
  },
  {
    name: "SmartES",
    tag: "ES・志望動機 AI生成",
    url: "https://smartes.jp/",
    color: "from-orange-500/10 to-orange-400/5",
    border: "border-orange-200",
    strengths: [
      "企業URLを貼るだけで志望動機を自動生成",
      "約10万件の選考通過ESを学習した専門AI",
      "2〜3時間かかるES初稿を30分以内に",
      "無料（登録後5回・以降1日3回）",
    ],
    limitation: "ES生成ツールに特化。管理・記録・コーチング機能はない。生成文はそのまま使わず自分で編集が必要。",
    careoUse: "SmartESで書いたESの初稿を、CareoでAIチェック・保存・提出管理する",
  },
  {
    name: "リクナビ / マイナビ",
    tag: "就活ポータル（求人・エントリー）",
    url: "https://job.rikunabi.com/",
    color: "from-red-500/10 to-red-400/5",
    border: "border-red-200",
    strengths: [
      "日本最大規模の求人・インターン情報",
      "マイキャリアボックス（マイナビ）で複数社へ一括ES提出",
      "無料の自己分析診断ツール（リクナビ診断・MATCH plus）",
      "業界研究コンテンツが充実",
    ],
    limitation: "就活管理・AIコーチング・記録保存の機能はない。情報量が多すぎて迷いやすい。",
    careoUse: "リクナビ・マイナビで応募した企業をCareoに登録し、その後の選考進捗をまとめて管理する",
  },
  {
    name: "OfferBox",
    tag: "オファー型採用（待ち受け就活）",
    url: "https://offerbox.jp/",
    color: "from-green-500/10 to-green-400/5",
    border: "border-green-200",
    strengths: [
      "プロフィールを登録するだけで企業からオファーが届く",
      "TSEプライム上場企業の68%が利用する大企業ネットワーク",
      "AnalyzeU+（251問・28軸）の本格的な無料適性診断",
      "学生は完全無料",
    ],
    limitation: "プロフィール完成度が低いとオファーが来ない。能動的な求人検索はできない。",
    careoUse: "OfferBoxで届いたオファー企業をCareoに登録し、選考の進捗・面接ログを記録する",
  },
  {
    name: "Notion / スプレッドシート",
    tag: "汎用管理ツール（自作）",
    url: "https://notion.so/",
    color: "from-gray-500/10 to-gray-400/5",
    border: "border-gray-200",
    strengths: [
      "自分好みに完全カスタマイズできる",
      "企業研究メモ・ES下書きを自由に書ける",
      "既存のテンプレートを使えばすぐ始められる",
      "無料で利用可能（Notion AI は有料）",
    ],
    limitation: "就活専用機能はゼロ。AIコーチング・締切通知・分析はすべて手作業。初期設定と維持管理に時間がかかる。",
    careoUse: "Notionに書いた企業情報やESをCareoへ移行すると、AIコーチングがすぐに使えるようになる",
  },
];

// 比較表（正確な情報のみ）
const comparisonRows = [
  {
    label: "求人情報・エントリー",
    note: "企業を探す機能",
    careo: false, base: false, smart: false, riku: true, offer: true, notion: false,
  },
  {
    label: "スカウト・オファー受信",
    note: "企業から連絡が来る",
    careo: false, base: true, smart: false, riku: "△", offer: true, notion: false,
  },
  {
    label: "ES生成AI",
    note: "AIがESを書いてくれる",
    careo: false, base: true, smart: true, riku: false, offer: false, notion: "△有料",
  },
  {
    label: "選考進捗の一元管理",
    note: "複数社をまとめて管理",
    careo: true, base: false, smart: false, riku: false, offer: false, notion: "△手動",
  },
  {
    label: "ES・面接・OB訪問・筆記の記録",
    note: "活動ログを保存",
    careo: true, base: false, smart: false, riku: false, offer: false, notion: "△手動",
  },
  {
    label: "週次PDCAをAIが自動分析",
    note: "AIが全体を振り返る",
    careo: true, base: false, smart: false, riku: false, offer: false, notion: false,
  },
  {
    label: "ES提出前AIチェック",
    note: "自己分析との整合性確認",
    careo: true, base: false, smart: false, riku: false, offer: false, notion: false,
  },
  {
    label: "データ横断の気づき通知",
    note: "OB訪問・面接・ESを繋ぐ",
    careo: true, base: false, smart: false, riku: false, offer: false, notion: false,
  },
  {
    label: "全データを把握したAIコーチ",
    note: "選考全体を知るAIに相談",
    careo: true, base: "△", smart: false, riku: false, offer: false, notion: false,
  },
  {
    label: "学生は完全無料",
    note: "",
    careo: true, base: true, smart: "△制限あり", riku: true, offer: true, notion: true,
  },
  {
    label: "広告・スカウト電話なし",
    note: "",
    careo: true, base: false, smart: true, riku: false, offer: false, notion: true,
  },
];

// Notionからの移行
const migrationSteps = [
  {
    icon: "📋",
    title: "企業リストを移す",
    detail: "NotionやスプレッドシートにまとめてあるCSVを見ながら、Careoに企業を1社ずつ追加。ステータスも同じように設定できます。",
    tip: "登録5分あれば10社くらいはすぐ入れられます",
  },
  {
    icon: "📝",
    title: "ESの下書きをコピー",
    detail: "NotionにあるESの文章をCareoのES管理にコピー。企業ごとに設問と回答をセットで保存できます。",
    tip: "保存後すぐにAI提出前チェックが使えます",
  },
  {
    icon: "🗒️",
    title: "面接・OB訪問メモを移す",
    detail: "箇条書きで残してある面接のメモやOB訪問の記録を、CareoのログにコピーするだけでOK。",
    tip: "入力後にAIが横断分析を始めます",
  },
  {
    icon: "🤖",
    title: "AIコーチングがすぐ使える",
    detail: "データを入れた瞬間から、AIコーチ「カレオ」が全体を把握。「今週何をすべきか」「このESの弱点は何か」などを聞けます。",
    tip: "これがNotionでは絶対にできないこと",
  },
];

const faqs = [
  {
    q: "BaseMeと併用できますか？",
    a: "はい、ぜひ併用してください。BaseMeはスカウト受信・ES生成・面接練習に優れたサービスです。BaseMeでもらったスカウトをCareoに登録して進捗管理すると、両方の強みを活かせます。BaseMeのAIはES生成が得意で、CareoのAIは選考全体の管理・分析が得意です。",
  },
  {
    q: "SmartESで書いたESをCareoでも使えますか？",
    a: "はい。SmartESで生成したES初稿をCareoのES管理に保存し、提出前にCareoのAIチェックを受けるという使い方がおすすめです。SmartESは初稿生成が速く、CareoはES保存と自己分析との整合性チェックが得意なので、組み合わせると効果的です。",
  },
  {
    q: "Notionで管理していましたが、移行は大変ですか？",
    a: "Careoへの自動インポート機能はありませんが、登録5分で使い始められます。企業リストをNotionから見ながら手入力する方がほとんどで、「入力しながらすぐAIアドバイスがもらえるので、移行しながら価値を感じた」という声が多いです。",
  },
  {
    q: "リクナビ・マイナビと何が違いますか？",
    a: "リクナビ・マイナビは企業を探してエントリーするためのプラットフォームです。Careoはエントリーした後の選考管理・AIコーチングに特化しています。リクナビ・マイナビで応募した企業をCareoに登録して管理するのがおすすめの使い方です。",
  },
  {
    q: "OfferBoxとの違いは？",
    a: "OfferBoxは企業からオファーをもらうための登録型サービスです。CareoはOfferBoxで届いたオファー企業を選考管理するために使えます。OfferBoxのAnalyzeU+（251問の適性診断）はCareoにはない機能なので、自己分析に活用してCareoのプロフィールに反映するのがおすすめです。",
  },
  {
    q: "AI機能はどのくらい使えますか？",
    a: "週次PDCA分析・ES提出前チェック・AIチャット・企業研究・次のアクション提案など、すべてのAI機能が無料で利用できます。レート制限（20回/分）はありますが、通常の就活利用では気にならないレベルです。",
  },
];

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
        <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed border-t border-gray-100 pt-4">
          {a}
        </div>
      )}
    </div>
  );
}

export default function ComparePage() {
  const cell = (v: boolean | string) =>
    v === true
      ? <span className="text-[#00c896] font-bold text-lg">✓</span>
      : v === false
        ? <span className="text-gray-200 text-lg">—</span>
        : <span className="text-amber-500 text-[11px] font-semibold leading-tight">{v}</span>;

  const careoCell = (v: boolean | string) =>
    v === true
      ? <span className="text-[#00c896] font-bold text-lg">✓</span>
      : v === false
        ? <span className="text-gray-300 text-lg">—</span>
        : <span className="text-amber-500 text-[11px] font-semibold leading-tight">{v}</span>;

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
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">
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
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#00c896]/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-500/8 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto text-center">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-5">
            就活ツール比較ガイド 2026
          </p>
          <h1 className="text-3xl md:text-5xl font-bold mb-6 leading-tight tracking-tight">
            就活ツール、<br className="md:hidden" />全部使うのが<span className="text-[#00c896]">正解</span>。
          </h1>
          <p className="text-gray-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
            BaseMe・SmartES・OfferBox・リクナビ──それぞれに優れた点があります。<br />
            Careoは競合ではなく、<strong className="text-white">これらのデータを集めてAIで管理・分析するハブ</strong>です。
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

      {/* ── 各サービスの正直な紹介 ──────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-gray-50/60">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">Honest Review</p>
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-4 tracking-tight">
            各サービスの<span className="text-[#00c896]">強みと使い所</span>
          </h2>
          <p className="text-gray-500 text-center text-sm mb-14 max-w-xl mx-auto">
            競合を隠す必要はありません。それぞれ得意なことが違う。
            全部使った上でCareoをハブにするのが、最も賢い就活です。
          </p>
          <div className="grid md:grid-cols-2 gap-5">
            {serviceProfiles.map((s) => (
              <div key={s.name} className={`bg-gradient-to-br ${s.color} rounded-2xl p-6 border ${s.border}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{s.tag}</p>
                    <h3 className="font-bold text-gray-900 text-xl">{s.name}</h3>
                  </div>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-2 py-1 bg-white/60 hover:bg-white transition-colors shrink-0"
                  >
                    公式 ↗
                  </a>
                </div>
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-500 mb-2">強み</p>
                  <ul className="space-y-1">
                    {s.strengths.map((str) => (
                      <li key={str} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="text-[#00c896] mt-0.5 shrink-0">✓</span>
                        {str}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-xs text-gray-400 bg-white/50 rounded-xl px-3 py-2 mb-3 leading-relaxed">
                  <span className="font-semibold text-gray-500">注意点：</span>{s.limitation}
                </p>
                <p className="text-xs text-[#00c896] font-bold border-t border-white/40 pt-3">
                  ▶ Careoとの組み合わせ方：{s.careoUse}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 比較テーブル ────────────────────────────────────────────────────── */}
      <section id="compare" className="px-6 py-20 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">Feature Matrix</p>
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-4 tracking-tight">
            機能比較表
          </h2>
          <p className="text-gray-500 text-center text-sm mb-12 max-w-xl mx-auto">
            目的が違うサービスを並べています。「CareoがNo.1」ではなく、
            「何に使うか」で選んでください。
          </p>
          <div className="overflow-x-auto -mx-2 rounded-2xl border border-gray-200 shadow-sm">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th scope="col" className="text-left py-4 px-5 text-gray-400 font-medium w-[30%]">機能</th>
                  <th className="py-4 px-3 text-center">
                    <span className="bg-[#00c896] text-white text-xs font-bold px-3 py-1.5 rounded-lg">Careo</span>
                  </th>
                  <th className="py-4 px-3 text-center text-gray-400 font-medium text-xs">BaseMe<br /><span className="text-[10px] text-gray-300">スカウト×AI</span></th>
                  <th className="py-4 px-3 text-center text-gray-400 font-medium text-xs">SmartES<br /><span className="text-[10px] text-gray-300">ES生成</span></th>
                  <th className="py-4 px-3 text-center text-gray-400 font-medium text-xs">リクナビ<br /><span className="text-[10px] text-gray-300">マイナビ</span></th>
                  <th className="py-4 px-3 text-center text-gray-400 font-medium text-xs">OfferBox<br /><span className="text-[10px] text-gray-300">オファー型</span></th>
                  <th className="py-4 px-3 text-center text-gray-400 font-medium text-xs">Notion<br /><span className="text-[10px] text-gray-300">スプレッド</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {comparisonRows.map((row) => (
                  <tr key={row.label} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3.5 px-5 text-gray-700 font-medium text-xs md:text-sm">
                      {row.label}
                      {row.note && <span className="block text-[10px] text-gray-400 font-normal">{row.note}</span>}
                    </td>
                    <td className="py-3.5 px-3 text-center bg-[#00c896]/3">{careoCell(row.careo)}</td>
                    <td className="py-3.5 px-3 text-center">{cell(row.base)}</td>
                    <td className="py-3.5 px-3 text-center">{cell(row.smart)}</td>
                    <td className="py-3.5 px-3 text-center">{cell(row.riku)}</td>
                    <td className="py-3.5 px-3 text-center">{cell(row.offer)}</td>
                    <td className="py-3.5 px-3 text-center">{cell(row.notion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-gray-400 mt-4">
            ※ △: 部分的に対応 / 条件あり。各サービスの公開情報をもとに作成（2026年現在）。情報は変更される可能性があります。
          </p>
        </div>
      </section>

      {/* ── 共存エコシステム図 ───────────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-gradient-to-br from-[#0D0B21] to-[#1a2f4e] text-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">Ecosystem</p>
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-4 tracking-tight">
            全部使う、Careoでまとめる
          </h2>
          <p className="text-gray-400 text-center text-sm mb-14 max-w-xl mx-auto">
            Careoは「管理とAIコーチング」に集中するツールです。
            各サービスの強みを使い切った上で、Careoがデータを受け取って全体を回します。
          </p>
          <div className="max-w-3xl mx-auto mb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-center mb-6">
              {[
                { label: "企業探し", tools: "リクナビ\nマイナビ", icon: "🔍" },
                { label: "スカウト受信", tools: "BaseMe\nOfferBox", icon: "📩" },
                { label: "ES生成", tools: "SmartES\nBaseMe AI", icon: "✍️" },
                { label: "自己分析", tools: "AnalyzeU+\nMATCH plus", icon: "💡" },
              ].map((item) => (
                <div key={item.label} className="bg-white/8 rounded-xl p-4 text-center border border-white/10">
                  <div className="text-2xl mb-2">{item.icon}</div>
                  <p className="text-xs font-bold text-gray-300 mb-1">{item.label}</p>
                  <p className="text-[10px] text-gray-500 whitespace-pre-line leading-relaxed">{item.tools}</p>
                </div>
              ))}
            </div>
            <div className="flex justify-center mb-6">
              <div className="flex flex-col items-center gap-1 text-gray-500 text-xs">
                <div className="flex gap-8 md:gap-24 text-gray-600 text-lg">
                  <span>↘</span><span>↓</span><span>↓</span><span>↙</span>
                </div>
                <span className="text-[10px]">応募した企業・ESをCareoへ</span>
              </div>
            </div>
            <div className="bg-gradient-to-r from-[#00c896]/20 to-[#00a87e]/10 border border-[#00c896]/30 rounded-2xl p-6 text-center">
              <p className="text-[#00c896] font-bold text-lg mb-2">Careo（管理・AIコーチング・PDCA）</p>
              <p className="text-gray-400 text-xs leading-relaxed">
                選考進捗管理 / ES保存・AIチェック / 面接ログ / OB訪問ログ / 筆記試験管理<br />
                週次PDCA分析 / データ横断の気づき通知 / AIコーチ「カレオ」
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Notionからの移行 ─────────────────────────────────────────────────── */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">Migration</p>
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-4 tracking-tight">
            Notion・スプレッドシートから<br className="md:hidden" /><span className="text-[#00c896]">乗り換える</span>
          </h2>
          <p className="text-gray-500 text-center text-sm mb-6 max-w-xl mx-auto">
            「NotionやGoogleスプレッドシートで管理していたけど、AIコーチングを使ってみたい」
            という方向けのガイドです。
          </p>

          {/* Notionが得意なこと vs Careoが得意なこと */}
          <div className="grid md:grid-cols-2 gap-5 mb-14">
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Notionが得意なこと</p>
              <ul className="space-y-2">
                {[
                  "自分好みに完全カスタマイズ",
                  "企業研究の長文メモ・資料管理",
                  "ESの下書きをバリバリ書く",
                  "チームで共有・コメントしあう",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-gray-300 mt-0.5 shrink-0">✓</span>{item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-gray-400 mt-4 bg-white rounded-xl p-3 leading-relaxed">
                引き続きNotionで企業研究メモを書くのはアリです。
                Careoへの移行は「管理とAI分析の部分だけ」でOK。
              </p>
            </div>
            <div className="bg-gradient-to-br from-[#00c896]/10 to-[#00a87e]/5 rounded-2xl p-6 border border-[#00c896]/20">
              <p className="text-xs font-bold text-[#00c896] uppercase tracking-wider mb-3">Careoが得意なこと</p>
              <ul className="space-y-2">
                {[
                  "締切3日前の自動通知（見落としゼロ）",
                  "週次でAIがPDCAを自動分析",
                  "ES提出前に自己分析との整合性チェック",
                  "面接・OB訪問・ESを横断した気づき通知",
                  "AIコーチ「カレオ」に全体相談",
                ].map(item => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-[#00c896] mt-0.5 shrink-0">✓</span>{item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 移行ステップ */}
          <h3 className="text-xl font-bold text-gray-900 text-center mb-8">移行4ステップ（合計30分）</h3>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {migrationSteps.map((step, i) => (
              <div key={step.title} className="relative">
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="bg-[#00c896] text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-xl">{step.icon}</span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm mb-2">{step.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{step.detail}</p>
                  <p className="text-[11px] text-[#00c896] font-semibold border-t border-gray-200 pt-2">
                    💡 {step.tip}
                  </p>
                </div>
                {i < migrationSteps.length - 1 && (
                  <div className="hidden md:flex absolute -right-2 top-1/2 -translate-y-1/2 z-10 text-gray-300 text-lg">→</div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/signup"
              className="inline-block bg-[#00c896] hover:bg-[#00a87e] text-white font-bold px-8 py-4 rounded-xl transition-colors"
            >
              Careoで始める（無料・5分）
            </Link>
            <p className="text-gray-400 text-xs mt-3">Notionのデータは消さなくてOK。並行して使いながら試せます。</p>
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
            就活ツールを使い切るなら、<br />Careoでまとめる
          </h2>
          <p className="text-gray-300 text-sm md:text-base mb-8 max-w-md mx-auto leading-relaxed">
            BaseMe・SmartES・リクナビ・OfferBoxを使いながら、<br />
            Careoで選考全体をAIが管理・コーチングします。
          </p>
          <Link
            href="/signup"
            className="inline-block bg-[#00c896] hover:bg-[#00a87e] text-white font-bold text-lg px-10 py-4 rounded-xl transition-colors shadow-lg shadow-[#00c896]/30"
          >
            無料で始める
          </Link>
          <div className="flex items-center justify-center gap-5 mt-6 text-gray-500 text-xs flex-wrap">
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
          <p className="text-gray-600 text-xs">© 2026 Careo</p>
        </div>
      </footer>
    </div>
  );
}
