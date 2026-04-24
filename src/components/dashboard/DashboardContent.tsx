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
import { useToast } from "@/components/ui/Toast";
import { useDeadlineNotifications } from "@/hooks/useDeadlineNotifications";
import { Button } from "@/components/ui/Button";
import { InsightsWidget } from "@/components/dashboard/InsightsWidget";
import { PostOfferWidget } from "@/components/dashboard/PostOfferWidget";
import { AdSlot } from "@/components/ads/AdSlot";
import { UpgradeNudge } from "@/components/ads/UpgradeNudge";
import { SkeletonCard } from "@/components/ui/SkeletonCard";
import { daysUntil } from "@/lib/utils";
import { COMPANY_STATUS_ORDER, COMPANY_STATUS_LABELS } from "@/types";
import { TutorialModal } from "@/components/dashboard/TutorialModal";
import { ReviewPromptModal } from "@/components/dashboard/ReviewPromptModal";
import { CareoKun } from "@/components/landing/CareoKun";
import { AppCard, StatTile, ListItem } from "@/components/ui/app";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "おはようございます";
  if (h >= 12 && h < 18) return "こんにちは";
  return "お疲れ様です";
}

function getGreetingMood(): "cheer" | "think" | "default" {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "cheer";
  if (h >= 18 || h < 5) return "default";
  return "think";
}

function formatDate(d: Date): string {
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `${month}月${day}日 ${weekdays[d.getDay()]}曜日`;
}

function formatRelativeDate(dateStr: string): string {
  const d = daysUntil(dateStr);
  if (d === 0) return "今日";
  if (d === 1) return "明日";
  if (d < 0) return `${Math.abs(d)}日前`;
  return `${d}日後`;
}

interface NextActionResult {
  summary: string;
  weeklyActions: { priority: "high" | "medium" | "low"; action: string; reason: string }[];
}

const priorityDot: Record<"high" | "medium" | "low", string> = {
  high: "var(--app-danger)",
  medium: "var(--app-warning)",
  low: "var(--app-info)",
};

