"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { LPChatBot } from "@/components/landing/LPChatBot";

// ─── FAQ データ ──────────────────────────────────────────────────────────────
const faqItems = [
  {
    q: "導入費用はかかりますか？",
    a: "大学・キャリアセンター向けには利用料が発生します。料金は大学の規模・利用形態・連携機能の範囲に応じてご相談ください。初回ヒアリングは無料です。なお、学生側の利用は引き続き完全無料です。",
  },
  {
    q: "学生の情報は強制的に開示されますか？",
    a: "いいえ。情報開示は学生の判断に委ねられています。学生は項目ごとに「キャリアセンターに見せる・見せない」を設定でき、選考中の企業名やES内容など、見せたくない情報は非公開にできます。",
  },
  {
    q: "既存の就職支援システムと併用できますか？",
    a: "はい。Careoはあくまでも学生が自主的に使う就活管理ツールです。既存のシステムを置き換えるものではなく、「学生の実態把握」を補完するかたちで活用いただけます。",
  },
  {
    q: "何人の学生から導入できますか？",
    a: "1人からでも利用可能です。学生は大学メールアドレス（例：×××@sophia.ac.jp）で登録するため、ドメインによる在籍確認が自動的に行われます。提携後は同じ大学ドメインで登録した学生が自動的に連携対象になります。",
  },
  {
    q: "キャリアセンター側に特別な操作は必要ですか？",
    a: "初期設定（大学登録・担当者アカウント作成）のみです。その後は学生が自分でCareoを使い始め、同意した情報が自動的に共有されます。担当者の方には専用ダッシュボードをご提供します。",
  },
  {
    q: "学生へのCareoの利用促進は、どのように行われますか？",
    a: "基本的な周知活動はCareo側で行いますが、大学側からのご協力もぜひお願いしています。ガイダンスや説明会でのご紹介・掲示物の掲示など、大学からの周知は学生への普及に大きく貢献します。紹介用の資料・スライドはCareo側でご用意しますので、お気軽にご活用ください。",
  },
];

// ─── Pain Points データ ───────────────────────────────────────────────────────
const painPoints = [
  {
    icon: "📣",
    title: "学生を集める仕組みがない",
    desc: "キャリアセンターの存在を知らない学生、使い方がわからない学生が多い。担当者の64%が「人手不足」を訴える中、周知や呼び込みに割けるリソースがない。",
    tag: "集客・周知（61%が課題）",
  },
  {
    icon: "😶",
    title: "学生の就活状況が把握できない",
    desc: "「何社受けているの？」「ESは書いた？」——相談に来た時点で初めて把握する状況。学生の75%の就活実態がブラックボックスのまま支援が始まる。",
    tag: "情報不足（75%が課題）",
  },
  {
    icon: "🚨",
    title: "未内定学生を早期に発見できない",
    desc: "困っている学生ほど孤立しがち。支援が必要な学生の66%は来談せず、手遅れになってから初めて状況が判明するケースが後を絶たない。",
    tag: "早期発見（66%が課題）",
  },
  {
    icon: "📊",
    title: "支援の成果が数字で見えない",
    desc: "毎日懸命に支援しているのに、どれだけ効果があったか証明できない。予算交渉にも、改善にも、データが必要なのに可視化できない。",
    tag: "成果測定",
  },
];

// ─── Features データ ──────────────────────────────────────────────────────────
const features = [
  {
    icon: "📱",
    title: "学生の就活ダッシュボード共有",
    desc: "学生が同意した情報（応募企業数・選考フェーズ・ES提出状況など）をリアルタイムで確認。面談前に全体像を把握できます。",
    tag: "リアルタイム",
  },
  {
    icon: "🤖",
    title: "AI分析インサイトを事前に確認",
    desc: "CareoのAIが自動生成した「今この学生が抱えているリスク・課題」を面談前に確認。深掘りすべきポイントが一目でわかります。",
    tag: "AIインサイト",
  },
  {
    icon: "💬",
    title: "学生への個別メッセージ",
    desc: "来談していない学生へも、Careo経由でメッセージを届けられます。「ES締切が近い」「面接対策を一緒にしよう」——タイミングを逃さないサポートが可能に。",
    tag: "プロアクティブ支援",
  },
  {
    icon: "📝",
    title: "ES添削をAIと分担",
    desc: "学生がキャリセン添削を依頼すると、まずAIが整合性・具体性・文体を自動チェック。スコアと改善提案を付けてから担当者に届けます。担当者は質の高い添削に集中できます。",
    tag: "業務効率化",
  },
  {
    icon: "🚨",
    title: "孤立学生への自動アラート",
    desc: "30日以上ログインなし・応募ゼロ・連続お祈りなど、支援が必要な学生を自動検知してアラート通知。困っている学生ほど相談に来ない問題を、データで解決します。",
    tag: "プロアクティブ支援",
  },
  {
    icon: "📈",
    title: "大学全体の就活状況を集計",
    desc: "全体の応募社数・選考通過率・内定獲得状況を集計データで把握。学部別の内定率・卒業年度別の分布・志望業界ランキングまで多角的に分析できます。",
    tag: "データ分析",
  },
  {
    icon: "📊",
    title: "月次支援効果レポート",
    desc: "「面談あり学生の内定率 vs なし学生」を自動集計。面談の効果を数字で証明し、予算交渉・活動報告に活用できます。月次レポートはPDFで出力可能です。",
    tag: "成果可視化",
  },
  {
    icon: "🎓",
    title: "説明会・ガイダンスの効果測定",
    desc: "開催したイベントへの参加者を登録するだけ。参加前後30日の就活活動量を自動比較し、どのイベントが学生の行動変容に繋がったかをデータで確認できます。",
    tag: "効果測定",
  },
  {
    icon: "🎯",
    title: "大学独自のお知らせ配信",
    desc: "「説明会スケジュール」「OB/OG訪問受付開始」——大学からのお知らせをCareo経由で就活中の学生にリーチ。開封率が高い、使用中のツール内での配信が可能です。",
    tag: "情報配信",
  },
  {
    icon: "📅",
    title: "相談予約システム",
    desc: "学生がCareoアプリから相談枠を予約・キャンセルできます。職員は空き枠を設定・管理でき、予約リマインダーを自動送信。来談率の向上と予約管理の効率化を同時に実現します。",
    tag: "新機能",
  },
  {
    icon: "🤝",
    title: "貴大学に合わせた導入サポート",
    desc: "初回ヒアリングで課題・規模・既存システムを確認し、最適な連携プランをご提案します。料金は大学の規模・利用範囲に応じてご相談ください。",
    tag: "オーダーメイド",
  },
];

