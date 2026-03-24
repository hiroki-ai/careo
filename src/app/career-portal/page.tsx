"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ALERT_TYPE_LABELS, AlertType } from "@/types";

interface AlertSummary {
  id: string;
  studentUserId: string;
  alertType: AlertType;
  alertDetail: Record<string, unknown> | null;
  createdAt: string;
}

interface DashboardStats {
  totalStudents: number;
  byGradYear: { year: number; count: number }[];
  byStage: { stage: string; count: number }[];
  topIndustries: { industry: string; count: number }[];
  offerRate: number;
  offeredCount: number;
  notStartedCount: number;
}

const STAGE_LABELS: Record<string, string> = {
  not_started: "まだ始めていない",
  just_started: "始めたばかり",
  in_progress: "本格的に進めている",
};

const STAGE_COLORS: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-600",
  just_started: "bg-yellow-100 text-yellow-700",
  in_progress: "bg-green-100 text-green-700",
};

function StatCard({
  label,
  value,
  sub,
  color = "text-gray-900",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function CareerPortalDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [alerts, setAlerts] = useState<AlertSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/career-portal/dashboard").then((r) => r.json()),
      fetch("/api/career-portal/alerts").then((r) => r.json()),
    ]).then(([dashData, alertData]) => {
      setStats(dashData);
      setAlerts(alertData.alerts ?? []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!stats) {
    return <p className="text-gray-500">データを読み込めませんでした。</p>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ヘッダー */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-sm text-gray-500 mt-1">学生の就活状況のサマリーです</p>
      </div>

      {/* KPI カード */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="登録学生数" value={stats.totalStudents} sub="名" />
        <StatCard
          label="内定取得率"
          value={`${stats.offerRate}%`}
          sub={`${stats.offeredCount}名が内定`}
          color="text-green-600"
        />
        <StatCard
          label="未活動学生"
          value={stats.notStartedCount}
          sub="企業登録ゼロ"
          color={stats.notStartedCount > 0 ? "text-red-500" : "text-gray-900"}
        />
        <StatCard label="卒業年度" value={stats.byGradYear.length} sub="学年が登録中" />
      </div>

      {/* 卒業年度別 + 就活ステージ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 卒業年度別人数 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">卒業年度別人数</h2>
          {stats.byGradYear.length === 0 ? (
            <p className="text-sm text-gray-400">データなし</p>
          ) : (
            <div className="space-y-2">
              {stats.byGradYear.map(({ year, count }) => (
                <div key={year} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-16 shrink-0">{year}卒</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{
                        width: `${Math.round((count / stats.totalStudents) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-700 w-10 text-right shrink-0">{count}名</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 就活ステージ */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">就活ステージ分布</h2>
          {stats.byStage.length === 0 ? (
            <p className="text-sm text-gray-400">データなし</p>
          ) : (
            <div className="space-y-2">
              {stats.byStage.map(({ stage, count }) => (
                <div key={stage} className="flex items-center justify-between">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${STAGE_COLORS[stage] ?? "bg-gray-100 text-gray-600"}`}
                  >
                    {STAGE_LABELS[stage] ?? stage}
                  </span>
                  <span className="text-sm font-semibold text-gray-700">{count}名</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 志望業界TOP5 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">志望業界 TOP5（公開設定の学生のみ）</h2>
        {stats.topIndustries.length === 0 ? (
          <p className="text-sm text-gray-400">データなし</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {stats.topIndustries.map(({ industry, count }, i) => (
              <div
                key={industry}
                className="flex flex-col items-center bg-blue-50 rounded-lg p-3 text-center"
              >
                <span className="text-xs text-blue-400 font-bold mb-1">#{i + 1}</span>
                <span className="text-xs text-gray-700 font-medium leading-tight mb-1">{industry}</span>
                <span className="text-lg font-bold text-blue-600">{count}</span>
                <span className="text-[10px] text-gray-400">名</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 要注意学生アラート */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-xl border border-amber-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              要注意学生 ({alerts.length}名)
            </h2>
            <Link href="/career-portal/alerts" className="text-xs text-blue-600 hover:underline">
              すべて見る →
            </Link>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 3).map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                    {ALERT_TYPE_LABELS[a.alertType]}
                  </span>
                </div>
                <Link
                  href={`/career-portal/students/${a.studentUserId}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  詳細を確認 →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* クイックリンク */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: "/career-portal/students", label: "学生一覧", sub: "個別状況を確認", color: "bg-blue-100 text-blue-600", icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" },
          { href: "/career-portal/alerts", label: "要注意学生", sub: "アラート一覧", color: "bg-amber-100 text-amber-600", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
          { href: "/career-portal/es-reviews", label: "ES添削", sub: "依頼を確認・返信", color: "bg-green-100 text-green-600", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
          { href: "/career-portal/announcements", label: "アナウンス", sub: "全学生へ通知", color: "bg-indigo-100 text-indigo-600", icon: "M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 bg-white rounded-xl border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
          >
            <div className={`w-9 h-9 ${item.color} rounded-lg flex items-center justify-center shrink-0`}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
              <p className="text-xs text-gray-500">{item.sub}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
