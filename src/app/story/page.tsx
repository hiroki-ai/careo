import Link from "next/link";
import type { Metadata } from "next";
import { CareoKun } from "@/components/landing/CareoKun";

export const metadata: Metadata = {
  title: "開発者ストーリー | Careo - 28卒の大学生が個人開発で就活アプリを作るまで",
  description: "大学キャリアセンター営業の失敗、ToCへの方針転換、3軸（キャッシュフロー・顧客体験・差別化）の確定、そして今日まで。Careoを個人開発している28卒の全記録。",
  openGraph: {
    title: "Careo 開発者ストーリー",
    description: "28卒の大学生が個人開発で就活アプリを作るまで、全部公開。",
  },
};

const ACCENT = "#00c896";
const ACCENT_DEEP = "#00a87e";
const INK = "#0D0B21";
const BG = "#fcfbf8";
const SURFACE = "#f5f3ee";

interface Milestone {
  date: string;
  title: string;
  body: string;
  tag?: "挫折" | "学び" | "決断" | "リリース";
  tagColor?: string;
}

const MILESTONES: Milestone[] = [
  {
    date: "2025年秋",
    title: "自分の就活管理用にCareoを作り始めた",
    tag: "リリース",
    tagColor: "#00a87e",
    body: "28卒の自分自身が、就活の進捗を管理するいいアプリが見つからなかった。Notionに書いても続かない、スプレッドシートは面倒。「自分が使いたいもの」をそのまま作った。最初は個人ツールとして、データベース + ダッシュボードだけの超ミニマル版。",
  },
  {
    date: "2026年 初頭",
    title: "キャリセン営業モデルを構想",
    tag: "決断",
    tagColor: "#60a5fa",
    body: "自分以外にも使ってもらいたくなって、「大学キャリアセンターと提携する」構想を立てた。学生は無料、大学が運営資金を出す、双方向コミュニケーション可能なポータル。収益が読めるし、大学という権威も活用できる。Handshake（米国）のモデルを参考に、キャリアセンター用のポータルを本気で実装し始めた。",
  },
  {
    date: "2026年4月上旬",
    title: "大学ヒアリング → 3つの壁",
    tag: "挫折",
    tagColor: "#ef4444",
    body: "実際に大学キャリアセンター担当者と話した。高い評価をもらった一方で、採用には3つの構造的な壁があった。\n\n1. **信頼性・法的責任** — 個人開発者のプロダクトを大学が公式案内するのは不具合時の責任問題で困難。\n2. **情報セキュリティ** — 学生の個人データを扱うにはプロレベル体制が必須。\n3. **継続性** — 開発者が卒業したら誰がメンテするのか。\n\n「学生開発」は応援対象にはなるが、ビジネス契約では信頼性の欠如になる。何度話しても、この構造は個人のままでは越えられないと分かった。",
  },
  {
    date: "2026年4月中旬",
    title: "API cron 全停止・キャッシュフロー緊急止血",
    tag: "決断",
    tagColor: "#f59e0b",
    body: "キャリセン営業の失敗を受け、収益ゼロのままAIコストだけ垂れ流す状態に気づいた。その日のうちに毎日動いていた AI cron 全8本を停止。さらに ChatGPT で代替可能な AI 機能（チャット・ES添削・音声文字起こしなど10個）を削除。合計 -4,563行のコード削除。「新機能を作る前に、まず出血を止める」が最初の判断。",
  },
  {
    date: "2026年4月21日",
    title: "CRM思想でゼロから再設計・ToC方針確定",
    tag: "決断",
    tagColor: "#00a87e",
    body: "営業（学生）× 顧客（企業）× 商談（面接）× 受注（内定）= CRM。就活は「個人営業」と捉え直すと、HubSpot のようなツールとして一貫性のあるプロダクトが見えてくる。5ステップで方針を確定：\n\n1. ターゲット: 28卒・動き出したけど何すればいいか分からない層\n2. コアペイン: 「何から始めるか」「焦り」「締切恐怖」\n3. マネタイズ: ¥480/月フリーミアム + 広告\n4. 成功体験: 30秒で「今週やることTOP3」が見える\n5. MVP: 既存機能を絞り込み、5フェーズで段階的に",
  },
  {
    date: "2026年4月21〜24日",
    title: "3軸で全てを判断する運用に",
    tag: "学び",
    tagColor: "#a78bfa",
    body: "1人開発だと判断がブレやすい。なので「キャッシュフロー / 顧客体験 / 差別化」の3軸で全ての機能追加・削除を評価することにした。この軸に沿わない施策は、どれだけアイデアが面白くても保留にする。たとえば25個のマーケ施策のうち、2個を除外、3個を期限制に修正、3個を後回しにした。",
  },
  {
    date: "2026年4月24日",
    title: "Phase 1〜5のMVP実装完了・LP刷新",
    tag: "リリース",
    tagColor: "#00a87e",
    body: "4日間でPhase 1〜5（コアループ磨き込み・課金ゲート・広告インフラ・LP改造・卒業後フック）を実装。チャット中心のUXから「データ可視化・PDCA・KPI」中心のCRM型UXへ。LPもCareoグリーンの温かい配色に統一、ダッシュボード風モックに差し替え。",
  },
];

