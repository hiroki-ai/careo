"use client";

import { useState } from "react";
import Link from "next/link";
import { CareoKun } from "@/components/landing/CareoKun";

const ACCENT = "#00c896";
const ACCENT_DEEP = "#00a87e";
const INK = "#0D0B21";
const BG = "#fcfbf8";

type GradYear = "28" | "29" | "30" | "other";
type Stage = "not_started" | "just_started" | "in_progress" | "advanced";
type CompanyCount = "0" | "1-5" | "6-15" | "16+";
type EsSubmitted = "0" | "1-5" | "6-15" | "16+";
type InterviewCount = "0" | "1-3" | "4-8" | "9+";

interface Answers {
  grad: GradYear | null;
  stage: Stage | null;
  companies: CompanyCount | null;
  es: EsSubmitted | null;
  interviews: InterviewCount | null;
  obVisits: "0" | "1-3" | "4+" | null;
}

// ざっくり内定確率を算出（データ主導の目安、保証ではない）
// 参考値: 就活生の平均エントリー22社、内定率約65%（マイナビ統計）
function calcProbability(a: Answers): { percent: number; rank: "S" | "A" | "B" | "C"; color: string; insights: string[] } {
  let score = 30; // ベースライン
  const insights: string[] = [];

  // 動き出しタイミング（卒業年×フェーズ）
  if (a.grad === "28" && a.stage === "advanced") { score += 15; insights.push("28卒で選考進行中は時期として理想的"); }
  else if (a.grad === "28" && a.stage === "in_progress") { score += 10; }
  else if (a.grad === "28" && a.stage === "just_started") { score += 5; insights.push("28卒ならもう少しペースを上げたい時期"); }
  else if (a.grad === "28" && a.stage === "not_started") { score -= 10; insights.push("28卒で未着手は急ぐ必要あり"); }
  if (a.grad === "29" || a.grad === "30") { score += 5; insights.push("早期動き出しは大きなアドバンテージ"); }

  // 応募企業数
  if (a.companies === "16+") { score += 15; insights.push("16社以上応募はポートフォリオとして十分"); }
  else if (a.companies === "6-15") { score += 10; }
  else if (a.companies === "1-5") { score += 3; insights.push("もう少し応募数を増やすとリスク分散できる"); }
  else if (a.companies === "0") { score -= 15; insights.push("応募を始めるのが最優先"); }

  // ES提出数
  if (a.es === "16+") { score += 10; insights.push("16通以上のESはスキル蓄積が進んでる"); }
  else if (a.es === "6-15") { score += 7; }
  else if (a.es === "1-5") { score += 2; }
  else if (a.es === "0") { score -= 5; }

  // 面接経験
  if (a.interviews === "9+") { score += 10; insights.push("面接経験9回以上は強力な資産"); }
  else if (a.interviews === "4-8") { score += 7; }
  else if (a.interviews === "1-3") { score += 3; }

  // OB訪問
  if (a.obVisits === "4+") { score += 8; insights.push("OB訪問4件以上は業界理解が深い"); }
  else if (a.obVisits === "1-3") { score += 3; }

  score = Math.max(5, Math.min(95, score));
  const percent = Math.round(score);

  let rank: "S" | "A" | "B" | "C" = "C";
  let color = "#ef4444";
  if (percent >= 75) { rank = "S"; color = ACCENT; }
  else if (percent >= 55) { rank = "A"; color = "#10b981"; }
  else if (percent >= 40) { rank = "B"; color = "#f59e0b"; }
  else { rank = "C"; color = "#ef4444"; }

  if (insights.length === 0) insights.push("一通り取り組めている。このまま PDCA を回そう");
  return { percent, rank, color, insights };
}

const OPTS = {
  grad: [
    { value: "28" as GradYear, label: "28卒（現 大学3年）" },
    { value: "other" as GradYear, label: "その他（院生・他学年）" },
  ],
  stage: [
    { value: "not_started" as Stage, label: "まだ何もしてない" },
    { value: "just_started" as Stage, label: "動き出したところ" },
    { value: "in_progress" as Stage, label: "複数社に応募中" },
    { value: "advanced" as Stage, label: "面接進行中・内定あり" },
  ],
  companies: [
    { value: "0" as CompanyCount, label: "0社" },
    { value: "1-5" as CompanyCount, label: "1〜5社" },
    { value: "6-15" as CompanyCount, label: "6〜15社" },
    { value: "16+" as CompanyCount, label: "16社以上" },
  ],
  es: [
    { value: "0" as EsSubmitted, label: "0通" },
    { value: "1-5" as EsSubmitted, label: "1〜5通" },
    { value: "6-15" as EsSubmitted, label: "6〜15通" },
    { value: "16+" as EsSubmitted, label: "16通以上" },
  ],
  interviews: [
    { value: "0" as InterviewCount, label: "0回" },
    { value: "1-3" as InterviewCount, label: "1〜3回" },
    { value: "4-8" as InterviewCount, label: "4〜8回" },
    { value: "9+" as InterviewCount, label: "9回以上" },
  ],
  obVisits: [
    { value: "0" as const, label: "0件" },
    { value: "1-3" as const, label: "1〜3件" },
    { value: "4+" as const, label: "4件以上" },
  ],
};

