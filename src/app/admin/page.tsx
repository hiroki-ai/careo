"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface DailyCount {
  date: string; // "YYYY-MM-DD"
  count: number;
  cumulative: number;
}

interface UserStats {
  totalUsers: number;
  byGradYear: { graduation_year: number; count: number }[];
  daily: DailyCount[];
  last7: number;  // 直近7日の新規登録数
  last30: number; // 直近30日
}

function MiniBarChart({ data, maxVal }: { data: DailyCount[]; maxVal: number }) {
  return (
    <div className="flex items-end gap-px h-20 w-full">
      {data.map((d) => {
        const pct = maxVal > 0 ? Math.round((d.count / maxVal) * 100) : 0;
        return (
          <div key={d.date} className="flex-1 flex flex-col items-center justify-end h-full group relative">
            <div
              className="w-full rounded-t bg-blue-400 group-hover:bg-blue-500 transition-colors min-h-[2px]"
              style={{ height: `${Math.max(pct, 4)}%` }}
            />
            {/* ホバー tooltip */}
            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:block z-10 pointer-events-none">
              <div className="bg-gray-800 text-white text-[10px] rounded px-2 py-1 whitespace-nowrap">
                {d.date.slice(5)}: {d.count}人
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CumulativeChart({ data }: { data: DailyCount[] }) {
  const max = data[data.length - 1]?.cumulative ?? 1;
  return (
    <div className="relative h-20 w-full">
      <svg viewBox={`0 0 ${data.length} 100`} preserveAspectRatio="none" className="w-full h-full">
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.05" />
          </linearGradient>
        </defs>
        {/* 面グラフ */}
        <path
          d={[
            `M 0 100`,
            ...data.map((d, i) => `L ${i} ${100 - Math.round((d.cumulative / max) * 95)}`),
            `L ${data.length - 1} 100`,
            "Z",
          ].join(" ")}
          fill="url(#grad)"
        />
        {/* 線 */}
        <path
          d={data.map((d, i) =>
            `${i === 0 ? "M" : "L"} ${i} ${100 - Math.round((d.cumulative / max) * 95)}`
          ).join(" ")}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

export default function AdminPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<30 | 60 | 90>(30);

  useEffect(() => {
    async function init() {
      // 全ユーザー（created_at + graduation_year）
      const { data: allUsers } = await supabase
        .from("user_profiles")
        .select("created_at, graduation_year")
        .order("created_at", { ascending: true });

      const users = allUsers ?? [];
      const total = users.length;

      // 卒業年別
      const gradGrouped: Record<number, number> = {};
      users.forEach((u: { graduation_year: number }) => {
        gradGrouped[u.graduation_year] = (gradGrouped[u.graduation_year] ?? 0) + 1;
      });
      const byGradYear = Object.entries(gradGrouped)
        .map(([year, count]) => ({ graduation_year: Number(year), count }))
        .sort((a, b) => a.graduation_year - b.graduation_year);

      // 日別集計（過去90日）
      const now = new Date();
      const dailyMap: Record<string, number> = {};
      for (let i = 89; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        dailyMap[d.toISOString().slice(0, 10)] = 0;
      }
      users.forEach((u: { created_at: string }) => {
        const key = u.created_at.slice(0, 10);
        if (key in dailyMap) dailyMap[key]++;
      });
      let cum = users.filter((u: { created_at: string }) => u.created_at.slice(0, 10) < Object.keys(dailyMap)[0]).length;
      const daily: DailyCount[] = Object.entries(dailyMap).map(([date, count]) => {
        cum += count;
        return { date, count, cumulative: cum };
      });

      // 直近7日・30日
      const sevenDaysAgo = new Date(now); sevenDaysAgo.setDate(now.getDate() - 7);
      const thirtyDaysAgo = new Date(now); thirtyDaysAgo.setDate(now.getDate() - 30);
      const last7 = users.filter((u: { created_at: string }) => new Date(u.created_at) >= sevenDaysAgo).length;
      const last30 = users.filter((u: { created_at: string }) => new Date(u.created_at) >= thirtyDaysAgo).length;

      setStats({ totalUsers: total, byGradYear, daily, last7, last30 });
      setLoading(false);
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-gray-400 text-sm">読み込み中...</p>
    </div>
  );

  const slicedDaily = stats?.daily.slice(-(range)) ?? [];
  const maxDaily = Math.max(...slicedDaily.map(d => d.count), 1);

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">管理者ダッシュボード</h1>
        <p className="text-xs text-gray-400 mt-1">管理者専用ページ</p>
      </div>

      {stats && (
        <div className="space-y-4">
          {/* KPIカード */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
              <p className="text-[11px] text-gray-400 mb-1">総ユーザー</p>
              <p className="text-3xl font-bold text-blue-600">{stats.totalUsers}</p>
              <p className="text-[10px] text-gray-400">人</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
              <p className="text-[11px] text-gray-400 mb-1">直近7日</p>
              <p className="text-3xl font-bold text-emerald-600">+{stats.last7}</p>
              <p className="text-[10px] text-gray-400">人</p>
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm text-center">
              <p className="text-[11px] text-gray-400 mb-1">直近30日</p>
              <p className="text-3xl font-bold text-indigo-600">+{stats.last30}</p>
              <p className="text-[10px] text-gray-400">人</p>
            </div>
          </div>

          {/* 累計推移グラフ */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-800">累計ユーザー推移</p>
                <p className="text-xs text-gray-400">過去{range}日間</p>
              </div>
              <div className="flex gap-1">
                {([30, 60, 90] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${range === r ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                  >
                    {r}日
                  </button>
                ))}
              </div>
            </div>
            <CumulativeChart data={slicedDaily} />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400">{slicedDaily[0]?.date.slice(5)}</span>
              <span className="text-[10px] text-gray-400">{slicedDaily[slicedDaily.length - 1]?.date.slice(5)}</span>
            </div>
          </div>

          {/* 日別新規登録バーチャート */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-800 mb-1">日別新規登録数</p>
            <p className="text-xs text-gray-400 mb-4">過去{range}日間（バーにカーソルで日付と人数）</p>
            <MiniBarChart data={slicedDaily} maxVal={maxDaily} />
            <div className="flex justify-between mt-1">
              <span className="text-[10px] text-gray-400">{slicedDaily[0]?.date.slice(5)}</span>
              <span className="text-[10px] text-gray-400">{slicedDaily[slicedDaily.length - 1]?.date.slice(5)}</span>
            </div>
          </div>

          {/* 卒業年別内訳 */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
            <p className="text-sm font-semibold text-gray-800 mb-4">卒業年別内訳</p>
            <div className="space-y-2">
              {stats.byGradYear.length > 0 ? stats.byGradYear.map(({ graduation_year, count }) => (
                <div key={graduation_year} className="flex items-center gap-3">
                  <span className="text-sm text-gray-600 w-14 shrink-0">{graduation_year}卒</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-blue-400"
                      style={{ width: `${Math.round((count / stats.totalUsers) * 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 w-10 text-right shrink-0">{count}人</span>
                </div>
              )) : <p className="text-sm text-gray-400">データなし</p>}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
            ⚠️ このページはナビには表示されません。/admin を直接入力してアクセスしてください。
          </div>
        </div>
      )}
    </div>
  );
}
