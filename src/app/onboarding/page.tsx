"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { JobSearchStage } from "@/types";
import { KareoCharacter } from "@/components/kareo/KareoCharacter";

type WorryKey = "what_to_do" | "deadlines" | "pass_rate" | "matching";

const CURRENT_YEAR = new Date().getFullYear();

// グラデーション年を選んだら、そこから grade を推定
function inferGradeFromGradYear(gradYear: number): string {
  const yearsUntilGrad = gradYear - CURRENT_YEAR;
  if (yearsUntilGrad <= 0) return "学部4年";
  if (yearsUntilGrad === 1) return "学部3年";
  if (yearsUntilGrad === 2) return "学部2年";
  return "学部1年";
}

const GRAD_YEARS = [
  { value: CURRENT_YEAR + 2, label: `${(CURRENT_YEAR + 2) % 100}卒`, sub: "現在 大学3年" },
  { value: CURRENT_YEAR + 3, label: `${(CURRENT_YEAR + 3) % 100}卒`, sub: "現在 大学2年" },
  { value: CURRENT_YEAR + 1, label: `${(CURRENT_YEAR + 1) % 100}卒`, sub: "現在 大学4年" },
  { value: CURRENT_YEAR + 4, label: "その他", sub: "院生・1年生など" },
];

const STAGES: { value: JobSearchStage; title: string; desc: string }[] = [
  { value: "not_started", title: "まだ始めてない", desc: "何から手をつければいいか分からない" },
  { value: "just_started", title: "動き出したところ", desc: "数社リサーチ中、ES書き始めた" },
  { value: "in_progress", title: "複数社で選考中", desc: "面接・ESを並行で走らせている" },
];

const WORRIES: { value: WorryKey; emoji: string; title: string; desc: string }[] = [
  { value: "what_to_do", emoji: "🤔", title: "何をすべきか分からない", desc: "今週やるべきことが見えない" },
  { value: "deadlines", emoji: "⏰", title: "締切管理が追いつかない", desc: "サマーインターン締切を逃しそう" },
  { value: "pass_rate", emoji: "📉", title: "選考通過率を上げたい", desc: "ESや面接で落ちる原因を知りたい" },
  { value: "matching", emoji: "🎯", title: "合う企業が分からない", desc: "自分の軸と相性の良い業界を知りたい" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { saveProfile } = useProfile();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [graduationYear, setGraduationYear] = useState<number | null>(null);
  const [stage, setStage] = useState<JobSearchStage | null>(null);
  const [worry, setWorry] = useState<WorryKey | null>(null);
  const [saving, setSaving] = useState(false);

  const handleGradYear = (year: number) => {
    setGraduationYear(year);
    setStep(2);
  };
  const handleStage = (s: JobSearchStage) => {
    setStage(s);
    setStep(3);
  };
  const handleWorry = async (w: WorryKey) => {
    setWorry(w);
    setSaving(true);
    try {
      await saveProfile({
        university: "",
        faculty: "",
        grade: graduationYear ? inferGradeFromGradYear(graduationYear) : "学部3年",
        graduationYear: graduationYear!,
        targetIndustries: [],
        targetJobs: [],
        jobSearchStage: stage!,
      });
      // worry は localStorage に保存してダッシュボードで使う
      try { localStorage.setItem("careo_initial_worry", w); } catch { /* ignore */ }
      router.push("/");
    } catch {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#00c896]/5 via-white to-blue-50/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* プログレスバー */}
        <div className="flex items-center justify-center gap-1.5 mb-8">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={`h-1 rounded-full transition-all duration-300 ${
                s === step ? "w-12 bg-[#00c896]" : step > s ? "w-8 bg-[#00c896]/40" : "w-8 bg-gray-200"
              }`}
            />
          ))}
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-[#00c896]/5 border border-gray-100 p-6 md:p-8">
          {/* Step 1: 卒業年 */}
          {step === 1 && (
            <>
              <div className="text-center mb-6">
                <div className="mx-auto mb-2"><KareoCharacter expression="waving" size={120} /></div>
                <div className="inline-block bg-[#00c896]/10 rounded-full px-3 py-1 mb-3">
                  <p className="text-xs font-bold text-[#00a87e]">はじめまして、カレオです 🎉</p>
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1.5">
                  卒業は何年？
                </h1>
                <p className="text-sm text-gray-500">就活スケジュールに合わせてアドバイスします</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {GRAD_YEARS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => handleGradYear(g.value)}
                    className="flex flex-col items-center justify-center py-5 rounded-2xl border-2 border-gray-100 hover:border-[#00c896] hover:bg-[#00c896]/5 transition-all active:scale-[0.98]"
                  >
                    <span className="text-xl font-black text-gray-900">{g.label}</span>
                    <span className="text-[11px] text-gray-400 mt-1">{g.sub}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Step 2: 就活フェーズ */}
          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <div className="mx-auto mb-2"><KareoCharacter expression="default" size={96} animate={false} /></div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1.5">
                  今の就活はどんな感じ？
                </h1>
                <p className="text-sm text-gray-500">状況に合わせてサポートの仕方を調整します</p>
              </div>

              <div className="space-y-2.5">
                {STAGES.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => handleStage(s.value)}
                    className="w-full flex flex-col items-start p-4 rounded-2xl border-2 border-gray-100 hover:border-[#00c896] hover:bg-[#00c896]/5 transition-all text-left active:scale-[0.99]"
                  >
                    <span className="text-base font-bold text-gray-900">{s.title}</span>
                    <span className="text-xs text-gray-500 mt-0.5">{s.desc}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="block mx-auto mt-5 text-xs text-gray-400 hover:text-gray-600"
              >
                ← 戻る
              </button>
            </>
          )}

          {/* Step 3: 一番の悩み */}
          {step === 3 && (
            <>
              <div className="text-center mb-6">
                <div className="mx-auto mb-2"><KareoCharacter expression="encouraging" size={96} animate={false} /></div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-1.5">
                  今、一番モヤモヤしてるのは？
                </h1>
                <p className="text-sm text-gray-500">まずそれを解決するところからサポートします</p>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {WORRIES.map((w) => (
                  <button
                    key={w.value}
                    type="button"
                    disabled={saving}
                    onClick={() => handleWorry(w.value)}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-gray-100 hover:border-[#00c896] hover:bg-[#00c896]/5 transition-all text-left active:scale-[0.99] disabled:opacity-50"
                  >
                    <span className="text-2xl shrink-0">{w.emoji}</span>
                    <div className="flex-1">
                      <div className="text-sm font-bold text-gray-900">{w.title}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{w.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              {saving && (
                <div className="text-center mt-5 text-sm text-[#00a87e] font-semibold">
                  ダッシュボードを準備中...
                </div>
              )}

              {!saving && (
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="block mx-auto mt-5 text-xs text-gray-400 hover:text-gray-600"
                >
                  ← 戻る
                </button>
              )}
            </>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          詳しいプロフィール（大学・学部等）は後から設定できます
        </p>
      </div>
    </div>
  );
}