export default function SimulatorPage() {
  const [step, setStep] = useState<number>(0);
  const [a, setA] = useState<Answers>({
    grad: null, stage: null, companies: null, es: null, interviews: null, obVisits: null,
  });
  const steps = [
    { key: "grad" as const, label: "卒業年は？", opts: OPTS.grad },
    { key: "stage" as const, label: "今の就活フェーズは？", opts: OPTS.stage },
    { key: "companies" as const, label: "応募済みの企業数は？", opts: OPTS.companies },
    { key: "es" as const, label: "提出済みのES数は？", opts: OPTS.es },
    { key: "interviews" as const, label: "受けた面接の回数は？", opts: OPTS.interviews },
    { key: "obVisits" as const, label: "OB/OG訪問の件数は？", opts: OPTS.obVisits },
  ];

  const showResult = step >= steps.length;
  const result = showResult ? calcProbability(a) : null;

  const choose = (key: keyof Answers, value: unknown) => {
    setA({ ...a, [key]: value });
    setStep(step + 1);
  };

  return (
    <div className="min-h-screen font-zen-kaku py-6 md:py-10 px-4" style={{ background: BG, color: INK }}>
      <div className="max-w-xl mx-auto">
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 inline-block mb-4">
          ← トップに戻る
        </Link>

        {!showResult && (
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8" style={{ border: "1px solid rgba(0,200,150,0.15)" }}>
            {step === 0 && (
              <div className="text-center mb-5">
                <p className="text-xs font-bold text-[#00a87e] tracking-[0.2em] uppercase mb-2">FREE SIMULATOR</p>
                <h1 className="font-klee text-2xl md:text-3xl font-bold mb-2">
                  あなたの<span style={{ color: ACCENT_DEEP }}>内定確率</span>、<br />
                  可視化します。
                </h1>
                <p className="text-xs text-gray-500">6問で現時点の就活力をスコアリング</p>
              </div>
            )}

            <div className="mb-4">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span className="font-bold text-[#00a87e]">{step + 1} / {steps.length}</span>
                <span>{Math.round(((step + 1) / steps.length) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${((step + 1) / steps.length) * 100}%`, background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_DEEP})` }}
                />
              </div>
            </div>

            <h2 className="font-klee text-xl md:text-2xl font-bold mb-4 leading-snug">
              {steps[step].label}
            </h2>
            <div className="grid grid-cols-2 gap-2.5">
              {steps[step].opts.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => choose(steps[step].key, opt.value)}
                  className="text-center py-4 px-3 rounded-2xl border-2 border-gray-100 hover:border-[#00c896] hover:bg-[#00c896]/5 transition-all active:scale-[0.99] text-sm font-semibold text-gray-900"
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {step > 0 && (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="block mx-auto mt-5 text-xs text-gray-400 hover:text-gray-600"
              >
                ← 前に戻る
              </button>
            )}
          </div>
        )}

        {result && (
          <div>
            <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 mb-4" style={{ border: `2px solid ${result.color}` }}>
              <div className="text-center mb-4">
                <p className="text-xs font-bold tracking-[0.2em] uppercase mb-2" style={{ color: result.color }}>YOUR SCORE</p>
                <div className="relative inline-block mb-2">
                  <div className="flex items-baseline gap-1 justify-center">
                    <span className="text-7xl md:text-8xl font-black font-klee" style={{ color: result.color }}>{result.percent}</span>
                    <span className="text-2xl font-bold text-gray-400">%</span>
                  </div>
                  <div className="absolute -top-3 -right-6 text-4xl font-black" style={{ color: result.color }}>{result.rank}</div>
                </div>
                <p className="text-sm font-semibold text-gray-700">現時点での内定獲得スコア</p>
                <p className="text-[10px] text-gray-400 mt-1">※就活生の一般データに基づく目安</p>
              </div>

              <div className="bg-[#0D0B21] text-white rounded-2xl p-5 mb-4">
                <p className="text-[11px] font-bold text-[#00c896] tracking-[0.2em] uppercase mb-3">📊 スコアの内訳</p>
                <ul className="space-y-2">
                  {result.insights.map((ins, i) => (
                    <li key={i} className="text-sm flex items-start gap-2 leading-relaxed">
                      <span className="text-[#00c896] shrink-0 mt-0.5">•</span>{ins}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <p className="text-xs font-bold text-amber-900 mb-1">💡 スコアを上げる一番の近道</p>
                <p className="text-xs text-amber-800 leading-relaxed">
                  Careoでパイプラインを管理して、KPIで通過率を追う。落ちた選考の共通パターンを見つけて次に活かす——これが最短ルート。
                </p>
              </div>
            </div>

            <div className="rounded-3xl p-6 md:p-8 text-center" style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DEEP})` }}>
              <div className="mx-auto mb-2 flex justify-center"><CareoKun size={80} mood="cheer" /></div>
              <h3 className="font-klee text-xl md:text-2xl font-bold text-white mb-2">
                このスコアを<br />もっと<span className="underline">正確に・高く</span>。
              </h3>
              <p className="text-white/80 text-xs md:text-sm mb-5 max-w-md mx-auto">
                Careoでデータを登録すると、リアルの通過率・業界別勝率まで可視化されます。
              </p>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 bg-white text-[#00a87e] font-black px-7 py-3.5 rounded-xl text-[15px] shadow-xl"
              >
                Careoでスコアを本物にする →
              </Link>
              <p className="text-white/60 text-[10px] mt-3">登録30秒 · クレカ不要 · 無料プランあり</p>
            </div>

            <div className="flex items-center justify-center gap-4 mt-5">
              <button
                type="button"
                onClick={() => { setA({ grad: null, stage: null, companies: null, es: null, interviews: null, obVisits: null }); setStep(0); }}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                もう一度やる
              </button>
              <button
                type="button"
                onClick={() => {
                  const text = `Careoで内定確率を診断したら ${result.percent}% (ランク${result.rank}) でした。\nあなたも6問でわかる 👇`;
                  const url = `${window.location.origin}/simulator`;
                  window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
                }}
                className="text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Xでシェア
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
