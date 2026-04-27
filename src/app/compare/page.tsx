"use client";

import { useState } from "react";
import Link from "next/link";

// ─── Data ────────────────────────────────────────────────────────────────────

// 各サービスの正直な強み
const serviceProfiles = [
  {
    name: "BaseMe",
    category: "スカウト型",
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
    name: "ABABA（アババ）",
    tag: "お祈り→スカウト転換",
    url: "https://ababa.jp/",
    color: "from-purple-500/10 to-purple-400/5",
    border: "border-purple-200",
    strengths: [
      "不採用通知（お祈りメール）をスキャンして評価に変換",
      "お祈りから別企業のスカウトが届く逆転発想のサービス",
      "SPIスコアも評価対象なので筆記試験の頑張りが活きる",
      "学生は完全無料",
    ],
    limitation: "あくまで「落とされた選考のデータ」が資産になるサービス。積極的な求人検索・選考管理機能はない。",
    careoUse: "ABABAで届いたスカウト企業をCareoに登録し、その後の選考進捗・面接ログを一元管理する",
  },
  {
    name: "Notion / スプレッドシート",
    category: "管理（自作）",
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

// 先輩が実際に使っていた「みんな入れてる」系・調査用サービス（追加）
// 友人ヒアリング (2026-04-27): カテゴリ別に併用される定番サービス
const supplementaryServices = [
  // ☆みんな入れる枠
  {
    name: "マイナビ",
    category: "みんな入れる",
    tag: "求人ポータルの定番",
    url: "https://job.mynavi.jp/",
    role: "求人検索・企業エントリー",
    strength: "国内最大級の求人数。マイキャリアボックスで一括ES提出も可。",
    careoCombo: "マイナビでエントリーした企業をCareoに登録し、選考進捗・面接ログを管理する。",
  },
  {
    name: "キャリタス就活",
    category: "みんな入れる",
    tag: "求人ポータル+合説",
    url: "https://job.career-tasu.jp/",
    role: "合同説明会・スケジュール管理",
    strength: "リアル/オンライン合同説明会が充実。地方企業・中堅企業の求人も豊富。",
    careoCombo: "キャリタスで参加した説明会をCareoのカレンダーに登録し、参加後の所感をその場で記録する。",
  },
  // ☆ES・体験談調べ用
  {
    name: "ワンキャリア",
    category: "ES・体験談調べ",
    tag: "選考体験記の宝庫",
    url: "https://www.onecareer.jp/",
    role: "選考通過ES・面接体験記の閲覧",
    strength: "通過したESの実物・面接質問・体験記が圧倒的に豊富。志望企業の選考を「予習」できる。",
    careoCombo: "ワンキャリアで読んだ通過ESや想定質問を、CareoのES下書き・面接準備メモに転記して活用する。",
  },
  {
    name: "就活会議",
    category: "ES・体験談調べ",
    tag: "選考クチコミ + 評価",
    url: "https://syukatsu-kaigi.jp/",
    role: "ES・面接の体験談 + 企業評価",
    strength: "選考体験談の口コミと、企業の評判（働きがい・成長環境）の両方を見られる。",
    careoCombo: "就活会議で集めた質問パターン・評価を、Careoの企業メモに整理してから面接に臨む。",
  },
  // ☆社員クチコミ・年収調べ
  {
    name: "Openwork",
    category: "クチコミ・年収",
    tag: "現役・元社員のリアル",
    url: "https://www.openwork.jp/",
    role: "社員クチコミ・年収・働きがい調査",
    strength: "現役・元社員による評価レポートが豊富。年収・残業時間・成長環境などを多面的に評価。",
    careoCombo: "Openworkで調べた内部情報・年収レンジをCareoの企業メモに保存し、内定比較の判断材料にする。",
  },
  // ☆OBOG訪問用
  {
    name: "ビズリーチ・キャンパス",
    category: "OB訪問",
    tag: "OB/OG訪問プラットフォーム",
    url: "https://br-campus.jp/",
    role: "大学OB/OG訪問のマッチング",
    strength: "大学・学部別にOB/OGを検索できる、安全で信頼性の高いマッチング。実際に会いやすい。",
    careoCombo: "ビズリーチ・キャンパスでアポを取り、訪問後の学び・気づきをCareoのOB訪問ログに即記録。後続の面接や志望動機作成に直結する。",
  },
  // ☆スカウト用
  {
    name: "キャリアチケットスカウト",
    category: "スカウト",
    tag: "プロフィール型スカウト",
    url: "https://careerticket.jp/scout/",
    role: "プロフィール登録 → スカウト受信",
    strength: "自己分析を兼ねたプロフィール作成で、志向性に合った企業からスカウトが届く。エージェント支援もある。",
    careoCombo: "キャリアチケットで届いたスカウト企業をCareoに登録し、選考進捗・面接ログを横断管理。エージェントから貰った情報もCareoのメモに集約。",
  },
  {
    name: "外資就活ドットコム",
    category: "スカウト",
    tag: "上位層・外資・コンサル",
    url: "https://gaishishukatsu.com/",
    role: "外資・日系トップ企業向けスカウト",
    strength: "外資金融・コンサル・日系大手を志望する就活生向けの選考情報・スカウト。質の高いコミュニティ。",
    careoCombo: "外資就活ドットコムで知った早期選考や難関選考のスケジュールをCareoのカレンダーに登録し、専用のES・面接対策ログを蓄積。",
  },
];

// 比較表（正確な情報のみ）
const comparisonRows = [
  {
    label: "求人情報・エントリー",
    note: "企業を探す機能",
    careo: false, base: false, smart: false, riku: true, offer: true, notion: false, ababa: false,
  },
  {
    label: "スカウト・オファー受信",
    note: "企業から連絡が来る",
    careo: false, base: true, smart: false, riku: "△", offer: true, notion: false, ababa: true,
  },
  {
    label: "ES生成AI",
    note: "AIがESを書いてくれる",
    careo: false, base: true, smart: true, riku: false, offer: false, notion: "△有料", ababa: false,
  },
  {
    label: "選考進捗の一元管理",
    note: "複数社をまとめて管理",
    careo: true, base: false, smart: false, riku: false, offer: false, notion: "△手動", ababa: false,
  },
  {
    label: "ES・面接・OB訪問・筆記の記録",
    note: "活動ログを保存",
    careo: true, base: false, smart: false, riku: false, offer: false, notion: "△手動", ababa: false,
  },
  {
    label: "週次PDCAをAIが自動分析",
    note: "AIが全体を振り返る",
    careo: true, base: false, smart: false, riku: false, offer: false, notion: false, ababa: false,
  },
  {
    label: "ES提出前AIチェック",
    note: "自己分析との整合性確認",
    careo: true, base: false, smart: false, riku: false, offer: false, notion: false, ababa: false,
  },
  {
    label: "データ横断の気づき通知",
    note: "OB訪問・面接・ESを繋ぐ",
    careo: true, base: false, smart: false, riku: false, offer: false, notion: false, ababa: false,
  },
  {
    label: "全データを把握したAIコーチ",
    note: "選考全体を知るAIに相談",
    careo: true, base: "△", smart: false, riku: false, offer: false, notion: false, ababa: false,
  },
  {
    label: "無料プランあり",
    note: "",
    careo: true, base: true, smart: "△制限あり", riku: true, offer: true, notion: true, ababa: true,
  },
  {
    label: "広告・スカウト電話なし",
    note: "",
    careo: true, base: false, smart: true, riku: false, offer: false, notion: true, ababa: "△スカウトあり",
  },
];

// Notionからの移行
const migrationSteps = [
  {
    icon: "📥",
    step: "STEP 1",
    time: "約1〜2分",
    title: "データをインポート",
    detail: "NotionのテーブルはCSVエクスポート、ページはPDF出力してCareoにドロップ。AIが企業名・ステータス・OB訪問・筆記試験を自動抽出します。",
    tip: "手入力ゼロ。AIが読み取れない項目だけ確認",
    highlight: true,
  },
  {
    icon: "✏️",
    step: "STEP 2",
    time: "約3〜5分",
    title: "ESをCareoに保存",
    detail: "NotionにあるESの文章をコピー&ペーストするだけ。企業ごとに設問と回答をセットで管理できます。",
    tip: "保存後すぐAI提出前チェックが使えます",
    highlight: false,
  },
  {
    icon: "🗒️",
    step: "STEP 3",
    time: "約3〜5分",
    title: "面接・OB訪問メモを移す",
    detail: "箇条書きのメモをそのままCareoに貼るだけ。入力後すぐにAIが面接・ES・OB訪問を横断して気づきを通知します。",
    tip: "Notionの長文メモは消さなくてOK",
    highlight: false,
  },
  {
    icon: "🤖",
    step: "STEP 4",
    time: "以降ずっと",
    title: "AIが自動で動き出す",
    detail: "データが揃った瞬間からAIコーチ「カレオ」が全体把握。週次PDCA・締切通知・内定予測が自動で届きます。",
    tip: "これがNotionでは絶対にできないこと",
    highlight: false,
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
    a: "CSV・PDFの一括インポートに対応しています。NotionのテーブルはCSVエクスポート、ページはPDF出力してCareoにアップロードすると、AIが企業名・ステータス・OB訪問・筆記試験などを自動抽出します。抽出結果を確認・編集してからインポートできるので、安心して移行できます。",
  },
  {
    q: "リクナビ・マイナビと何が違いますか？",
    a: "リクナビ・マイナビは企業を探してエントリーするためのプラットフォームです。Careoはエントリーした後の選考管理・AIコーチングに特化しています。リクナビ・マイナビで応募した企業をCareoに登録して管理するのがおすすめの使い方です。",
  },
  {
    q: "ABABAと併用できますか？",
    a: "はい、ABABAは「お祈りメール（不採用通知）を別企業のスカウトに変換する」というユニークなサービスです。ABABAで届いたスカウト企業をCareoに登録して選考進捗・面接ログを管理することで、両方の強みを活かせます。就活後半にお祈りが増えてきたタイミングでABABAを活用し、Careoで一元管理するのがおすすめです。",
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
    <div className="min-h-screen font-zen-kaku" style={{ background: "#fcfbf8" }}>

      {/* ── ナビ ────────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-192.png" alt="Careo" className="w-7 h-7" />
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
      <section className="px-6 py-20 bg-[#f5f3ee]/60">
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

      {/* ── 先輩が実際に使ってた定番サービス（カテゴリ別） ───────────────── */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-5xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">
            Senior&apos;s Stack
          </p>
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-4 tracking-tight">
            先輩が実際に使ってた<span className="text-[#00c896]">定番サービス</span>
          </h2>
          <p className="text-gray-500 text-center text-sm mb-12 max-w-2xl mx-auto">
            就活には「シーン別の定番サービス」があります。Careoはこれら全部のデータを<strong className="text-gray-700">一元管理するハブ</strong>。
            個別ツールの強みを消さず、全部活かす設計です。
          </p>

          {(["みんな入れる", "ES・体験談調べ", "クチコミ・年収", "OB訪問", "スカウト"] as const).map((cat) => {
            const items = supplementaryServices.filter((s) => s.category === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat} className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-xs font-bold text-[#00c896] bg-[#00c896]/10 px-3 py-1.5 rounded-full">
                    ☆ {cat}
                  </span>
                  <div className="flex-1 h-px bg-gray-100" />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  {items.map((s) => (
                    <div
                      key={s.name}
                      className="bg-[#fcfbf8] rounded-2xl p-5 border border-gray-100 hover:border-[#00c896]/30 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                            {s.tag}
                          </p>
                          <h3 className="font-bold text-gray-900 text-lg leading-tight">{s.name}</h3>
                        </div>
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-gray-400 hover:text-gray-600 border border-gray-200 rounded-lg px-2 py-1 bg-white hover:bg-gray-50 transition-colors shrink-0"
                        >
                          公式 ↗
                        </a>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        <span className="font-semibold text-gray-700">役割：</span>{s.role}
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed mb-3">{s.strength}</p>
                      <p className="text-xs text-[#00a87e] font-bold border-t border-gray-100 pt-2.5 leading-relaxed">
                        ▶ Careoとの組み合わせ：{s.careoCombo}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="bg-gradient-to-br from-[#00c896]/5 to-blue-50/40 rounded-2xl p-6 mt-10 border border-[#00c896]/20">
            <p className="text-sm font-bold text-gray-900 mb-2">
              💡 結論：Careoは「個別ツールの上位互換」ではなく「データ集約のハブ」
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              マイナビで応募 → ワンキャリアでES予習 → ビズリーチ・キャンパスでOB訪問 → Openworkで年収確認。
              この流れで集まる情報を <strong className="text-gray-800">Careoに一元化</strong> することで、
              AIが全データを横断して「次にやるべきこと」を提案できるようになります。
            </p>
          </div>
        </div>
      </section>

      {/* ── 比較テーブル ────────────────────────────────────────────────────── */}
      <section id="compare" className="px-6 py-20" style={{ background: "#fcfbf8" }}>
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
            <table className="w-full text-sm min-w-[780px]">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/80">
                  <th scope="col" className="text-left py-4 px-5 text-gray-400 font-medium w-[28%]">機能</th>
                  <th className="py-4 px-3 text-center">
                    <span className="bg-[#00c896] text-white text-xs font-bold px-3 py-1.5 rounded-lg">Careo</span>
                  </th>
                  <th className="py-4 px-3 text-center text-gray-400 font-medium text-xs">BaseMe<br /><span className="text-[10px] text-gray-300">スカウト×AI</span></th>
                  <th className="py-4 px-3 text-center text-gray-400 font-medium text-xs">SmartES<br /><span className="text-[10px] text-gray-300">ES生成</span></th>
                  <th className="py-4 px-3 text-center text-gray-400 font-medium text-xs">リクナビ<br /><span className="text-[10px] text-gray-300">マイナビ</span></th>
                  <th className="py-4 px-3 text-center text-gray-400 font-medium text-xs">OfferBox<br /><span className="text-[10px] text-gray-300">オファー型</span></th>
                  <th className="py-4 px-3 text-center text-gray-400 font-medium text-xs">ABABA<br /><span className="text-[10px] text-gray-300">お祈り転換</span></th>
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
                    <td className="py-3.5 px-3 text-center">{cell(row.ababa)}</td>
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

      {/* ── 競合ポジショニングマップ ──────────────────────────────────────── */}
      <section className="px-6 py-20 bg-white">
        <div className="max-w-4xl mx-auto">
          <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3 text-center">Market Position</p>
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-4 tracking-tight">
            就活サービスの中で、<span className="text-[#00c896]">Careoはここにいる</span>
          </h2>
          <p className="text-gray-500 text-center text-sm mb-12 max-w-xl mx-auto">
            横軸は「役割（入口ツール ←→ 管理ツール）」、縦軸は「AI活用度」。<br />
            Careoだけが<strong className="text-gray-700">「管理×AI高」</strong>という空白地帯に存在しています。
          </p>

          {/* 2Dマップ */}
          <div className="relative mx-auto mb-8 max-w-[560px] h-[420px]">
            {/* 外枠 + 背景 */}
            <div className="absolute inset-0 rounded-3xl border border-gray-200 overflow-hidden bg-white shadow-sm">
              {/* 4象限の背景色 */}
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                <div className="bg-blue-50/40" />
                <div className="bg-[#00c896]/5" />
                <div className="bg-gray-50/80" />
                <div className="bg-gray-50/50" />
              </div>
              {/* 十字ライン */}
              <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-200" />
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200" />
            </div>

            {/* 軸ラベル */}
            <div className="absolute top-2 w-full flex justify-center">
              <span className="text-[11px] font-bold text-[#00c896] bg-white/90 px-2 py-0.5 rounded-full border border-[#00c896]/20">AI特化 ↑</span>
            </div>
            <div className="absolute bottom-2 w-full flex justify-center">
              <span className="text-[11px] text-gray-400 bg-white/90 px-2 py-0.5 rounded-full">AI機能なし</span>
            </div>
            <div className="absolute left-2 top-0 bottom-0 flex items-center justify-center">
              <span className="text-[10px] text-gray-400 select-none -rotate-90 whitespace-nowrap">← 入口（求人・スカウト）</span>
            </div>
            <div className="absolute right-2 top-0 bottom-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-gray-600 select-none [writing-mode:vertical-rl]">管理・分析 →</span>
            </div>

            {/* ゾーンラベル（背景） */}
            <div className="absolute top-7 right-7 text-[9px] text-[#00c896]/50 font-bold select-none">Careoゾーン（空白地帯）</div>

            {/* リクナビ/マイナビ */}
            <div className="absolute left-[16%] top-[73%] -translate-x-1/2 -translate-y-1/2">
              <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-center shadow-sm whitespace-nowrap">
                <p className="text-[10px] font-bold text-red-600">リクナビ</p>
                <p className="text-[9px] text-red-400">マイナビ</p>
              </div>
            </div>

            {/* OfferBox */}
            <div className="absolute left-[30%] top-[60%] -translate-x-1/2 -translate-y-1/2">
              <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-center shadow-sm">
                <p className="text-[10px] font-bold text-green-700">OfferBox</p>
              </div>
            </div>

            {/* ABABA */}
            <div className="absolute left-[22%] top-[45%] -translate-x-1/2 -translate-y-1/2">
              <div className="bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 text-center shadow-sm">
                <p className="text-[10px] font-bold text-purple-700">ABABA</p>
                <p className="text-[9px] text-purple-400">お祈り転換</p>
              </div>
            </div>

            {/* BaseMe */}
            <div className="absolute left-[26%] top-[22%] -translate-x-1/2 -translate-y-1/2">
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-center shadow-sm">
                <p className="text-[10px] font-bold text-blue-700">BaseMe</p>
              </div>
            </div>

            {/* SmartES */}
            <div className="absolute left-[50%] top-[15%] -translate-x-1/2 -translate-y-1/2">
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 text-center shadow-sm">
                <p className="text-[10px] font-bold text-orange-700">SmartES</p>
              </div>
            </div>

            {/* Notion/SS */}
            <div className="absolute left-[76%] top-[70%] -translate-x-1/2 -translate-y-1/2">
              <div className="bg-gray-100 border border-gray-300 rounded-xl px-3 py-2 text-center shadow-sm whitespace-nowrap">
                <p className="text-[10px] font-bold text-gray-600">Notion / SS</p>
              </div>
            </div>

            {/* Careo（強調） */}
            <div className="absolute left-[80%] top-[17%] -translate-x-1/2 -translate-y-1/2">
              <div className="bg-[#00c896] rounded-xl px-3.5 py-2.5 text-center shadow-lg shadow-[#00c896]/40 ring-2 ring-[#00c896]/30">
                <p className="text-[11px] font-bold text-white">✦ Careo</p>
                <p className="text-[9px] text-white/80">管理×AI</p>
              </div>
            </div>
          </div>

          {/* 凡例 */}
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {[
              { name: "リクナビ / マイナビ", role: "求人・エントリー", cls: "bg-red-50 text-red-600 border-red-200" },
              { name: "OfferBox", role: "スカウト型採用", cls: "bg-green-50 text-green-700 border-green-200" },
              { name: "BaseMe", role: "スカウト×AI", cls: "bg-blue-50 text-blue-700 border-blue-200" },
              { name: "ABABA", role: "お祈り→スカウト転換", cls: "bg-purple-50 text-purple-700 border-purple-200" },
              { name: "SmartES", role: "ES生成AI", cls: "bg-orange-50 text-orange-700 border-orange-200" },
              { name: "Notion / SS", role: "汎用管理", cls: "bg-gray-100 text-gray-600 border-gray-300" },
              { name: "Careo", role: "管理×AIコーチング", cls: "bg-[#00c896] text-white border-transparent" },
            ].map(item => (
              <div key={item.name} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-semibold border ${item.cls}`}>
                {item.name}
                <span className="opacity-60">— {item.role}</span>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400">
            ※ ポジションはCareoの主観的評価に基づくイメージです（2026年現在）。
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
                { label: "スカウト受信", tools: "BaseMe\nOfferBox\nABABA", icon: "📩" },
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
          <div className="flex items-center justify-center gap-3 mb-10">
            <h3 className="text-xl font-bold text-gray-900">移行4ステップ</h3>
            <span className="bg-[#00c896]/10 text-[#00c896] text-xs font-bold px-3 py-1 rounded-full">合計10分でできる</span>
          </div>

          {/* Desktop: horizontal timeline */}
          <div className="hidden md:block relative">
            {/* connector line */}
            <div className="absolute top-10 left-[calc(12.5%)] right-[calc(12.5%)] h-0.5 bg-gradient-to-r from-[#00c896] via-[#00c896]/50 to-gray-200" />
            <div className="grid grid-cols-4 gap-4">
              {migrationSteps.map((step, i) => (
                <div key={step.title} className="flex flex-col items-center text-center relative">
                  {/* circle */}
                  <div className={`w-20 h-20 rounded-full flex flex-col items-center justify-center mb-4 z-10 shadow-sm border-2 ${
                    step.highlight
                      ? "bg-[#00c896] border-[#00c896] text-white"
                      : "bg-white border-gray-200 text-gray-700"
                  }`}>
                    <span className="text-2xl leading-none">{step.icon}</span>
                    <span className={`text-[9px] font-bold mt-1 ${step.highlight ? "text-white/80" : "text-gray-400"}`}>{i + 1}</span>
                  </div>
                  {/* badge */}
                  <span className={`text-[10px] font-bold tracking-widest mb-1 ${step.highlight ? "text-[#00c896]" : "text-gray-400"}`}>
                    {step.step}
                  </span>
                  <span className="text-[10px] text-gray-400 mb-2">{step.time}</span>
                  <h4 className="font-bold text-gray-900 text-sm mb-2 leading-snug">{step.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{step.detail}</p>
                  <p className={`text-[11px] font-semibold px-2 py-1.5 rounded-lg w-full ${
                    step.highlight
                      ? "bg-[#00c896]/10 text-[#00c896]"
                      : "bg-gray-50 text-gray-500"
                  }`}>
                    💡 {step.tip}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile: vertical timeline */}
          <div className="md:hidden space-y-4 relative">
            <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-gradient-to-b from-[#00c896] to-gray-200" />
            {migrationSteps.map((step, i) => (
              <div key={step.title} className="flex gap-4 relative">
                {/* circle */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 z-10 shadow-sm border-2 ${
                  step.highlight
                    ? "bg-[#00c896] border-[#00c896]"
                    : "bg-white border-gray-200"
                }`}>
                  <span className="text-xl">{step.icon}</span>
                </div>
                <div className={`flex-1 rounded-2xl p-4 border ${
                  step.highlight
                    ? "bg-gradient-to-br from-[#00c896]/5 to-[#00c896]/10 border-[#00c896]/20"
                    : "bg-gray-50 border-gray-100"
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold tracking-widest ${step.highlight ? "text-[#00c896]" : "text-gray-400"}`}>
                      {step.step}
                    </span>
                    <span className="text-[10px] text-gray-400">{step.time}</span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-sm mb-1">{step.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed mb-2">{step.detail}</p>
                  <p className={`text-[11px] font-semibold ${step.highlight ? "text-[#00c896]" : "text-gray-500"}`}>
                    💡 {step.tip}
                  </p>
                </div>
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
      <section className="px-6 py-20 bg-[#f5f3ee]/60">
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
            <span>✓ 無料プランあり</span>
            <span>✓ 登録5分</span>
            <span>✓ カード不要</span>
            <span>✓ Pro広告なし</span>
          </div>
        </div>
      </section>

      {/* ── フッター ─────────────────────────────────────────────────────────── */}
      <footer className="bg-[#0D0B21] px-6 py-8 border-t border-white/5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-192.png" alt="Careo" className="w-6 h-6" />
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
