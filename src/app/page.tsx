"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCompanies } from "@/hooks/useCompanies";
import { useEs } from "@/hooks/useEs";
import { useInterviews } from "@/hooks/useInterviews";
import { useProfile } from "@/hooks/useProfile";
import { useActionItems } from "@/hooks/useActionItems";
import { useChat } from "@/hooks/useChat";
import { useToast } from "@/components/ui/Toast";
import { useDeadlineNotifications } from "@/hooks/useDeadlineNotifications";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MiniCalendar } from "@/components/dashboard/MiniCalendar";
import { KareoWidget } from "@/components/dashboard/KareoWidget";
import { InsightsWidget } from "@/components/dashboard/InsightsWidget";
import { PostOfferWidget } from "@/components/dashboard/PostOfferWidget";
import { createClient } from "@/lib/supabase/client";
import { LandingPage } from "@/components/landing/LandingPage";
import { daysUntil } from "@/lib/utils";
import { COMPANY_STATUS_ORDER, JOB_SEARCH_STAGE_LABELS } from "@/types";

// 毎日のコーチCTA（チャット未実施の日は強調表示）
function DailyCoachBanner({ profile }: { profile: { careerAxis?: string; gakuchika?: string } | null }) {
  const [chatted, setChatted] = useState(true); // サーバーSSRで不一致しないようデフォルトtrue
  const [pdcaIssue, setPdcaIssue] = useState<string | null>(null);

  useEffect(() => {
    try {
      const last = localStorage.getItem("careo_last_chat_date");
      setChatted(last === new Date().toDateString());
      const raw = localStorage.getItem("careo_last_pdca");
      if (raw) {
        const pdca = JSON.parse(raw);
        const issue = pdca?.check?.issues?.[0] ?? pdca?.act?.nextWeekFocus ?? null;
        setPdcaIssue(issue);
      }
    } catch { /* ignore */ }
  }, []);

  const topic = pdcaIssue
    ? `「${pdcaIssue}」について一緒に考えよう`
    : !profile?.gakuchika
    ? "ガクチカをカレオコーチと一緒に整理しよう"
    : !profile?.careerAxis
    ? "就活の軸をカレオコーチと一緒に言語化しよう"
    : "今日の就活の進捗をカレオコーチに報告しよう";

  if (chatted) return null; // 今日すでに話していれば非表示

  return (
    <Link href="/chat">
      <div className="mb-4 bg-gradient-to-r from-[#00c896] to-[#00a87e] rounded-xl px-4 py-3 flex items-center gap-3 hover:opacity-95 transition-opacity cursor-pointer shadow-sm">
        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
          <span className="text-white font-bold text-sm">K</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">今日のカレオコーチ</p>
          <p className="text-indigo-200 text-xs truncate">{topic}</p>
        </div>
        <span className="text-white text-lg shrink-0">→</span>
      </div>
    </Link>
  );
}

