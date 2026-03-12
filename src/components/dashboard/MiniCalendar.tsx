"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

interface CalendarEvent {
  id: string;
  date: string;
  type: "ES" | "面接";
  title: string;
  link: string;
}

interface MiniCalendarProps {
  events: CalendarEvent[];
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

export function MiniCalendar({ events }: MiniCalendarProps) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const eventMap = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((e) => {
      const d = new Date(e.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const key = d.getDate().toString();
        if (!map[key]) map[key] = [];
        map[key].push(e);
      }
    });
    return map;
  }, [events, year, month]);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const selectedEvents = selectedDay ? eventMap[selectedDay.toString()] ?? [] : [];

  const prevMonth = () => {
    if (month === 0) { setYear(y => y - 1); setMonth(11); }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear(y => y + 1); setMonth(0); }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  };

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isToday = (day: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-1 rounded hover:bg-gray-100 cursor-pointer transition-colors">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-gray-900">{year}年{month + 1}月</span>
        <button onClick={nextMonth} className="p-1 rounded hover:bg-gray-100 cursor-pointer transition-colors">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className={`text-center text-[10px] font-semibold py-1 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"}`}>
            {d}
          </div>
        ))}
      </div>

      {/* 日付グリッド */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`empty-${i}`} />;
          const evs = eventMap[day.toString()] ?? [];
          const isSelected = selectedDay === day;
          const col = i % 7;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              className={`relative flex flex-col items-center py-1 rounded-lg transition-colors cursor-pointer ${
                isSelected ? "bg-blue-600" : isToday(day) ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              <span className={`text-xs font-medium ${
                isSelected ? "text-white" :
                isToday(day) ? "text-blue-600 font-bold" :
                col === 0 ? "text-red-400" :
                col === 6 ? "text-blue-400" :
                "text-gray-700"
              }`}>
                {day}
              </span>
              {evs.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {evs.slice(0, 2).map((e, j) => (
                    <span key={j} className={`w-1 h-1 rounded-full ${
                      isSelected ? "bg-white" : e.type === "ES" ? "bg-blue-400" : "bg-purple-400"
                    }`} />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* 凡例 */}
      <div className="flex gap-3 mt-3 pt-3 border-t border-gray-50">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-[10px] text-gray-400">ES締切</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-purple-400" />
          <span className="text-[10px] text-gray-400">面接</span>
        </div>
      </div>

      {/* 選択日のイベント */}
      {selectedDay && (
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
          <p className="text-xs font-semibold text-gray-500">{month + 1}/{selectedDay} の予定</p>
          {selectedEvents.length === 0 ? (
            <p className="text-xs text-gray-400">予定なし</p>
          ) : (
            selectedEvents.map((e) => (
              <Link key={e.id} href={e.link} className="flex items-center gap-2 hover:opacity-80">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  e.type === "ES" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"
                }`}>{e.type}</span>
                <span className="text-xs text-gray-700 truncate">{e.title}</span>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
