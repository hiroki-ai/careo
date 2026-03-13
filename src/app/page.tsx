"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCompanies } from "@/hooks/useCompanies";
import { useEs } from "@/hooks/useEs";
import { useInterviews } from "@/hooks/useInterviews";
import { useProfile } from "@/hooks/useProfile";
import { useActionItems } from "@/hooks/useActionItems";
import { useChat } from "@/hooks/useChat";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MiniCalendar } from "@/components/dashboard/MiniCalendar";
import { PdcaPanel } from "@/components/dashboard/PdcaPanel";
import { KareoWidget } from "@/components/dashboard/KareoWidget";
import { createClient } from "@/lib/supabase/client";
import { daysUntil } from "@/lib/utils";
import { COMPANY_STATUS_ORDER, JOB_SEARCH_STAGE_LABELS } from "@/types";

interface NextActionResult {
  summary: string;
  weeklyActions: { priority: "high" | "medium" | "low"; action: string; reason: string }[];
}

interface PdcaResult {
  plan: { weeklyGoal: string; taskCompletion: string };
  do: { highlights: string[]; totalActivity: string };
  check: { score: number; goodPoints: string[]; issues: string[]; insight: string };
  act: { improvements: string[]; nextWeekFocus: string; encouragement: string };
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
  const { profile } = useProfile();
  const { pendingItems, completedItems, loading: itemsLoading, replaceItems, toggleItem } = useActionItems();
  const { recentUserMessages } = useChat();
  const router = useRouter();
  const [aiSummary, setAiSummary] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [pdcaResult, setPdcaResult] = useState<PdcaResult | null>(null);
  const [pdcaLoading, setPdcaLoading] = useState(false);

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
    .slice(0, 3);

