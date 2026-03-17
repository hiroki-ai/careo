"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCompanies } from "@/hooks/useCompanies";
import { useEs } from "@/hooks/useEs";
import { useInterviews } from "@/hooks/useInterviews";
import { useProfile } from "@/hooks/useProfile";

interface AggregateInsights {
  total_users: number;
  avg_companies_per_user: number;
  top_industries: { industry: string; count: number }[];
  offer_rate: number;
  avg_interviews_before_offer: number;
}

// データが不足している場合の参考値（28卒・日本就活統計ベース）
const REFERENCE_DATA: AggregateInsights = {
  total_users: 0,
  avg_companies_per_user: 22,
  offer_rate: 0.65,
  avg_interviews_before_offer: 4.3,
  top_industries: [
    { industry: "IT・通信", count: 100 },
    { industry: "メーカー", count: 85 },
    { industry: "商社", count: 70 },
    { industry: "金融・保険", count: 65 },
    { industry: "コンサルティング", count: 55 },
  ],
};

// 実データを使うのに必要な最低ユーザー数
const MIN_REAL_DATA_USERS = 5;

function StatCard({
  label, value, sub, color = "text-gray-900", badge,
}: {
  label: string; value: string | number; sub?: string; color?: string; badge?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-1">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        {badge && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">{badge}</span>}
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="h-3 bg-gray-100 rounded-full animate-pulse w-1/2 mb-2" />
      <div className="h-7 bg-gray-100 rounded-full animate-pulse w-1/3" />
    </div>
  );
}

