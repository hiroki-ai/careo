"use client";

import { useState } from "react";
import { Interview, InterviewResult, Company, QAPair } from "@/types";
import { Button } from "@/components/ui/Button";
import { generateId } from "@/lib/utils";

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
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            企業 <span className="text-red-500">*</span>
          </label>
          <select
            value={form.companyId}
            onChange={(e) => setForm({ ...form, companyId: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            required
          >
            <option value="">企業を選択</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">面接回数</label>
          <input
            type="number"
            min={1}
            max={10}
            value={form.round}
            onChange={(e) => setForm({ ...form, round: Number(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">面接日時</label>
          <input
            type="datetime-local"
            value={form.scheduledAt.slice(0, 16)}
            onChange={(e) => setForm({ ...form, scheduledAt: new Date(e.target.value).toISOString() })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">結果</label>
          <select
            value={form.result}
            onChange={(e) => setForm({ ...form, result: e.target.value as InterviewResult })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="PENDING">結果待ち</option>
            <option value="PASS">通過</option>
            <option value="FAIL">不通過</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">面接官</label>
        <input
          type="text"
          value={form.interviewers}
          onChange={(e) => setForm({ ...form, interviewers: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例: 人事 田中さん、開発部 鈴木さん"
        />
      </div>

      {/* 質問・回答 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">質問・回答メモ</label>
          <Button type="button" variant="ghost" size="sm" onClick={addQuestion}>+ 質問追加</Button>
        </div>
        <div className="space-y-4">
          {form.questions.map((q, i) => (
            <div key={q.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">質問 {i + 1}</span>
                {form.questions.length > 1 && (
                  <button type="button" onClick={() => removeQuestion(i)} className="text-xs text-red-400 hover:text-red-600 cursor-pointer">削除</button>
                )}
              </div>
              <input
                type="text"
                value={q.question}
                onChange={(e) => updateQuestion(i, "question", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="聞かれた質問"
              />
              <textarea
                value={q.answer}
                onChange={(e) => updateQuestion(i, "answer", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none"
                placeholder="自分の回答・メモ"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">総評メモ</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          placeholder="雰囲気、反省点、次回への準備など"
        />
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>キャンセル</Button>
        <Button type="submit">保存</Button>
      </div>
    </form>
  );
}
