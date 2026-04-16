"use client";

import Link from "next/link";
import { useEs } from "@/hooks/useEs";
import { useInterviews } from "@/hooks/useInterviews";
import { useCompanies } from "@/hooks/useCompanies";
import { useEvents } from "@/hooks/useEvents";
import { LegacyBadge as Badge } from "@/components/ui/StatusBadge";
import { formatDate, formatDateTime, daysUntil } from "@/lib/utils";
import { COMPANY_EVENT_TYPE_COLORS } from "@/types";
import { KareoCharacter } from "@/components/kareo/KareoCharacter";
import { PageTutorial, PAGE_TUTORIALS } from "@/components/PageTutorial";

interface DeadlineItem {
  id: string;
  type: string;
  title: string;
  companyName: string;
  companyId?: string;
  date: string;
  link: string;
  isPast: boolean;
  days: number;
}

const TYPE_BADGE: Record<string, string> = {
  ES: "bg-blue-100 text-blue-700",
  面接: "bg-purple-100 text-purple-700",
  説明会: "bg-orange-100 text-orange-700",
  インターン: "bg-green-100 text-green-700",
  セミナー: "bg-indigo-100 text-indigo-700",
  その他: "bg-gray-100 text-gray-600",
};

export default function DeadlinesPage() {
  const { esList } = useEs();
  const { interviews } = useInterviews();
  const { companies } = useCompanies();
  const { events } = useEvents();

  const getCompanyName = (companyId: string) =>
    companies.find((c) => c.id === companyId)?.name ?? "不明な企業";

  const items: DeadlineItem[] = [
    ...esList
      .filter((e) => e.deadline && e.status === "DRAFT")
      .map((e) => {
        const days = daysUntil(e.deadline!);
        return {
          id: e.id,
          type: "ES",
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
          type: "面接",
          title: `${i.round}次面接`,
          companyName: getCompanyName(i.companyId),
          companyId: i.companyId,
          date: i.scheduledAt,
          link: `/interviews/${i.id}`,
          isPast: days < 0,
          days,
        };
      }),
    ...events
      .filter((e) => e.status === "upcoming")
      .map((e) => {
        const days = daysUntil(e.scheduledAt);
        return {
          id: e.id,
          type: e.eventType,
          title: e.eventType,
          companyName: e.companyName,
          companyId: e.companyId ?? undefined,
          date: e.scheduledAt,
          link: `/events`,
          isPast: days < 0,
          days,
        };
      }),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const upcoming = items.filter((i) => !i.isPast);
  const past = items.filter((i) => i.isPast && (i.type === "ES" || i.type === "面接"));

  const getDaysBadge = (days: number) => {
    if (days === 0) return <Badge variant="danger">今日</Badge>;
    if (days === 1) return <Badge variant="danger">明日</Badge>;
    if (days <= 3) return <Badge variant="danger">あと{days}日</Badge>;
    if (days <= 7) return <Badge variant="warning">あと{days}日</Badge>;
    return <Badge variant="default">あと{days}日</Badge>;
  };

  const getUrgencyBorder = (days: number) => {
    if (days === 0) return "border-l-4 border-l-red-500 border-red-200";
    if (days === 1) return "border-l-4 border-l-amber-500 border-amber-200";
    if (days <= 3) return "border-l-4 border-l-blue-500 border-blue-200";
    return "border-gray-100";
  };

  const getUrgencyBg = (days: number) => {
    if (days === 0) return "bg-red-50";
    if (days === 1) return "bg-amber-50";
    if (days <= 3) return "bg-blue-50";
    return "bg-white";
  };

  // 3日以内の締切
  const urgentItems = upcoming.filter(i => i.days <= 3);

  return (
    <div className="p-4 md:p-8">
      <PageTutorial {...PAGE_TUTORIALS["deadlines"]} pageKey="deadlines" />
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">スケジュール</h1>
        <p className="text-sm text-gray-500 mt-1">ES締切・面接・説明会・インターン</p>
      </div>

      {/* 3日以内の締切アラートバナー */}
      {urgentItems.length > 0 && (
        <div className={`rounded-2xl p-4 mb-6 ${
          urgentItems.some(i => i.days === 0) ? "bg-red-50 border border-red-200" :
          urgentItems.some(i => i.days === 1) ? "bg-amber-50 border border-amber-200" :
          "bg-blue-50 border border-blue-200"
        }`}>
          <div className="flex items-start gap-3">
            <KareoCharacter expression="encouraging" size={48} className="shrink-0" />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${
                urgentItems.some(i => i.days === 0) ? "text-red-700" :
                urgentItems.some(i => i.days === 1) ? "text-amber-700" :
                "text-blue-700"
              }`}>
                {urgentItems.some(i => i.days === 0)
                  ? "今日が締切の予定があります！"
                  : urgentItems.some(i => i.days === 1)
                  ? "明日締切の予定があります"
                  : `${urgentItems.length}件の予定が3日以内に迫っています`}
              </p>
              <div className="mt-2 space-y-1">
                {urgentItems.slice(0, 5).map((item) => (
                  <Link key={`urgent-${item.type}-${item.id}`} href={item.link}>
                    <div className="flex items-center gap-2 text-sm hover:underline">
                      <span className={`font-bold ${
                        item.days === 0 ? "text-red-600" : item.days === 1 ? "text-amber-600" : "text-blue-600"
                      }`}>
                        {item.days === 0 ? "今日" : item.days === 1 ? "明日" : `${item.days}日後`}
                      </span>
                      <span className="text-gray-700">{item.companyName} - {item.title}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {upcoming.length === 0 && past.length === 0 ? (
        <div className="text-center py-16 text-gray-400">直近の締切・予定はありません</div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">今後の予定</h2>
              <div className="space-y-3">
                {upcoming.map((item) => (
                  <Link key={`${item.type}-${item.id}`} href={item.link}>
                    <div className={`rounded-xl border p-5 hover:shadow-md transition-shadow cursor-pointer ${getUrgencyBorder(item.days)} ${getUrgencyBg(item.days)}`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${TYPE_BADGE[item.type] ?? "bg-gray-100 text-gray-600"}`}>
                              {item.type}
                            </span>
                            {item.companyId ? (
                              <Link href={`/companies/${item.companyId}`} onClick={(e) => e.stopPropagation()} className="text-xs text-gray-400 hover:underline">
                                {item.companyName}
                              </Link>
                            ) : (
                              <span className="text-xs text-gray-400">{item.companyName}</span>
                            )}
                          </div>
                          <p className="font-semibold text-gray-900">{item.title}</p>
                          <p className="text-sm text-gray-500 mt-0.5">
                            {formatDateTime(item.date)}
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
                            <span className={`text-xs font-medium px-2 py-0.5 rounded ${TYPE_BADGE[item.type] ?? "bg-gray-100 text-gray-600"}`}>
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
