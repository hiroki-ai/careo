"use client";

import Link from "next/link";
import { useCompanies } from "@/hooks/useCompanies";
import { useEs } from "@/hooks/useEs";
import { useInterviews } from "@/hooks/useInterviews";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { generateAdvice } from "@/lib/ai";
import { daysUntil } from "@/lib/utils";
import { COMPANY_STATUS_ORDER } from "@/types";

const priorityColors = {
  high: "border-l-red-500 bg-red-50",
  medium: "border-l-yellow-500 bg-yellow-50",
  low: "border-l-blue-500 bg-blue-50",
};

const priorityLabels = {
  high: "緊急",
  medium: "推奨",
  low: "情報",
};

const priorityBadgeVariants: Record<string, "danger" | "warning" | "default"> = {
  high: "danger",
  medium: "warning",
  low: "default",
};

export default function DashboardPage() {
  const { companies } = useCompanies();
  const { esList } = useEs();
  const { interviews } = useInterviews();

  const advices = generateAdvice(companies, esList, interviews);

  const statusCounts = COMPANY_STATUS_ORDER.reduce((acc, s) => {
    acc[s] = companies.filter((c) => c.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const upcomingDeadlines = [
    ...esList
      .filter((e) => e.deadline && e.status === "DRAFT")
      .map((e) => ({
        id: e.id,
        type: "ES" as const,
        title: e.title,
        company: companies.find((c) => c.id === e.companyId)?.name ?? "",
        date: e.deadline!,
        link: `/es/${e.id}`,
        days: daysUntil(e.deadline!),
      })),
    ...interviews
      .filter((i) => i.result === "PENDING" && daysUntil(i.scheduledAt) >= 0)
      .map((i) => ({
        id: i.id,
        type: "面接" as const,
        title: `${i.round}次面接`,
        company: companies.find((c) => c.id === i.companyId)?.name ?? "",
        date: i.scheduledAt,
        link: `/interviews/${i.id}`,
        days: daysUntil(i.scheduledAt),
      })),
  ]
    .filter((d) => d.days <= 7)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);

  const recentCompanies = [...companies]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-sm text-gray-500 mt-1">就活状況のサマリー</p>
      </div>

      {/* ステータスサマリー */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label: "選考中", count: companies.filter((c) => !["OFFERED", "REJECTED", "WISHLIST"].includes(c.status)).length, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "内定", count: statusCounts["OFFERED"] ?? 0, color: "text-green-600", bg: "bg-green-50" },
          { label: "ES提出待ち", count: esList.filter((e) => e.status === "DRAFT").length, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "気になる", count: statusCounts["WISHLIST"] ?? 0, color: "text-gray-600", bg: "bg-gray-50" },
        ].map((item) => (
          <div key={item.label} className={`${item.bg} rounded-xl p-5`}>
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className={`text-3xl font-bold mt-1 ${item.color}`}>{item.count}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* AIアドバイス */}
        <div className="col-span-2">
          <h2 className="font-semibold text-gray-900 mb-3">AIアドバイス</h2>
          <div className="space-y-3">
            {advices.map((advice, i) => (
              <div
                key={i}
                className={`border-l-4 rounded-r-xl p-4 ${priorityColors[advice.priority]}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={priorityBadgeVariants[advice.priority]}>
                        {priorityLabels[advice.priority]}
                      </Badge>
                      <span className="text-xs text-gray-500">{advice.category}</span>
                    </div>
                    <p className="text-sm text-gray-800">{advice.message}</p>
                  </div>
                  {advice.link && (
                    <Link
                      href={advice.link}
                      className="text-xs text-blue-600 hover:underline whitespace-nowrap shrink-0"
                    >
                      確認 →
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* サイドパネル */}
        <div className="space-y-6">
          {/* 直近の締切 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">直近の締切・面接</h2>
              <Link href="/deadlines" className="text-xs text-blue-500 hover:underline">すべて見る</Link>
            </div>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-sm text-gray-400">直近の予定はありません</p>
            ) : (
              <div className="space-y-2">
                {upcomingDeadlines.map((d) => (
                  <Link key={`${d.type}-${d.id}`} href={d.link}>
                    <div className={`bg-white rounded-lg border p-3 hover:bg-gray-50 transition-colors ${d.days <= 3 ? "border-red-200" : "border-gray-100"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${d.type === "ES" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                          {d.type}
                        </span>
                        <span className={`text-xs font-medium ${d.days === 0 ? "text-red-600" : d.days <= 3 ? "text-orange-600" : "text-gray-400"}`}>
                          {d.days === 0 ? "今日" : `あと${d.days}日`}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-gray-900 truncate">{d.title}</p>
                      <p className="text-xs text-gray-400 truncate">{d.company}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 最近更新した企業 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">最近の企業</h2>
              <Link href="/companies" className="text-xs text-blue-500 hover:underline">すべて見る</Link>
            </div>
            <div className="space-y-2">
              {recentCompanies.map((c) => (
                <Link key={c.id} href={`/companies/${c.id}`}>
                  <div className="bg-white rounded-lg border border-gray-100 p-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate flex-1 mr-2">{c.name}</p>
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
