"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import {
  JobSearchStage,
  JOB_SEARCH_STAGE_LABELS,
  INDUSTRIES,
  JOB_TYPES,
  GRADES,
} from "@/types";
import { KareoCharacter } from "@/components/dashboard/KareoWidget";

const currentYear = new Date().getFullYear();
const graduationYears = [currentYear, currentYear + 1, currentYear + 2, currentYear + 3];

type FormData = {
  university: string;
  faculty: string;
  grade: string;
  graduationYear: number;
  jobSearchStage: JobSearchStage;
  targetIndustries: string[];
  targetJobs: string[];
};

const STEPS = [
  {
    id: 1,
    kareoMessage: "やあ！カレオだよ👋\nオレがずっと就活をサポートするよ。\nまず、大学と学年を教えて！",
  },
  {
    id: 2,
    kareoMessage: "ありがとう！\n今、就活どのくらい進んでる？\n正直に教えてくれると、アドバイスの精度が上がるよ。",
  },
  {
    id: 3,
    kareoMessage: "いいね！\nどんな業界・職種に興味ある？\n複数選んでOK、後で変えられるよ。",
  },
  {
    id: 4,
    kareoMessage: "完璧！準備完了だよ🎉\nこれからオレがずっとそばにいるから、\n何でも相談してね！",
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { saveProfile } = useProfile();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<FormData>({
    university: "",
    faculty: "",
    grade: "",
    graduationYear: currentYear + 1,
    jobSearchStage: "not_started",
    targetIndustries: [],
    targetJobs: [],
  });

  const toggle = (field: "targetIndustries" | "targetJobs", value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const canNext = () => {
    if (step === 1) return !!form.grade;
    if (step === 2) return !!form.jobSearchStage;
    if (step === 3) return true;
    return false;
  };

  const handleNext = () => {
    if (step < 3) setStep((s) => s + 1);
    else handleFinish();
  };

  const handleFinish = async () => {
    setSaving(true);
    await saveProfile(form);
    setStep(4);
    setTimeout(() => router.push("/"), 2000);
  };

  const currentStepData = STEPS[step - 1];
  const progress = step === 4 ? 100 : ((step - 1) / 3) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* プログレスバー */}
        {step < 4 && (
          <div className="mb-6">
            <div className="flex justify-between text-xs text-gray-400 mb-1.5">
              <span>ステップ {step} / 3</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* カレオの吹き出し */}
        <div className="flex items-end gap-3 mb-6">
          <div className="shrink-0">
            <KareoCharacter size={52} />
          </div>
          <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-indigo-100 flex-1">
            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
              {currentStepData.kareoMessage}
            </p>
          </div>
        </div>

        {/* フォームカード */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">

          {/* Step 1: 基本情報 */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">大学名</label>
                  <input
                    type="text"
                    value={form.university}
                    onChange={(e) => setForm({ ...form, university: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
                    placeholder="例: 東京大学"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">学部・研究科</label>
                  <input
                    type="text"
                    value={form.faculty}
                    onChange={(e) => setForm({ ...form, faculty: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
                    placeholder="例: 工学部"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">
                    学年 <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={form.grade}
                    onChange={(e) => setForm({ ...form, grade: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
                    required
                  >
                    <option value="">選んでね</option>
                    {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">卒業予定</label>
                  <select
                    value={form.graduationYear}
                    onChange={(e) => setForm({ ...form, graduationYear: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50"
                  >
                    {graduationYears.map((y) => <option key={y} value={y}>{y}年卒</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: 就活の進み具合 */}
          {step === 2 && (
            <div className="space-y-2">
              {(Object.entries(JOB_SEARCH_STAGE_LABELS) as [JobSearchStage, string][]).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, jobSearchStage: value })}
                  className={`w-full px-4 py-3 rounded-xl text-sm font-medium border-2 transition-all cursor-pointer text-left flex items-center gap-3 ${
                    form.jobSearchStage === value
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                      : "border-gray-100 bg-gray-50 text-gray-600 hover:border-indigo-200 hover:bg-indigo-50/50"
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border-2 shrink-0 ${
                    form.jobSearchStage === value
                      ? "border-indigo-500 bg-indigo-500"
                      : "border-gray-300"
                  }`} />
                  {label}
                </button>
              ))}
            </div>
          )}

          {/* Step 3: 業界・職種 */}
          {step === 3 && (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">志望業界（複数OK）</p>
                <div className="flex flex-wrap gap-2">
                  {INDUSTRIES.map((ind) => (
                    <button
                      key={ind}
                      type="button"
                      onClick={() => toggle("targetIndustries", ind)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                        form.targetIndustries.includes(ind)
                          ? "bg-indigo-600 text-white border-indigo-600"
                          : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
                      }`}
                    >
                      {ind}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5">志望職種（複数OK）</p>
                <div className="flex flex-wrap gap-2">
                  {JOB_TYPES.map((job) => (
                    <button
                      key={job}
                      type="button"
                      onClick={() => toggle("targetJobs", job)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all cursor-pointer ${
                        form.targetJobs.includes(job)
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
                      }`}
                    >
                      {job}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: 完成 */}
          {step === 4 && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-semibold text-gray-900 mb-1">セットアップ完了！</p>
              <p className="text-sm text-gray-400">ダッシュボードに移動しています...</p>
              <div className="mt-4 flex justify-center gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}

          {/* ナビゲーションボタン */}
          {step < 4 && (
            <div className="flex items-center justify-between mt-6">
              {step > 1 ? (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  ← 戻る
                </button>
              ) : <div />}
              <button
                onClick={handleNext}
                disabled={!canNext() || saving}
                className={`px-6 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                  canNext() && !saving
                    ? "bg-gradient-to-r from-indigo-600 to-blue-600 text-white hover:opacity-90 shadow-md"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {saving ? "保存中..." : step === 3 ? "はじめる 🚀" : "次へ →"}
              </button>
            </div>
          )}
        </div>

        {/* スキップリンク */}
        {step < 4 && (
          <p className="text-center mt-4">
            <button
              onClick={handleFinish}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors cursor-pointer underline"
            >
              後で設定する
            </button>
          </p>
        )}
      </div>
    </div>
  );
}