export default function InsightsPage() {
  const supabase = createClient();
  const { companies, loading: companiesLoading } = useCompanies();
  const { esList, loading: esLoading } = useEs();
  const { interviews, loading: interviewsLoading } = useInterviews();
  const { profile } = useProfile();

  const [insights, setInsights] = useState<AggregateInsights | null>(null);
  const [isRealData, setIsRealData] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState<number | null>(null);

  useEffect(() => {
    async function fetchInsights() {
      setInsightsLoading(true);
      try {
        // ユーザー数を直接取得（管理者確認用）
        const { count } = await supabase
          .from("user_profiles")
          .select("*", { count: "exact", head: true });
        setTotalUsers(count ?? 0);

        // RPCで集計データを取得
        const { data, error } = await supabase.rpc("get_careo_aggregate_insights");
        const parsed = Array.isArray(data) ? data[0] : data;

        if (!error && parsed && parsed.total_users >= MIN_REAL_DATA_USERS) {
          setInsights(parsed as AggregateInsights);
          setIsRealData(true);
        } else {
          // データ不足 → 参考値を使用
          setInsights({ ...REFERENCE_DATA, total_users: count ?? 0 });
          setIsRealData(false);
        }
      } catch {
        setInsights({ ...REFERENCE_DATA, total_users: 0 });
        setIsRealData(false);
      } finally {
        setInsightsLoading(false);
      }
    }
    fetchInsights();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const myCompaniesCount = companies.length;
  const myOfferedCount = companies.filter((c) => c.status === "OFFERED").length;
  const myInterviewCount = interviews.length;
  const myEsCount = esList.filter((e) => e.status === "SUBMITTED").length;
  const myActiveCount = companies.filter((c) => !["WISHLIST", "REJECTED"].includes(c.status)).length;
  const dataLoading = companiesLoading || esLoading || interviewsLoading;

  const badge = isRealData ? undefined : "参考値";

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">就活データ インサイト</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isRealData ? "Careoユーザーの匿名統計データ" : "就活統計の参考値（実データ収集中）"}
          </p>
        </div>
        {/* 管理者向けユーザー数バッジ */}
        {totalUsers !== null && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-center min-w-[100px]">
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">登録ユーザー</p>
            <p className="text-2xl font-bold text-blue-600">{totalUsers}<span className="text-sm font-normal ml-0.5">人</span></p>
            {!isRealData && (
              <p className="text-[10px] text-blue-400">{MIN_REAL_DATA_USERS}人で実データ表示</p>
            )}
          </div>
        )}
      </div>

      {/* データステータスバナー */}
      {!isRealData && !insightsLoading && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
          <span className="text-amber-500 text-lg shrink-0">📊</span>
          <div>
            <p className="text-sm font-semibold text-amber-700">現在は参考値を表示しています</p>
            <p className="text-xs text-amber-600 mt-0.5">
              Careoのユーザーが{MIN_REAL_DATA_USERS}人以上になると、実際の統計データに自動で切り替わります。
              現在の数値は日本の就活統計をもとにした参考値です。
            </p>
          </div>
        </div>
      )}
      {isRealData && !insightsLoading && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl px-4 py-3 flex items-center gap-3">
          <span className="text-green-500 text-lg">✓</span>
          <p className="text-sm font-semibold text-green-700">Careoユーザーの実データを表示しています</p>
        </div>
      )}

      {/* Aggregate Stats */}
      <section className="mb-8">
        <h2 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">
          {isRealData ? "全ユーザー統計" : "就活統計（参考値）"}
        </h2>
        {insightsLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : insights ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
              <StatCard
                label="平均登録企業数"
                value={`${Math.round(insights.avg_companies_per_user)}社`}
                sub="1人あたり"
                color="text-indigo-600"
                badge={badge}
              />
              <StatCard
                label="内定獲得率"
                value={`${Math.round(insights.offer_rate * 100)}%`}
                sub="選考企業のうち"
                color="text-green-600"
                badge={badge}
              />
              <StatCard
                label="内定までの平均面接数"
                value={`${insights.avg_interviews_before_offer.toFixed(1)}回`}
                color="text-purple-600"
                badge={badge}
              />
            </div>

            {/* Top Industries */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-500">人気業界ランキング</p>
                {!isRealData && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-200">参考値</span>}
              </div>
              <div className="space-y-2">
                {insights.top_industries.slice(0, 5).map((ind, i) => {
                  const max = insights.top_industries[0].count;
                  const pct = Math.round((ind.count / max) * 100);
                  return (
                    <div key={ind.industry} className="flex items-center gap-3">
                      <span className="text-xs font-bold text-gray-400 w-4 shrink-0">#{i + 1}</span>
                      <span className="text-sm text-gray-700 w-32 shrink-0 truncate">{ind.industry}</span>
                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full bg-blue-400" style={{ width: `${pct}%` }} />
                      </div>
                      {isRealData && <span className="text-xs text-gray-500 w-12 text-right shrink-0">{ind.count}社</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}
      </section>

      {/* My Stats vs Average */}
      <section>
        <h2 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wide">あなた vs 平均</h2>
        {dataLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Companies */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 mb-3">登録企業数</p>
              <div className="flex items-end gap-6">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">あなた</p>
                  <p className="text-3xl font-bold text-blue-600">{myCompaniesCount}<span className="text-sm font-normal text-gray-400 ml-1">社</span></p>
                </div>
                {insights && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">平均{!isRealData && " (参考)"}</p>
                    <p className="text-2xl font-bold text-gray-300">{Math.round(insights.avg_companies_per_user)}<span className="text-sm font-normal text-gray-300 ml-1">社</span></p>
                  </div>
                )}
              </div>
              {insights && (
                <p className={`text-xs mt-2 font-medium ${myCompaniesCount >= Math.round(insights.avg_companies_per_user) ? "text-green-600" : "text-orange-500"}`}>
                  {myCompaniesCount >= Math.round(insights.avg_companies_per_user)
                    ? `平均より${myCompaniesCount - Math.round(insights.avg_companies_per_user)}社多い`
                    : `平均より${Math.round(insights.avg_companies_per_user) - myCompaniesCount}社少ない`}
                </p>
              )}
            </div>

            {/* Offers */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 mb-3">内定数</p>
              <div className="flex items-end gap-6">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">あなた</p>
                  <p className="text-3xl font-bold text-green-600">{myOfferedCount}<span className="text-sm font-normal text-gray-400 ml-1">社</span></p>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">選考中 {myActiveCount}社 / ES提出済み {myEsCount}件</p>
            </div>

            {/* Interviews */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 mb-3">面接回数</p>
              <div className="flex items-end gap-6">
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">あなた</p>
                  <p className="text-3xl font-bold text-purple-600">{myInterviewCount}<span className="text-sm font-normal text-gray-400 ml-1">回</span></p>
                </div>
                {insights && (
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">内定まで平均{!isRealData && " (参考)"}</p>
                    <p className="text-2xl font-bold text-gray-300">{insights.avg_interviews_before_offer.toFixed(1)}<span className="text-sm font-normal text-gray-300 ml-1">回</span></p>
                  </div>
                )}
              </div>
              {interviews.length > 0 && (
                <p className="text-xs text-gray-400 mt-2">
                  通過率: {interviews.filter(i => i.result !== "PENDING").length > 0
                    ? Math.round((interviews.filter(i => i.result === "PASS").length / interviews.filter(i => i.result !== "PENDING").length) * 100)
                    : 0}%
                </p>
              )}
            </div>

            {/* Profile completeness */}
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <p className="text-xs font-semibold text-gray-500 mb-3">プロフィール完成度</p>
              {profile ? (() => {
                const fields = [profile.university, profile.faculty, profile.grade, profile.careerAxis, profile.gakuchika, profile.selfPr, profile.strengths, profile.weaknesses];
                const filled = fields.filter(Boolean).length;
                const pct = Math.round((filled / fields.length) * 100);
                return (
                  <>
                    <div className="flex items-end gap-4">
                      <p className="text-3xl font-bold text-indigo-600">{pct}<span className="text-sm font-normal text-gray-400 ml-0.5">%</span></p>
                      <p className="text-xs text-gray-400 mb-1">{filled}/{fields.length} 項目入力済み</p>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                      <div className={`h-2 rounded-full ${pct === 100 ? "bg-green-500" : pct >= 60 ? "bg-indigo-500" : "bg-orange-400"}`} style={{ width: `${pct}%` }} />
                    </div>
                  </>
                );
              })() : <p className="text-sm text-gray-400">プロフィール未設定</p>}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