const AXES = [
  {
    emoji: "💰",
    title: "キャッシュフロー",
    description: "MAU 5,000までは事業じゃなく先行投資。10,000で副業成立、20,000で月¥25万。出血を止めるのが最優先、幻想で規模は決めない。",
  },
  {
    emoji: "🤝",
    title: "顧客体験",
    description: "使って30秒で価値が分かる設計。入力摩擦を減らし、出力価値を最大化。新規登録は30秒、広告は非侵襲、トライアル30日はカード不要。",
  },
  {
    emoji: "🎯",
    title: "差別化",
    description: "「ChatGPT で代替できる機能は作らない」「個人開発でしか刺せないニッチに寄せる」「Build in Public で誠実さを差別化」の3ルール。",
  },
];

export default function StoryPage() {
  return (
    <div className="min-h-screen font-zen-kaku" style={{ background: BG, color: INK }}>
      {/* Hero */}
      <section className="relative overflow-hidden px-4 pt-12 pb-10 md:px-5 md:pt-20 md:pb-16">
        <div className="absolute pointer-events-none" style={{ top: 40, right: -60, width: 300, height: 300, background: `radial-gradient(circle, ${ACCENT}22, transparent 65%)`, filter: "blur(40px)" }} />
        <div className="absolute pointer-events-none" style={{ bottom: 0, left: -80, width: 280, height: 280, background: "radial-gradient(circle, rgba(255,200,100,0.2), transparent 65%)", filter: "blur(40px)" }} />
        <div className="relative max-w-3xl mx-auto">
          <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 inline-block mb-6">
            ← Careoトップ
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-[#00c896]/30 text-[#00a87e] text-xs font-bold mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00c896]" />
            OUR STORY · Build in Public
          </div>
          <h1 className="font-klee text-3xl md:text-5xl font-bold leading-[1.2] mb-4">
            28卒の大学生が、<br />
            <span style={{ color: ACCENT_DEEP }}>個人開発で就活アプリ</span>を<br className="sm:hidden" />
            作るまで。
          </h1>
          <p className="text-sm md:text-base text-gray-600 leading-[1.9]">
            キャリアセンター営業の失敗、ToCへの方針転換、3軸で判断する運用、そして今日までの全記録。
            <br />
            大手就活アプリでは絶対に出せない、個人開発の裏側を正直に書きます。
          </p>
          <div className="flex flex-wrap gap-2 mt-6">
            <Link href="/stats" className="text-xs font-bold px-4 py-2 rounded-full bg-white border border-gray-200 text-gray-700 hover:border-[#00c896]/40 hover:text-[#00a87e] transition-colors">
              リアルタイム統計 →
            </Link>
            <a href="https://x.com/hiroki_careo" target="_blank" rel="noopener noreferrer" className="text-xs font-bold px-4 py-2 rounded-full bg-black text-white">
              𝕏 でフォロー →
            </a>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="px-4 md:px-5 py-10 md:py-12" style={{ background: SURFACE }}>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-start gap-4 mb-4">
            <div className="shrink-0"><CareoKun size={72} mood="cheer" /></div>
            <div>
              <p className="text-[11px] font-bold text-[#00a87e] tracking-widest uppercase mb-1">WHY WE BUILD</p>
              <h2 className="font-klee text-xl md:text-2xl font-bold leading-tight">
                就活アプリを、<span style={{ color: ACCENT_DEEP }}>学生のための</span>道具に。
              </h2>
            </div>
          </div>
          <p className="text-sm text-gray-700 leading-[1.9]">
            既存の就活サービスはほぼすべて「企業側」からお金をもらう構造です。だから、学生のためだけに最適化するのは難しい。スカウト型も、情報提供型も、本質的には企業に広告を売っている。
          </p>
          <p className="text-sm text-gray-700 leading-[1.9] mt-3">
            Careo は「学生自身が使う管理ツール」としてゼロから設計しました。月¥480のサブスクと広告で回す予定で、学生データを企業に売ることは一切しません。その代わり、なぜどう作っているのか、何が上手くいってないのかを、全部公開します。
          </p>
        </div>
      </section>

      {/* Timeline */}
      <section className="px-4 md:px-5 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <p className="text-[11px] font-bold text-[#00a87e] tracking-widest uppercase mb-2">TIMELINE</p>
            <h2 className="font-klee text-2xl md:text-3xl font-bold">ここまでの道のり</h2>
          </div>
          <div className="relative">
            <div className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-gradient-to-b from-[#00c896] via-[#00c896]/30 to-transparent" />
            {MILESTONES.map((m, i) => (
              <div key={i} className="relative pl-12 pb-8 last:pb-0">
                <div className="absolute left-0 top-1 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white" style={{ background: m.tagColor ?? ACCENT, boxShadow: `0 4px 14px ${m.tagColor ?? ACCENT}55` }}>
                  {i + 1}
                </div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-bold text-gray-400">{m.date}</span>
                  {m.tag && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: m.tagColor ?? ACCENT }}>
                      {m.tag}
                    </span>
                  )}
                </div>
                <h3 className="font-klee text-lg md:text-xl font-bold mb-2 leading-tight">{m.title}</h3>
                <p className="text-sm text-gray-700 leading-[1.9] whitespace-pre-wrap">{m.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 axes */}
      <section className="px-4 md:px-5 py-12 md:py-16" style={{ background: SURFACE }}>
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <p className="text-[11px] font-bold text-[#00a87e] tracking-widest uppercase mb-2">THREE AXES</p>
            <h2 className="font-klee text-2xl md:text-3xl font-bold">
              全てを判断する<br className="sm:hidden" />
              <span style={{ color: ACCENT_DEEP }}>3つの軸</span>
            </h2>
            <p className="text-sm text-gray-600 mt-2 leading-relaxed">
              1人開発は判断がブレやすい。だから毎回この3軸に照らして決める。どれか欠けたら採用しない。
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {AXES.map((a) => (
              <div key={a.title} className="bg-white rounded-2xl p-5 md:p-6" style={{ border: "1px solid rgba(13,11,33,0.06)" }}>
                <div className="text-3xl mb-3">{a.emoji}</div>
                <h3 className="font-klee text-lg font-bold mb-2">{a.title}</h3>
                <p className="text-xs text-gray-600 leading-[1.8]">{a.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lessons */}
      <section className="px-4 md:px-5 py-12 md:py-16">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <p className="text-[11px] font-bold text-[#00a87e] tracking-widest uppercase mb-2">LESSONS</p>
            <h2 className="font-klee text-2xl md:text-3xl font-bold">失敗から学んだこと</h2>
          </div>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl p-5 md:p-6" style={{ border: "1px solid rgba(13,11,33,0.06)" }}>
              <h3 className="font-klee text-base font-bold mb-2">① 個人開発の壁は「技術」じゃない</h3>
              <p className="text-sm text-gray-700 leading-[1.9]">
                大学キャリセン営業で分かったのは、プロダクトの品質で勝っても、個人であるというだけで契約先には選ばれないということ。信頼性・セキュリティ・継続性、この3つは技術で解決できない。なので戦う土俵そのものを B2B から ToC に変えた。
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 md:p-6" style={{ border: "1px solid rgba(13,11,33,0.06)" }}>
              <h3 className="font-klee text-base font-bold mb-2">② 新機能より出血止めが先</h3>
              <p className="text-sm text-gray-700 leading-[1.9]">
                キャリセン営業が頓挫した時、収益ゼロなのに AI cron が毎日回ってAPI コストを垂れ流していた。まず出血を止める。その判断が遅れるほど次の戦略を考える体力がなくなる。作るより削る方が、初期フェーズでは重要なスキル。
              </p>
            </div>
            <div className="bg-white rounded-2xl p-5 md:p-6" style={{ border: "1px solid rgba(13,11,33,0.06)" }}>
              <h3 className="font-klee text-base font-bold mb-2">③ ChatGPTで代替できるものは作らない</h3>
              <p className="text-sm text-gray-700 leading-[1.9]">
                AI チャット、ES 添削、企業研究…これらは ChatGPT で十分。Careo が勝てるのは「ユーザーの就活データを全部持ってる状態でしか成立しない分析」だけ。データが貯まるほど価値が増す機能にフォーカスする。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Current + Next */}
      <section className="px-4 md:px-5 py-12 md:py-16" style={{ background: SURFACE }}>
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <p className="text-[11px] font-bold text-[#00a87e] tracking-widest uppercase mb-2">NOW & NEXT</p>
            <h2 className="font-klee text-2xl md:text-3xl font-bold">いま、そして次に目指すもの</h2>
          </div>
          <div className="bg-white rounded-2xl p-5 md:p-6 mb-4" style={{ border: "1px solid rgba(13,11,33,0.06)" }}>
            <h3 className="font-klee text-base font-bold mb-2">今の状況</h3>
            <p className="text-sm text-gray-700 leading-[1.9]">
              MVP の機能実装はほぼ完了。Stripe での ¥480 サブスク、30日無料トライアル、紹介プログラム、先輩の匿名データ閲覧、KPI ダッシュボード、週次の AI アドバイス — 全部動いています。
              次は<b>28卒の友達3〜5人に実際に使ってもらってフィードバックを取る</b>段階。プロダクトとしての仮説検証が最優先。
            </p>
            <Link href="/stats" className="inline-flex items-center gap-2 text-xs font-bold text-[#00a87e] mt-3 hover:underline">
              リアルタイム統計を見る →
            </Link>
          </div>
          <div className="bg-white rounded-2xl p-5 md:p-6" style={{ border: "1px solid rgba(13,11,33,0.06)" }}>
            <h3 className="font-klee text-base font-bold mb-2">次に目指すもの</h3>
            <ul className="text-sm text-gray-700 leading-[1.9] space-y-2 list-disc pl-5">
              <li>28卒ユーザー 1,000 人突破（MAU 5,000 が事業の損益分岐点）</li>
              <li>サマーインターン期に「毎朝 Careo を開く」習慣が作れるかの検証</li>
              <li>卒業後の 29卒 → 28卒データ閲覧ループを立ち上げる</li>
              <li>もし順調なら、チーム化と法人化を経て、また大学提携を狙い直す</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 md:px-5 py-12">
        <div className="max-w-3xl mx-auto rounded-3xl p-8 md:p-12 text-center" style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DEEP})` }}>
          <div className="mx-auto mb-3 flex justify-center"><CareoKun size={80} mood="cheer" /></div>
          <h2 className="font-klee text-2xl md:text-3xl font-bold text-white mb-3">
            一緒に、Careo を育ててくれる<br />28卒を探してます。
          </h2>
          <p className="text-white/85 text-sm mb-6 max-w-md mx-auto">
            使ってみて感じたことを、どんどん教えてほしい。本気で就活してる人の一次情報が、次の開発を決める。
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <Link href="/signup" className="inline-flex items-center gap-2 bg-white text-[#00a87e] font-black px-7 py-3.5 rounded-xl text-[15px] shadow-xl">
              無料で Careo を始める →
            </Link>
            <a href="https://x.com/hiroki_careo" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-white/20 text-white font-bold px-6 py-3.5 rounded-xl text-[14px] border border-white/30">
              𝕏 でフィードバック →
            </a>
          </div>
          <p className="text-white/60 text-[10px] mt-4">登録30秒 · クレカ不要 · 無料プランあり</p>
        </div>
      </section>
    </div>
  );
}