interface NextActionResult {
  summary: string;
  weeklyActions: { priority: "high" | "medium" | "low"; action: string; reason: string }[];
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

function DashboardContent() {
  const { companies } = useCompanies();
  const { esList } = useEs();
  const { interviews } = useInterviews();
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

  // ブラウザ通知（締切3日以内）
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

  // データが揃ったら一度だけ自動フェッチ（profileがnullでも動かす）
  useEffect(() => {
    if (itemsLoading) return;
    if (hasFetched.current) return;
    hasFetched.current = true;
    if (pendingItems.length === 0 && completedItems.length === 0) {
      fetchAiAdvice([]);
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

  return (
    <div className="p-4 md:p-6 min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* ページヘッダー */}
      <div className="flex items-center justify-between mb-4 md:mb-5">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">ダッシュボード</h1>
          {profile && (
            <p className="text-xs md:text-sm text-gray-500 mt-0.5 hidden sm:block">
              {[profile.university, profile.faculty, profile.grade].filter(Boolean).join(" · ")} ／ {profile.graduationYear}年卒 ／ {JOB_SEARCH_STAGE_LABELS[profile.jobSearchStage]}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link href="/settings" className="hidden md:block">
            <Button variant="secondary" size="sm">設定</Button>
          </Link>
          <Button variant="ghost" size="sm" onClick={handleLogout}>ログアウト</Button>
        </div>
      </div>

      {/* ステータスサマリー */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-5">
        {[
          { label: "選考中", count: companies.filter(c => !["OFFERED","REJECTED","WISHLIST"].includes(c.status)).length, gradient: "from-teal-500 to-emerald-500", bg: "bg-gradient-to-br from-teal-50/60 to-emerald-50/40", border: "border-teal-100", text: "text-teal-600" },
          { label: "内定", count: statusCounts["OFFERED"] ?? 0, gradient: "from-emerald-500 to-green-500", bg: "bg-gradient-to-br from-emerald-50 to-green-50", border: "border-emerald-100", text: "text-emerald-600" },
          { label: "ES提出待ち", count: esList.filter(e => e.status === "DRAFT").length, gradient: "from-amber-500 to-orange-500", bg: "bg-gradient-to-br from-amber-50 to-orange-50", border: "border-amber-100", text: "text-amber-600" },
          { label: "気になる", count: statusCounts["WISHLIST"] ?? 0, gradient: "from-gray-400 to-slate-500", bg: "bg-gradient-to-br from-gray-50 to-slate-50", border: "border-gray-200", text: "text-gray-600" },
        ].map((item) => (
          <div key={item.label} className={`${item.bg} border ${item.border} rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow`}>
            <p className="text-xs font-medium text-gray-500 mb-1">{item.label}</p>
            <p className={`text-3xl font-bold bg-gradient-to-r ${item.gradient} bg-clip-text text-transparent`}>{item.count}</p>
          </div>
        ))}
      </div>

      {/* 今日のカレオコーチ CTA */}
      <DailyCoachBanner profile={profile} />

      {/* メインコンテンツ: 3列 */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">

        {/* 左: Next Action チェックリスト */}
        <div className="md:col-span-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">🎯 <span>Next Action</span></h2>
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
                    className="mt-0.5 w-4 h-4 rounded border-gray-400 accent-[#00c896] cursor-pointer shrink-0"
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
            <div className="text-center py-8 text-gray-400">
              <p className="text-xs mb-3">プロフィールを設定するとAIがアドバイスします</p>
              <Button size="sm" onClick={() => fetchAiAdvice([])}>AIアドバイスを取得</Button>
            </div>
          )}
        </div>

        {/* 中: カレンダー + 締切 */}
        <div className="md:col-span-4">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">📅 カレンダー</h2>
          <MiniCalendar events={calendarEvents} />

          {upcomingDeadlines.length > 0 && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500">直近の締切</p>
                <Link href="/deadlines" className="text-[10px] text-[#00c896] hover:underline">すべて</Link>
              </div>
              <div className="space-y-1.5">
                {upcomingDeadlines.map((d) => (
                  <Link key={`${d.type}-${d.id}`} href={d.link}>
                    <div className={`flex items-center justify-between bg-white rounded-lg border p-2 hover:bg-gray-50 transition-colors ${d.days <= 3 ? "border-red-200" : "border-gray-100"}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0 ${d.type === "ES" ? "bg-[#00c896]/10 text-[#00a87e]" : "bg-purple-100 text-purple-700"}`}>
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

        {/* 右: カレオ ウィジェット (PC のみ) */}
        <div className="md:col-span-4 hidden md:block" style={{ height: "480px" }}>
          <KareoWidget />
        </div>
      </div>

      {/* 内定後コンテンツ（戦略6）または内定シェア */}
      {companies.filter(c => c.status === "OFFERED").length > 0 && (
        <PostOfferWidget offeredCompanies={companies.filter(c => c.status === "OFFERED")} />
      )}


      {/* カレオからの気づき（クロスデータ・インサイト通知）*/}
      <InsightsWidget />

      {/* PDCAレポートへのリンク */}
      <div className="mb-4">
        <Link href="/report" className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-[#00c896]/30 hover:shadow-sm transition-all group">
          <div className="flex items-center gap-2">
            <span className="text-base">📊</span>
            <div>
              <p className="text-sm font-semibold text-gray-900">週次PDCAレポート</p>
              <p className="text-xs text-gray-400">AIが就活全体を分析・スコアリング</p>
            </div>
          </div>
          <span className="text-gray-300 group-hover:text-[#00c896] transition-colors">→</span>
        </Link>
      </div>
    </div>
  );
}

export default function RootPage() {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setIsAuth(!!data.user));
  }, []);

  if (isAuth === null) return null;
  if (!isAuth) return <LandingPage />;
  return <DashboardContent />;
}
