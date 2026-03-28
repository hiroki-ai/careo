"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";

const COACHES = [
  { id: "kareo", name: "カレオ", tagline: "頼れる先輩×落ち着いたメンター", gradient: "from-teal-400 to-emerald-500", emoji: "🌿" },
  { id: "nagoma", name: "なごま", tagline: "覚悟を決める！エセ関西弁コーチ", gradient: "from-orange-400 to-pink-500", emoji: "🔥" },
  { id: "yamato", name: "やまと", tagline: "ちょっと頼りないけど一緒に頑張る系", gradient: "from-yellow-400 to-lime-500", emoji: "🌱" },
  { id: "jun", name: "じゅん", tagline: "毒舌ドS・核心だけを突く鬼コーチ", gradient: "from-purple-500 to-slate-600", emoji: "⚡" },
];

type FeatureItem = { icon: string; label: string; desc: string };

type Step =
  | { type: "welcome"; title: string; message: string }
  | { type: "features"; title: string; message: string; features: FeatureItem[] }
  | { type: "ai"; title: string; message: string; features: FeatureItem[] }
  | { type: "coach"; title: string; message: string };

const STEPS: Step[] = [
  {
    type: "welcome",
    title: "ようこそ、カレオへ！",
    message:
      "やあ、来てくれたね。カレオコーチだよ。\n\nCareoは就活の「管理・分析・相談」を全部まとめてできるアプリ。使い方をサクッと紹介するよ。",
  },
  {
    type: "features",
    title: "就活データを一元管理",
    message: "企業・ES・面接ログはもちろん、OB/OG訪問や筆記試験の結果まで、就活のすべてをここで管理できるよ。",
    features: [
      { icon: "🏢", label: "企業管理", desc: "気になる〜内定まで選考状況を追跡" },
      { icon: "✍️", label: "ESエディタ", desc: "AIが設問に合った文章を提案" },
      { icon: "🎤", label: "面接ログ", desc: "面接内容とフィードバックを記録" },
      { icon: "👔", label: "OB/OG訪問", desc: "訪問メモとインサイトを蓄積" },
      { icon: "📝", label: "筆記試験", desc: "SPI・玉手箱の結果を管理" },
    ],
  },
  {
    type: "ai",
    title: "AIが就活を丸ごと分析",
    message: "蓄積したデータをもとにAIが毎週分析。何をすべきかが一目でわかるよ。",
    features: [
      { icon: "🔄", label: "PDCA分析", desc: "振り返り・改善点をスコアで可視化" },
      { icon: "🎯", label: "Next Action", desc: "今週やるべき行動を優先度付きで提案" },
      { icon: "📊", label: "内定スコア予測", desc: "選考データから内定獲得確率を算出" },
      { icon: "⚖️", label: "内定比較", desc: "複数内定を軸ごとに比較して意思決定を支援" },
    ],
  },
  {
    type: "coach",
    title: "コーチを選ぼう",
    message:
      "AIコーチは4人のキャラから選べるよ。\nチャット画面でいつでも切り替えられるから、気分に合わせて使い分けてみて！",
  },
];

export function TutorialModal() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [selectedCoachId, setSelectedCoachId] = useState("kareo");
  const { saveCoachId } = useProfile();

  useEffect(() => {
    try {
      if (!localStorage.getItem("careo_tutorial_shown")) setVisible(true);
    } catch { /* ignore */ }
  }, []);

  const close = () => {
    try { localStorage.setItem("careo_tutorial_shown", "1"); } catch { /* ignore */ }
    setVisible(false);
  };

  const handleSelectCoach = (id: string) => {
    setSelectedCoachId(id);
  };

  const handleFinish = () => {
    try { localStorage.setItem("careo_coach_id", selectedCoachId); } catch { /* ignore */ }
    saveCoachId(selectedCoachId);
    close();
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
    else close();
  };

  const prev = () => setStep(s => s - 1);

  if (!visible) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm p-0 md:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
    >
      <div className="w-full md:max-w-md bg-white md:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col">

        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-[#00c896] to-[#00a87e] px-5 pt-5 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/20 rounded-full flex items-center justify-center shrink-0 text-2xl">
              🤖
            </div>
            <div>
              <p className="text-white font-bold text-sm">カレオコーチ</p>
              <p className="text-white/70 text-xs">就活AIアシスタント</p>
            </div>
            <button
              type="button"
              onClick={close}
              className="ml-auto text-white/60 hover:text-white text-lg leading-none p-1"
              aria-label="閉じる"
            >
              ✕
            </button>
          </div>
          {/* ステップバー */}
          <div className="flex gap-1.5 mt-3.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full flex-1 transition-all duration-300 ${i <= step ? "bg-white" : "bg-white/30"}`}
              />
            ))}
          </div>
        </div>

        {/* 本文（スクロール可） */}
        <div className="px-5 py-5 overflow-y-auto flex-1">
          <h2 className="font-bold text-gray-900 text-base mb-3">{current.title}</h2>

          {/* コーチ吹き出し */}
          <div className="bg-gray-50 rounded-xl rounded-tl-sm px-4 py-3 mb-4">
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{current.message}</p>
          </div>

          {/* ステップ2・3：機能カード */}
          {(current.type === "features" || current.type === "ai") && (
            <div className="grid grid-cols-1 gap-2 mb-2">
              {current.features.map((f) => (
                <div key={f.label} className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl px-3.5 py-2.5 shadow-sm">
                  <span className="text-xl shrink-0">{f.icon}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900">{f.label}</p>
                    <p className="text-xs text-gray-400 truncate">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ステップ4：コーチ一覧 */}
          {current.type === "coach" && (
            <div className="grid grid-cols-2 gap-2 mb-2">
              {COACHES.map((coach) => {
                const isSelected = selectedCoachId === coach.id;
                return (
                  <button
                    key={coach.id}
                    type="button"
                    onClick={() => handleSelectCoach(coach.id)}
                    className={`flex items-center gap-2 bg-white rounded-xl p-2.5 shadow-sm text-left transition-all ${
                      isSelected
                        ? "border-2 border-[#00c896] ring-1 ring-[#00c896]/20"
                        : "border border-gray-100 hover:border-[#00c896]/40"
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${coach.gradient} flex items-center justify-center shrink-0 text-sm`}>
                      {coach.emoji}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 truncate">{coach.name}</p>
                      <p className="text-[10px] text-gray-400 leading-tight line-clamp-2">{coach.tagline}</p>
                    </div>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-[#00c896] flex items-center justify-center shrink-0">
                        <span className="text-white text-[8px] font-bold">✓</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* フッター（ナビゲーション） */}
        <div className="px-5 pb-5 pt-2 shrink-0 border-t border-gray-100">
          <div className="flex items-center gap-2">
            {step > 0 && (
              <button
                type="button"
                onClick={prev}
                className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700 border border-gray-200 rounded-xl transition-colors"
              >
                ← 戻る
              </button>
            )}
            <div className="flex-1" />
            {isLast ? (
              <Link href="/chat" onClick={handleFinish}>
                <button type="button" className="px-5 py-2.5 bg-gradient-to-r from-[#00c896] to-[#00a87e] text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity shadow-sm">
                  このコーチで始める →
                </button>
              </Link>
            ) : (
              <button
                type="button"
                onClick={next}
                className="px-5 py-2.5 bg-gradient-to-r from-[#00c896] to-[#00a87e] text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity shadow-sm"
              >
                次へ →
              </button>
            )}
          </div>
          {!isLast && (
            <button type="button" onClick={close} className="w-full mt-2 text-xs text-gray-400 hover:text-gray-600 transition-colors py-1">
              スキップ
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
