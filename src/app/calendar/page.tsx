"use client";

import Link from "next/link";
import { useCompanies } from "@/hooks/useCompanies";
import { useEs } from "@/hooks/useEs";
import { useInterviews } from "@/hooks/useInterviews";
import { MiniCalendar } from "@/components/dashboard/MiniCalendar";
import { daysUntil } from "@/lib/utils";

export default function CalendarPage() {
  const { companies } = useCompanies();
  const { esList } = useEs();
  const { interviews } = useInterviews();

  const calendarEvents = [
    ...esList
      .filter((e) => e.deadline && e.status === "DRAFT")
      .map((e) => ({
        id: e.id,
        date: e.deadline!,
        type: "ES" as const,
        title: `${companies.find(c => c.id === e.companyId)?.name ?? ""} ES`,
        link: `/es/${e.id}`,
      })),
    ...interviews
      .filter((i) => i.result === "PENDING")
      .map((i) => ({
        id: i.id,
        date: i.scheduledAt,
        type: "面接" as const,
        title: `${companies.find(c => c.id === i.companyId)?.name ?? ""} ${i.round}次面接`,
        link: `/interviews/${i.id}`,
      })),
  ];

  const upcoming = calendarEvents
    .map(e => ({ ...e, days: daysUntil(e.date) }))
    .filter(d => d.days >= 0)
    .sort((a, b) => a.days - b.days);

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">カレンダー</h1>
        <p className="text-sm text-gray-400 mt-0.5">ES締切・面接のスケジュール</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-6">
        <MiniCalendar events={calendarEvents} />
      </div>

      <div>
        <h2 className="font-semibold text-gray-900 text-sm mb-3">今後の予定</h2>
        {upcoming.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
            <p className="text-gray-400 text-sm">予定がありません</p>
            <p className="text-xs text-gray-300 mt-1">ESや面接を登録すると表示されます</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((d) => (
              <Link key={`${d.type}-${d.id}`} href={d.link}>
                <div className={`flex items-center justify-between bg-white rounded-xl border p-3.5 hover:bg-gray-50 transition-colors ${d.days <= 3 ? "border-red-200" : "border-gray-100"}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${d.type === "ES" ? "bg-[#00c896]/10 text-[#00a87e]" : "bg-purple-100 text-purple-700"}`}>
                      {d.type}
                    </span>
                    <p className="text-sm font-medium text-gray-900 truncate">{d.title}</p>
                  </div>
                  <span className={`text-xs font-bold shrink-0 ml-3 ${d.days === 0 ? "text-red-600" : d.days <= 3 ? "text-orange-500" : "text-gray-400"}`}>
                    {d.days === 0 ? "今日！" : `あと${d.days}日`}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
