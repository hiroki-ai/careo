"use client";

import { useState } from "react";
import { Company, CompanyStatus, COMPANY_STATUS_LABELS, COMPANY_STATUS_ORDER, INDUSTRIES } from "@/types";
import { Button } from "@/components/ui/Button";
import { AutoTextarea } from "@/components/forms/AutoTextarea";

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
    mypage_url: initialData?.mypage_url ?? "",
    status: initialData?.status ?? "WISHLIST",
    notes: initialData?.notes ?? "",
  });
  const [showAdvanced, setShowAdvanced] = useState(!!(initialData?.url || initialData?.mypage_url));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          企業名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full px-3 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c896] focus:border-transparent"
          placeholder="例: 株式会社テックビジョン"
          required
          autoFocus
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">業界</label>
        <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x">
          {INDUSTRIES.map((ind) => {
            const sel = form.industry === ind;
            return (
              <button
                type="button"
                key={ind}
                onClick={() => setForm({ ...form, industry: sel ? "" : ind })}
                className={`shrink-0 snap-start px-3 py-2 text-xs font-bold rounded-full border-2 transition-all ${
                  sel ? "border-[#00c896] bg-[#00c896]/10 text-[#00a87e]" : "border-gray-200 bg-white text-gray-600"
                }`}
              >
                {ind}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">ステータス</label>
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value as CompanyStatus })}
          aria-label="ステータス"
          className="w-full px-3 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c896] focus:border-transparent"
        >
          {COMPANY_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{COMPANY_STATUS_LABELS[s]}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">メモ</label>
        <AutoTextarea
          value={form.notes ?? ""}
          onChange={(v) => setForm({ ...form, notes: v })}
          minRows={3}
          placeholder="気になる点、OB情報など"
        />
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-xs font-semibold text-gray-500 hover:text-gray-700"
      >
        {showAdvanced ? "▾" : "▸"} URL情報（任意）
      </button>

      {showAdvanced && (
        <div className="space-y-4 pl-3 border-l-2 border-gray-100">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">マイページURL</label>
            <input
              type="url"
              value={form.mypage_url}
              onChange={(e) => setForm({ ...form, mypage_url: e.target.value })}
              className="w-full px-3 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c896] focus:border-transparent"
              placeholder="https://job.rikunabi.com/2026/mypage/..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">企業URL</label>
            <input
              type="url"
              value={form.url}
              onChange={(e) => setForm({ ...form, url: e.target.value })}
              className="w-full px-3 py-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c896] focus:border-transparent"
              placeholder="https://example.com"
            />
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2 sticky bottom-0 bg-white pb-1">
        <Button type="button" variant="secondary" onClick={onCancel} className="flex-1">キャンセル</Button>
        <Button type="submit" className="flex-1">{submitLabel}</Button>
      </div>
    </form>
  );
}
