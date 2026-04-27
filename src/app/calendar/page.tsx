"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useCompanies } from "@/hooks/useCompanies";
import { useEs } from "@/hooks/useEs";
import { useInterviews } from "@/hooks/useInterviews";
import { useEvents } from "@/hooks/useEvents";
import { useCustomEvents } from "@/hooks/useCustomEvents";
import { CustomEvent, CUSTOM_EVENT_COLOR_DOT, CUSTOM_EVENT_COLOR_BADGE } from "@/types";
import { CustomEventModal } from "./CustomEventModal";
import { PageTutorial, PAGE_TUTORIALS } from "@/components/PageTutorial";

type ViewMode = "month" | "agenda";
type EvType = "ES" | "面接" | "説明会" | "インターン" | "セミナー" | "その他" | "マイ予定";

interface CalEv {
  id: string;
  date: string;
  endDate?: string | null;
  type: EvType;
  title: string;
  location?: string | null;
  notes?: string | null;
  color?: string;
  link?: string;
  custom?: CustomEvent;
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

const TYPE_DOT: Record<EvType, string> = {
  ES: "bg-blue-400",
  面接: "bg-purple-500",
  説明会: "bg-orange-400",
  インターン: "bg-green-500",
  セミナー: "bg-indigo-400",
  その他: "bg-gray-400",
  マイ予定: "bg-pink-400",
};

const TYPE_BADGE: Record<EvType, string> = {
  ES: "bg-blue-100 text-blue-700",
  面接: "bg-purple-100 text-purple-700",
  説明会: "bg-orange-100 text-orange-700",
  インターン: "bg-green-100 text-green-700",
  セミナー: "bg-indigo-100 text-indigo-700",
  その他: "bg-gray-100 text-gray-600",
  マイ予定: "bg-pink-100 text-pink-700",
};

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function fmtDateLabel(d: Date) {
  return `${d.getMonth() + 1}月${d.getDate()}日 (${WEEKDAYS[d.getDay()]})`;
}

export default function CalendarPage() {
  const { companies } = useCompanies();
  const { esList } = useEs();
  const { interviews } = useInterviews();
  const { events } = useEvents();
  const { customEvents, addCustomEvent, updateCustomEvent, deleteCustomEvent } = useCustomEvents();

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [view, setView] = useState<ViewMode>("month");

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CustomEvent | null>(null);

  const allEvents: CalEv[] = useMemo(() => [
    ...esList
      .filter((e) => e.deadline && e.status === "DRAFT")
      .map((e) => ({
        id: `es-${e.id}`,
        date: e.deadline!,
        type: "ES" as EvType,
        title: `${companies.find(c => c.id === e.companyId)?.name ?? ""} ES`,
        link: `/es/${e.id}`,
      })),
    ...interviews
      .filter((i) => i.result === "PENDING")
      .map((i) => ({
        id: `int-${i.id}`,
        date: i.scheduledAt,
        type: "面接" as EvType,
        title: `${companies.find(c => c.id === i.companyId)?.name ?? ""} ${i.round}次面接`,
        link: `/interviews/${i.id}`,
      })),
    ...events
      .filter((e) => e.status === "upcoming")
      .map((e) => ({
        id: `ev-${e.id}`,
        date: e.scheduledAt,
        endDate: e.endDate,
        type: e.eventType as EvType,
        title: `${e.companyName} ${e.eventType}`,
        location: e.location,
        notes: e.notes,
        link: `/events`,
      })),
    ...customEvents.map((c) => ({
      id: `cu-${c.id}`,
      date: c.scheduledAt,
      endDate: c.endAt,
      type: "マイ予定" as EvType,
      title: c.title,
      location: c.location,
      notes: c.notes,
      color: c.color,
      custom: c,
    })),
  ], [esList, interviews, events, customEvents, companies]);

  const eventMapByDay = useMemo(() => {
    const map = new Map<string, CalEv[]>();
    allEvents.forEach(e => {
      const key = ymd(new Date(e.date));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    });
    map.forEach(list => list.sort((a, b) => a.date.localeCompare(b.date)));
    return map;
  }, [allEvents]);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
  const isSelected = (day: number) =>
    selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === day;

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
  };
  const goToday = () => {
    const t = new Date();
    setYear(t.getFullYear());
    setMonth(t.getMonth());
    setSelectedDate(t);
  };

