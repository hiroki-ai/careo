"use client";

import { useState, useMemo } from "react";

interface Props {
  value?: string | null;  // ISO datetime
  onChange: (iso: string) => void;
  label?: string;
  required?: boolean;
  withTime?: boolean;
  minDate?: string;
  placeholder?: string;
}

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function pad(n: number) { return n.toString().padStart(2, "0"); }
function ymd(d: Date) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; }

export function DateTimeField({ value, onChange, label, required, withTime = true, minDate, placeholder = "日時を選択" }: Props) {
  const [open, setOpen] = useState(false);
  const current = value ? new Date(value) : null;
  const today = new Date();
  const [viewYear, setViewYear] = useState(current?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(current?.getMonth() ?? today.getMonth());
  const [hour, setHour] = useState(current?.getHours() ?? 9);
  const [minute, setMinute] = useState(current ? Math.floor(current.getMinutes() / 5) * 5 : 0);
  const [selectedDate, setSelectedDate] = useState<Date | null>(current);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const minDateObj = useMemo(() => minDate ? new Date(minDate) : null, [minDate]);

  const displayLabel = current
    ? withTime
      ? `${current.getFullYear()}年${current.getMonth() + 1}月${current.getDate()}日 (${WEEKDAYS[current.getDay()]}) ${pad(current.getHours())}:${pad(current.getMinutes())}`
      : `${current.getFullYear()}年${current.getMonth() + 1}月${current.getDate()}日 (${WEEKDAYS[current.getDay()]})`
    : "";

  const prev = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const next = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const pickDay = (day: number) => {
    const d = new Date(viewYear, viewMonth, day, hour, minute, 0, 0);
    if (minDateObj && d < minDateObj) return;
    setSelectedDate(d);
  };

  const confirm = () => {
    if (!selectedDate) return;
    const d = new Date(selectedDate);
    if (withTime) { d.setHours(hour); d.setMinutes(minute); }
    onChange(d.toISOString());
    setOpen(false);
  };

  const isSel = (day: number) => selectedDate && selectedDate.getFullYear() === viewYear && selectedDate.getMonth() === viewMonth && selectedDate.getDate() === day;
  const isToday = (day: number) => today.getFullYear() === viewYear && today.getMonth() === viewMonth && today.getDate() === day;
  const isDisabled = (day: number) => {
    if (!minDateObj) return false;
    const d = new Date(viewYear, viewMonth, day);
    const m0 = new Date(minDateObj); m0.setHours(0, 0, 0, 0);
    return d < m0;
  };

  return (
    <>
      {label && (
        <label className="block text-xs font-semibold text-gray-600 mb-1.5">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`w-full px-3 py-3 text-sm text-left border border-gray-200 rounded-xl bg-white hover:border-gray-300 active:bg-gray-50 transition-colors ${current ? "text-gray-900" : "text-gray-400"}`}
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="truncate">{displayLabel || placeholder}</span>
        </div>
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/40" onClick={() => setOpen(false)}>
          <div
            className="bg-white w-full md:max-w-md md:rounded-2xl rounded-t-3xl p-4 md:p-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ヘッダー */}
            <div className="flex items-center justify-between mb-3">
              <button type="button" onClick={prev} aria-label="前の月" className="p-2 -ml-2 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h3 className="text-base font-bold">{viewYear}年{viewMonth + 1}月</h3>
              <button type="button" onClick={next} aria-label="次の月" className="p-2 -mr-2 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {WEEKDAYS.map((d, i) => (
                <div key={d} className={`text-center text-[10px] font-bold py-1 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"}`}>
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((day, i) => {
                if (!day) return <div key={`e-${i}`} />;
                const sel = isSel(day);
                const tdy = isToday(day);
                const dis = isDisabled(day);
                const col = i % 7;
                return (
                  <button
                    type="button"
                    key={day}
                    onClick={() => !dis && pickDay(day)}
                    disabled={dis}
                    className={`aspect-square flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
                      dis ? "text-gray-300 cursor-not-allowed" :
                      sel ? "bg-[#00c896] text-white font-bold" :
                      tdy ? "bg-[#00c896]/10 text-[#00a87e] font-bold" :
                      col === 0 ? "text-red-500 hover:bg-gray-100" :
                      col === 6 ? "text-blue-500 hover:bg-gray-100" :
                      "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {withTime && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-600 mb-2">時刻</p>
                <div className="flex items-center gap-2">
                  <select
                    value={hour}
                    onChange={(e) => setHour(parseInt(e.target.value))}
                    className="flex-1 px-3 py-2.5 text-base font-medium border border-gray-200 rounded-xl"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>{pad(i)}時</option>
                    ))}
                  </select>
                  <select
                    value={minute}
                    onChange={(e) => setMinute(parseInt(e.target.value))}
                    className="flex-1 px-3 py-2.5 text-base font-medium border border-gray-200 rounded-xl"
                  >
                    {Array.from({ length: 12 }, (_, i) => i * 5).map((m) => (
                      <option key={m} value={m}>{pad(m)}分</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-5">
              <button
                type="button"
                onClick={() => { setSelectedDate(null); onChange(""); setOpen(false); }}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                クリア
              </button>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={confirm}
                disabled={!selectedDate}
                className="px-5 py-2.5 text-sm font-bold text-white bg-[#00c896] hover:bg-[#00a87e] disabled:bg-gray-300 rounded-xl"
              >
                決定
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function dateTimeFieldDefaultMin() { return ymd(new Date()); }
