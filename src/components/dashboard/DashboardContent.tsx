"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCompanies } from "@/hooks/useCompanies";
import { useEs } from "@/hooks/useEs";
import { useInterviews } from "@/hooks/useInterviews";
import { useEvents } from "@/hooks/useEvents";
import { useProfile } from "@/hooks/useProfile";
import { useActionItems } from "@/hooks/useActionItems";
import { useChat } from "@/hooks/useChat";
import { useToast } from "@/components/ui/Toast";
import { useDeadlineNotifications } from "@/hooks/useDeadlineNotifications";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { InsightsWidget } from "@/components/dashboard/InsightsWidget";
import { PostOfferWidget } from "@/components/dashboard/PostOfferWidget";
import { createClient } from "@/lib/supabase/client";
import { daysUntil } from "@/lib/utils";
import { COMPANY_STATUS_ORDER, JOB_SEARCH_STAGE_LABELS, UserProfile } from "@/types";
import { useCoach } from "@/hooks/useCoach";
import { TutorialModal } from "@/components/dashboard/TutorialModal";
import { ReviewPromptModal } from "@/components/dashboard/ReviewPromptModal";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "おはようございます";
  if (h >= 12 && h < 18) return "こんにちは";
  return "お疲れ様です";
}

// 毎日のコーチCTA（チャット未実施の日は強調表示）
function DailyCoachBanner({ profile }: { profile: UserProfile | null }) {
  const [chatted, setChatted] = useState(true); // サーバーSSRで不一致しないようデフォルトtrue
  const [pdcaIssue, setPdcaIssue] = useState<string | null>(null);
  const { coachName } = useCoach();

  useEffect(() => {
    // Supabaseデータ優先、フォールバックはlocalStorage
    const lastChatDate = profile?.lastChatAt
      ? new Date(profile.lastChatAt).toDateString()
      : (() => { try { return localStorage.getItem("careo_last_chat_date") ?? ""; } catch { return ""; } })();
    setChatted(lastChatDate === new Date().toDateString());

    const pdca = profile?.lastPdca ?? (() => {
      try {
        const raw = localStorage.getItem("careo_last_pdca");
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed?.data ?? (parsed?.check ? parsed : null);
      } catch { return null; }
    })();
    if (pdca) {
      const issue = pdca?.check?.issues?.[0] ?? pdca?.act?.nextWeekFocus ?? null;
      setPdcaIssue(issue);
    }
  }, [profile?.lastChatAt, profile?.lastPdca]);

  const topic = pdcaIssue
    ? `「${pdcaIssue}」について一緒に考えよう`
    : !profile?.gakuchika
    ? `ガクチカを${coachName}コーチと一緒に整理しよう`
    : !profile?.careerAxis
    ? `就活の軸を${coachName}コーチと一緒に言語化しよう`
    : `今日の就活の進捗を${coachName}コーチに報告しよう`;

  if (chatted) return null; // 今日すでに話していれば非表示

  return (
    <Link href="/chat">
      <div className="mb-5 bg-gradient-to-br from-[#00c896] via-[#00b488] to-[#00a87e] rounded-3xl px-4 py-4 flex items-center gap-3 active:opacity-90 transition-opacity cursor-pointer coach-banner-shadow">
        <div className="w-11 h-11 bg-white/25 rounded-2xl flex items-center justify-center shrink-0 backdrop-blur-sm">
          <span className="text-white font-black text-base leading-none">{coachName[0]}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/80 text-[11px] font-semibold tracking-wide mb-0.5">今日の{coachName}コーチ</p>
          <p className="text-white font-bold text-sm truncate">{topic}</p>
        </div>
        <div className="shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
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
const priorityBadgeVariants: Record<string, "danger" | "warning" | "default"> = {
  high: "danger", medium: "warning", low: "default",
};

const EVENT_TYPE_BADGE: Record<string, string> = {
  ES: "bg-[#00c896]/10 text-[#00a87e]",
  面接: "bg-purple-100 text-purple-700",
  説明会: "bg-orange-100 text-orange-700",
  インターン: "bg-green-100 text-green-700",
  セミナー: "bg-indigo-100 text-indigo-700",
  その他: "bg-gray-100 text-gray-600",
};

export function DashboardContent() {
  const { companies } = useCompanies();
  const { esList } = useEs();
  const { interviews } = useInterviews();
  const { events } = useEvents();
  const { profile } = useProfile();
  const { pendingItems, completedItems, loading: itemsLoading, replaceItems, toggleItem } = useActionItems();
  const { recentUserMessages } = useChat();
  const { showToast } = useToast();
  const router = useRouter();
  const [aiSummary, setAiSummary] = useState<string>("");
  const [aiLoading, setAiLoading] = useState(false);
  const hasFetched = useRef(false);

  const statusCounts = COMPANY_STATUS_ORDER.reduce((acc, s) => {
    acc[s] = companies.filter((c) => c.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  // 締切・面接・説明会・インターンイベント
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

  // 直近7日の締切
  const upcomingDeadlines = calendarEvents
    .map(e => ({ ...e, days: daysUntil(e.date) }))
    .filter(d => d.days >= 0 && d.days <= 7)
    .sort((a, b) => a.days - b.days)
    .slice(0, 3);

  useDeadlineNotifications(calendarEvents.filter(e => {
    const d = daysUntil(e.date);
    return d >= 0 && d <= 3;
  }));

  // ESの設問データを除いた軽量版（AI分析には件数だけ必要）
  const esListSlim = esList.map(({ questions: _q, ...rest }) => rest);
  // AI送信用の軽量版（不要フィールドを除外してペイロードを削減）
  const companiesSlim = companies.map(({ name, status, industry, is_intern_offer }) => ({ name, status, industry, is_intern_offer }));
  const interviewsSlim = interviews.map(({ questions: _q, ...rest }) => rest);

  // リトライ付きfetch（失敗時に1回自動リトライ）
  const fetchAI = async (url: string, body: unknown, retries = 1): Promise<Record<string, unknown> | null> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) await new Promise(r => setTimeout(r, 2000));
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
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
      const data = await fetchAI("/api/ai/next-action", {
        companies: companiesSlim, esList: esListSlim, interviews: interviewsSlim, profile, completedActions,
        recentChatMessages: recentUserMessages,
      }) as NextActionResult | null;
      if (!data) { showToast("AIアドバイスの取得に失敗しました", "error"); return; }
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

  // データが揃ったら自動フェッチ：
  // ① アイテムが一件もない場合
  // ② 最後の自動フェッチが今日でない場合（毎日リフレッシュ）
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

  // ステータスチップのデータ（モバイル・PC共通）
  const statusItems = [
    { label: "選考中", icon: "🏃", count: companies.filter(c => !["OFFERED","REJECTED","WISHLIST"].includes(c.status)).length, gradient: "from-teal-500 to-emerald-500", bg: "bg-gradient-to-br from-teal-50/60 to-emerald-50/40", border: "border-teal-100", link: "/companies" },
    { label: "内定", icon: "🎉", count: statusCounts["OFFERED"] ?? 0, gradient: "from-emerald-500 to-green-500", bg: "bg-gradient-to-br from-emerald-50 to-green-50", border: "border-emerald-100", link: "/companies" },
    { label: "ES提出待ち", icon: "✍️", count: esList.filter(e => e.status === "DRAFT").length, gradient: "from-amber-500 to-orange-500", bg: "bg-gradient-to-br from-amber-50 to-orange-50", border: "border-amber-100", link: "/es" },
    { label: "気になる", icon: "🔖", count: statusCounts["WISHLIST"] ?? 0, gradient: "from-gray-400 to-slate-500", bg: "bg-gradient-to-br from-gray-50 to-slate-50", border: "border-gray-200", link: "/companies" },
  ];

  return (
    <div className="bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      <TutorialModal />
      <ReviewPromptModal />

      {/* ========== モバイルレイアウト ========== */}
      <div className="md:hidden px-4 pt-5 pb-28">

        {/* グリーティングヘッダー */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-xs text-gray-400 font-medium mb-1">{getGreeting()}</p>
            <h1 className="text-[22px] font-black text-gray-900 tracking-tight leading-tight">
              {profile?.username ? `${profile.username}の就活` : "今日の就活"}
            </h1>
          </div>
          <Link href="/settings">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm active:scale-95 transition-transform border border-gray-100/80">
              <svg className="w-4.5 h-4.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </Link>
        </div>

        {/* ステータスチップ — 横スクロール */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide mb-6 -mx-4 px-4">
          {statusItems.map((item) => (
            <Link key={item.label} href={item.link} className="shrink-0">
              <div className={`${item.bg} border ${item.border} rounded-2xl px-4 py-3 min-w-[88px] active:scale-95 transition-transform`}>
                <p className={`text-2xl font-black bg-gradient-to-br ${item.gradient} bg-clip-text text-transparent leading-none`}>
                  {item.count}
                </p>
                <p className="text-[11px] text-gray-500 font-semibold mt-1">{item.label}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* コーチCTA */}
        <DailyCoachBanner profile={profile} />

        {/* 今週やること（Next Action）— 最重要 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-[#00c896] to-[#00a87e] rounded-full" />
              <h2 className="text-[15px] font-bold text-gray-900">今週やること</h2>
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
                <div key={i} className="h-[68px] bg-gray-100/80 rounded-2xl animate-pulse" />
              ))}
            </div>
          )}

          {!aiLoading && !itemsLoading && hasItems && (
            <div className="space-y-2">
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  className={`relative flex items-start gap-3 rounded-2xl p-4 ${priorityColors[item.priority]}`}
                >
                  {/* 上端カラーライン */}
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
                </div>
              ))}
            </div>
          )}

          {!aiLoading && !itemsLoading && !hasItems && (
            <div className="text-center py-10 rounded-3xl bg-gray-50">
              <p className="text-xs text-gray-400 mb-3 font-medium">プロフィールを設定するとAIがアドバイスします</p>
              <Button size="sm" onClick={() => fetchAiAdvice([])}>AIアドバイスを取得</Button>
            </div>
          )}
        </div>

        {/* 直近の締切 */}
        {upcomingDeadlines.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-1 h-5 bg-gradient-to-b from-orange-400 to-red-400 rounded-full" />
                <h2 className="text-[15px] font-bold text-gray-900">直近の締切</h2>
              </div>
              <Link href="/deadlines" className="text-xs font-semibold text-[#00c896]">すべて</Link>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
              {upcomingDeadlines.map((d) => (
                <Link key={`${d.type}-${d.id}`} href={d.link} className="shrink-0">
                  <div className={`flex flex-col gap-1.5 rounded-2xl px-3.5 py-3 min-w-[140px] active:scale-95 transition-transform ${d.days <= 3 ? "bg-red-50" : "bg-white shadow-sm border border-gray-100/80"}`}>
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${EVENT_TYPE_BADGE[d.type] ?? "bg-gray-100 text-gray-600"}`}>
                        {d.type}
                      </span>
                      <span className={`text-[11px] font-black ${d.days === 0 ? "text-red-600" : d.days <= 3 ? "text-orange-500" : "text-gray-400"}`}>
                        {d.days === 0 ? "今日" : `${d.days}日`}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-900 leading-snug line-clamp-2">{d.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ========== PCレイアウト（変更なし） ========== */}
      <div className="hidden md:block p-5">

        {/* PCヘッダー */}
        <div className="flex items-center justify-between mb-2 md:mb-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
            {profile && (
              <p className="text-xs text-gray-500 mt-0.5">
                {profile.university ? `${profile.university} · ` : ""}{profile.grade} ／ {JOB_SEARCH_STAGE_LABELS[profile.jobSearchStage]}
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

        {/* PCステータスグリッド */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {statusItems.map((item) => (
            <Link key={item.label} href={item.link}>
              <div className={`${item.bg} border ${item.border} rounded-2xl p-3 shadow-sm active:scale-[0.97] transition-transform`}>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium text-gray-500">{item.label}</p>
                  <span className="text-base">{item.icon}</span>
                </div>
                <p className={`text-2xl font-bold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent leading-none`}>{item.count}</p>
                <p className="text-[10px] text-gray-400 mt-1">社 / 件</p>
              </div>
            </Link>
          ))}
        </div>

        {/* PCコーチCTA */}
        <DailyCoachBanner profile={profile} />

        {/* PC 直近の締切（モバイルは上で表示済み） */}
        {upcomingDeadlines.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-gray-900 text-sm">📅 直近の締切</h2>
              <Link href="/deadlines" className="text-xs text-[#00c896] hover:underline">すべて →</Link>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {upcomingDeadlines.map((d) => (
                <Link key={`${d.type}-${d.id}`} href={d.link} className="shrink-0">
                  <div className={`flex items-center gap-2 bg-white rounded-xl border px-3 py-2.5 ${d.days <= 3 ? "border-red-200 bg-red-50/30" : "border-gray-100"}`}>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${EVENT_TYPE_BADGE[d.type] ?? "bg-gray-100 text-gray-600"}`}>
                      {d.type}
                    </span>
                    <p className="text-xs font-medium text-gray-900 max-w-[110px] truncate">{d.title}</p>
                    <span className={`text-xs font-bold shrink-0 ${d.days === 0 ? "text-red-600" : d.days <= 3 ? "text-orange-500" : "text-gray-400"}`}>
                      {d.days === 0 ? "今日！" : `${d.days}日`}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* PC 12カラムグリッド */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4">

          {/* Left: Next Action */}
          <div className="md:col-span-7">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-gray-900 text-base flex items-center gap-1.5">🎯 <span>Next Action</span></h2>
              <Button variant="ghost" size="sm" onClick={() => fetchAiAdvice()} disabled={aiLoading}>
                {aiLoading ? "分析中..." : "再分析"}
              </Button>
            </div>
            {aiSummary && (
              <p className="text-xs text-gray-400 mb-1.5 px-1">{aiSummary}</p>
            )}

            {(aiLoading || itemsLoading) && (
              <div className="space-y-1.5">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-11 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            )}

            {!aiLoading && !itemsLoading && hasItems && (
              <div className="space-y-1.5">
                {pendingItems.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-start gap-3 border-l-4 rounded-r-xl p-3 ${priorityColors[item.priority]}`}
                  >
                    <input
                      type="checkbox"
                      checked={false}
                      title={`完了: ${item.action}`}
                      onChange={() => handleToggle(item.id, true)}
                      className="mt-0.5 w-5 h-5 rounded border-gray-400 accent-[#00c896] cursor-pointer shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <Badge variant={priorityBadgeVariants[item.priority]}>
                          {priorityLabels[item.priority]}
                        </Badge>
                        <p className="text-sm font-semibold text-gray-900 leading-tight">{item.action}</p>
                      </div>
                      <p className="text-xs text-gray-500">{item.reason}</p>
                    </div>
                    {item.link && (
                      item.link.external
                        ? <a href={item.link.href} target="_blank" rel="noopener noreferrer" className="shrink-0 ml-1 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-1 rounded-lg transition-colors whitespace-nowrap">{item.link.label}</a>
                        : <Link href={item.link.href} className="shrink-0 ml-1 text-[10px] font-bold text-[#00a87e] bg-[#00c896]/10 hover:bg-[#00c896]/20 border border-[#00c896]/30 px-2 py-1 rounded-lg transition-colors whitespace-nowrap">{item.link.label}</Link>
                    )}
                  </div>
                ))}
                {completedItems.length > 0 && (
                  <div className="mt-1">
                    <p className="text-[10px] text-gray-400 mb-1 px-1">完了済み</p>
                    {completedItems.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-2.5 border-l-4 border-l-gray-200 bg-gray-50 rounded-r-xl p-2 mb-1 cursor-pointer opacity-60"
                      >
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={() => toggleItem(item.id, false)}
                          className="w-4 h-4 rounded border-gray-400 accent-[#00c896] cursor-pointer shrink-0"
                        />
                        <p className="text-xs text-gray-500 line-through">{item.action}</p>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!aiLoading && !itemsLoading && !hasItems && (
              <div className="text-center py-4 text-gray-400">
                <p className="text-xs mb-2">プロフィールを設定するとAIがアドバイスします</p>
                <Button size="sm" onClick={() => fetchAiAdvice([])}>AIアドバイスを取得</Button>
              </div>
            )}
          </div>

          {/* Right: 気づき */}
          <div className="md:col-span-5 space-y-3 md:space-y-4">
            {/* 直近の締切 — PCのみ（サイドカラム） */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h2 className="font-semibold text-gray-900 text-sm">📅 締切詳細</h2>
                <Link href="/calendar" className="text-[10px] text-[#00c896] hover:underline">カレンダー →</Link>
              </div>
              {upcomingDeadlines.length > 0 ? (
                <div className="space-y-1.5">
                  {upcomingDeadlines.map((d) => (
                    <Link key={`${d.type}-${d.id}`} href={d.link}>
                      <div className={`flex items-center justify-between bg-white rounded-xl border p-2.5 hover:bg-gray-50 transition-colors ${d.days <= 3 ? "border-red-200" : "border-gray-100"}`}>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${EVENT_TYPE_BADGE[d.type] ?? "bg-gray-100 text-gray-600"}`}>
                            {d.type}
                          </span>
                          <p className="text-xs font-medium text-gray-900 truncate">{d.title}</p>
                        </div>
                        <span className={`text-[10px] font-bold shrink-0 ml-2 ${d.days === 0 ? "text-red-600" : d.days <= 3 ? "text-orange-500" : "text-gray-400"}`}>
                          {d.days === 0 ? "今日！" : `あと${d.days}日`}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-gray-100 rounded-xl p-2.5 text-center">
                  <p className="text-xs text-gray-400">直近7日に締切はありません</p>
                </div>
              )}
            </div>

            {/* カレオからの気づき */}
            <InsightsWidget />
          </div>
        </div>
      </div>

      {/* 内定後コンテンツ（モバイル・PC共通） */}
      {companies.filter(c => c.status === "OFFERED").length > 0 && (
        <div className="mt-3 px-4 md:px-5 pb-4">
          <PostOfferWidget offeredCompanies={companies.filter(c => c.status === "OFFERED")} />
        </div>
      )}
    </div>
  );
}
