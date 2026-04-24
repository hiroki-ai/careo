"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { useCompanies } from "@/hooks/useCompanies";
import { useEs } from "@/hooks/useEs";
import { useInterviews } from "@/hooks/useInterviews";
import { useEvents } from "@/hooks/useEvents";
import { useProfile } from "@/hooks/useProfile";
import { useActionItems } from "@/hooks/useActionItems";
import { useToast } from "@/components/ui/Toast";
import { useDeadlineNotifications } from "@/hooks/useDeadlineNotifications";
import { Button } from "@/components/ui/Button";
import { InsightsWidget } from "@/components/dashboard/InsightsWidget";
import { PostOfferWidget } from "@/components/dashboard/PostOfferWidget";
import { AdSlot } from "@/components/ads/AdSlot";
import { UpgradeNudge } from "@/components/ads/UpgradeNudge";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { createClient } from "@/lib/supabase/client";
import { daysUntil } from "@/lib/utils";
import { COMPANY_STATUS_ORDER, COMPANY_STATUS_LABELS, JOB_SEARCH_STAGE_LABELS, CompanyStatus } from "@/types";
import { TutorialModal } from "@/components/dashboard/TutorialModal";
import { ReviewPromptModal } from "@/components/dashboard/ReviewPromptModal";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "おはようございます";
  if (h >= 12 && h < 18) return "こんにちは";
  return "お疲れ様です";
}

interface NextActionResult {
  summary: string;
  weeklyActions: { priority: "high" | "medium" | "low"; action: string; reason: string }[];
}

const priorityColors = {
  high: "bg-red-50",
  medium: "bg-amber-50",
  low: "bg-blue-50/60",
};
const priorityAccent = {
  high: "bg-red-500",
  medium: "bg-amber-400",
  low: "bg-blue-400",
};
const priorityPill = {
  high: "bg-red-100 text-red-600",
  medium: "bg-amber-100 text-amber-600",
  low: "bg-blue-100 text-blue-500",
};
const priorityLabels = { high: "緊急", medium: "推奨", low: "情報" };

const EVENT_TYPE_BADGE: Record<string, string> = {
  ES: "bg-[#00c896]/10 text-[#00a87e]",
  面接: "bg-purple-100 text-purple-700",
  説明会: "bg-orange-100 text-orange-700",
  インターン: "bg-green-100 text-green-700",
  セミナー: "bg-indigo-100 text-indigo-700",
  その他: "bg-gray-100 text-gray-600",
};

// Funnel stage config
const FUNNEL_STAGES: { key: CompanyStatus | CompanyStatus[]; label: string; color: string }[] = [
  { key: "WISHLIST", label: "気になる", color: "#94a3b8" },
  { key: ["APPLIED", "INTERN_APPLYING"], label: "応募", color: "#60a5fa" },
  { key: ["DOCUMENT", "INTERN_DOCUMENT"], label: "書類", color: "#818cf8" },
  { key: ["INTERVIEW_1", "INTERN_INTERVIEW_1"], label: "1次面接", color: "#a78bfa" },
  { key: ["INTERVIEW_2", "INTERN_INTERVIEW_2"], label: "2次面接", color: "#c084fc" },
  { key: ["FINAL", "INTERN_FINAL"], label: "最終", color: "#f472b6" },
  { key: "OFFERED", label: "内定", color: "#00c896" },
];

// Stat card icon components
function BuildingIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
function ClockIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
function TrophyIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
    </svg>
  );
}

function formatRelativeDate(dateStr: string): string {
  const d = daysUntil(dateStr);
  if (d === 0) return "今日";
  if (d === 1) return "明日";
  if (d < 0) return `${Math.abs(d)}日前`;
  return `${d}日後`;
}

