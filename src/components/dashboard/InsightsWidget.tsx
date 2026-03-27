"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useCompanies } from "@/hooks/useCompanies";
import { useEs } from "@/hooks/useEs";
import { useInterviews } from "@/hooks/useInterviews";
import { useProfile } from "@/hooks/useProfile";
import { useActionItems } from "@/hooks/useActionItems";
import { useObVisits } from "@/hooks/useObVisits";
import { useAptitudeTests } from "@/hooks/useAptitudeTests";
import type { InsightItem } from "@/app/api/ai/insights/route";
import { useCoach } from "@/hooks/useCoach";

const CACHE_KEY = "careo_last_insights";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6時間キャッシュ

// AIが生成するlinkのホワイトリスト（存在しないページへのリンクを防ぐ）
const VALID_INSIGHT_LINKS = new Set([
  "/", "/chat", "/companies", "/es", "/interviews",
  "/ob-visits", "/tests", "/career", "/deadlines",
  "/groups", "/report", "/settings",
]);

const typeConfig: Record<InsightItem["type"], { bg: string; border: string; iconBg: string; icon: string }> = {
  warning: {
    bg: "bg-red-50",
    border: "border-red-200",
    iconBg: "bg-red-100",
    icon: "⚠️",
  },
  connection: {
    bg: "bg-indigo-50",
    border: "border-indigo-200",
    iconBg: "bg-indigo-100",
    icon: "🔗",
  },
  tip: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconBg: "bg-amber-100",
    icon: "💡",
  },
  benchmark: {
    bg: "bg-teal-50",
    border: "border-teal-200",
    iconBg: "bg-teal-100",
    icon: "📊",
  },
};

const priorityLabel: Record<InsightItem["priority"], string> = {
  high: "今すぐ",
  medium: "今週中に",
  low: "参考",
};

const priorityColor: Record<InsightItem["priority"], string> = {
  high: "text-red-600 bg-red-50",
  medium: "text-amber-600 bg-amber-50",
  low: "text-gray-500 bg-gray-100",
};

export function InsightsWidget() {
  const { companies } = useCompanies();
  const { esList } = useEs();
  const { interviews } = useInterviews();
  const { profile } = useProfile();
  const { pendingItems } = useActionItems();
  const { visits: obVisits } = useObVisits();
  const { tests: aptitudeTests } = useAptitudeTests();

  const { coachName } = useCoach();
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const hasFetched = useRef(false);

  // キャッシュ復元
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const { data, ts } = JSON.parse(cached) as { data: InsightItem[]; ts: number };
        if (Date.now() - ts < CACHE_TTL_MS) {
          setInsights(data);
          hasFetched.current = true;
        }
      }
    } catch { /* ignore */ }
  }, []);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const companiesSlim = companies.map(({ name, status, industry, is_intern_offer }) => ({ name, status, industry, is_intern_offer }));
      const esListSlim = esList.map(({ questions: _q, ...rest }) => rest);
      const interviewsSlim = interviews.map(({ questions: _q, ...rest }) => rest);
      const obVisitsSlim = obVisits.map(({ companyName, purpose }) => ({ companyName, purpose }));
      const testsSlim = aptitudeTests.map(({ companyName, testType, result }) => ({ companyName, testType, result }));

      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companies: companiesSlim,
          esList: esListSlim,
          interviews: interviewsSlim,
          obVisits: obVisitsSlim,
          aptitudeTests: testsSlim,
          profile,
          pendingActions: pendingItems.map(i => i.action),
        }),
      });
      const data = await res.json() as { insights?: InsightItem[] };
      if (data.insights && data.insights.length > 0) {
        setInsights(data.insights);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({ data: data.insights, ts: Date.now() }));
        } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  // データが揃ったら自動フェッチ（未キャッシュ時のみ）
  useEffect(() => {
    if (hasFetched.current) return;
    if (companies.length === 0 && esList.length === 0) return; // データなしなら実行しない
    hasFetched.current = true;
    fetchInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies.length, esList.length]);

  if (loading) {
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="font-semibold text-gray-900 text-sm">🔮 {coachName}からの気づき</h2>
        </div>
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (insights.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
          🔮 <span>{coachName}からの気づき</span>
        </h2>
        <button
          onClick={() => {
            hasFetched.current = false;
            try { localStorage.removeItem(CACHE_KEY); } catch { /* ignore */ }
            fetchInsights();
          }}
          className="text-[10px] text-gray-400 hover:text-gray-600 transition-colors"
        >
          更新
        </button>
      </div>

      <div className="space-y-2">
        {insights.slice(0, 4).map((insight, i) => {
          const cfg = typeConfig[insight.type];
          const key = `${insight.type}-${i}`;
          const isExpanded = expanded === key;

          return (
            <div
              key={key}
              className={`${cfg.bg} border ${cfg.border} rounded-xl overflow-hidden`}
            >
              <button
                className="w-full text-left p-3 flex items-start gap-2.5"
                onClick={() => setExpanded(isExpanded ? null : key)}
              >
                <span className="text-base shrink-0 mt-0.5">{insight.emoji ?? cfg.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${priorityColor[insight.priority]}`}>
                      {priorityLabel[insight.priority]}
                    </span>
                    <p className="text-xs font-semibold text-gray-900">{insight.title}</p>
                  </div>
                  {isExpanded && (
                    <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">{insight.body}</p>
                  )}
                </div>
                <span className="text-gray-400 text-xs shrink-0 mt-0.5">
                  {isExpanded ? "▲" : "▼"}
                </span>
              </button>

              {isExpanded && insight.link && VALID_INSIGHT_LINKS.has(insight.link) && (
                <div className="px-3 pb-3">
                  <Link
                    href={insight.link}
                    className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium hover:underline"
                  >
                    詳細を確認する →
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
