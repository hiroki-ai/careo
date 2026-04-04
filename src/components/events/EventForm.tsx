"use client";

import { useState } from "react";
import { CompanyEvent, CompanyEventType, COMPANY_EVENT_TYPES } from "@/types";
import { useEvents } from "@/hooks/useEvents";
import { useCompanies } from "@/hooks/useCompanies";
import { useToast } from "@/components/ui/Toast";

const INPUT = "w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-[#00c896] focus:ring-1 focus:ring-[#00c896]/30 bg-white";
const LABEL = "block text-xs font-medium text-gray-500 mb-1";

interface Props {
  event?: CompanyEvent;
  onClose: () => void;
  onSaved?: () => void;
}

export function EventForm({ event, onClose, onSaved }: Props) {
  const { addEvent, updateEvent } = useEvents();
  const { companies } = useCompanies();
  const { showToast } = useToast();
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 16);

  const [companyName, setCompanyName] = useState(event?.companyName ?? "");
  const [companyId, setCompanyId] = useState(event?.companyId ?? "");
  const [eventType, setEventType] = useState<CompanyEventType>(event?.eventType ?? "説明会");
  const [scheduledAt, setScheduledAt] = useState(
    event?.scheduledAt ? event.scheduledAt.slice(0, 16) : today
  );
  const [endDate, setEndDate] = useState(event?.endDate ?? "");
  const [location, setLocation] = useState(event?.location ?? "");
  const [url, setUrl] = useState(event?.url ?? "");
  const [notes, setNotes] = useState(event?.notes ?? "");

  // 企業選択したら名前を自動入力
  const handleCompanySelect = (id: string) => {
    setCompanyId(id);
    if (id) {
      const co = companies.find(c => c.id === id);
      if (co) setCompanyName(co.name);
    }
  };

  const handleSave = async () => {
    if (!companyName.trim()) { showToast("企業名を入力してください", "warning"); return; }
    if (!scheduledAt) { showToast("日時を入力してください", "warning"); return; }
    setSaving(true);
    try {
      const payload = {
        companyName: companyName.trim(),
        companyId: companyId || null,
        eventType,
        scheduledAt: new Date(scheduledAt).toISOString(),
        endDate: endDate || null,
        location: location || null,
        url: url || null,
        notes: notes || null,
        status: "upcoming" as const,
      };
      if (event) {
        await updateEvent(event.id, payload);
        showToast("更新しました", "success");
      } else {
        await addEvent(payload);
        showToast(`${eventType}を追加しました`, "success");
      }
      onSaved?.();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-gray-900">{event ? "日程を編集" : "説明会・インターンを追加"}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 種別 */}
        <div>
          <label className={LABEL}>種別</label>
          <div className="flex flex-wrap gap-2">
            {COMPANY_EVENT_TYPES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setEventType(t)}
                className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                  eventType === t
                    ? "bg-[#00c896] text-white border-[#00c896]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#00c896]/50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* 企業選択（登録済み企業から） */}
        <div>
          <label className={LABEL}>企業（登録済みから選ぶ）</label>
          <select
            value={companyId}
            onChange={e => handleCompanySelect(e.target.value)}
            className={INPUT}
          >
            <option value="">-- 選択しない（手入力） --</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* 企業名 */}
        <div>
          <label className={LABEL}>企業名 <span className="text-red-400">*</span></label>
          <input
            type="text"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            placeholder="例: 株式会社〇〇"
            className={INPUT}
          />
        </div>

        {/* 日時 */}
        <div>
          <label className={LABEL}>日時 <span className="text-red-400">*</span></label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={e => setScheduledAt(e.target.value)}
            className={INPUT}
          />
        </div>

        {/* 終了日（インターンなど複数日の場合） */}
        {(eventType === "インターン" || eventType === "その他") && (
          <div>
            <label className={LABEL}>終了日（複数日の場合）</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className={INPUT}
            />
          </div>
        )}

        {/* 場所 */}
        <div>
          <label className={LABEL}>場所・形式</label>
          <input
            type="text"
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="例: オンライン / 東京本社"
            className={INPUT}
          />
        </div>

        {/* URL */}
        <div>
          <label className={LABEL}>URL（参加リンク等）</label>
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://..."
            className={INPUT}
          />
        </div>

        {/* メモ */}
        <div>
          <label className={LABEL}>メモ</label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={2}
            placeholder="持ち物、注意事項など"
            className={INPUT + " resize-none"}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-[#00c896] text-white font-semibold py-3 rounded-xl hover:bg-[#00a87e] transition-colors disabled:opacity-60"
        >
          {saving ? "保存中..." : event ? "更新する" : "追加する"}
        </button>
      </div>
    </div>
  );
}