export function DashboardContent() {
  const { companies } = useCompanies();
  const { esList } = useEs();
  const { interviews } = useInterviews();
  const { events } = useEvents();
  const { profile } = useProfile();
  const { pendingItems, completedItems, loading: itemsLoading, replaceItems, toggleItem } = useActionItems();
  const { showToast } = useToast();
  const router = useRouter();
  const [aiSummary, setAiSummary] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const hasFetched = useRef(false);

  const statusCounts = COMPANY_STATUS_ORDER.reduce((acc, s) => {
    acc[s] = companies.filter((c) => c.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  // Calendar events
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
    ...events
      .filter((e) => e.status === "upcoming")
      .map((e) => ({
        id: e.id,
        date: e.scheduledAt,
        type: e.eventType,
        title: `${e.companyName} ${e.eventType}`,
        link: `/events`,
      })),
  ];

  const upcomingDeadlines = calendarEvents
    .map(e => ({ ...e, days: daysUntil(e.date) }))
    .filter(d => d.days >= 0 && d.days <= 14)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);

  useDeadlineNotifications(calendarEvents.filter(e => {
    const d = daysUntil(e.date);
    return d >= 0 && d <= 3;
  }));

  const esListSlim = esList.map(({ questions: _q, ...rest }) => rest);
  const companiesSlim = companies.map(({ name, status, industry, is_intern_offer }) => ({ name, status, industry, is_intern_offer }));
  const interviewsSlim = interviews.map(({ questions: _q, ...rest }) => rest);

  const fetchAI = async (url: string, body: unknown, retries = 1): Promise<Record<string, unknown> | null> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) await new Promise(r => setTimeout(r, 2000));
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        // 制限超過（402）は特別扱い: アップグレード誘導のトーストを表示
        if (res.status === 402) {
          const data = await res.json().catch(() => ({}));
          showToast(
            data.error ?? "今月の無料枠を使い切りました",
            "warning",
            { label: "アップグレード", onClick: () => router.push("/upgrade") },
            10000,
          );
          return { limitExceeded: true };
        }
        const text = await res.text();
        if (!text) continue;
        return JSON.parse(text);
      } catch {
        if (attempt === retries) return null;
      }
    }
    return null;
  };

  const fetchAiAdvice = async (completed?: string[]) => {
    setAiLoading(true);
    try {
      const completedActions = completed ?? completedItems.map(i => i.action);
      // オンボーディングで選んだ初回悩みを初回fetch時のみ反映
      let initialWorry: string | null = null;
      try {
        initialWorry = localStorage.getItem("careo_initial_worry");
      } catch { /* ignore */ }
      const data = await fetchAI("/api/ai/next-action", {
        companies: companiesSlim, esList: esListSlim, interviews: interviewsSlim, profile, completedActions,
        initialWorry,
      }) as NextActionResult | null;
      // 使ったら消す（以降のfetchでは影響しない）
      if (initialWorry) {
        try { localStorage.removeItem("careo_initial_worry"); } catch { /* ignore */ }
      }
      if (!data) { showToast("AIアドバイスの取得に失敗しました", "error"); return; }
      if ("limitExceeded" in data) return; // 402: 既にアップグレード誘導トースト表示済み
      if (!("error" in data)) {
        setAiSummary(data.summary ?? "");
        await replaceItems(data.weeklyActions);
      } else {
        const errMsg = (data as { error: string }).error;
        showToast(errMsg.includes("多すぎ") ? errMsg : "AIアドバイスの取得に失敗しました", "error");
      }
    } finally {
      setAiLoading(false);
    }
  };

  // 初回ログイン時に紹介コードがあれば特典を付与
  useEffect(() => {
    let code: string | null = null;
    try { code = localStorage.getItem("careo_referral_code"); } catch { /* ignore */ }
    if (!code) return;
    // 即座にlocalStorageから削除して二重実行を防ぐ
    try { localStorage.removeItem("careo_referral_code"); } catch { /* ignore */ }
    void fetch("/api/referral/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).then(async (res) => {
      const data = await res.json().catch(() => ({}));
      if (data.success) {
        showToast(data.message ?? "Proプラン30日分が付与されました！🎉", "success", undefined, 10000);
      } else if (data.error && !data.error.includes("すでに")) {
        showToast(data.error, "info");
      }
    }).catch(() => { /* silent */ });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (itemsLoading) return;
    if (hasFetched.current) return;
    hasFetched.current = true;
    const today = new Date().toDateString();
    const lastFetch = localStorage.getItem("careo_last_action_fetch");
    const isStale = lastFetch !== today;
    if (pendingItems.length === 0 && completedItems.length === 0) {
      localStorage.setItem("careo_last_action_fetch", today);
      fetchAiAdvice([]);
    } else if (isStale) {
      localStorage.setItem("careo_last_action_fetch", today);
      fetchAiAdvice(completedItems.map(i => i.action));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsLoading]);

  const handleToggle = async (id: string, isCompleted: boolean) => {
    await toggleItem(id, isCompleted);
    if (isCompleted) {
      const newCompleted = [...completedItems.map(i => i.action)];
      const toggled = pendingItems.find(i => i.id === id);
      if (toggled) newCompleted.push(toggled.action);
      await fetchAiAdvice(newCompleted);
    }
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  };

  const hasItems = pendingItems.length > 0 || completedItems.length > 0;

  // --- Stat cards ---
  const interviewsThisWeek = interviews.filter(i => {
    const d = daysUntil(i.scheduledAt);
    return i.result === "PENDING" && d >= 0 && d <= 7;
  });
  const nextInterview = interviewsThisWeek.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())[0];

  const esDeadlineSoon = esList.filter(e => {
    if (!e.deadline || e.status !== "DRAFT") return false;
    const d = daysUntil(e.deadline);
    return d >= 0 && d <= 7;
  });
  const hasUrgentES = esDeadlineSoon.some(e => daysUntil(e.deadline!) <= 2);

  const offeredCount = statusCounts["OFFERED"] ?? 0;

  const statCards = [
    {
      label: "応募企業数",
      value: companies.length,
      sub: `${companies.filter(c => !["WISHLIST", "REJECTED", "OFFERED"].includes(c.status)).length}社 選考中`,
      icon: <BuildingIcon />,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-100",
      link: "/companies",
    },
    {
      label: "今週の面接",
      value: interviewsThisWeek.length,
      sub: nextInterview ? `次: ${formatRelativeDate(nextInterview.scheduledAt)}` : "予定なし",
      icon: <CalendarIcon />,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-100",
      link: "/interviews",
    },
    {
      label: "ES締切",
      value: esDeadlineSoon.length,
      sub: esDeadlineSoon.length > 0 ? `最短: ${formatRelativeDate(esDeadlineSoon.sort((a, b) => daysUntil(a.deadline!) - daysUntil(b.deadline!))[0].deadline!)}` : "締切なし",
      icon: <ClockIcon />,
      color: hasUrgentES ? "text-red-500" : "text-amber-500",
      bgColor: hasUrgentES ? "bg-red-50" : "bg-amber-50",
      borderColor: hasUrgentES ? "border-red-200" : "border-amber-100",
      link: "/deadlines",
      urgent: hasUrgentES,
    },
    {
      label: "内定",
      value: offeredCount,
      sub: offeredCount > 0 ? "おめでとう!" : "まだなし",
      icon: <TrophyIcon />,
      color: offeredCount > 0 ? "text-[#00c896]" : "text-gray-400",
      bgColor: offeredCount > 0 ? "bg-[#00c896]/5" : "bg-gray-50",
      borderColor: offeredCount > 0 ? "border-[#00c896]/20" : "border-gray-100",
      link: "/companies",
    },
  ];

  // --- Selection funnel data ---
  const funnelData = useMemo(() => {
    const max = Math.max(companies.length, 1);
    return FUNNEL_STAGES.map((stage) => {
      const keys = Array.isArray(stage.key) ? stage.key : [stage.key];
      const count = companies.filter(c => keys.includes(c.status)).length;
      return {
        name: stage.label,
        count,
        color: stage.color,
        pct: Math.round((count / max) * 100),
      };
    });
  }, [companies]);

  // --- Recent activity ---
  const recentActivity = useMemo(() => {
    const items: { id: string; text: string; time: string; icon: string; color: string }[] = [];

    companies.slice(0, 3).forEach(c => {
      items.push({
        id: `c-${c.id}`,
        text: `${c.name} を${COMPANY_STATUS_LABELS[c.status]}に更新`,
        time: c.updatedAt,
        icon: "🏢",
        color: "bg-blue-100",
      });
    });

    esList.filter(e => e.status === "SUBMITTED").slice(0, 2).forEach(e => {
      const company = companies.find(c => c.id === e.companyId);
      items.push({
        id: `e-${e.id}`,
        text: `${company?.name ?? ""} ESを提出`,
        time: e.updatedAt,
        icon: "📄",
        color: "bg-green-100",
      });
    });

    interviews.slice(0, 2).forEach(i => {
      const company = companies.find(c => c.id === i.companyId);
      items.push({
        id: `i-${i.id}`,
        text: `${company?.name ?? ""} ${i.round}次面接`,
        time: i.updatedAt,
        icon: "🎙️",
        color: "bg-purple-100",
      });
    });

    return items
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 5);
  }, [companies, esList, interviews]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06 },
    },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/30 dark:from-[#0f1117] dark:via-[#0f1117] dark:to-[#0f1117] min-h-screen">
      <TutorialModal />
      <ReviewPromptModal />

      {/* ========== MOBILE LAYOUT ========== */}
      <div className="md:hidden px-4 pt-5 pb-32">
        {/* Greeting */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mb-1">{getGreeting()}</p>
            <h1 className="text-[22px] font-black text-gray-900 dark:text-gray-100 tracking-tight leading-tight">
              {profile?.username ? `${profile.username}の就活` : "今日の就活"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const evt = new KeyboardEvent("keydown", { key: "k", metaKey: true });
                document.dispatchEvent(evt);
              }}
              className="w-10 h-10 bg-white dark:bg-[#1a1d27] rounded-2xl flex items-center justify-center shadow-sm active:scale-95 transition-transform border border-gray-100/80 dark:border-[#2a2d37]"
              title="検索 (Cmd+K)"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <Link href="/settings">
              <div className="w-10 h-10 bg-white dark:bg-[#1a1d27] rounded-2xl flex items-center justify-center shadow-sm active:scale-95 transition-transform border border-gray-100/80 dark:border-[#2a2d37]">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
            </Link>
          </div>
        </div>

        {/* Top Summary Cards - horizontal scroll */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide mb-6 -mx-4 px-4"
        >
          {statCards.map((card) => (
            <motion.div key={card.label} variants={itemVariants}>
              <Link href={card.link} className="shrink-0">
                <div className={`${card.bgColor} border ${card.borderColor} rounded-2xl px-4 py-3 min-w-[120px] active:scale-95 transition-transform ${card.urgent ? "ring-1 ring-red-300 animate-pulse" : ""}`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`${card.color} opacity-60`}>{card.icon}</span>
                  </div>
                  <p className={`text-2xl font-black ${card.color} leading-none`}>{card.value}</p>
                  <p className="text-[11px] text-gray-500 font-medium mt-1.5 truncate">{card.label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 truncate">{card.sub}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Next Actions */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-[#00c896] to-[#00a87e] rounded-full" />
              <h2 className="text-[15px] font-bold text-gray-900 dark:text-gray-100">今週やること</h2>
            </div>
            <button
              type="button"
              onClick={() => fetchAiAdvice()}
              disabled={aiLoading}
              className="text-xs text-gray-400 disabled:opacity-40 active:text-gray-600 transition-colors font-medium"
            >
              {aiLoading ? "分析中..." : "更新"}
            </button>
          </div>

          {(aiLoading || itemsLoading) && (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <SkeletonCard key={i} variant="deadline" />
              ))}
            </div>
          )}

          {!aiLoading && !itemsLoading && hasItems && (
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-2">
              {pendingItems.map((item) => (
                <motion.div
                  key={item.id}
                  variants={itemVariants}
                  className={`relative flex items-start gap-3 rounded-2xl p-4 ${priorityColors[item.priority]}`}
                >
                  <div className={`absolute top-0 left-4 right-4 h-[2px] rounded-full ${priorityAccent[item.priority]}`} />
                  <input
                    type="checkbox"
                    checked={false}
                    title={`完了: ${item.action}`}
                    onChange={() => handleToggle(item.id, true)}
                    className="mt-0.5 w-5 h-5 rounded-md border-gray-300 accent-[#00c896] cursor-pointer shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 leading-tight mb-0.5">{item.action}</p>
                    <p className="text-xs text-gray-500 leading-relaxed">{item.reason}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityPill[item.priority]}`}>
                      {priorityLabels[item.priority]}
                    </span>
                    {item.link && (
                      item.link.external
                        ? <a href={item.link.href} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-blue-500 whitespace-nowrap">{item.link.label} →</a>
                        : <Link href={item.link.href} className="text-[10px] font-bold text-[#00a87e] whitespace-nowrap">{item.link.label} →</Link>
                    )}
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {!aiLoading && !itemsLoading && !hasItems && (
            <div className="text-center py-10 rounded-3xl bg-gray-50">
              <p className="text-xs text-gray-400 mb-3 font-medium">プロフィールを設定するとAIがアドバイスします</p>
              <Button size="sm" onClick={() => fetchAiAdvice([])}>AIアドバイスを取得</Button>
            </div>
          )}
        </div>

        {/* Upcoming deadlines (Stripe style) */}
        {upcomingDeadlines.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-orange-400 to-red-400 rounded-full" />
                <h2 className="text-[15px] font-bold text-gray-900 dark:text-gray-100">直近の締切</h2>
              </div>
              <Link href="/deadlines" className="text-xs font-semibold text-[#00c896]">すべて</Link>
            </div>
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-1.5">
              {upcomingDeadlines.map((d) => (
                <motion.div key={`${d.type}-${d.id}`} variants={itemVariants}>
                  <Link href={d.link}>
                    <div className={`flex items-center gap-3 rounded-xl px-3.5 py-3 active:scale-[0.98] transition-transform ${d.days <= 2 ? "bg-red-50 border border-red-100" : d.days <= 5 ? "bg-amber-50/60 border border-amber-100" : "bg-gray-50 border border-gray-100"}`}>
                      <div className={`w-1 h-8 rounded-full shrink-0 ${d.days <= 2 ? "bg-red-500" : d.days <= 5 ? "bg-amber-400" : "bg-gray-300"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900 truncate">{d.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${EVENT_TYPE_BADGE[d.type] ?? "bg-gray-100 text-gray-600"}`}>
                            {d.type}
                          </span>
                          <span className="text-[10px] text-gray-400">{new Date(d.date).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}</span>
                        </div>
                      </div>
                      <span className={`text-xs font-black shrink-0 ${d.days === 0 ? "text-red-600" : d.days <= 2 ? "text-red-500" : d.days <= 5 ? "text-amber-500" : "text-gray-400"}`}>
                        {formatRelativeDate(d.date)}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </div>

      {/* ========== PC LAYOUT ========== */}
      <div className="hidden md:block px-6 pt-6 pb-8">

        {/* PC Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-gray-400 font-medium mb-1">{getGreeting()}</p>
            <h1 className="text-[26px] font-black text-gray-900 dark:text-gray-100 tracking-tight leading-tight">
              {profile?.username ? `${profile.username}の就活` : "ダッシュボード"}
            </h1>
            {profile && (
              <p className="text-xs text-gray-400 mt-1 font-medium">
                {profile.university ? `${profile.university} · ` : ""}{profile.grade} ／ {JOB_SEARCH_STAGE_LABELS[profile.jobSearchStage]}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Cmd+K trigger */}
            <button
              type="button"
              onClick={() => {
                const evt = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
                document.dispatchEvent(evt);
              }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#2a2d37] bg-white dark:bg-[#1a1d27] hover:bg-gray-50 dark:hover:bg-[#2a2d37] text-gray-400 text-sm transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="text-xs">検索...</span>
              <kbd className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 font-mono text-[10px]">Ctrl K</kbd>
            </button>
            <Link href="/settings">
              <button type="button" className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                設定
              </button>
            </Link>
            <button type="button" onClick={handleLogout} className="px-3.5 py-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 text-sm font-medium transition-colors">
              ログアウト
            </button>
          </div>
        </div>

        {/* Top Summary Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-4 gap-3 mb-6"
        >
          {statCards.map((card) => (
            <motion.div key={card.label} variants={itemVariants}>
              <Link href={card.link}>
                <div className={`${card.bgColor} border ${card.borderColor} rounded-2xl p-5 hover:scale-[1.02] transition-all cursor-pointer group ${card.urgent ? "ring-1 ring-red-300" : ""}`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-semibold text-gray-500">{card.label}</p>
                    <div className={`w-9 h-9 rounded-xl ${card.bgColor} flex items-center justify-center ${card.color} opacity-50 group-hover:opacity-100 transition-opacity`}>
                      {card.icon}
                    </div>
                  </div>
                  <p className={`text-3xl font-black ${card.color} leading-none`}>{card.value}</p>
                  <p className="text-[11px] text-gray-400 mt-2 font-medium">{card.sub}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        {/* Selection Funnel */}
        {companies.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6 bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-100 dark:border-[#2a2d37] p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-blue-400 to-purple-400 rounded-full" />
                <h2 className="text-[15px] font-bold text-gray-900 dark:text-gray-100">選考ファネル</h2>
              </div>
              <Link href="/companies" className="text-xs font-semibold text-[#00c896] hover:opacity-70 transition-opacity">詳細 →</Link>
            </div>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelData} layout="vertical" margin={{ left: 50, right: 30, top: 5, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "#6b7280", fontWeight: 600 }}
                    width={50}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", fontSize: 12, padding: "8px 12px" }}
                    formatter={(value) => [`${value}社`, ""]}
                    cursor={{ fill: "rgba(0,0,0,0.03)" }}
                  />
                  <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                    {funnelData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {/* Drop-off percentages */}
            <div className="flex items-center justify-between mt-2 px-1">
              {funnelData.map((stage, i) => (
                <div key={stage.name} className="text-center">
                  <p className="text-[10px] font-bold" style={{ color: stage.color }}>{stage.count}</p>
                  {i > 0 && funnelData[i - 1].count > 0 && (
                    <p className="text-[9px] text-gray-400">
                      {Math.round((stage.count / funnelData[i - 1].count) * 100)}%
                    </p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* 12-column grid: Actions + Deadlines + Activity */}
        <div className="grid grid-cols-12 gap-5">

          {/* Left: Next Action */}
          <div className="col-span-7">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-[#00c896] to-[#00a87e] rounded-full" />
                <h2 className="text-[15px] font-bold text-gray-900 dark:text-gray-100">今週やること</h2>
              </div>
              <button
                type="button"
                onClick={() => fetchAiAdvice()}
                disabled={aiLoading}
                className="text-xs text-gray-400 hover:text-gray-600 disabled:opacity-40 transition-colors font-medium"
              >
                {aiLoading ? "分析中..." : "再分析"}
              </button>
            </div>
            {aiSummary && (
              <p className="text-xs text-gray-400 mb-2 px-0.5">{aiSummary}</p>
            )}

            {(aiLoading || itemsLoading) && (
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <SkeletonCard key={i} variant="deadline" />
                ))}
              </div>
            )}

            {!aiLoading && !itemsLoading && hasItems && (
              <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-2">
                {pendingItems.map((item) => (
                  <motion.div
                    key={item.id}
                    variants={itemVariants}
                    className={`relative flex items-start gap-3 rounded-2xl p-3.5 ${priorityColors[item.priority]} hover:shadow-sm transition-shadow`}
                  >
                    <div className={`absolute top-0 left-4 right-4 h-[2px] rounded-full ${priorityAccent[item.priority]}`} />
                    <input
                      type="checkbox"
                      checked={false}
                      title={`完了: ${item.action}`}
                      onChange={() => handleToggle(item.id, true)}
                      className="mt-0.5 w-4 h-4 rounded-md border-gray-300 accent-[#00c896] cursor-pointer shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 leading-tight mb-0.5">{item.action}</p>
                      <p className="text-xs text-gray-500">{item.reason}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${priorityPill[item.priority]}`}>
                        {priorityLabels[item.priority]}
                      </span>
                      {item.link && (
                        item.link.external
                          ? <a href={item.link.href} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-blue-500 hover:underline whitespace-nowrap">{item.link.label} →</a>
                          : <Link href={item.link.href} className="text-[10px] font-bold text-[#00a87e] hover:underline whitespace-nowrap">{item.link.label} →</Link>
                      )}
                    </div>
                  </motion.div>
                ))}
                {completedItems.length > 0 && (
                  <div className="mt-2">
                    <p className="text-[10px] text-gray-400 mb-1.5 font-semibold uppercase tracking-wide">完了済み</p>
                    {completedItems.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-2.5 bg-gray-50 rounded-xl px-3.5 py-2.5 mb-1.5 cursor-pointer opacity-55 hover:opacity-70 transition-opacity"
                      >
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={() => toggleItem(item.id, false)}
                          className="w-4 h-4 rounded-md accent-[#00c896] cursor-pointer shrink-0"
                        />
                        <p className="text-xs text-gray-500 line-through">{item.action}</p>
                      </label>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {!aiLoading && !itemsLoading && !hasItems && (
              <div className="text-center py-10 rounded-3xl bg-gray-50">
                <p className="text-xs text-gray-400 mb-3 font-medium">プロフィールを設定するとAIがアドバイスします</p>
                <Button size="sm" onClick={() => fetchAiAdvice([])}>AIアドバイスを取得</Button>
              </div>
            )}
          </div>

          {/* Right column: Deadlines + Activity + Insights */}
          <div className="col-span-5 space-y-5">

            {/* Upcoming deadlines (Stripe style) */}
            <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-100 dark:border-[#2a2d37] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-5 bg-gradient-to-b from-orange-400 to-red-400 rounded-full" />
                  <h2 className="text-[15px] font-bold text-gray-900 dark:text-gray-100">締切</h2>
                </div>
                <Link href="/calendar" className="text-xs font-semibold text-[#00c896] hover:opacity-70 transition-opacity">カレンダー</Link>
              </div>
              {upcomingDeadlines.length > 0 ? (
                <div className="space-y-1.5">
                  {upcomingDeadlines.map((d) => (
                    <Link key={`${d.type}-${d.id}`} href={d.link}>
                      <div className={`flex items-center gap-3 rounded-xl px-3 py-2.5 hover:scale-[1.01] transition-transform ${d.days <= 2 ? "bg-red-50" : d.days <= 5 ? "bg-amber-50/50" : "bg-gray-50 hover:bg-gray-100"}`}>
                        <div className={`w-0.5 h-7 rounded-full shrink-0 ${d.days <= 2 ? "bg-red-500" : d.days <= 5 ? "bg-amber-400" : "bg-gray-300"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-gray-900 truncate">{d.title}</p>
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${EVENT_TYPE_BADGE[d.type] ?? "bg-gray-100 text-gray-600"}`}>
                            {d.type}
                          </span>
                        </div>
                        <span className={`text-[11px] font-black shrink-0 ${d.days === 0 ? "text-red-600" : d.days <= 2 ? "text-red-500" : d.days <= 5 ? "text-amber-500" : "text-gray-400"}`}>
                          {formatRelativeDate(d.date)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-400 font-medium">直近に締切はありません</p>
                </div>
              )}
            </div>

            {/* Recent activity timeline */}
            {recentActivity.length > 0 && (
              <div className="bg-white dark:bg-[#1a1d27] rounded-2xl border border-gray-100 dark:border-[#2a2d37] p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-1 h-5 bg-gradient-to-b from-gray-300 to-gray-400 rounded-full" />
                  <h2 className="text-[15px] font-bold text-gray-900 dark:text-gray-100">最近の活動</h2>
                </div>
                <div className="space-y-0">
                  {recentActivity.map((activity, i) => (
                    <div key={activity.id} className="flex items-start gap-3 py-2.5 relative">
                      {/* Timeline line */}
                      {i < recentActivity.length - 1 && (
                        <div className="absolute left-[15px] top-[36px] bottom-0 w-px bg-gray-100" />
                      )}
                      <div className={`w-8 h-8 rounded-full ${activity.color} flex items-center justify-center text-sm shrink-0 relative z-10`}>
                        {activity.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-700 truncate">{activity.text}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(activity.time).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights widget */}
            <InsightsWidget />
          </div>
        </div>
      </div>

      {/* Post-offer content */}
      {companies.filter(c => c.status === "OFFERED").length > 0 && (
        <div className="mt-3 px-4 md:px-5 pb-4">
          <PostOfferWidget offeredCompanies={companies.filter(c => c.status === "OFFERED")} />
        </div>
      )}

      {/* SNS共有カード */}
      {profile?.username && (
        <div className="px-4 md:px-5 pb-3">
          <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">🎨</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-gray-900 mb-0.5">就活ログをSNSで共有</p>
              <p className="text-[11px] text-gray-500">自分の就活記録を1枚の画像に、Xで投稿できる</p>
            </div>
            <div className="flex flex-col gap-1">
              <a
                href={`/api/og/summary?username=${profile.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-[#00c896]/10 text-[#00a87e] hover:bg-[#00c896]/20 transition-colors text-center whitespace-nowrap"
              >
                画像を見る
              </a>
              <button
                type="button"
                onClick={() => {
                  const imgUrl = `${window.location.origin}/api/og/summary?username=${profile.username}`;
                  const text = `私の就活の軌跡、Careoで可視化中 📊\n${imgUrl}`;
                  window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}`, "_blank");
                }}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-black text-white hover:opacity-80 transition-opacity whitespace-nowrap"
              >
                𝕏 で投稿
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 広告（Free ユーザーのみ、AdSense審査通過後に表示） */}
      <div className="px-4 md:px-5 pb-6">
        <AdSlot slotId={process.env.NEXT_PUBLIC_ADSENSE_SLOT_DASHBOARD} format="auto" />
        <UpgradeNudge message="広告非表示＋PDCA無制限のProプランで、就活を加速。" />
      </div>
    </div>
  );
}
