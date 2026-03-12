"use client";

import { useState } from "react";
import { UserProfile, JobSearchStage, JOB_SEARCH_STAGE_LABELS, INDUSTRIES, JOB_TYPES, GRADES } from "@/types";
import { Button } from "@/components/ui/Button";

type FormData = Omit<UserProfile, "id" | "createdAt" | "updatedAt">;

interface ProfileFormProps {
  initialData?: Partial<FormData>;
  onSubmit: (data: FormData) => void;
  submitLabel?: string;
}

const currentYear = new Date().getFullYear();
const graduationYears = [currentYear, currentYear + 1, currentYear + 2, currentYear + 3];

export function ProfileForm({ initialData, onSubmit, submitLabel = "保存" }: ProfileFormProps) {
  const [form, setForm] = useState<FormData>({
    grade: initialData?.grade ?? "",
    graduationYear: initialData?.graduationYear ?? currentYear + 1,
    targetIndustries: initialData?.targetIndustries ?? [],
    targetJobs: initialData?.targetJobs ?? [],
    jobSearchStage: initialData?.jobSearchStage ?? "not_started",
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
          <label className="block text-sm font-medium text-gray-700 mb-1">
            学年 <span className="text-red-500">*</span>
          </label>
          <select
            value={form.grade}
            onChange={(e) => setForm({ ...form, grade: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  ? "bg-blue-600 text-white border-blue-600"
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
                  ? "bg-blue-600 text-white border-blue-600"
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
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
              }`}
            >
              {job}
            </button>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full">{submitLabel}</Button>
    </form>
  );
}
