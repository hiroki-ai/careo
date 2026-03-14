"use client";

import { useState } from "react";
import { ES, EsStatus, Company, QAPair } from "@/types";
import { Button } from "@/components/ui/Button";
import { generateId } from "@/lib/utils";

type FormData = Omit<ES, "id" | "createdAt" | "updatedAt">;

interface EsFormProps {
  companies: Company[];
  initialCompanyId?: string;
  initialData?: Partial<FormData>;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
}

export function EsForm({ companies, initialCompanyId, initialData, onSubmit, onCancel }: EsFormProps) {
  const [form, setForm] = useState<FormData>({
    companyId: initialData?.companyId ?? initialCompanyId ?? companies[0]?.id ?? "",
    title: initialData?.title ?? "",
    questions: initialData?.questions ?? [{ id: generateId(), question: "", answer: "" }],
    deadline: initialData?.deadline ?? "",
    status: initialData?.status ?? "DRAFT",
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
    if (!form.companyId || !form.title.trim()) return;
    onSubmit({ ...form, deadline: form.deadline || undefined });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          タイトル <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          placeholder="例: 2026年新卒ES"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">提出締切</label>
          <input
            type="datetime-local"
            value={form.deadline ? form.deadline.slice(0, 16) : ""}
            onChange={(e) => setForm({ ...form, deadline: e.target.value ? new Date(e.target.value).toISOString() : "" })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ステータス</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as EsStatus })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="DRAFT">下書き</option>
            <option value="SUBMITTED">提出済み</option>
          </select>
        </div>
      </div>

      {/* 設問・回答 */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">設問・回答</label>
          <Button type="button" variant="ghost" size="sm" onClick={addQuestion}>+ 設問追加</Button>
        </div>
        <div className="space-y-4">
          {form.questions.map((q, i) => (
            <div key={q.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">設問 {i + 1}</span>
                {form.questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(i)}
                    className="text-xs text-red-400 hover:text-red-600 cursor-pointer"
                  >
                    削除
                  </button>
                )}
              </div>
              <input
                type="text"
                value={q.question}
                onChange={(e) => updateQuestion(i, "question", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="設問内容"
              />
              <textarea
                value={q.answer}
                onChange={(e) => updateQuestion(i, "answer", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white resize-none"
                placeholder="回答内容"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>キャンセル</Button>
        <Button type="submit">保存</Button>
      </div>
    </form>
  );
}