  const fetchAiAdvice = async (completed?: string[]) => {
    setAiLoading(true);
    try {
      const completedActions = completed ?? completedItems.map(i => i.action);
      const res = await fetch("/api/ai/next-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companies, esList, interviews, profile, completedActions, recentChatMessages: recentUserMessages }),
      });
      const text = await res.text();
      if (!text) throw new Error("Empty response");
      const data: NextActionResult = JSON.parse(text);
      if (!("error" in data)) {
        setAiSummary(data.summary ?? "");
        await replaceItems(data.weeklyActions);
      } else {
        console.error("[AI] error:", (data as { error: string }).error);
      }
    } catch (err) {
      console.error("[fetchAiAdvice]", err);
    } finally {
      setAiLoading(false);
    }
  };

  const fetchPdca = async () => {
    setPdcaLoading(true);
    try {
      const res = await fetch("/api/ai/pdca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companies, esList, interviews, profile,
          pendingActions: pendingItems.map(i => ({ action: i.action, priority: i.priority })),
          completedActions: completedItems.map(i => ({ action: i.action })),
          recentChatMessages: recentUserMessages,
        }),
      });
      const text = await res.text();
      if (!text) return;
      const data = JSON.parse(text);
      if (!("error" in data)) setPdcaResult(data);
    } catch (err) {
      console.error("[fetchPdca]", err);
    } finally {
      setPdcaLoading(false);
    }
  };

  useEffect(() => {
    if (profile && !itemsLoading && !hasLoaded && pendingItems.length === 0) {
      setHasLoaded(true);
      fetchAiAdvice(completedItems.map(i => i.action));
    } else if (profile && !itemsLoading && !hasLoaded) {
      setHasLoaded(true);
    }
  }, [profile, itemsLoading]);

  useEffect(() => {
    if (profile && !itemsLoading && hasLoaded && !pdcaResult && !pdcaLoading) {
      fetchPdca();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasLoaded, itemsLoading]);

  const handleToggle = async (id: string, isCompleted: boolean) => {
    await toggleItem(id, isCompleted);
    if (isCompleted) {
      const newCompleted = [...completedItems.map(i => i.action)];
      const toggled = pendingItems.find(i => i.id === id);
      if (toggled) newCompleted.push(toggled.action);
      await fetchAiAdvice(newCompleted);
      fetchPdca();
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const hasItems = pendingItems.length > 0 || completedItems.length > 0;

  return (
    <div className="p-6">
      {/* ページヘッダー */}
      <div className="flex items-center justify-between mb-5">
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
      <div className="grid grid-cols-4 gap-3 mb-5">
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

      {/* メインコンテンツ: 3列 */}
      <div className="grid grid-cols-12 gap-4 mb-4">

        {/* 左: Next Action チェックリスト */}
        <div className="col-span-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 text-sm">🎯 Next Action</h2>
            <Button variant="ghost" size="sm" onClick={() => fetchAiAdvice()} disabled={aiLoading}>
              {aiLoading ? "分析中..." : "再分析"}
            </Button>
          </div>
          {aiSummary && (
            <p className="text-xs text-gray-400 mb-3 px-1">{aiSummary}</p>
          )}

          {(aiLoading || itemsLoading) && (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {!aiLoading && !itemsLoading && hasItems && (
            <div className="space-y-2">
              {pendingItems.map((item) => (
                <label
                  key={item.id}
                  className={`flex items-start gap-2.5 border-l-4 rounded-r-xl p-3 cursor-pointer ${priorityColors[item.priority]}`}
                >
                  <input
                    type="checkbox"
                    checked={false}
                    onChange={() => handleToggle(item.id, true)}
                    className="mt-0.5 w-4 h-4 rounded border-gray-400 accent-blue-600 cursor-pointer shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      <Badge variant={priorityBadgeVariants[item.priority]}>
                        {priorityLabels[item.priority]}
                      </Badge>
                      <p className="text-xs font-medium text-gray-900">{item.action}</p>
                    </div>
                    <p className="text-[11px] text-gray-500">{item.reason}</p>
                  </div>
                </label>
              ))}
              {completedItems.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] text-gray-400 mb-1.5 px-1">完了済み</p>
                  {completedItems.map((item) => (
                    <label
                      key={item.id}
                      className="flex items-center gap-2.5 border-l-4 border-l-gray-200 bg-gray-50 rounded-r-xl p-2.5 mb-1.5 cursor-pointer opacity-60"
                    >
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => toggleItem(item.id, false)}
                        className="w-4 h-4 rounded border-gray-400 accent-blue-600 cursor-pointer shrink-0"
                      />
                      <p className="text-xs text-gray-500 line-through">{item.action}</p>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {!aiLoading && !itemsLoading && !hasItems && (
            <div className="text-center py-8 text-gray-400">
              <p className="text-xs mb-3">プロフィールを設定するとAIがアドバイスします</p>
              <Button size="sm" onClick={() => fetchAiAdvice([])}>AIアドバイスを取得</Button>
            </div>
          )}
        </div>

        {/* 中: カレンダー + 締切 */}
        <div className="col-span-4">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">📅 カレンダー</h2>
          <MiniCalendar events={calendarEvents} />

          {upcomingDeadlines.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500">直近の締切</p>
                <Link href="/deadlines" className="text-[10px] text-blue-500 hover:underline">すべて</Link>
              </div>
              <div className="space-y-1.5">
                {upcomingDeadlines.map((d) => (
                  <Link key={`${d.type}-${d.id}`} href={d.link}>
                    <div className={`flex items-center justify-between bg-white rounded-lg border p-2 hover:bg-gray-50 transition-colors ${d.days <= 3 ? "border-red-200" : "border-gray-100"}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0 ${d.type === "ES" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}`}>
                          {d.type}
                        </span>
                        <p className="text-xs font-medium text-gray-900 truncate">{d.title}</p>
                      </div>
                      <span className={`text-[10px] font-semibold shrink-0 ml-2 ${d.days === 0 ? "text-red-600" : d.days <= 3 ? "text-orange-600" : "text-gray-400"}`}>
                        {d.days === 0 ? "今日" : `あと${d.days}日`}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右: カレオ ウィジェット */}
        <div className="col-span-4" style={{ height: "480px" }}>
          <KareoWidget />
        </div>
      </div>

      {/* PDCA 週次レポート */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900">📊 PDCA 週次レポート</h2>
            <span className="text-xs text-gray-400">チャット・選考状況からAIが自動分析</span>
          </div>
          <Button variant="ghost" size="sm" onClick={fetchPdca} disabled={pdcaLoading}>
            {pdcaLoading ? "分析中..." : "再分析"}
          </Button>
        </div>

        {pdcaLoading && (
          <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
            <div className="h-2 bg-gray-100 rounded-full animate-pulse w-full" />
            <div className="grid grid-cols-4 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {!pdcaLoading && pdcaResult && <PdcaPanel result={pdcaResult} />}

        {!pdcaLoading && !pdcaResult && (
          <div className="bg-white rounded-xl border border-gray-100 p-6 text-center text-gray-400">
            <p className="text-sm mb-3">就活データが揃うとPDCA分析が実行されます</p>
            <Button size="sm" onClick={fetchPdca}>PDCAを分析する</Button>
          </div>
        )}
      </div>
    </div>
  );
}
