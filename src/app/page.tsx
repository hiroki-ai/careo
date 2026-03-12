"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCompanies } from "@/hooks/useCompanies";
import { useEs } from "@/hooks/useEs";
import { useInterviews } from "@/hooks/useInterviews";
import { useProfile } from "@/hooks/useProfile";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MiniCalendar } from "@/components/dashboard/MiniCalendar";
import { createClient } from "@/lib/supabase/client";
import { daysUntil } from "@/lib/utils";
import { COMPANY_STATUS_ORDER, JOB_SEARCH_STAGE_LABELS } from "@/types";

interface ActionItem {
  priority: "high" | "medium" | "low";
  action: string;
  reason: string;
}

interface NextActionResult {
  summary: string;
  weeklyActions: ActionItem[];
}

const priorityColors = {
  high: "border-l-red-500 bg-red-50",
  medium: "border-l-yellow-500 bg-yellow-50",
  low: "border-l-blue-500 bg-blue-50",
};
const priorityLabels = { high: "緊急", medium: "推奨", low: "情報" };
const priorityBadgeVariants: Record<string, "danger" | "warning" | "default"> = {
  high: "danger", medium: "warning", low: "default",
};

export default function DashboardPage() {
  const { companies } = useCompanies();
  const { esList } = useEs();
  const { interviews } = useInterviews();
  const { profile, saveProfile } = useProfile();
  const router = useRouter();
  const [aiResult, setAiResult] = useState<NextActionResult | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const statusCounts = COMPANY_STATUS_ORDER.reduce((acc, s) => {
    acc[s] = companies.filter((c) => c.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  // カレンダーイベント
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

  // 直近7日の締切
  const upcomingDeadlines = calendarEvents
    .map(e => ({ ...e, days: daysUntil(e.date) }))
    .filter(d => d.days >= 0 && d.days <= 7)
    .sort((a, b) => a.days - b.days)
    .slice(0, 4);

  const recentCompanies = [...companies]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 4);

  const fetchAiAdvice = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/next-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companies, esList, interviews, profile }),
      });
      const text = await res.text();
      if (!text) throw new Error("Empty response");
      const data = JSON.parse(text);
      if (!data.error) setAiResult(data);
      else console.error("[AI] error:", data.error, data.raw);
    } catch (err) {
      console.error("[fetchAiAdvice]", err);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (companies.length >= 0 && !aiResult && profile) fetchAiAdvice();
  }, [profile]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="p-8">
      {/* ページヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
          {profile && (
            <p className="text-sm text-gray-500 mt-0.5">
              {[profile.university, profile.faculty, profile.grade].filter(Boolean).join(" · ")} ／ {profile.graduationYear}年卒 ／ {JOB_SEARCH_STAGE_LABELS[profile.jobSearchStage]}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href="/settings">
            <Button variant="secondary" size="sm">設定</Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>ログアウト</Button>
        </div>
      </div>

      {/* ステータスサマリー */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: "選考中", count: companies.filter(c => !["OFFERED","REJECTED","WISHLIST"].includes(c.status)).length, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
          { label: "内定", count: statusCounts["OFFERED"] ?? 0, color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
          { label: "ES提出待ち", count: esList.filter(e => e.status === "DRAFT").length, color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
          { label: "気になる", count: statusCounts["WISHLIST"] ?? 0, color: "text-gray-600", bg: "bg-gray-50", border: "border-gray-100" },
        ].map((item) => (
          <div key={item.label} className={`${item.bg} border ${item.border} rounded-xl p-4`}>
            <p className="text-xs font-medium text-gray-500 mb-1">{item.label}</p>
            <p className={`text-3xl font-bold ${item.color}`}>{item.count}</p>
          </div>
        ))}
      </div>

      {/* メインコンテンツ */}
      <div className="grid grid-cols-12 gap-5">
        {/* AI Next Action */}
        <div className="col-span-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">🤖 Next Action AI</h2>
            <Button variant="ghost" size="sm" onClick={fetchAiAdvice} disabled={aiLoading}>
              {aiLoading ? "分析中..." : "再分析"}
            </Button>
          </div>
          {aiResult?.summary && (
            <p className="text-xs text-gray-400 mb-3 px-1">{aiResult.summary}</p>
          )}
          {aiLoading && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          )}
          {!aiLoading && aiResult && (
            <div className="space-y-2">
              {aiResult.weeklyActions.map((action, i) => (
                <div key={i} className={`border-l-4 rounded-r-xl p-3.5 ${priorityColors[action.priority]}`}>
                  <div className="flex items-start gap-2.5">
                    <Badge variant={priorityBadgeVariants[action.priority]}>
                      {priorityLabels[action.priority]}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{action.action}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{action.reason}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!aiLoading && !aiResult && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-sm mb-3">プロフィールを設定するとAIがアドバイスします</p>
              <Button size="sm" onClick={fetchAiAdvice}>AIアドバイスを取得</Button>
            </div>
          )}
        </div>

        {/* カレンダー */}
        <div className="col-span-4">
          <h2 className="font-semibold text-gray-900 mb-3">カレンダー</h2>
          <MiniCalendar events={calendarEvents} />
        </div>

        {/* 右サイドパネル */}
        <div className="col-span-3 space-y-5">
          {/* 直近の予定 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900 text-sm">直近の締切</h2>
              <Link href="/deadlines" className="text-xs text-blue-500 hover:underline">すべて</Link>
            </div>
            {upcomingDeadlines.length === 0 ? (
              <p className="text-xs text-gray-400">直近の予定はありません</p>
            ) : (
              <div className="space-y-2">
                {upcomingDeadlines.map((d) => (
                  <Link key={`${d.type}-${d.id}`} href={d.link}>
                    <div className={`bg-white rounded-lg border p-2.5 hover:bg-gray-50 transition-colors ${d.days <= 3 ? "border-red-200" : "border-gray-100"}`}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${d.type === "ES" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                          {d.type}
                        </span>
                        <span className={`text-[10px] font-semibold ${d.days === 0 ? "text-red-600" : d.days <= 3 ? "text-orange-600" : "text-gray-400"}`}>
                          {d.days === 0 ? "今日" : `あと${d.days}日`}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-gray-900 truncate">{d.title}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 最近の企業 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900 text-sm">最近の企業</h2>
              <Link href="/companies" className="text-xs text-blue-500 hover:underline">すべて</Link>
            </div>
            <div className="space-y-2">
              {recentCompanies.map((c) => (
                <Link key={c.id} href={`/companies/${c.id}`}>
                  <div className="bg-white rounded-lg border border-gray-100 p-2.5 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-medium text-gray-900 truncate flex-1">{c.name}</p>
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
