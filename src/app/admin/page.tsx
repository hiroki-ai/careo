"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface UserStats {
  totalUsers: number;
  byGradYear: { graduation_year: number; count: number }[];
}

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";

export default function AdminPage() {
  const supabase = createClient();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || user.email !== ADMIN_EMAIL) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      setIsAdmin(true);

      // 全ユーザー数
      const { count: total } = await supabase
        .from("user_profiles")
        .select("*", { count: "exact", head: true });

      // 卒業年別内訳
      const { data: byYear } = await supabase
        .from("user_profiles")
        .select("graduation_year");

      const grouped: Record<number, number> = {};
      (byYear ?? []).forEach((row: { graduation_year: number }) => {
        grouped[row.graduation_year] = (grouped[row.graduation_year] ?? 0) + 1;
      });
      const byGradYear = Object.entries(grouped)
        .map(([year, count]) => ({ graduation_year: Number(year), count }))
        .sort((a, b) => a.graduation_year - b.graduation_year);

      setStats({ totalUsers: total ?? 0, byGradYear });
      setLoading(false);
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-400 text-sm">読み込み中...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-2xl mb-2">🔒</p>
          <p className="text-gray-500 text-sm">アクセス権限がありません</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">管理者ダッシュボード</h1>
        <p className="text-xs text-gray-400 mt-1">このページはURLを知っている管理者のみ表示されます</p>
      </div>

      {stats && (
        <>
          {/* 総ユーザー数 */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">登録ユーザー数</p>
            <p className="text-5xl font-bold text-blue-600">
              {stats.totalUsers}
              <span className="text-lg font-normal text-gray-400 ml-1">人</span>
            </p>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-medium text-gray-500 mb-3">卒業年別内訳</p>
              <div className="space-y-2">
                {stats.byGradYear.length > 0 ? stats.byGradYear.map(({ graduation_year, count }) => (
                  <div key={graduation_year} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-16 shrink-0">{graduation_year}卒</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-400"
                        style={{ width: `${Math.round((count / stats.totalUsers) * 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-semibold text-gray-700 w-10 text-right shrink-0">{count}人</span>
                  </div>
                )) : (
                  <p className="text-sm text-gray-400">データなし</p>
                )}
              </div>
            </div>
          </div>

          {/* ステータス */}
          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-xs text-amber-700">
            ⚠️ このページはナビには表示されません。URL（/admin）を直接入力してアクセスしてください。
          </div>
        </>
      )}
    </div>
  );
}
