"use client";

import { useState } from "react";
import Link from "next/link";
import { CareoKun } from "@/components/landing/CareoKun";

const ACCENT = "#00c896";
const ACCENT_DEEP = "#00a87e";
const INK = "#0D0B21";
const BG = "#fcfbf8";

type Archetype = "strategist" | "pioneer" | "explorer" | "craftsman" | "relator";

interface Question {
  id: string;
  text: string;
  options: { label: string; weight: Partial<Record<Archetype, number>> }[];
}

const QUESTIONS: Question[] = [
  {
    id: "timing",
    text: "就活は今、どのくらい進んでる？",
    options: [
      { label: "早期選考も視野に、サマーインターンから本気", weight: { pioneer: 3, strategist: 1 } },
      { label: "動き出したところ、数社リサーチ中", weight: { explorer: 2, strategist: 1 } },
      { label: "これから本格的に、まだ何もしてない", weight: { explorer: 3 } },
      { label: "既に複数社で選考進行中", weight: { strategist: 3, pioneer: 1 } },
    ],
  },
  {
    id: "axis",
    text: "企業選びで一番重視するのは？",
    options: [
      { label: "業界・職種・年収など条件面", weight: { strategist: 3 } },
      { label: "社風・人・働き方のカルチャー", weight: { relator: 3 } },
      { label: "自分の成長や挑戦できる環境", weight: { pioneer: 3 } },
      { label: "深く専門性を磨ける専門領域", weight: { craftsman: 3 } },
    ],
  },
  {
    id: "pr",
    text: "ES・面接で自分を伝える時、得意なスタイルは？",
    options: [
      { label: "数字・データで実績を語る", weight: { strategist: 3 } },
      { label: "印象的なエピソードで語る", weight: { relator: 2, explorer: 1 } },
      { label: "挑戦・失敗・そこからの学びを語る", weight: { pioneer: 3 } },
      { label: "専門知識・スキルの深さを語る", weight: { craftsman: 3 } },
    ],
  },
  {
    id: "info",
    text: "企業情報の集め方は？",
    options: [
      { label: "複数サイトを横断してデータで比較", weight: { strategist: 3 } },
      { label: "OB訪問で生の声を徹底的に聞く", weight: { relator: 3 } },
      { label: "インターンに参加して現場で見る", weight: { pioneer: 3 } },
      { label: "1〜2社に絞って深く調べる", weight: { craftsman: 3 } },
    ],
  },
  {
    id: "confidence",
    text: "今、一番不安なことは？",
    options: [
      { label: "何から始めればいいか分からない", weight: { explorer: 3 } },
      { label: "締切・スケジュール管理が追いつかない", weight: { strategist: 2, pioneer: 1 } },
      { label: "選考の通過率が低い気がする", weight: { strategist: 2, craftsman: 1 } },
      { label: "自分に合う企業が分からない", weight: { explorer: 2, relator: 1 } },
    ],
  },
];

