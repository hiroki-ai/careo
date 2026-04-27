"use client";

import { useState } from "react";
import { ES, EsStatus, Company, QAPair } from "@/types";
import { Button } from "@/components/ui/Button";
import { generateId } from "@/lib/utils";
import { DateTimeField } from "@/components/forms/DateTimeField";
import { AutoTextarea } from "@/components/forms/AutoTextarea";
import { SegmentedChoice } from "@/components/forms/SegmentedChoice";

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
    result: initialData?.result ?? "unknown",
    isSharedAnonymously: initialData?.isSharedAnonymously ?? false,
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
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          タイトル <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="w-full px-3 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c896] focus:border-transparent"
          placeholder="例: 2026年新卒ES"
          required
        />
      </div>

      <DateTimeField
        label="提出締切"
        value={form.deadline}
        onChange={(iso) => setForm({ ...form, deadline: iso })}
      />

      <SegmentedChoice<EsStatus>
        label="ステータス"
        value={form.status}
        onChange={(v) => setForm({ ...form, status: v })}
        options={[
          { value: "DRAFT", label: "下書き", emoji: "📝" },
          { value: "SUBMITTED", label: "提出済み", emoji: "✅" },
        ]}
      />

      {/* 設問・回答 */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-600">設問・回答</label>
          <Button type="button" variant="ghost" size="sm" onClick={addQuestion}>+ 追加</Button>
        </div>
        <div className="space-y-3">
          {form.questions.map((q, i) => (
            <div key={q.id} className="p-3 bg-gray-50 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-500 uppercase">Q{i + 1}</span>
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
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#00c896] focus:border-transparent"
                placeholder="設問内容"
              />
              <AutoTextarea
                value={q.answer}
                onChange={(v) => updateQuestion(i, "answer", v)}
                minRows={3}
                placeholder="回答内容"
                className="bg-white"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 pt-2 sticky bottom-0 bg-white pb-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">キャンセル</Button>
        <Button type="submit" className="flex-1">保存</Button>
      </div>
    </form>
  );
}
