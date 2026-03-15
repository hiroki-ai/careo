"use client";

import Link from "next/link";
import { useEs } from "@/hooks/useEs";
import { useInterviews } from "@/hooks/useInterviews";
import { useCompanies } from "@/hooks/useCompanies";
import { Badge } from "@/components/ui/Badge";
import { formatDate, formatDateTime, daysUntil } from "@/lib/utils";

interface DeadlineItem {
  id: string;
  type: "ES" | "面接";
  title: string;
  companyName: string;
  companyId: string;
  date: string;
  link: string;
  isPast: boolean;
  days: number;
}

export default function DeadlinesPage() {
  const { esList } = useEs();
  const { interviews } = useInterviews();
  const { companies } = useCompanies();

  const getCompanyName = (companyId: string) =>
    companies.find((c) => c.id === companyId)?.name ?? "不明な企業";

  const items: DeadlineItem[] = [
    ...esList
      .filter((e) => e.deadline && e.status === "DRAFT")
      .map((e) => {
        const days = daysUntil(e.deadline!);
        return {
          id: e.id,
          type: "ES" as const,
          title: e.title,
          companyName: getCompanyName(e.companyId),
          companyId: e.companyId,
          date: e.deadline!,
          link: `/es/${e.id}`,
          isPast: days < 0,
          days,
        };
      }),
    ...interviews
      .filter((i) => i.result === "PENDING")
      .map((i) => {
        const days = daysUntil(i.scheduledAt);
        return {
          id: i.id,
          type: "面接" as const,
          title: `${i.round}次面接`,
          companyName: getCompanyName(i.companyId),
          companyId: i.companyId,
          date: i.scheduledAt,
          link: `/interviews/${i.id}`,
          isPast: days < 0,
          days,
        };
      }),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcoming = items.filter((i) => !i.isPast);
  const past = items.filter((i) => i.isPast);

  const getDaysBadge = (days: number) => {
    if (days === 0) return <Badge variant="danger">今日</Badge>;
    if (days === 1) return <Badge variant="danger">明日</Badge>;
    if (days <= 3) return <Badge variant="danger">あと{days}日</Badge>;
    if (days <= 7) return <Badge variant="warning">あと{days}日</Badge>;
    return <Badge variant="default">あと{days}日</Badge>;
  };

  return (
    <div className="p-4 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">締切一覧</h1>
        <p className="text-sm text-gray-500 mt-1">未提出のES締切・予定面接を表示</p>
      </div>

      {upcoming.length === 0 && past.length === 0 ? (
        <div className="text-center py-16 text-gray-400">直近の締切・面接はありません</div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">今後の予定</h2>
              <div className="space-y-3">
                {upcoming.map((item) => (
                  <Link key={`${item.type}-${item.id}`} href={item.link}>
                    <div className={`bg-white rounded-xl border p-5 hover:shadow-md transition-shadow cursor-pointer ${item.days <= 3 ? "border-red-200" : "border-gray-100"}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${item.type === "ES" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                              {item.type}
                            </span>
                            <Link href={`/companies/${item.companyId}`} onClick={(e) => e.stopPropagation()} className="text-xs text-gray-400 hover:underline">
                              {item.companyName}
                            </Link>
                          </div>
                          <p className="font-semibold text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {item.type === "面接" ? formatDateTime(item.date) : formatDate(item.date)}
                          </p>
                        </div>
                        {getDaysBadge(item.days)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">期限切れ</h2>
              <div className="space-y-3 opacity-60">
                {past.map((item) => (
                  <Link key={`${item.type}-${item.id}`} href={item.link}>
                    <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${item.type === "ES" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                              {item.type}
                            </span>
                            <span className="text-xs text-gray-400">{item.companyName}</span>
                          </div>
                          <p className="font-semibold text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-500 mt-0.5">{formatDate(item.date)}</p>
                        </div>
                        <Badge variant="default">期限切れ</Badge>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
