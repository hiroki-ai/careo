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
import { Modal } from "@/components/ui/Modal";
import { ProfileForm } from "@/components/profile/ProfileForm";
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const statusCounts = COMPANY_STATUS_ORDER.reduce((acc, s) => {
    acc[s] = companies.filter((c) => c.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  const upcomingDeadlines = [
    ...esList
      .filter((e) => e.deadline && e.status === "DRAFT")
      .map((e) => ({
        id: e.id, type: "ES" as const, title: e.title,
        company: companies.find((c) => c.id === e.companyId)?.name ?? "",
        link: `/es/${e.id}`, days: daysUntil(e.deadline!),
      })),
    ...interviews
      .filter((i) => i.result === "PENDING" && daysUntil(i.scheduledAt) >= 0)
      .map((i) => ({
        id: i.id, type: "面接" as const, title: `${i.round}次面接`,
        company: companies.find((c) => c.id === i.companyId)?.name ?? "",
        link: `/interviews/${i.id}`, days: daysUntil(i.scheduledAt),
      })),
  ].filter((d) => d.days <= 7).sort((a, b) => a.days - b.days).slice(0, 5);

  const recentCompanies = [...companies]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const fetchAiAdvice = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai/next-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companies, esList, interviews, profile }),
      });
      const data = await res.json();
      if (!data.error) setAiResult(data);
    } finally {
      setAiLoading(false);
    }
  };

  // データ読み込み後に自動でAIアドバイスを取得
  useEffect(() => {
    if (companies.length > 0 && !aiResult) fetchAiAdvice();
  }, [companies.length]);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-sm text-gray-500 mt-1">就活状況のサマリー</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => setIsProfileOpen(true)}>プロフィール編集</Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>ログアウト</Button>
        </div>
      </div>

      {/* プロフィール概要 */}
      {profile && (
        <div className="bg-blue-50 rounded-xl px-5 py-3 mb-6 flex items-center gap-4 flex-wrap">
          <span className="text-sm text-blue-700 font-medium">{profile.grade}・{profile.graduationYear}年卒</span>
          <span className="text-blue-300">|</span>
          <span className="text-sm text-blue-700">{JOB_SEARCH_STAGE_LABELS[profile.jobSearchStage]}</span>
          {profile.targetIndustries.length > 0 && (
            <>
              <span className="text-blue-300">|</span>
              <span className="text-sm text-blue-700">志望: {profile.targetIndustries.slice(0, 2).join("・")}{profile.targetIndustries.length > 2 ? " 他" : ""}</span>
            </>
          )}
        </div>
      )}

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
        {/* Next Action AI */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">🤖 Next Action AI</h2>
            <Button variant="ghost" size="sm" onClick={fetchAiAdvice} disabled={aiLoading}>
              {aiLoading ? "分析中..." : "再分析"}
            </Button>
          </div>

          {aiResult?.summary && (
            <p className="text-sm text-gray-500 mb-3 px-1">{aiResult.summary}</p>
          )}

          {aiLoading && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          )}

          {!aiLoading && aiResult && (
            <div className="space-y-3">
              {aiResult.weeklyActions.map((action, i) => (
                <div key={i} className={`border-l-4 rounded-r-xl p-4 ${priorityColors[action.priority]}`}>
                  <div className="flex items-start gap-3">
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
              <p className="text-sm mb-3">企業・ES・面接を登録するとAIがアドバイスします</p>
              <Button size="sm" onClick={fetchAiAdvice}>AIアドバイスを取得</Button>
            </div>
          )}
        </div>

        {/* サイドパネル */}
        <div className="space-y-6">
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

      {/* プロフィール編集モーダル */}
      <Modal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} title="プロフィール編集" size="lg">
        <ProfileForm
          initialData={profile ?? undefined}
          onSubmit={async (data) => {
            await saveProfile(data);
            setIsProfileOpen(false);
            fetchAiAdvice();
          }}
        />
      </Modal>
    </div>
  );
}