  // スワイプ対応
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 60) {
      if (dx < 0) nextMonth();
      else prevMonth();
    }
    touchStartX.current = null;
  };

  const selectedKey = ymd(selectedDate);
  const selectedDayEvents = eventMapByDay.get(selectedKey) ?? [];

  // アジェンダビュー: 今日以降の予定を日付ごとにグループ化
  const agendaGroups = useMemo(() => {
    const todayMid = new Date();
    todayMid.setHours(0, 0, 0, 0);
    const upcoming = allEvents
      .filter((e) => new Date(e.date) >= todayMid)
      .sort((a, b) => a.date.localeCompare(b.date));
    const groups = new Map<string, CalEv[]>();
    upcoming.forEach((e) => {
      const key = ymd(new Date(e.date));
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(e);
    });
    return Array.from(groups.entries()).slice(0, 60);
  }, [allEvents]);

  const openAdd = () => { setEditTarget(null); setModalOpen(true); };
  const openEdit = (c: CustomEvent) => { setEditTarget(c); setModalOpen(true); };

  const handleSubmit = async (data: Omit<CustomEvent, "id" | "createdAt" | "updatedAt">) => {
    if (editTarget) await updateCustomEvent(editTarget.id, data);
    else await addCustomEvent(data);
  };

  return (
    <div className="pb-24 md:pb-8">
      <PageTutorial {...PAGE_TUTORIALS["calendar"]} pageKey="calendar" />

      {/* ヘッダー（sticky） */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="px-4 md:px-8 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">カレンダー</h1>
            <Link href="/events" className="text-xs text-[#00a87e] hover:underline font-medium hidden md:inline">
              説明会・インターン管理 →
            </Link>
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                aria-label="前の月"
                className="p-2 -ml-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-base md:text-lg font-bold text-gray-900 min-w-[7rem] text-center">
                {year}年{month + 1}月
              </h2>
              <button
                type="button"
                onClick={nextMonth}
                aria-label="次の月"
                className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={goToday}
                className="ml-1 px-3 py-1.5 text-xs font-bold text-[#00a87e] bg-[#00c896]/10 hover:bg-[#00c896]/20 rounded-lg transition-colors"
              >
                今日
              </button>
            </div>

            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                type="button"
                onClick={() => setView("month")}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${view === "month" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
              >
                月
              </button>
              <button
                type="button"
                onClick={() => setView("agenda")}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${view === "agenda" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}
              >
                予定
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-8 pt-4">
        {view === "month" ? (
          <>
            {/* 月グリッド */}
            <div
              className="bg-white rounded-2xl border border-gray-100 p-2 md:p-4"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="grid grid-cols-7 mb-1">
                {WEEKDAYS.map((d, i) => (
                  <div
                    key={d}
                    className={`text-center text-[10px] md:text-xs font-bold py-1.5 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"}`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5 md:gap-1">
                {cells.map((day, i) => {
                  if (!day) return <div key={`empty-${i}`} className="aspect-square md:aspect-auto md:h-20" />;
                  const key = ymd(new Date(year, month, day));
                  const evs = eventMapByDay.get(key) ?? [];
                  const sel = isSelected(day);
                  const tdy = isToday(day);
                  const col = i % 7;
                  return (
                    <button
                      type="button"
                      key={day}
                      onClick={() => setSelectedDate(new Date(year, month, day))}
                      className={`relative flex flex-col items-stretch p-1 md:p-1.5 rounded-lg transition-all min-h-[3.5rem] md:min-h-[5rem] text-left ${
                        sel
                          ? "bg-[#00c896] ring-2 ring-[#00c896] ring-offset-1"
                          : tdy
                          ? "bg-[#00c896]/10 hover:bg-[#00c896]/15"
                          : "hover:bg-gray-50 active:bg-gray-100"
                      }`}
                    >
                      <span
                        className={`text-xs md:text-sm font-bold ${
                          sel
                            ? "text-white"
                            : tdy
                            ? "text-[#00a87e]"
                            : col === 0
                            ? "text-red-500"
                            : col === 6
                            ? "text-blue-500"
                            : "text-gray-700"
                        }`}
                      >
                        {day}
                      </span>
                      <div className="mt-0.5 flex flex-col gap-0.5 overflow-hidden">
                        {evs.slice(0, 2).map((e) => (
                          <span
                            key={e.id}
                            className={`text-[8px] md:text-[10px] leading-tight px-1 py-0.5 rounded truncate font-medium ${
                              sel ? "bg-white/30 text-white" : TYPE_BADGE[e.type]
                            }`}
                          >
                            {e.title}
                          </span>
                        ))}
                        {evs.length > 2 && (
                          <span className={`text-[8px] md:text-[10px] ${sel ? "text-white/80" : "text-gray-400"} font-medium`}>
                            +{evs.length - 2}件
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 選択日のタイムライン */}
            <div className="mt-4 bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-gray-900">
                  {fmtDateLabel(selectedDate)}
                </h3>
                <span className="text-xs text-gray-400">{selectedDayEvents.length}件</span>
              </div>
              {selectedDayEvents.length === 0 ? (
                <button
                  type="button"
                  onClick={openAdd}
                  className="w-full py-6 text-center text-sm text-gray-400 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#00c896] hover:text-[#00a87e] transition-colors"
                >
                  + 予定を追加
                </button>
              ) : (
                <div className="space-y-2">
                  {selectedDayEvents.map((e) => (
                    <EventRow key={e.id} event={e} onEdit={openEdit} />
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          // アジェンダビュー
          <div className="space-y-5">
            {agendaGroups.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                <p className="text-gray-400 text-sm">今後の予定はありません</p>
                <button
                  type="button"
                  onClick={openAdd}
                  className="mt-3 inline-flex items-center gap-1 px-4 py-2 text-sm font-bold text-white bg-[#00c896] hover:bg-[#00a87e] rounded-xl transition-colors"
                >
                  + 予定を追加
                </button>
              </div>
            ) : (
              agendaGroups.map(([key, list]) => {
                const d = new Date(key);
                const isTodayGroup = ymd(today) === key;
                const diffDays = Math.floor((d.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000);
                return (
                  <div key={key}>
                    <div className="flex items-center gap-2 mb-2 sticky top-[5.5rem] md:top-24 bg-white/90 backdrop-blur-sm py-1 z-10">
                      <span className={`text-sm font-bold ${isTodayGroup ? "text-[#00a87e]" : "text-gray-900"}`}>
                        {fmtDateLabel(d)}
                      </span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${isTodayGroup ? "bg-[#00c896]/10 text-[#00a87e]" : diffDays <= 3 ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-500"}`}>
                        {isTodayGroup ? "今日" : diffDays === 1 ? "明日" : `${diffDays}日後`}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {list.map((e) => (
                        <EventRow key={e.id} event={e} onEdit={openEdit} showTime />
                      ))}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* FAB */}
      <button
        type="button"
        onClick={openAdd}
        aria-label="予定を追加"
        className="fixed bottom-24 md:bottom-8 right-5 md:right-8 z-30 w-14 h-14 rounded-full bg-[#00c896] hover:bg-[#00a87e] active:scale-95 shadow-lg shadow-[#00c896]/30 flex items-center justify-center transition-all"
      >
        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>

      <CustomEventModal
        open={modalOpen}
        initial={editTarget}
        defaultDate={!editTarget ? selectedDate.toISOString() : null}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        onDelete={editTarget ? deleteCustomEvent : undefined}
      />
    </div>
  );
}

function EventRow({ event, onEdit, showTime = false }: { event: CalEv; onEdit: (c: CustomEvent) => void; showTime?: boolean }) {
  const time = fmtTime(event.date);
  const endTime = event.endDate ? fmtTime(event.endDate) : null;
  const isCustom = event.type === "マイ予定" && event.custom;
  const dotClass = isCustom && event.color
    ? CUSTOM_EVENT_COLOR_DOT[event.color as keyof typeof CUSTOM_EVENT_COLOR_DOT]
    : TYPE_DOT[event.type];
  const badgeClass = isCustom && event.color
    ? CUSTOM_EVENT_COLOR_BADGE[event.color as keyof typeof CUSTOM_EVENT_COLOR_BADGE]
    : TYPE_BADGE[event.type];

  const content = (
    <div className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-[#00c896]/30 hover:shadow-sm transition-all">
      <div className={`w-1 self-stretch rounded-full ${dotClass}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${badgeClass}`}>
            {event.type}
          </span>
          {showTime && (
            <span className="text-[11px] font-medium text-gray-500">
              {time}{endTime ? ` - ${endTime}` : ""}
            </span>
          )}
          {!showTime && (
            <span className="text-[11px] font-medium text-gray-500">
              {time}{endTime ? ` - ${endTime}` : ""}
            </span>
          )}
        </div>
        <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
        {event.location && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">📍 {event.location}</p>
        )}
        {event.notes && (
          <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{event.notes}</p>
        )}
      </div>
    </div>
  );

  if (isCustom) {
    return (
      <button type="button" onClick={() => onEdit(event.custom!)} className="w-full text-left">
        {content}
      </button>
    );
  }
  if (event.link) {
    return <Link href={event.link}>{content}</Link>;
  }
  return content;
}
