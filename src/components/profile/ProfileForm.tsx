"use client";

import { useState } from "react";
import { UserProfile, JobSearchStage, JOB_SEARCH_STAGE_LABELS, INDUSTRIES, JOB_TYPES, GRADES } from "@/types";
import { Button } from "@/components/ui/Button";

type FormData = Omit<UserProfile, "id" | "createdAt" | "updatedAt">;

interface ProfileFormProps {
  initialData?: Partial<FormData>;
  onSubmit: (data: FormData) => void;
  submitLabel?: string;
  showSelfAnalysis?: boolean; // オンボーディングでは就活軸も聞く
}

const currentYear = new Date().getFullYear();
const graduationYears = [currentYear, currentYear + 1, currentYear + 2, currentYear + 3];

export function ProfileForm({ initialData, onSubmit, submitLabel = "保存", showSelfAnalysis = false }: ProfileFormProps) {
  const [form, setForm] = useState<FormData>({
    university: initialData?.university ?? "",
    faculty: initialData?.faculty ?? "",
    grade: initialData?.grade ?? "",
    graduationYear: initialData?.graduationYear ?? currentYear + 1,
    targetIndustries: initialData?.targetIndustries ?? [],
    targetJobs: initialData?.targetJobs ?? [],
    jobSearchStage: initialData?.jobSearchStage ?? "not_started",
    careerAxis: initialData?.careerAxis ?? "",
    gakuchika: initialData?.gakuchika ?? "",
    selfPr: initialData?.selfPr ?? "",
    strengths: initialData?.strengths ?? "",
    weaknesses: initialData?.weaknesses ?? "",
  });

  const toggleItem = (field: "targetIndustries" | "targetJobs", value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.grade) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">大学名</label>
          <input
            type="text"
            value={form.university}
            onChange={(e) => setForm({ ...form, university: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00c896]"
            placeholder="例: 東京大学"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">学部・研究科</label>
          <input
            type="text"
            value={form.faculty}
            onChange={(e) => setForm({ ...form, faculty: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00c896]"
            placeholder="例: 工学部情報工学科"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            学年 <span className="text-red-500">*</span>
          </label>
          <select
            value={form.grade}
            onChange={(e) => setForm({ ...form, grade: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00c896]"
            required
          >
            <option value="">選択してください</option>
            {GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">卒業予定年度</label>
          <select
            value={form.graduationYear}
            onChange={(e) => setForm({ ...form, graduationYear: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00c896]"
          >
            {graduationYears.map((y) => <option key={y} value={y}>{y}年卒</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">就活の進み具合</label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(JOB_SEARCH_STAGE_LABELS) as [JobSearchStage, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setForm({ ...form, jobSearchStage: value })}
              className={`px-3 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
                form.jobSearchStage === value
                  ? "bg-[#00c896] text-white border-[#00c896]"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          志望業界 <span className="text-gray-400 font-normal">（複数選択可）</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {INDUSTRIES.map((ind) => (
            <button
              key={ind}
              type="button"
              onClick={() => toggleItem("targetIndustries", ind)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                form.targetIndustries.includes(ind)
                  ? "bg-[#00c896] text-white border-[#00c896]"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {ind}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          志望職種 <span className="text-gray-400 font-normal">（複数選択可）</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {JOB_TYPES.map((job) => (
            <button
              key={job}
              type="button"
              onClick={() => toggleItem("targetJobs", job)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${
                form.targetJobs.includes(job)
                  ? "bg-[#00c896] text-white border-[#00c896]"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {job}
            </button>
          ))}
        </div>
      </div>

      {showSelfAnalysis && (
        <>
          <div className="bg-[#00c896]/5 border border-[#00c896]/20 rounded-xl p-4">
            <p className="text-xs text-[#00a87e] font-semibold mb-1">✨ AIコーチングの精度が上がります</p>
            <p className="text-xs text-gray-500">以下を入力するほど、カレオが的確なアドバイスを届けられます。後から設定でも変更できます。</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              就活の軸 <span className="text-gray-400 font-normal text-xs">（任意）</span>
            </label>
            <textarea
              value={form.careerAxis ?? ""}
              onChange={(e) => setForm({ ...form, careerAxis: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00c896] resize-none"
              placeholder="例: 人の課題解決に直接関われる仕事がしたい。成長環境があり、チームで動ける会社。"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ガクチカ（学生時代に力を入れたこと） <span className="text-gray-400 font-normal text-xs">（任意）</span>
            </label>
            <textarea
              value={form.gakuchika ?? ""}
              onChange={(e) => setForm({ ...form, gakuchika: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00c896] resize-none"
              placeholder="例: 大学のサッカー部でキャプテンとしてチームをまとめ、地区大会優勝を達成した。"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              自己PR <span className="text-gray-400 font-normal text-xs">（任意）</span>
            </label>
            <textarea
              value={form.selfPr ?? ""}
              onChange={(e) => setForm({ ...form, selfPr: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00c896] resize-none"
              placeholder="例: 課題に対してデータを収集・分析し、チームを巻き込んで改善策を実行できます。"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">強み <span className="text-gray-400 font-normal text-xs">（任意）</span></label>
              <textarea
                value={form.strengths ?? ""}
                onChange={(e) => setForm({ ...form, strengths: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00c896] resize-none"
                placeholder="例: 粘り強さ・巻き込み力"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">弱み <span className="text-gray-400 font-normal text-xs">（任意）</span></label>
              <textarea
                value={form.weaknesses ?? ""}
                onChange={(e) => setForm({ ...form, weaknesses: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00c896] resize-none"
                placeholder="例: 慎重すぎて決断が遅い"
              />
            </div>
          </div>
        </>
      )}

      <Button type="submit" className="w-full">{submitLabel}</Button>
    </form>
  );
}
