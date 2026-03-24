"use client";

import { useEffect, useState } from "react";

interface Analytics {
  totalStudents: number;
  byFaculty: { faculty: string; count: number; offered: number; offerRate: number }[];
  byGradYear: { year: number; count: number }[];
  industryRanking: { industry: string; count: number }[];
  interviewPassRate: number;
  activeRate: number;
  inactiveCount: number;
  offerRate: number;
  offeredCount: number;
  totalCompanies: number;
  totalInterviews: number;
}

function StatCard({ label, value, sub, color = "text-gray-900" }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/career-portal/analytics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  if (!data) return <p className="text-gray-500">データを読み込めませんでした</p>;

  const maxFacultyCount = Math.max(...(data.byFaculty.map((f) => f.count)), 1);
  const maxIndustryCount = Math.max(...(data.industryRanking.map((i) => i.count)), 1);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">詳細分析</h1>
        <p className="text-sm text-gray-500 mt-1">大学全体の就活状況を多角的に把握できます</p>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="登録学生数" value={data.totalStudents} sub="名" />
        <StatCard label="内定取得率" value={`${data.offerRate}%`} sub={`${data.offeredCount}名が内定`} color="text-green-600" />
        <StatCard label="面接通過率" value={`${data.interviewPassRate}%`} sub={`${data.totalInterviews}回の面接`} color="text-blue-600" />
        <StatCard label="アクティブ率" value={`${data.activeRate}%`} sub={`${data.inactiveCount}名が30日未ログイン`} color={data.inactiveCount > 0 ? "text-amber-500" : "text-gray-900"} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 学部別内定率 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">学部別 登録数・内定率</h2>
          {data.byFaculty.length === 0 ? (
            <p className="text-sm text-gray-400">データなし</p>
          ) : (
            <div className="space-y-3">
              {data.byFaculty.map(({ faculty, count, offerRate }) => (
                <div key={faculty}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700 font-medium truncate max-w-[140px]">{faculty}</span>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs text-gray-400">{count}名</span>
                      <span className="text-xs font-semibold text-green-600">{offerRate}%</span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-400 rounded-full"
                      style={{ width: `${Math.round((count / maxFacultyCount) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 卒業年度別 */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">卒業年度別人数</h2>
          {data.byGradYear.length === 0 ? (
            <p className="text-sm text-gray-400">データなし</p>
          ) : (
            <div className="space-y-3">
              {data.byGradYear.map(({ year, count }) => (
                <div key={year} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-16 shrink-0">{year}卒</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="bg-indigo-400 h-2 rounded-full"
                      style={{ width: `${Math.round((count / data.totalStudents) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-700 w-10 text-right shrink-0">{count}名</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 業界別応募数ランキング */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">志望業界別 応募数ランキング（全学生集計）</h2>
        {data.industryRanking.length === 0 ? (
          <p className="text-sm text-gray-400">データなし</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.industryRanking.map(({ industry, count }, i) => (
              <div key={industry} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-5 shrink-0">#{i + 1}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-700">{industry}</span>
                    <span className="text-gray-500 text-xs">{count}社</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-400 rounded-full"
                      style={{ width: `${Math.round((count / maxIndustryCount) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