// ─── Steps データ ─────────────────────────────────────────────────────────────
const steps = [
  {
    step: "01",
    title: "提携申し込み",
    desc: "このページのフォームからお問い合わせください。ご担当者様とオンラインで30分のヒアリングを行い、貴大学に合わせた連携設定をします。",
  },
  {
    step: "02",
    title: "学生がCareoを使い始める",
    desc: "学生は大学メールアドレスで登録するだけ。AIコーチ「カレオ」が365日就活を伴走します。学生への強制や課金は一切ありません。",
  },
  {
    step: "03",
    title: "連携スタート",
    desc: "学生が共有を許可すると、キャリアセンターのダッシュボードにデータが反映されます。面談の質が上がり、プロアクティブな支援が可能になります。",
  },
];

export default function CareerCenterLandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [openFaqs, setOpenFaqs] = useState<Set<number>>(new Set());
  const [form, setForm] = useState({ name: "", email: "", university: "", message: "" });
  const [formState, setFormState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const observerRef = useRef<IntersectionObserver | null>(null);

  // スクロール検知
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // スクロールアニメーション
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("visible");
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState("sending");
    try {
      const res = await fetch("/api/career-center-inquiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          university: form.university,
          message: form.message,
        }),
      });
      if (res.ok) setFormState("done");
      else setFormState("error");
    } catch {
      setFormState("error");
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
          scrolled ? "lp-header-scrolled" : "bg-transparent"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-new.svg" alt="Careo" className="w-7 h-7" />
            <span className="font-bold text-[#0D0B21] text-lg tracking-tight">Careo</span>
            <span className="hidden sm:inline text-xs text-gray-400 font-medium ml-1 border-l border-gray-200 pl-2">
              for キャリアセンター
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <a
              href="#contact"
              className="text-sm text-gray-600 hover:text-[#00c896] transition-colors hidden md:block"
            >
              お問い合わせ
            </a>
            <Link
              href="/career-portal/login"
              className="text-sm text-gray-500 hover:text-gray-800 transition-colors hidden md:block"
            >
              担当者ログイン
            </Link>
            <a
              href="#contact"
              className="text-sm font-bold text-[#00c896] border border-[#00c896] px-4 py-2 rounded-xl hover:bg-[#00c896]/10 transition-all hidden md:block"
            >
              資料請求
            </a>
            <a
              href="#contact"
              className="lp-btn-primary text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-all hover:scale-105"
            >
              提携を検討する
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-20 md:pt-36 md:pb-32">
        {/* 背景 */}
        <div className="absolute inset-0 lp-dot-grid opacity-60" />
        <div className="lp-hero-glow absolute inset-0 pointer-events-none" />
        <div className="lp-hero-blob-1 absolute w-[600px] h-[500px] -top-32 -left-40 animate-blob animate-float-slow pointer-events-none" />
        <div className="lp-hero-blob-2 absolute w-[500px] h-[400px] -bottom-20 -right-32 animate-blob delay-1000 animate-float pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-6 text-center">
          {/* バッジ */}
          <div className="inline-flex items-center gap-2 bg-[#00c896]/8 border border-[#00c896]/20 text-[#00a87e] text-xs font-bold px-4 py-2 rounded-full mb-8 animate-fade-in">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00c896] animate-pulse" />
            大学キャリアセンター担当者の方へ
          </div>

          {/* メインコピー */}
          <h1 className="text-4xl md:text-6xl font-bold text-[#0D0B21] tracking-tight leading-tight mb-6 animate-fade-up">
            学生の就活を、<br className="hidden md:block" />
            <span className="lp-gradient-text-hero bg-clip-text text-transparent">
              データで支援できる時代へ。
            </span>
          </h1>

          <p className="text-gray-500 text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed animate-fade-up delay-200">
            Careoは学生が自主的に使う就活管理アプリです。<br className="hidden md:block" />
            大学と連携することで、面談の質が上がり、孤立した学生に届き、<br className="hidden md:block" />
            支援の成果が可視化されます。<span className="font-semibold text-[#0D0B21]">相談予約もCareoで完結</span>。まずは<span className="font-semibold text-[#0D0B21]">無料ヒアリング</span>からお気軽にご相談ください。
          </p>

          {/* CTAボタン */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-up delay-300">
            <a
              href="#contact"
              className="lp-btn-hero text-white font-bold px-8 py-4 rounded-2xl text-base transition-all hover:scale-105 hover:-translate-y-0.5 w-full sm:w-auto"
            >
              提携を検討する（ヒアリング無料）→
            </a>
            <a
              href="#features"
              className="text-gray-600 font-medium px-6 py-4 rounded-2xl border border-gray-200 hover:border-[#00c896]/40 hover:text-[#00a87e] transition-all text-base w-full sm:w-auto text-center"
            >
              機能を見る
            </a>
          </div>

          {/* 実績バッジ */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 animate-fade-in delay-500">
            {[
              { value: "無料", label: "初回ヒアリング" },
              { value: "完全", label: "プライバシー優先設計" },
              { value: "即日", label: "導入開始可能" },
            ].map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center">
                <span className="text-2xl font-bold text-[#00c896]">{value}</span>
                <span className="text-xs text-gray-400 mt-0.5">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pain Points ────────────────────────────────────────────────────── */}
      <section className="bg-[#0D0B21] py-24 px-6 relative overflow-hidden">
        <div className="lp-dark-grid absolute inset-0 opacity-40" />
        {/* ambient glow */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00c896]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-blue-500/3 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-14 reveal">
            <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3">The Problem</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
              キャリアセンターが抱える、<span className="lp-gradient-text-dark bg-clip-text text-transparent">4つの課題</span>
            </h2>
            <p className="text-gray-400 text-sm max-w-xl mx-auto">
              調査では担当者の60〜75%がこれらを課題と回答。情報の非対称性が根本原因です。
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {painPoints.map((item, i) => (
              <div
                key={item.title}
                className={`lp-story-card rounded-2xl p-7 reveal reveal-delay-${i + 1}`}
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <span className="inline-block text-[10px] font-bold text-[#00c896] bg-[#00c896]/10 px-2 py-0.5 rounded-full mb-3">
                  {item.tag}
                </span>
                <h3 className="text-white font-bold text-lg mb-3 leading-snug">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Bridge */}
          <div className="mt-14 text-center reveal">
            <p className="text-gray-300 text-lg font-medium">
              これらは全て、<span className="text-[#00c896] font-bold">Careoとの提携</span>で解決できます。
            </p>
          </div>
        </div>
      </section>

      {/* ── Solution ───────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-gray-50/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 reveal">
            <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3">The Solution</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0D0B21] tracking-tight mb-4">
              Careoが、その課題を<br className="hidden md:block" />
              <span className="lp-gradient-text-green bg-clip-text text-transparent">こう解決します</span>
            </h2>
          </div>

          <div className="space-y-10">
            {[
              {
                problem: "面談まで学生の状況がわからない",
                solution: "面談「前」から全体像を把握",
                detail:
                  "学生が同意した就活データ（応募企業・選考フェーズ・ES状況・自己分析・AI分析レポート）が、面談前にキャリアセンターのダッシュボードに反映されます。「今週、A社の最終面接があります」——来談前から深いアドバイスの準備ができます。",
                icon: "📱",
                align: "left",
              },
              {
                problem: "困っている学生ほど来談しない",
                solution: "学生が自ら動く仕組み＋プロアクティブリーチ",
                detail:
                  "Careoには、AIコーチ「カレオ」が学生の就活全体を把握し、週次でPDCA分析・気づき通知を自動配信する機能があります。困っていても来談できない学生には、キャリアセンターからCareo経由でメッセージを届けられます。",
                icon: "🤖",
                align: "right",
              },
              {
                problem: "支援の成果が数字で見えない",
                solution: "集計ダッシュボードで支援効果を証明",
                detail:
                  "提携大学全体の就活状況（平均応募社数・ES通過率・内定獲得率）を集計データで確認できます。前年比較、学部間比較、フェーズ別進捗——支援の優先度判断や報告書作成に活用できます。",
                icon: "📊",
                align: "left",
              },
            ].map((item) => (
              <div
                key={item.problem}
                className={`flex flex-col ${item.align === "right" ? "md:flex-row-reverse" : "md:flex-row"} gap-8 items-center reveal`}
              >
                {/* テキスト側 */}
                <div className="flex-1">
                  <span className="inline-block text-xs text-gray-400 bg-gray-100 px-3 py-1 rounded-full mb-3">
                    課題: {item.problem}
                  </span>
                  <h3 className="text-2xl font-bold text-[#0D0B21] mb-4">
                    <span className="text-[#00c896]">→</span> {item.solution}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.detail}</p>
                </div>
                {/* アイコン側 */}
                <div className="flex-shrink-0 w-full md:w-64 h-48 bg-gradient-to-br from-[#00c896]/5 to-[#059669]/8 rounded-2xl border border-[#00c896]/15 flex items-center justify-center text-6xl">
                  {item.icon}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Handshake / Market Proof ───────────────────────────────────────── */}
      <section className="bg-[#0D0B21] py-24 px-6 relative overflow-hidden">
        <div className="lp-dark-grid absolute inset-0 opacity-30" />
        <div className="absolute top-1/3 left-0 w-[500px] h-[400px] bg-[#00c896]/4 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500/3 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto">
          <div className="text-center mb-16 reveal">
            <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3">Market Proof</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
              このモデルは、<span className="lp-gradient-text-dark bg-clip-text text-transparent">すでにアメリカで証明されている</span>
            </h2>
            <p className="text-gray-400 text-sm max-w-2xl mx-auto leading-relaxed">
              Careoが目指すビジネスモデルの先駆者が、アメリカにいます。その名は<span className="text-white font-semibold">Handshake</span>。
            </p>
          </div>

          {/* Handshake実績カード */}
          <div className="lp-story-card rounded-2xl p-8 md:p-10 mb-10 reveal">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-xs text-gray-300 font-medium mb-5">
                  🇺🇸 アメリカ・就活プラットフォーム
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-2xl font-bold text-white">Handshake</h3>
                  <a
                    href="https://joinhandshake.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#00c896] transition-colors border border-white/10 hover:border-[#00c896]/30 px-2.5 py-1 rounded-full"
                  >
                    公式サイト
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">
                  2014年創業。「大学キャリアセンターと学生と企業をつなぐ」プラットフォームとして急成長。
                  学生は無料、大学・企業が課金するビジネスモデルで、全米トップ大学の90%以上が導入。
                  2022年には評価額<span className="text-[#00c896] font-bold">約3,500億円（$3.5B）</span>のユニコーン企業となりました。
                </p>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { value: "1,400+", label: "導入大学数" },
                    { value: "1,400万+", label: "登録学生数" },
                    { value: "$3.5B", label: "企業評価額" },
                  ].map(({ value, label }) => (
                    <div key={label} className="text-center bg-white/5 rounded-xl p-3">
                      <p className="text-xl font-bold text-[#00c896]">{value}</p>
                      <p className="text-xs text-gray-400 mt-1">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 矢印＋Careo */}
              <div className="hidden md:flex flex-col items-center justify-center gap-3 pt-8">
                <div className="text-3xl text-[#00c896] animate-float">→</div>
              </div>

              <div className="flex-1 lp-pricing-card rounded-xl p-6">
                <div className="inline-flex items-center gap-2 bg-[#00c896]/10 border border-[#00c896]/20 px-3 py-1.5 rounded-full text-xs text-[#00c896] font-bold mb-5">
                  🇯🇵 日本版 × AI特化
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Careo</h3>
                <p className="text-gray-300 text-sm leading-relaxed mb-5">
                  Handshakeと同じ「学生無料・大学課金」モデルを、<span className="text-white font-semibold">日本の就活文化に最適化</span>した形で展開。
                  さらにAIコーチング・ES分析・PDCA自動化という独自機能で、
                  単なるプラットフォームを超えた<span className="text-[#00c896] font-bold">「就活OS」</span>を目指しています。
                </p>
                <ul className="space-y-2">
                  {[
                    "日本独自のES・OB訪問・筆記試験に対応",
                    "AIが学生の就活全体をコーチング",
                    "大学キャリアセンターとのデータ連携",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-[#00c896] mt-0.5 flex-shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* メッセージ */}
          <div className="text-center reveal">
            <p className="text-gray-300 text-base md:text-lg leading-relaxed">
              Handshakeが証明した通り、<span className="text-white font-bold">大学キャリアセンターが就活エコシステムの中心</span>になれる時代が来ています。<br className="hidden md:block" />
              日本でそれを実現するのが、Careoです。
            </p>
            <a
              href="#contact"
              className="inline-flex items-center gap-2 mt-8 lp-btn-primary text-white font-bold px-8 py-3.5 rounded-xl transition-all hover:scale-105"
            >
              貴大学でも、この革命を →
            </a>
          </div>
        </div>
      </section>

      {/* ── 競合比較・差別化 ───────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-gray-50/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 reveal">
            <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3">Differentiation</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0D0B21] tracking-tight mb-4">
              既存のツールとは、<span className="text-[#00c896]">何が違うのか</span>
            </h2>
            <p className="text-gray-500 text-sm max-w-2xl mx-auto leading-relaxed">
              「今あるツールで十分では？」——この疑問に正面から答えます。
            </p>
          </div>

          {/* ポジショニングマップ */}
          <div className="mb-16 reveal">
            <h3 className="text-base font-bold text-gray-400 uppercase tracking-widest text-center mb-8">就活支援ツールのポジショニングマップ</h3>

            <div className="relative mx-auto max-w-[560px] h-[400px]">
              {/* 外枠 */}
              <div className="absolute inset-0 rounded-3xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
                  <div className="bg-gray-50/60" />
                  <div className="bg-[#00c896]/5" />
                  <div className="bg-gray-50/80" />
                  <div className="bg-gray-50/60" />
                </div>
                <div className="absolute top-1/2 left-0 right-0 h-px bg-gray-200" />
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-200" />
              </div>

              {/* 軸ラベル */}
              <div className="absolute top-2 w-full flex justify-center">
                <span className="text-[11px] font-bold text-[#00c896] bg-white/90 px-2 py-0.5 rounded-full border border-[#00c896]/20">情報可視性 高 ↑</span>
              </div>
              <div className="absolute bottom-2 w-full flex justify-center">
                <span className="text-[11px] text-gray-400 bg-white/90 px-2 py-0.5 rounded-full">情報可視性 低</span>
              </div>
              <div className="absolute left-2 top-0 bottom-0 flex items-center justify-center">
                <span className="text-[10px] text-gray-400 select-none -rotate-90 whitespace-nowrap">← 義務的（強制利用）</span>
              </div>
              <div className="absolute right-2 top-0 bottom-0 flex items-center justify-center">
                <span className="text-[10px] font-bold text-gray-600 select-none [writing-mode:vertical-rl]">自主利用 →</span>
              </div>

              {/* ゾーンラベル */}
              <div className="absolute top-7 right-7 text-[9px] text-[#00c896]/50 font-bold select-none">Careoゾーン（空白地帯）</div>

              {/* 従来の就職支援システム */}
              <div className="absolute left-[18%] top-[28%] -translate-x-1/2 -translate-y-1/2">
                <div className="bg-gray-100 border border-gray-300 rounded-xl px-3 py-2 text-center shadow-sm whitespace-nowrap">
                  <p className="text-[10px] font-bold text-gray-600">従来の就職支援システム</p>
                </div>
              </div>

              {/* Google Forms / アンケート */}
              <div className="absolute left-[24%] top-[68%] -translate-x-1/2 -translate-y-1/2">
                <div className="bg-gray-100 border border-gray-300 rounded-xl px-3 py-2 text-center shadow-sm whitespace-nowrap">
                  <p className="text-[10px] font-bold text-gray-500">アンケート / Forms</p>
                </div>
              </div>

              {/* LINE / メール */}
              <div className="absolute left-[38%] top-[74%] -translate-x-1/2 -translate-y-1/2">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-3 py-2 text-center shadow-sm">
                  <p className="text-[10px] font-bold text-yellow-700">LINE / メール</p>
                </div>
              </div>

              {/* リクナビ / マイナビ */}
              <div className="absolute left-[75%] top-[78%] -translate-x-1/2 -translate-y-1/2">
                <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-center shadow-sm whitespace-nowrap">
                  <p className="text-[10px] font-bold text-red-600">リクナビ / マイナビ</p>
                </div>
              </div>

              {/* Careo（強調） */}
              <div className="absolute left-[80%] top-[18%] -translate-x-1/2 -translate-y-1/2">
                <div className="bg-[#00c896] rounded-xl px-3.5 py-2.5 text-center shadow-lg shadow-[#00c896]/40 ring-2 ring-[#00c896]/30">
                  <p className="text-[11px] font-bold text-white">✦ Careo</p>
                  <p className="text-[9px] text-white/80">自主利用×高可視性</p>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-gray-400 mt-4">
              ※ ポジションはCareoの主観的評価に基づくイメージです。
            </p>
          </div>

          {/* 比較テーブル */}
          <div className="reveal">
            <h3 className="text-base font-bold text-gray-400 uppercase tracking-widest text-center mb-8">各ツールとの比較</h3>
            <div className="overflow-x-auto -mx-2 rounded-2xl border border-gray-200 shadow-sm bg-white">
              <table className="w-full text-xs min-w-[620px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/80">
                    <th scope="col" className="text-left py-4 px-5 text-gray-400 font-medium w-[28%]">比較軸</th>
                    <th className="py-4 px-3 text-center text-gray-400 font-medium">従来の<br />就職支援システム</th>
                    <th className="py-4 px-3 text-center text-gray-400 font-medium">リクナビ<br />マイナビ</th>
                    <th className="py-4 px-3 text-center text-gray-400 font-medium">LINE/<br />メール</th>
                    <th className="py-4 px-3 text-center text-gray-400 font-medium">アンケート/<br />Forms</th>
                    <th className="py-4 px-3 text-center">
                      <span className="bg-[#00c896] text-white text-xs font-bold px-3 py-1.5 rounded-lg">Careo</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    {
                      label: "学生が自主的に使う",
                      note: "義務でなく自分のために使う",
                      old: false, riku: true, line: "△", form: false, careo: true,
                    },
                    {
                      label: "リアルタイムで状況把握",
                      note: "面談前に学生の今を知れる",
                      old: "△", riku: false, line: false, form: false, careo: true,
                    },
                    {
                      label: "AI分析・インサイト付き",
                      note: "単なるデータではなく示唆",
                      old: false, riku: false, line: false, form: false, careo: true,
                    },
                    {
                      label: "孤立学生へのリーチ",
                      note: "来談しない学生にも届く",
                      old: false, riku: false, line: "△", form: false, careo: true,
                    },
                    {
                      label: "既存システムと共存できる",
                      note: "置き換えではなく補完",
                      old: "—", riku: true, line: true, form: true, careo: true,
                    },
                    {
                      label: "支援成果の可視化",
                      note: "データで効果を証明できる",
                      old: "△", riku: false, line: false, form: "△", careo: true,
                    },
                    {
                      label: "学生側の費用",
                      note: "学生の負担",
                      old: "無料", riku: "無料", line: "無料", form: "無料", careo: "完全無料",
                    },
                  ].map(row => {
                    const cell = (v: boolean | string) =>
                      v === true ? <span className="text-[#00c896] font-bold text-base">✓</span>
                      : v === false ? <span className="text-gray-200 text-base">—</span>
                      : <span className="text-amber-500 text-[10px] font-semibold">{v}</span>;
                    const careoCell = (v: boolean | string) =>
                      v === true ? <span className="text-[#00c896] font-bold text-base">✓</span>
                      : v === false ? <span className="text-gray-300 text-base">—</span>
                      : <span className="text-[#00c896] text-[10px] font-bold">{v}</span>;
                    return (
                      <tr key={row.label} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-5 text-gray-700 font-medium text-xs">
                          {row.label}
                          {row.note && <span className="block text-[10px] text-gray-400 font-normal mt-0.5">{row.note}</span>}
                        </td>
                        <td className="py-3.5 px-3 text-center">{cell(row.old)}</td>
                        <td className="py-3.5 px-3 text-center">{cell(row.riku)}</td>
                        <td className="py-3.5 px-3 text-center">{cell(row.line)}</td>
                        <td className="py-3.5 px-3 text-center">{cell(row.form)}</td>
                        <td className="py-3.5 px-3 text-center bg-[#00c896]/3">{careoCell(row.careo)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-center text-xs text-gray-400 mt-3">
              ※ △: 部分的に対応 / 条件あり。2026年現在の情報をもとに作成。
            </p>
          </div>
        </div>
      </section>

      {/* ── 立ち位置と発展戦略 ─────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 reveal">
            <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3">Strategy</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0D0B21] tracking-tight mb-4">
              Careoはどこを目指すのか
            </h2>
            <p className="text-gray-500 text-sm max-w-2xl mx-auto leading-relaxed">
              学生のツールとして始まり、大学キャリアセンターのインフラへ。<br className="hidden md:block" />
              段階的に価値を積み上げる、Careoの発展戦略です。
            </p>
          </div>

          {/* 3層エコシステム図 */}
          <div className="mb-16 reveal">
            <h3 className="text-base font-bold text-gray-400 uppercase tracking-widest text-center mb-8">就活エコシステムにおける立ち位置</h3>
            <div className="space-y-2 max-w-2xl mx-auto">
              {/* Layer 1: 学生 */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">LAYER 1</span>
                  <h4 className="font-bold text-blue-800 text-sm">学生</h4>
                </div>
                <p className="text-sm text-blue-700 mb-3">自主的にCareoを使って就活を管理。AIコーチング・ES管理・選考PDCA。</p>
                <div className="flex gap-1.5 flex-wrap">
                  {["ES管理", "面接ログ", "OB/OG訪問", "PDCA分析", "AIコーチ「カレオ」"].map(tag => (
                    <span key={tag} className="bg-white text-blue-600 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-blue-200">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="flex justify-center py-1">
                <span className="text-[#00c896] text-xs font-semibold">↕ 学生が同意した情報をリアルタイムで連携</span>
              </div>

              {/* Layer 2: Careo */}
              <div className="bg-gradient-to-r from-[#00c896]/10 to-[#059669]/8 border border-[#00c896]/30 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-[#00c896] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">LAYER 2</span>
                  <h4 className="font-bold text-[#0D0B21] text-sm">Careo（データハブ＋AIエンジン）</h4>
                </div>
                <p className="text-sm text-gray-600 mb-3">学生データを集約・AIで分析し、学生とキャリアセンターの両方に価値を提供。</p>
                <div className="flex gap-1.5 flex-wrap">
                  {["AIインサイト生成", "週次PDCA自動化", "プライバシー管理", "データ集計", "キャリアセンターレポート"].map(tag => (
                    <span key={tag} className="bg-white text-[#00a87e] text-[10px] font-semibold px-2 py-0.5 rounded-full border border-[#00c896]/30">{tag}</span>
                  ))}
                </div>
              </div>

              <div className="flex justify-center py-1">
                <span className="text-[#00c896] text-xs font-semibold">↓ ダッシュボードで可視化・支援強化</span>
              </div>

              {/* Layer 3: キャリアセンター */}
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="bg-purple-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">LAYER 3</span>
                  <h4 className="font-bold text-purple-800 text-sm">キャリアセンター（提携大学）</h4>
                </div>
                <p className="text-sm text-purple-700 mb-3">学生の就活状況をリアルタイムで把握。面談の質向上・孤立学生へのリーチ・支援効果の可視化。</p>
                <div className="flex gap-1.5 flex-wrap">
                  {["ダッシュボード閲覧", "個別メッセージ送信", "集計レポート", "AI面談準備サポート"].map(tag => (
                    <span key={tag} className="bg-white text-purple-600 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-purple-200">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
            <p className="text-center text-xs text-gray-400 mt-5">
              既存の就職支援システムの置き換えではなく、「学生の実態データ」という新しいレイヤーを追加します。
            </p>
          </div>

          {/* 発展ロードマップ */}
          <div className="reveal">
            <h3 className="text-base font-bold text-gray-400 uppercase tracking-widest text-center mb-8">Careoの発展ロードマップ</h3>
            <div className="grid md:grid-cols-3 gap-5">
              {[
                {
                  phase: "Phase 1",
                  title: "学生への普及・信頼構築",
                  status: "現在進行中",
                  statusCls: "bg-[#00c896] text-white",
                  desc: "就活AIアプリとして学生に使われること。AIコーチング・ES管理・PDCA分析を通じて「手放せないツール」になる。",
                  items: ["AIコーチ「カレオ」", "週次PDCA分析", "ES管理・AIチェック", "OB/OG訪問・筆記試験管理"],
                  borderCls: "border-[#00c896]/40",
                  bgCls: "bg-[#00c896]/5",
                },
                {
                  phase: "Phase 2",
                  title: "大学連携 × SaaS提供",
                  status: "提携募集中",
                  statusCls: "bg-blue-500 text-white",
                  desc: "普及した学生データをキャリアセンターへ橋渡し。月額SaaSとして提供し、相談予約システム・ダッシュボード・AI分析インサイトを一体で導入できます（詳細はヒアリングにて）。",
                  items: ["キャリアセンターダッシュボード", "相談予約システム", "学生への個別メッセージ", "大学全体の集計分析", "面談前AIインサイト"],
                  borderCls: "border-blue-200",
                  bgCls: "bg-blue-50/50",
                },
                {
                  phase: "Phase 3",
                  title: "企業マッチング × 採用インフラ化",
                  status: "将来ビジョン",
                  statusCls: "bg-purple-500 text-white",
                  desc: "学生・大学・企業の3者をつなぐ就活データプラットフォームへ。就活過程データを活用した高精度マッチングで、日本の採用インフラを変える。",
                  items: ["企業との採用データ連携", "就活過程データを使った高精度マッチング", "複数大学間の比較分析", "就活トレンド・予測レポート"],
                  borderCls: "border-purple-200",
                  bgCls: "bg-purple-50/50",
                },
              ].map((phase, i) => (
                <div key={phase.phase} className={`border ${phase.borderCls} ${phase.bgCls} rounded-2xl p-6 reveal reveal-delay-${i + 1}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold text-gray-400">{phase.phase}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${phase.statusCls}`}>{phase.status}</span>
                  </div>
                  <h4 className="font-bold text-[#0D0B21] text-base mb-3 leading-snug">{phase.title}</h4>
                  <p className="text-gray-500 text-xs leading-relaxed mb-4">{phase.desc}</p>
                  <ul className="space-y-1.5">
                    {phase.items.map(item => (
                      <li key={item} className="flex items-start gap-1.5 text-xs text-gray-600">
                        <span className="text-[#00c896] mt-0.5 shrink-0">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 開発者ストーリー ─────────────────────────────────────────────────── */}
      <section className="bg-[#0D0B21] py-24 px-6 relative overflow-hidden">
        <div className="lp-dark-grid absolute inset-0 opacity-30" />
        <div className="absolute top-1/3 right-0 w-[400px] h-[400px] bg-[#00c896]/4 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl mx-auto">
          <div className="text-center mb-12 reveal">
            <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3">Our Story</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
              なぜCareoを作ったのか
            </h2>
          </div>

          <div className="lp-story-card rounded-2xl p-8 md:p-10 reveal">
            <div className="flex items-center gap-4 mb-7">
              <div className="w-12 h-12 rounded-2xl bg-[#00c896]/20 border border-[#00c896]/30 flex items-center justify-center text-2xl shrink-0">
                🎓
              </div>
              <div>
                <p className="text-white font-bold text-base">上智大学 在学中の学生が開発</p>
                <p className="text-gray-400 text-sm">開発者自身が、就活をしながらCareoを作り続けている</p>
              </div>
            </div>

            <div className="space-y-5 text-gray-300 text-sm leading-relaxed">
              <p>
                Careoの開発者は、自分自身が就活をする中で「なぜこんなに管理が大変なんだろう」と感じたことがきっかけで開発を始めました。
              </p>
              <p>
                ESの締切を見落としそうになったり、面接の振り返りをしようにもどこに書いたかわからなくなったり。
                Notionでテンプレートを作ってみても、管理するための管理が増えるだけ。
                自分で使うために作り始めたCareoが、気づけば「全部AIがやってくれるツール」になっていました。
              </p>
              <p>
                就活を進める中で、もうひとつ気づいたことがあります。
                <span className="text-white font-semibold">キャリアセンターに相談できたらどれほど楽だったか</span>——でも、何を相談すればいいかわからない。自分の状況を言語化する前に、面談の時間が来てしまう。
              </p>
              <p>
                そこから、学生が自分で使うツールと、キャリアセンターの支援をつなぐという構想が生まれました。
                <span className="text-[#00c896] font-semibold">学生が自然に使い続けることで、キャリアセンターに価値あるデータが流れる</span>——押しつけではなく、学生が「使いたい」と思えるツールだからこそ成り立つモデルです。
              </p>
            </div>

            <div className="mt-8 pt-7 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <p className="text-gray-400 text-xs leading-relaxed max-w-lg">
                開発者自身がユーザーであるため、学生目線の改善が常に行われています。<br />
                「使ってもらえるツール」にこだわり続けることが、Careoの競争優位です。
              </p>
              <a
                href="#contact"
                className="shrink-0 inline-flex items-center gap-2 lp-btn-primary text-white font-bold px-6 py-3 rounded-xl transition-all hover:scale-105 text-sm"
              >
                提携を検討する →
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 reveal">
            <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3">Features</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0D0B21] tracking-tight mb-4">
              提携で使えるようになる<span className="text-[#00c896]">主要機能</span>
            </h2>
            <p className="text-gray-500 text-sm max-w-xl mx-auto">
              提携プランに含まれる機能一覧です。詳細はヒアリングにてご説明します。
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`group border border-gray-100 rounded-2xl p-6 hover:border-[#00c896]/30 hover:-translate-y-1 transition-all duration-300 reveal reveal-delay-${(i % 4) + 1}`}
              >
                <div className="lp-step-icon w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4">
                  {f.icon}
                </div>
                <span className="inline-block text-[10px] font-bold text-[#00c896] bg-[#00c896]/8 px-2 py-0.5 rounded-full mb-3">
                  {f.tag}
                </span>
                <h3 className="font-bold text-[#0D0B21] text-base mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ───────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-gray-50/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16 reveal">
            <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3">How it Works</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0D0B21] tracking-tight mb-4">
              提携開始まで、<span className="text-[#00c896]">3ステップ</span>
            </h2>
            <p className="text-gray-500 text-sm">最短1週間で連携をスタートできます。</p>
          </div>

          <div className="relative">
            {/* 接続ライン（PCのみ） */}
            <div className="hidden md:block absolute top-10 left-[16.67%] right-[16.67%] h-px bg-gradient-to-r from-[#00c896]/30 via-[#00c896]/60 to-[#00c896]/30" />

            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <div key={step.step} className={`text-center reveal reveal-delay-${i + 1}`}>
                  <div className="relative inline-flex">
                    <div className="lp-step-icon w-20 h-20 rounded-2xl flex flex-col items-center justify-center mx-auto mb-6">
                      <span className="text-[#00c896] text-xs font-bold">STEP</span>
                      <span className="text-2xl font-bold text-[#0D0B21]">{step.step}</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-[#0D0B21] text-base mb-3">{step.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Privacy First ──────────────────────────────────────────────────── */}
      <section className="bg-[#0D0B21] py-24 px-6 relative overflow-hidden">
        <div className="lp-dark-grid-subtle absolute inset-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#00c896]/4 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto">
          <div className="text-center mb-14 reveal">
            <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3">Privacy First</p>
            <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-4">
              学生のプライバシーを、<br className="hidden md:block" />
              <span className="lp-gradient-text-dark bg-clip-text text-transparent">設計の中心に置いています</span>
            </h2>
            <p className="text-gray-400 text-sm max-w-xl mx-auto">
              Careoが大学と連携する上で最も大切にしているのは、学生への信頼です。
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 mb-10">
            {[
              {
                icon: "🔒",
                title: "学生が情報開示をコントロール",
                desc: "キャリアセンターへの共有は学生が設定。選考企業名・ES内容・選考フェーズなど、見せたくない情報は非公開にできます。",
              },
              {
                icon: "🏫",
                title: "自分の大学のみに共有",
                desc: "データが共有されるのは在籍大学のキャリアセンターのみ。他大学やCareoの外部に個人情報が出ることはありません。",
              },
              {
                icon: "📊",
                title: "集計データのみの利用も可",
                desc: "個人を特定しない集計データのみでの連携も選択できます。学生の同意取得が難しい段階でも、大学全体の傾向把握から始められます。",
              },
            ].map((item, i) => (
              <div key={item.title} className={`lp-story-card rounded-2xl p-6 reveal reveal-delay-${i + 1}`}>
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="text-white font-bold text-base mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="lp-pricing-card rounded-2xl p-7 text-center reveal">
            <p className="text-[#00c896] text-sm font-bold mb-2">
              学生のデータは学生のもの
            </p>
            <p className="text-gray-300 text-sm leading-relaxed max-w-2xl mx-auto">
              Careoは学生が「使いたい」と思えるサービスであることを最優先にしています。
              強制的なデータ収集・共有は一切行いません。学生がCareoを安心して使えるからこそ、
              キャリアセンターにとって価値のある情報が集まります。
            </p>
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-14 reveal">
            <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3">FAQ</p>
            <h2 className="text-3xl font-bold text-[#0D0B21] tracking-tight">よくある質問</h2>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, i) => (
              <div
                key={i}
                className={`border rounded-xl overflow-hidden transition-colors duration-200 reveal reveal-delay-${(i % 4) + 1} ${
                  openFaqs.has(i) ? "border-[#00c896]/30" : "border-gray-100"
                }`}
              >
                <button
                  type="button"
                  className="w-full text-left px-5 py-4 flex items-center justify-between gap-4"
                  onClick={() => setOpenFaqs(prev => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next; })}
                >
                  <span className="font-semibold text-[#0D0B21] text-sm">{item.q}</span>
                  <span
                    className={`text-[#00c896] text-xl transition-transform duration-200 flex-shrink-0 ${
                      openFaqs.has(i) ? "rotate-180" : ""
                    }`}
                  >
                    ↓
                  </span>
                </button>
                {openFaqs.has(i) && (
                  <div className="px-5 pb-5">
                    <p className="text-gray-500 text-sm leading-relaxed">{item.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact / CTA ──────────────────────────────────────────────────── */}
      <section id="contact" className="py-24 px-6 bg-gray-50/50 relative overflow-hidden">
        <div className="lp-cta-dot-grid absolute inset-0 opacity-60" />
        <div className="lp-cta-glow absolute inset-0 pointer-events-none" />

        <div className="relative max-w-xl mx-auto">
          <div className="text-center mb-12 reveal">
            <p className="text-[#00c896] text-sm font-bold tracking-widest uppercase mb-3">Get Started</p>
            <h2 className="text-3xl md:text-4xl font-bold text-[#0D0B21] tracking-tight mb-4">
              お問い合わせ・<span className="text-[#00c896]">資料請求</span>
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              初回ヒアリングは無料です。30分のオンラインミーティングで、
              貴大学の課題と最適な活用方法をご提案します。<br className="hidden md:block" />
              キャリアセンター向けは月額SaaSモデルでの提供を予定しています。具体的な料金は大学の規模・利用範囲に応じてヒアリングにてご案内します。
            </p>
          </div>

          {formState === "done" ? (
            <div className="lp-after-card border border-[#00c896]/20 rounded-2xl p-10 text-center reveal">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-[#0D0B21] mb-2">お問い合わせを受け付けました</h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                通常2営業日以内にご連絡いたします。<br />
                しばらくお待ちください。
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-5 reveal">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    お名前 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="山田 太郎"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00c896]/30 focus:border-[#00c896]/60 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    メールアドレス <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="yamada@xxx.ac.jp"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00c896]/30 focus:border-[#00c896]/60 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  大学名 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="〇〇大学"
                  value={form.university}
                  onChange={(e) => setForm({ ...form, university: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00c896]/30 focus:border-[#00c896]/60 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  ご質問・ご相談内容 <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="提携に興味があります。詳しく教えてください。"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#00c896]/30 focus:border-[#00c896]/60 transition-all resize-none"
                />
              </div>
              {formState === "error" && (
                <p className="text-red-500 text-xs">送信に失敗しました。しばらく経ってから再度お試しください。</p>
              )}
              <button
                type="submit"
                disabled={formState === "sending"}
                className="w-full lp-btn-primary text-white font-bold py-3.5 rounded-xl transition-all hover:scale-[1.02] hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {formState === "sending" ? "送信中..." : "無料ヒアリングを申し込む →"}
              </button>
              <p className="text-center text-xs text-gray-400">
                初回ヒアリングは無料です。強引な営業は行いません。
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-100 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-new.svg" alt="Careo" className="w-5 h-5 opacity-60" />
            <span>Careo — AI就活コーチアプリ</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/" className="hover:text-[#00c896] transition-colors">学生向けLP</Link>
            <Link href="/career-portal/login" className="hover:text-[#00c896] transition-colors">担当者ログイン</Link>
            <Link href="/terms" className="hover:text-[#00c896] transition-colors">利用規約</Link>
            <Link href="/privacy" className="hover:text-[#00c896] transition-colors">プライバシーポリシー</Link>
          </div>
          <p>© 2025 Careo. All rights reserved.</p>
        </div>
      </footer>

      <LPChatBot
        welcomeMessage={"こんにちは。キャリアセンター担当者の方ですね。\n導入のご相談・費用のこと・学生データの扱いなど、何でもお答えします。"}
        subtitle="キャリアセンター向け相談窓口"
        suggestions={[
          "導入費用はどのくらいですか？",
          "学生のプライバシーは守られますか？",
          "既存の支援システムと併用できますか？",
          "まず何から始めればいいですか？",
        ]}
      />
    </div>
  );
}