const ARCHETYPE_DETAIL: Record<Archetype, {
  emoji: string;
  title: string;
  headline: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  fits: string[];
}> = {
  strategist: {
    emoji: "📊",
    title: "戦略家タイプ",
    headline: "データで勝つ就活ストラテジスト",
    description: "選考を構造的に捉え、数字と論理で勝ち方を設計するタイプ。CRM型のCareoと最も相性が良い。",
    strengths: ["情報整理が得意", "通過率を見て改善できる", "複数社並行が苦じゃない"],
    weaknesses: ["情報過多で意思決定が遅れる", "人の温度感より数字を優先しがち"],
    recommendation: "Careo の KPIダッシュボード・PDCA分析・業界別勝率をフル活用。落ちたパターンを可視化して改善ループを回そう。",
    fits: ["コンサル", "金融", "IT・データサイエンス", "総合商社"],
  },
  pioneer: {
    emoji: "🚀",
    title: "先駆者タイプ",
    headline: "挑戦で切り拓く就活パイオニア",
    description: "早期から動き、失敗を恐れず挑戦するタイプ。インターンと早期選考が主戦場。",
    strengths: ["行動力がある", "失敗から学ぶ", "新しい業界に飛び込める"],
    weaknesses: ["振り返りが浅くなりがち", "データ管理がおろそかに"],
    recommendation: "Careo で面接ログを必ず残して、パターンを客観視する習慣をつけよう。感覚の『手応え』だけで判断すると勿体ない。",
    fits: ["スタートアップ", "外資・コンサル", "ベンチャーIT", "新規事業"],
  },
  explorer: {
    emoji: "🔍",
    title: "探求者タイプ",
    headline: "まだ軸を探している就活エクスプローラー",
    description: "自分の軸・やりたいことを模索中。焦らず色々触れて方向を定める段階。",
    strengths: ["先入観が少ない", "幅広く検討できる", "自分の感覚を大事にできる"],
    weaknesses: ["焦りが空回りしやすい", "情報に振り回される", "選考準備が後手になる"],
    recommendation: "Careo の『今週やることTOP3』を毎週こなすだけで方向が見えてくる。まずは3社登録してパイプラインを動かそう。",
    fits: ["幅広く業界研究", "OB訪問メイン", "インターン中心"],
  },
  craftsman: {
    emoji: "⚙️",
    title: "職人タイプ",
    headline: "専門性で勝負する就活クラフツマン",
    description: "特定領域への関心が強く、1〜2社に絞って深掘りするタイプ。専門職志望に多い。",
    strengths: ["専門知識が深い", "志望度の本気度が伝わる", "面接で差をつけやすい"],
    weaknesses: ["選択肢が狭くリスクあり", "1社落ちると精神的ダメージ大"],
    recommendation: "Careo で第2・第3志望の選択肢も必ず並行管理。本命だけに集中すると内定ゼロのリスクがある。",
    fits: ["研究職", "エンジニア", "メーカー技術", "クリエイティブ"],
  },
  relator: {
    emoji: "🤝",
    title: "関係重視タイプ",
    headline: "人とカルチャーで選ぶ就活リレーター",
    description: "社風・人柄・働く人の温度感を重視するタイプ。OB訪問が武器になる。",
    strengths: ["カルチャーフィットの見極めが上手い", "面接で好感度が高い", "入社後の定着率が高い"],
    weaknesses: ["条件面の判断が甘くなりがち", "データ比較が苦手"],
    recommendation: "Careo の OB訪問ログ機能で得た気づきを言語化。面接で『なぜうち？』に深い回答ができる。",
    fits: ["人材・教育", "メーカー", "広告・メディア", "社会課題解決"],
  },
};

