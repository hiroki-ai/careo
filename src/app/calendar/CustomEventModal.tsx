"use client";

import { useState, useEffect } from "react";
import { CustomEvent, CustomEventColor, CUSTOM_EVENT_COLOR_DOT } from "@/types";

interface Props {
  open: boolean;
  initial?: CustomEvent | null;
  defaultDate?: string | null;
  onClose: () => void;
  onSubmit: (data: Omit<CustomEvent, "id" | "createdAt" | "updatedAt">) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

const COLORS: CustomEventColor[] = ["pink", "blue", "green", "orange", "purple", "yellow", "gray"];

function pad(n: number) { return n.toString().padStart(2, "0"); }
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function fromLocalInput(local: string): string {
  return new Date(local).toISOString();
}

export function CustomEventModal({ open, initial, defaultDate, onClose, onSubmit, onDelete }: Props) {
  const [title, setTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [color, setColor] = useState<CustomEventColor>("pink");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      setTitle(initial.title);
      setScheduledAt(toLocalInput(initial.scheduledAt));
      setEndAt(toLocalInput(initial.endAt));
      setLocation(initial.location ?? "");
      setNotes(initial.notes ?? "");
      setColor(initial.color);
    } else {
      setTitle("");
      const baseDate = defaultDate ? new Date(defaultDate) : new Date();
      baseDate.setHours(9, 0, 0, 0);
      setScheduledAt(`${baseDate.getFullYear()}-${pad(baseDate.getMonth() + 1)}-${pad(baseDate.getDate())}T09:00`);
      setEndAt("");
      setLocation("");
      setNotes("");
      setColor("pink");
    }
  }, [open, initial, defaultDate]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!title.trim() || !scheduledAt) return;
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        scheduledAt: fromLocalInput(scheduledAt),
        endAt: endAt ? fromLocalInput(endAt) : null,
        location: location.trim() || null,
        notes: notes.trim() || null,
        color,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!initial || !onDelete) return;
    if (!confirm("この予定を削除しますか？")) return;
    setSaving(true);
    try {
      await onDelete(initial.id);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-3xl p-5 md:p-6 max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">{initial ? "予定を編集" : "予定を追加"}</h2>
          <button type="button" onClick={onClose} aria-label="閉じる" className="p-2 -mr-2 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">タイトル *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 〇〇商事 説明会"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c896] focus:border-transparent"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">開始 *</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c896]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5">終了（任意）</label>
              <input
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c896]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">場所</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="例: オンライン / 〇〇ビル"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c896]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">メモ</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="持ち物・準備事項など"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c896] resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-2">色</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  aria-label={`${c}色を選択`}
                  className={`w-9 h-9 rounded-full ${CUSTOM_EVENT_COLOR_DOT[c]} ${color === c ? "ring-2 ring-offset-2 ring-gray-700" : ""} transition-all`}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          {initial && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              削除
            </button>
          )}
          <div className="flex-1" />
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || !title.trim() || !scheduledAt}
            className="px-5 py-2.5 text-sm font-bold text-white bg-[#00c896] hover:bg-[#00a87e] disabled:bg-gray-300 rounded-xl transition-colors"
          >
            {saving ? "保存中..." : "保存"}
          </button>
        </div>
      </div>
    </div>
  );
}
