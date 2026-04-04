"use client";

import { useState } from "react";
import { useEvents } from "@/hooks/useEvents";
import { EventForm } from "@/components/events/EventForm";
import { CompanyEvent, COMPANY_EVENT_TYPE_COLORS } from "@/types";
import { daysUntil, formatDateTime } from "@/lib/utils";

function EventCard({ event, onEdit, onDelete }: {
  event: CompanyEvent;
  onEdit: (e: CompanyEvent) => void;
  onDelete: (id: string) => void;
}) {
  const days = daysUntil(event.scheduledAt);
  const isPast = days < 0;
  const isDone = event.status === "done";

  return (
    <div className={`bg-white rounded-xl border p-4 ${isPast || isDone ? "opacity-60" : days <= 3 ? "border-orange-200" : "border-gray-100"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${COMPANY_EVENT_TYPE_COLORS[event.eventType]}`}>
              {event.eventType}
            </span>
            {isDone && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">参加済み</span>
            )}
            {!isPast && !isDone && days <= 3 && days >= 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">
                {days === 0 ? "今日！" : `あと${days}日`}
              </span>
            )}
          </div>
          <p className="font-semibold text-gray-900 truncate">{event.companyName}</p>
          <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(event.scheduledAt)}</p>
          {event.endDate && (
            <p className="text-xs text-gray-400">〜 {event.endDate}</p>
          )}
          {event.location && (
            <p className="text-xs text-gray-400 mt-0.5">📍 {event.location}</p>
          )}
          {event.url && (
            <a href={event.url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-[#00a87e] hover:underline mt-0.5 block truncate">
              🔗 {event.url}
            </a>
          )}
          {event.notes && (
            <p className="text-xs text-gray-400 mt-1 line-clamp-2">{event.notes}</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onEdit(event)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            title="編集"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(event.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
            title="削除"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EventsPage() {
  const { events, loading, deleteEvent, updateEvent } = useEvents();
  const [showForm, setShowForm] = useState(false);
  const [editEvent, setEditEvent] = useState<CompanyEvent | null>(null);
  const [filter, setFilter] = useState<"upcoming" | "all">("upcoming");

  const now = new Date();
  const filtered = events.filter(e => {
    if (filter === "upcoming") {
      return e.status === "upcoming" && new Date(e.scheduledAt) >= now;
    }
    return true;
  });

  const handleDelete = async (id: string) => {
    if (!confirm("削除しますか？")) return;
    await deleteEvent(id);
  };

  const handleMarkDone = async (event: CompanyEvent) => {
    await updateEvent(event.id, { status: "done" });
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">説明会・インターン</h1>
          <p className="text-sm text-gray-400 mt-0.5">日程を登録して一元管理</p>
        </div>
        <button
          onClick={() => { setEditEvent(null); setShowForm(true); }}
          className="flex items-center gap-1.5 bg-[#00c896] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#00a87e] transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          追加
        </button>
      </div>

      {/* フィルター */}
      <div className="flex gap-2 mb-4">
        {(["upcoming", "all"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === f ? "bg-[#00c896] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "upcoming" ? "今後の予定" : "すべて"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400 text-sm">読み込み中...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-4xl mb-3">📅</p>
          <p className="text-gray-500 font-medium">
            {filter === "upcoming" ? "今後の予定はありません" : "まだ登録がありません"}
          </p>
          <p className="text-xs text-gray-400 mt-1">「追加」から説明会・インターンを登録しよう</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(e => (
            <div key={e.id} className="group relative">
              <EventCard
                event={e}
                onEdit={ev => { setEditEvent(ev); setShowForm(true); }}
                onDelete={handleDelete}
              />
              {e.status === "upcoming" && new Date(e.scheduledAt) <= now && (
                <button
                  onClick={() => handleMarkDone(e)}
                  className="mt-1 text-xs text-gray-400 hover:text-[#00a87e] transition-colors"
                >
                  参加済みとしてマーク
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <EventForm
          event={editEvent ?? undefined}
          onClose={() => { setShowForm(false); setEditEvent(null); }}
        />
      )}
    </div>
  );
}