export default function DiagnosisPage() {
  const [step, setStep] = useState<"intro" | number | "result">("intro");
  const [scores, setScores] = useState<Record<Archetype, number>>({
    strategist: 0, pioneer: 0, explorer: 0, craftsman: 0, relator: 0,
  });

  const handleAnswer = (weights: Partial<Record<Archetype, number>>) => {
    const newScores = { ...scores };
    Object.entries(weights).forEach(([k, v]) => {
      newScores[k as Archetype] = (newScores[k as Archetype] ?? 0) + (v ?? 0);
    });
    setScores(newScores);
    const nextStep = (typeof step === "number" ? step : -1) + 1;
    if (nextStep >= QUESTIONS.length) setStep("result");
    else setStep(nextStep);
  };

  const topType = (Object.entries(scores) as [Archetype, number][])
    .sort((a, b) => b[1] - a[1])[0][0];

  const reset = () => {
    setScores({ strategist: 0, pioneer: 0, explorer: 0, craftsman: 0, relator: 0 });
    setStep("intro");
  };

  return (
    <div className="min-h-screen font-zen-kaku py-6 md:py-10 px-4" style={{ background: BG, color: INK }}>
      <div className="max-w-xl mx-auto">
        {/* ヘッダー */}
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600 inline-block mb-4">
          ← トップに戻る
        </Link>

        {/* INTRO */}
        {step === "intro" && (
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 text-center" style={{ border: "1px solid rgba(0,200,150,0.15)" }}>
            <div className="mx-auto mb-3 flex justify-center"><CareoKun size={112} mood="cheer" /></div>
            <p className="text-xs font-bold text-[#00a87e] tracking-[0.2em] uppercase mb-2">FREE DIAGNOSIS</p>
            <h1 className="font-klee text-2xl md:text-3xl font-bold mb-3">
              就活の勝ち方、<br />
              3分で<span style={{ color: ACCENT_DEEP }}>診断</span>。
            </h1>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              5つの質問に答えるだけで、<br />
              あなたの<b>就活タイプ</b>と<b>勝ち方</b>が見えてきます。
            </p>
            <div className="flex items-center justify-center gap-3 text-xs text-gray-400 mb-5">
              <span>✓ 登録不要</span>
              <span>✓ 3分で終わる</span>
              <span>✓ 完全無料</span>
            </div>
            <button
              type="button"
              onClick={() => setStep(0)}
              className="inline-flex items-center gap-2 font-bold px-7 py-3.5 rounded-xl text-white text-[15px]"
              style={{
                background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DEEP})`,
                boxShadow: `0 8px 24px ${ACCENT}55`,
              }}
            >
              診断を始める →
            </button>
          </div>
        )}

        {/* QUESTIONS */}
        {typeof step === "number" && (
          <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8" style={{ border: "1px solid rgba(0,200,150,0.15)" }}>
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span className="font-bold text-[#00a87e]">質問 {step + 1} / {QUESTIONS.length}</span>
                <span>{Math.round(((step + 1) / QUESTIONS.length) * 100)}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${((step + 1) / QUESTIONS.length) * 100}%`, background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_DEEP})` }}
                />
              </div>
            </div>
            <h2 className="font-klee text-xl md:text-2xl font-bold mb-5 leading-snug">
              {QUESTIONS[step].text}
            </h2>
            <div className="flex flex-col gap-3">
              {QUESTIONS[step].options.map((opt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAnswer(opt.weight)}
                  className="text-left p-4 rounded-2xl border-2 border-gray-100 hover:border-[#00c896] hover:bg-[#00c896]/5 transition-all active:scale-[0.99]"
                >
                  <span className="text-sm font-semibold text-gray-900">{opt.label}</span>
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

        {/* RESULT */}
        {step === "result" && (() => {
          const detail = ARCHETYPE_DETAIL[topType];
          return (
            <div>
              <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 mb-4" style={{ border: `2px solid ${ACCENT}` }}>
                <div className="text-center mb-5">
                  <div className="text-5xl mb-2">{detail.emoji}</div>
                  <p className="text-xs font-bold text-[#00a87e] tracking-[0.2em] uppercase mb-1">YOUR TYPE</p>
                  <h2 className="font-klee text-3xl md:text-4xl font-bold mb-2">{detail.title}</h2>
                  <p className="text-base font-semibold text-gray-600">{detail.headline}</p>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed mb-6 bg-[#00c896]/5 rounded-xl p-4 border border-[#00c896]/20">
                  {detail.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                  <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
                    <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-2">💪 強み</p>
                    <ul className="space-y-1">
                      {detail.strengths.map((s, i) => (
                        <li key={i} className="text-xs text-emerald-800 flex items-start gap-1.5">
                          <span className="shrink-0 mt-0.5">✓</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                    <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-2">⚠️ 気をつけたい点</p>
                    <ul className="space-y-1">
                      {detail.weaknesses.map((w, i) => (
                        <li key={i} className="text-xs text-amber-800 flex items-start gap-1.5">
                          <span className="shrink-0 mt-0.5">•</span>{w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="bg-[#0D0B21] text-white rounded-2xl p-5 mb-5">
                  <p className="text-[11px] font-bold text-[#00c896] tracking-[0.2em] uppercase mb-2">🎯 あなたへの処方箋</p>
                  <p className="text-sm leading-relaxed">{detail.recommendation}</p>
                </div>

                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">相性の良い業界・職種</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detail.fits.map((f) => (
                      <span key={f} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-gray-200 text-gray-700">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* CTA */}
              <div className="rounded-3xl p-6 md:p-8 text-center" style={{ background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DEEP})` }}>
                <div className="mx-auto mb-2 flex justify-center"><CareoKun size={80} mood="cheer" /></div>
                <h3 className="font-klee text-xl md:text-2xl font-bold text-white mb-2">
                  このタイプに最適な就活管理を、<br />Careoで。
                </h3>
                <p className="text-white/80 text-xs md:text-sm mb-5 max-w-md mx-auto">
                  企業管理・ES・面接ログ・KPI・業界別勝率分析まで、君の就活に必要なデータが全部ひとつに。
                </p>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 bg-white text-[#00a87e] font-black px-7 py-3.5 rounded-xl text-[15px] shadow-xl"
                >
                  無料で Careo を始める →
                </Link>
                <p className="text-white/60 text-[10px] mt-3">登録30秒 · クレカ不要 · 完全無料</p>
              </div>

              <div className="flex items-center justify-center gap-4 mt-5">
                <button
                  type="button"
                  onClick={reset}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  もう一度診断する
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const text = `私の就活タイプは「${detail.title}」でした！${detail.headline}\n\nあなたも3分で診断できる:`;
                    const url = `${window.location.origin}/diagnosis`;
                    window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Xで結果をシェア
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
