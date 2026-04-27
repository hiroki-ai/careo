"use client";

import { useState } from "react";
import { Interview, InterviewResult, Company, QAPair } from "@/types";
import { Button } from "@/components/ui/Button";
import { generateId } from "@/lib/utils";
import { DateTimeField } from "@/components/forms/DateTimeField";
import { AutoTextarea } from "@/components/forms/AutoTextarea";
import { SegmentedChoice } from "@/components/forms/SegmentedChoice";

type FormData = Omit<Interview, "id" | "createdAt" | "updatedAt">;

interface InterviewFormProps {
  companies: Company[];
  initialCompanyId?: string;
  initialData?: Partial<FormData>;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
}

export function InterviewForm({ companies, initialCompanyId, initialData, onSubmit, onCancel }: InterviewFormProps) {
  const now = new Date();
  now.setMinutes(0, 0, 0);

  const [form, setForm] = useState<FormData>({
    companyId: initialData?.companyId ?? initialCompanyId ?? companies[0]?.id ?? "",
    round: initialData?.round ?? 1,
    scheduledAt: initialData?.scheduledAt ?? now.toISOString(),
    interviewers: initialData?.interviewers ?? "",
    questions: initialData?.questions ?? [{ id: generateId(), question: "", answer: "" }],
    notes: initialData?.notes ?? "",
    result: initialData?.result ?? "PENDING",
  });

  const addQuestion = () => {
    setForm({
      ...form,
      questions: [...form.questions, { id: generateId(), question: "", answer: "" }],
    });
  };

  const updateQuestion = (index: number, field: keyof QAPair, value: string) => {
    const updated = form.questions.map((q, i) =>
      i === index ? { ...q, [field]: value } : q
    );
    setForm({ ...form, questions: updated });
  };

  const removeQuestion = (index: number) => {
    setForm({ ...form, questions: form.questions.filter((_, i) => i !== index) });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyId) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          企業 <span className="text-red-500">*</span>
        </label>
        <select
          value={form.companyId}
          onChange={(e) => setForm({ ...form, companyId: e.target.value })}
          aria-label="企業を選択"
          className="w-full px-3 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c896] focus:border-transparent"
          required
        >
          <option value="">企業を選択</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">面接回数</label>
        <div className="grid grid-cols-5 gap-1.5">
          {[1, 2, 3, 4, 5].map((n) => {
            const sel = form.round === n;
            return (
              <button
                type="button"
                key={n}
                onClick={() => setForm({ ...form, round: n })}
                className={`py-2.5 text-sm font-bold rounded-xl border-2 transition-all ${
                  sel ? "border-[#00c896] bg-[#00c896]/10 text-[#00a87e]" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                }`}
              >
                {n}次
              </button>
            );
          })}
        </div>
      </div>

      <DateTimeField
        label="面接日時"
        value={form.scheduledAt}
        onChange={(iso) => setForm({ ...form, scheduledAt: iso || form.scheduledAt })}
      />

      <SegmentedChoice<InterviewResult>
        label="結果"
        value={form.result}
        onChange={(v) => setForm({ ...form, result: v })}
        options={[
          { value: "PENDING", label: "結果待ち", emoji: "⏳" },
          { value: "PASS", label: "通過", emoji: "✅" },
          { value: "FAIL", label: "不通過", emoji: "❌" },
        ]}
      />

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">面接官</label>
        <input
          type="text"
          value={form.interviewers}
          onChange={(e) => setForm({ ...form, interviewers: e.target.value })}
          className="w-full px-3 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c896] focus:border-transparent"
          placeholder="例: 人事 田中さん、開発部 鈴木さん"
        />
      </div>

      {/* 質問・回答 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-600">質問・回答メモ</label>
          <Button type="button" variant="ghost" size="sm" onClick={addQuestion}>+ 追加</Button>
        </div>
        <div className="space-y-3">
          {form.questions.map((q, i) => (
            <div key={q.id} className="p-3 bg-gray-50 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Q{i + 1}</span>
                {form.questions.length > 1 && (
                  <button type="button" onClick={() => removeQuestion(i)} className="text-xs text-red-400 hover:text-red-600 cursor-pointer">削除</button>
                )}
              </div>
              <input
                type="text"
                value={q.question}
                onChange={(e) => updateQuestion(i, "question", e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#00c896] focus:border-transparent"
                placeholder="聞かれた質問"
              />
              <AutoTextarea
                value={q.answer}
                onChange={(v) => updateQuestion(i, "answer", v)}
                minRows={2}
                placeholder="自分の回答・メモ"
                className="bg-white"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">総評メモ</label>
        <AutoTextarea
          value={form.notes ?? ""}
          onChange={(v) => setForm({ ...form, notes: v })}
          minRows={3}
          placeholder="雰囲気、反省点、次回への準備など"
        />
      </div>

      <div className="flex gap-2 pt-2 sticky bottom-0 bg-white pb-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">キャンセル</Button>
        <Button type="submit" className="flex-1">保存</Button>
      </div>
    </form>
  );
}