const priorityLabel = { high: "緊急", medium: "推奨", low: "情報" };

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

  const calendarEvents = [
    ...esList
      .filter((e) => e.deadline && e.status === "DRAFT")
      .map((e) => ({
        id: e.id,
        date: e.deadline!,
        type: "ES" as const,
        title: `${companies.find((c) => c.id === e.companyId)?.name ?? ""} ES`,
        link: `/es/${e.id}`,
      })),
    ...interviews
      .filter((i) => i.result === "PENDING")
      .map((i) => ({
        id: i.id,
        date: i.scheduledAt,
        type: "面接" as const,
        title: `${companies.find((c) => c.id === i.companyId)?.name ?? ""} ${i.round}次面接`,
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
    .map((e) => ({ ...e, days: daysUntil(e.date) }))
    .filter((d) => d.days >= 0 && d.days <= 14)
    .sort((a, b) => a.days - b.days)
    .slice(0, 5);

  useDeadlineNotifications(
    calendarEvents.filter((e) => {
      const d = daysUntil(e.date);
      return d >= 0 && d <= 3;
    })
  );

  const esListSlim = esList.map(({ questions: _q, ...rest }) => rest);
  const companiesSlim = companies.map(({ name, status, industry, is_intern_offer }) => ({
    name,
    status,
    industry,
    is_intern_offer,
  }));
  const interviewsSlim = interviews.map(({ questions: _q, ...rest }) => rest);

  const fetchAI = async (url: string, body: unknown, retries = 1): Promise<Record<string, unknown> | null> => {
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        if (attempt > 0) await new Promise((r) => setTimeout(r, 2000));
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (res.status === 402) {
          const data = await res.json().catch(() => ({}));
          showToast(
            data.error ?? "今月の無料枠を使い切りました",
            "warning",
            { label: "アップグレード", onClick: () => router.push("/upgrade") },
            10000
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
      const completedActions = completed ?? completedItems.map((i) => i.action);
      let initialWorry: string | null = null;
      try {
        initialWorry = localStorage.getItem("careo_initial_worry");
      } catch {
        /* ignore */
      }
      const data = (await fetchAI("/api/ai/next-action", {
        companies: companiesSlim,
        esList: esListSlim,
        interviews: interviewsSlim,
        profile,
        completedActions,
        initialWorry,
      })) as NextActionResult | null;
      if (initialWorry) {
        try {
          localStorage.removeItem("careo_initial_worry");
        } catch {
          /* ignore */
        }
      }
      if (!data) {
        showToast("AIアドバイスの取得に失敗しました", "error");
        return;
      }
      if ("limitExceeded" in data) return;
      if (!("error" in data)) {
        setAiSummary(data.summary ?? "");
        await replaceItems(data.weeklyActions);
      } else {
        const errMsg = (data as { error: string }).error;
        showToast(
          errMsg.includes("多すぎ") ? errMsg : "AIアドバイスの取得に失敗しました",
          "error"
        );
      }
    } finally {
      setAiLoading(false);
    }
  };

  // 紹介コード特典付与（初回のみ）
  useEffect(() => {
    let code: string | null = null;
    try {
      code = localStorage.getItem("careo_referral_code");
    } catch {
      /* ignore */
    }
    if (!code) return;
    try {
      localStorage.removeItem("careo_referral_code");
    } catch {
      /* ignore */
    }
    void fetch("/api/referral/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (data.success) {
          showToast(data.message ?? "Proプラン30日分が付与されました！🎉", "success", undefined, 10000);
        } else if (data.error && !data.error.includes("すでに")) {
          showToast(data.error, "info");
        }
      })
      .catch(() => {
        /* silent */
      });
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
      fetchAiAdvice(completedItems.map((i) => i.action));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsLoading]);

  const handleToggle = async (id: string, isCompleted: boolean) => {
    await toggleItem(id, isCompleted);
    if (isCompleted) {
      const newCompleted = [...completedItems.map((i) => i.action)];
      const toggled = pendingItems.find((i) => i.id === id);
      if (toggled) newCompleted.push(toggled.action);
      await fetchAiAdvice(newCompleted);
    }
  };

  const hasItems = pendingItems.length > 0 || completedItems.length > 0;

  // --- Stat values ---
  const interviewsThisWeek = interviews.filter((i) => {
    const d = daysUntil(i.scheduledAt);
    return i.result === "PENDING" && d >= 0 && d <= 7;
  });
  const nextInterview = interviewsThisWeek.sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  )[0];

  const esDeadlineSoon = esList.filter((e) => {
    if (!e.deadline || e.status !== "DRAFT") return false;
    const d = daysUntil(e.deadline);
    return d >= 0 && d <= 7;
  });

  const offeredCount = statusCounts["OFFERED"] ?? 0;

  // --- Recent activity ---
  const recentActivity: { id: string; text: string; time: string; icon: string; color: string }[] = [];
  companies.slice(0, 3).forEach((c) => {
    recentActivity.push({
      id: `c-${c.id}`,
      text: `${c.name} を${COMPANY_STATUS_LABELS[c.status]}に更新`,
      time: c.updatedAt,
      icon: "🏢",
      color: "#dbeafe",
    });
  });
  esList
    .filter((e) => e.status === "SUBMITTED")
    .slice(0, 2)
    .forEach((e) => {
      const company = companies.find((c) => c.id === e.companyId);
      recentActivity.push({
        id: `e-${e.id}`,
        text: `${company?.name ?? ""} ESを提出`,
        time: e.updatedAt,
        icon: "📄",
        color: "#dcfce7",
      });
    });
  interviews.slice(0, 2).forEach((i) => {
    const company = companies.find((c) => c.id === i.companyId);
    recentActivity.push({
      id: `i-${i.id}`,
      text: `${company?.name ?? ""} ${i.round}次面接`,
      time: i.updatedAt,
      icon: "🎙️",
      color: "#ede9fe",
    });
  });
  const sortedActivity = recentActivity
    .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
    .slice(0, 5);

  const offeredCompanies = companies.filter((c) => c.status === "OFFERED");
  const heroName = profile?.username ?? "あなた";

  return (
    <div style={{ background: "var(--app-surface-1)", minHeight: "100vh", color: "var(--app-text)" }}>
      <TutorialModal />
      <ReviewPromptModal />

      <div
        className="flex flex-col"
        style={{ padding: "18px 16px 120px", maxWidth: 1160, margin: "0 auto", gap: 18 }}
      >
        {/* Greeting header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div
              style={{ fontSize: 12, color: "var(--app-text-muted)", fontWeight: 600, marginBottom: 4 }}
            >
              {getGreeting()} · {formatDate(new Date())}
            </div>
            <h1
              className="font-klee"
              style={{
                fontSize: 26,
                fontWeight: 700,
                margin: 0,
                letterSpacing: -0.5,
              }}
            >
              {heroName}の就活
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const evt = new KeyboardEvent("keydown", { key: "k", metaKey: true });
                document.dispatchEvent(evt);
              }}
              title="検索 (⌘K)"
              aria-label="検索"
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "var(--app-surface-0)",
                border: "1px solid var(--app-border)",
                cursor: "pointer",
                display: "grid",
                placeItems: "center",
                color: "var(--app-text-muted)",
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <Link
              href="/settings"
              aria-label="設定"
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: "var(--app-surface-0)",
                border: "1px solid var(--app-border)",
                display: "grid",
                placeItems: "center",
                color: "var(--app-text-muted)",
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Kareo hero message */}
        <div
          style={{
            background: "linear-gradient(160deg, var(--app-accent-soft), var(--app-surface-0) 70%)",
            border: "1px solid rgba(0,200,150,.22)",
            borderRadius: "var(--app-r-xl)",
            padding: 18,
            display: "flex",
            gap: 14,
            alignItems: "flex-start",
          }}
        >
          <div style={{ flexShrink: 0 }}>
            <CareoKun size={52} mood={getGreetingMood()} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              className="handwriting-text"
              style={{
                fontSize: 14,
                lineHeight: 1.8,
                color: "var(--app-text)",
                background: "white",
                border: "1.5px solid var(--app-text)",
                borderRadius: 14,
                padding: "10px 14px",
                boxShadow: "3px 3px 0 var(--app-text)",
                display: "inline-block",
                maxWidth: "100%",
              }}
            >
              {aiLoading || !aiSummary ? (
                <>
                  {heroName}、今日もおつかれさま。
                  <br />
                  {upcomingDeadlines.length > 0
                    ? `直近の締切が${upcomingDeadlines.length}件あるよ。`
                    : "今日のやることから一緒に整理しよう。"}
                </>
              ) : (
                aiSummary
              )}
            </div>
            <div className="flex flex-wrap gap-2" style={{ marginTop: 12 }}>
              <Link
                href="/report"
                style={{
                  padding: "8px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: "var(--app-r-pill)",
                  background: "var(--app-accent)",
                  color: "white",
                  boxShadow: "var(--app-shadow-teal)",
                  textDecoration: "none",
                }}
              >
                今日の計画を見る
              </Link>
              <button
                type="button"
                onClick={() => fetchAiAdvice()}
                disabled={aiLoading}
                style={{
                  padding: "8px 14px",
                  fontSize: 12,
                  fontWeight: 700,
                  borderRadius: "var(--app-r-pill)",
                  background: "white",
                  color: "var(--app-text)",
                  border: "1px solid var(--app-border-strong)",
                  cursor: aiLoading ? "wait" : "pointer",
                  opacity: aiLoading ? 0.5 : 1,
                }}
              >
                {aiLoading ? "分析中…" : "AIアドバイスを更新"}
              </button>
            </div>
          </div>
        </div>

        {/* Stat tiles */}
        <div>
          <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
            <span
              style={{ width: 3, height: 16, background: "var(--app-accent)", borderRadius: 2 }}
            />
            <h2 className="font-klee" style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>
              今週の活動
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            <StatTile
              label="応募企業"
              value={companies.length}
              unit="社"
              icon="🏢"
            />
            <StatTile
              label="ES締切(7日以内)"
              value={esDeadlineSoon.length}
              unit="件"
              icon="📄"
              tone={esDeadlineSoon.some((e) => daysUntil(e.deadline!) <= 2) ? "accent" : "default"}
            />
            <StatTile
              label="今週の面接"
              value={interviewsThisWeek.length}
              unit="件"
              icon="🎙️"
              tone={interviewsThisWeek.length > 0 ? "accent" : "default"}
            />
            <StatTile label="内定" value={offeredCount} unit="社" icon="🏆" />
          </div>
          {nextInterview && (
            <div
              style={{ fontSize: 11, color: "var(--app-text-muted)", marginTop: 6, marginLeft: 2 }}
            >
              次の面接 · {formatRelativeDate(nextInterview.scheduledAt)}
            </div>
          )}
        </div>

        {/* Actions + Deadlines grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4">
          {/* Left: Weekly actions */}
          <AppCard
            title="今週やること"
            accent
            action={
              <button
                type="button"
                onClick={() => fetchAiAdvice()}
                disabled={aiLoading}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: aiLoading ? "var(--app-text-dim)" : "var(--app-accent-deep)",
                  background: "none",
                  border: "none",
                  cursor: aiLoading ? "wait" : "pointer",
                }}
              >
                {aiLoading ? "分析中…" : "再分析"}
              </button>
            }
          >
            {(aiLoading || itemsLoading) && (
              <div className="flex flex-col gap-2">
                {[0, 1, 2].map((i) => (
                  <SkeletonCard key={i} variant="deadline" />
                ))}
              </div>
            )}

            {!aiLoading && !itemsLoading && hasItems && (
              <div className="flex flex-col gap-2">
                {pendingItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3"
                    style={{
                      padding: "12px 14px",
                      background: "var(--app-surface-1)",
                      borderRadius: "var(--app-r-md)",
                      border: "1px solid var(--app-border)",
                      borderLeft: `3px solid ${priorityDot[item.priority]}`,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={false}
                      title={`完了: ${item.action}`}
                      onChange={() => handleToggle(item.id, true)}
                      style={{
                        marginTop: 2,
                        width: 16,
                        height: 16,
                        accentColor: "var(--app-accent)",
                        cursor: "pointer",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--app-text)", marginBottom: 2 }}>
                        {item.action}
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--app-text-muted)", lineHeight: 1.6 }}>
                        {item.reason}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5" style={{ flexShrink: 0 }}>
                      <span
                        style={{
                          fontSize: 9.5,
                          fontWeight: 800,
                          padding: "2px 8px",
                          borderRadius: "var(--app-r-pill)",
                          color: priorityDot[item.priority],
                          background: `color-mix(in oklch, ${priorityDot[item.priority]} 14%, white)`,
                        }}
                      >
                        {priorityLabel[item.priority]}
                      </span>
                      {item.link &&
                        (item.link.external ? (
                          <a
                            href={item.link.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: "var(--app-info)",
                              textDecoration: "none",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.link.label} →
                          </a>
                        ) : (
                          <Link
                            href={item.link.href}
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              color: "var(--app-accent-deep)",
                              textDecoration: "none",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.link.label} →
                          </Link>
                        ))}
                    </div>
                  </div>
                ))}

                {completedItems.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 800,
                        color: "var(--app-text-dim)",
                        letterSpacing: 1.5,
                        marginBottom: 6,
                      }}
                    >
                      完了済み
                    </div>
                    {completedItems.map((item) => (
                      <label
                        key={item.id}
                        className="flex items-center gap-2.5"
                        style={{
                          padding: "8px 12px",
                          background: "var(--app-surface-2)",
                          borderRadius: "var(--app-r-md)",
                          marginBottom: 4,
                          opacity: 0.6,
                          cursor: "pointer",
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={() => toggleItem(item.id, false)}
                          style={{ width: 14, height: 14, accentColor: "var(--app-accent)", cursor: "pointer" }}
                        />
                        <span
                          style={{
                            fontSize: 11.5,
                            color: "var(--app-text-muted)",
                            textDecoration: "line-through",
                          }}
                        >
                          {item.action}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!aiLoading && !itemsLoading && !hasItems && (
              <div
                style={{
                  textAlign: "center",
                  padding: "28px 16px",
                  background: "var(--app-surface-1)",
                  borderRadius: "var(--app-r-md)",
                }}
              >
                <div style={{ fontSize: 11.5, color: "var(--app-text-muted)", marginBottom: 12 }}>
                  プロフィールを設定するとAIがアドバイスします
                </div>
                <Button size="sm" onClick={() => fetchAiAdvice([])}>
                  AIアドバイスを取得
                </Button>
              </div>
            )}
          </AppCard>

          {/* Right: Deadlines */}
          <AppCard
            title="直近の締切"
            action={
              <Link
                href="/deadlines"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--app-accent-deep)",
                  textDecoration: "none",
                }}
              >
                すべて →
              </Link>
            }
          >
            {upcomingDeadlines.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {upcomingDeadlines.map((d) => {
                  const urgent = d.days <= 2;
                  const warn = d.days <= 5 && !urgent;
                  return (
                    <Link
                      key={`${d.type}-${d.id}`}
                      href={d.link}
                      style={{ textDecoration: "none", color: "inherit" }}
                    >
                      <div
                        className="flex items-center gap-2.5"
                        style={{
                          padding: "8px 10px",
                          borderRadius: "var(--app-r-sm)",
                          background: urgent
                            ? "var(--app-danger-soft)"
                            : warn
                            ? "var(--app-warning-soft)"
                            : "var(--app-surface-1)",
                          border: "1px solid var(--app-border)",
                        }}
                      >
                        <span
                          style={{
                            width: 3,
                            height: 24,
                            borderRadius: 2,
                            background: urgent
                              ? "var(--app-danger)"
                              : warn
                              ? "var(--app-warning)"
                              : "var(--app-text-dim)",
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: "var(--app-text)",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {d.title}
                          </div>
                          <div
                            style={{
                              fontSize: 10,
                              color: "var(--app-text-dim)",
                              marginTop: 1,
                            }}
                          >
                            {d.type}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: urgent
                              ? "var(--app-danger)"
                              : warn
                              ? "var(--app-warning)"
                              : "var(--app-text-muted)",
                            flexShrink: 0,
                          }}
                        >
                          {formatRelativeDate(d.date)}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  padding: "20px 10px",
                  textAlign: "center",
                  fontSize: 11.5,
                  color: "var(--app-text-muted)",
                  background: "var(--app-surface-1)",
                  borderRadius: "var(--app-r-sm)",
                }}
              >
                直近に締切はありません
              </div>
            )}
          </AppCard>
        </div>

        {/* Activity + Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-4">
          <AppCard title="最近の活動" subtitle={sortedActivity.length > 0 ? "最新5件" : undefined}>
            {sortedActivity.length > 0 ? (
              <div className="flex flex-col">
                {sortedActivity.map((a, i) => (
                  <ListItem
                    key={a.id}
                    leading={
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          background: a.color,
                          display: "grid",
                          placeItems: "center",
                          fontSize: 14,
                          color: "var(--app-text)",
                        }}
                      >
                        {a.icon}
                      </div>
                    }
                    title={a.text}
                    meta={new Date(a.time).toLocaleDateString("ja-JP", { month: "short", day: "numeric" })}
                    {...(i < sortedActivity.length - 1 ? {} : {})}
                  />
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: "20px 10px",
                  textAlign: "center",
                  fontSize: 11.5,
                  color: "var(--app-text-muted)",
                }}
              >
                まだ活動がありません
              </div>
            )}
          </AppCard>

          <InsightsWidget />
        </div>

        {/* Post-offer */}
        {offeredCompanies.length > 0 && <PostOfferWidget offeredCompanies={offeredCompanies} />}

        {/* SNS share card */}
        {profile?.username && (
          <div
            className="flex items-center gap-3"
            style={{
              padding: 14,
              background: "var(--app-surface-0)",
              border: "1px solid var(--app-border)",
              borderRadius: "var(--app-r-lg)",
            }}
          >
            <span style={{ fontSize: 22 }}>🎨</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--app-text)", marginBottom: 2 }}>
                就活ログをSNSで共有
              </div>
              <div style={{ fontSize: 10.5, color: "var(--app-text-muted)" }}>
                自分の就活記録を1枚の画像に、Xで投稿できる
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <a
                href={`/api/og/summary?username=${profile.username}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: "var(--app-accent-soft)",
                  color: "var(--app-accent-deep)",
                  textAlign: "center",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                画像を見る
              </a>
              <button
                type="button"
                onClick={() => {
                  const imgUrl = `${window.location.origin}/api/og/summary?username=${profile.username}`;
                  const text = `私の就活の軌跡、Careoで可視化中 📊\n${imgUrl}`;
                  window.open(
                    `https://x.com/intent/tweet?text=${encodeURIComponent(text)}`,
                    "_blank"
                  );
                }}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "6px 12px",
                  borderRadius: 8,
                  background: "black",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                𝕏 で投稿
              </button>
            </div>
          </div>
        )}

        {/* Ads */}
        <div>
          <AdSlot slotId={process.env.NEXT_PUBLIC_ADSENSE_SLOT_DASHBOARD} format="auto" />
          <UpgradeNudge message="広告非表示＋PDCA無制限のProプランで、就活を加速。" />
        </div>
      </div>
    </div>
  );
}
