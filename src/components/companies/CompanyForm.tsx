"use client";

import { useState } from "react";
import { Company, CompanyStatus, COMPANY_STATUS_LABELS, COMPANY_STATUS_ORDER } from "@/types";
import { Button } from "@/components/ui/Button";

type FormData = Omit<Company, "id" | "createdAt" | "updatedAt">;

interface CompanyFormProps {
  initialData?: Partial<FormData>;
  onSubmit: (data: FormData) => void;
  onCancel: () => void;
  submitLabel?: string;
}

export function CompanyForm({ initialData, onSubmit, onCancel, submitLabel = "保存" }: CompanyFormProps) {
  const [form, setForm] = useState<FormData>({
    name: initialData?.name ?? "",
    industry: initialData?.industry ?? "",
    url: initialData?.url ?? "",
    status: initialData?.status ?? "WISHLIST",
    notes: initialData?.notes ?? "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          企業名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例: 株式会社テックビジョン"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">業界</label>
        <input
          type="text"
          value={form.industry}
          onChange={(e) => setForm({ ...form, industry: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="例: IT・ソフトウェア"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">企業URL</label>
        <input
          type="url"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://example.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as CompanyStatus })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {COMPANY_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{COMPANY_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">メモ</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          placeholder="気になる点、OB情報など"
        />
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>キャンセル</Button>
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  );
}
