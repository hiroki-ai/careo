"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EVENT_TYPE_LABELS, EventType } from "@/types";

interface Event {
  id: string;
  title: string;
  eventType: EventType;
  heldAt: string;
  description: string | null;
  createdAt: string;
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", eventType: "guidance" as EventType, heldAt: "", description: "" });
  const [saving, setSaving] = useState(false);

  const fetch_ = () => {
    setLoading(true);
    fetch("/api/career-portal/events")
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch_(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/career-portal/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setShowForm(false);
    setForm({ title: "", eventType: "guidance", heldAt: "", description: "" });
    fetch_();
  };

  const EVENT_COLORS: Record<EventType, string> = {
    guidance: "bg-blue-100 text-blue-700",
    briefing: "bg-purple-100 text-purple-700",
    workshop: "bg-green-100 text-green-700",
    other: "bg-gray-100 text-gray-600",
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">イベント管理</h1>
          <p className="text-sm text-gray-500 mt-1">ガイダンス・説明会の開催記録と効果測定</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
        >
          + イベントを追加
        </button>
      </div>

      {/* 新規作成フォーム */}
      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-xl border border-blue-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">新規イベント</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">イベント名 *</label>
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="就活ガイダンス 春学期"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">種別</label>
              <select
                value={form.eventType}
                onChange={(e) => setForm({ ...form, eventType: e.target.value as EventType })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">開催日 *</label>
              <input
                required
                type="date"
                value={form.heldAt}
                onChange={(e) => setForm({ ...form, heldAt: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">説明（任意）</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="概要メモ"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50">
              {saving ? "保存中..." : "保存"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200">
              キャンセル
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-2xl mb-2">📅</p>
          <p className="text-gray-400 text-sm">イベントがまだ登録されていません</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {events.map((ev) => (
            <Link
              key={ev.id}
              href={`/career-portal/events/${ev.id}`}
              className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-base shrink-0">📅</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{ev.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${EVENT_COLORS[ev.eventType]}`}>
                      {EVENT_TYPE_LABELS[ev.eventType]}
                    </span>
                    <span className="text-xs text-gray-400">
                      {new Date(ev.heldAt).toLocaleDateString("ja-JP")}
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-xs text-blue-600">詳細・出席管理 →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
