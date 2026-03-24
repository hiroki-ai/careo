"use client";

import { useEffect, useState } from "react";

interface Report {
  period: { year: number; month: number };
  totalStudents: number;
  meetingSummary: { totalMeetings: number; uniqueStudents: number; outcomes: Record<string, number> };
  offerRateComparison: {
    withMeeting: { count: number; offerRate: number };
    withoutMeeting: { count: number; offerRate: number };
  };
  esReviewSummary: { total: number; completed: number };
  newCompaniesRegistered: number;
  overallOfferRate: number;
}

const OUTCOME_LABELS: Record<string, string> = {
  positive: "良好",
  neutral: "通常",
  followup_needed: "フォロー必要",
};
const OUTCOME_COLORS: Record<string, string> = {
  positive: "bg-green-100 text-green-700",
  neutral: "bg-gray-100 text-gray-600",
  followup_needed: "bg-amber-100 text-amber-700",
};

export default function ReportPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/career-portal/report?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [year, month]);

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">支援効果レポート</h1>
          <p className="text-sm text-gray-500 mt-1">面談実績と就活支援の効果を月次で確認できます</p>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="text-sm px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors print:hidden"
        >
          🖨 PDF保存
        </button>
      </div>

      {/* 月選択 */}
      <div className="flex items-center gap-4 print:hidden">
        <button type="button" onClick={prevMonth} className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50">←</button>
        <p className="text-lg font-semibold text-gray-800 min-w-[120px] text-center">{year}年{month}月</p>
        <button type="button" onClick={nextMonth} className="p-2 rounded-lg bg-white border border-gray-200 hover:bg-gray-50">→</button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>
      ) : !data ? (
        <p className="text-gray-500">データを読み込めませんでした</p>
      ) : (
        <>
          {/* KPI */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">当月面談数</p>
              <p className="text-3xl font-bold text-gray-900">{data.meetingSummary.totalMeetings}</p>
              <p className="text-xs text-gray-400 mt-1">{data.meetingSummary.uniqueStudents}名の学生</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">ES添削依頼</p>
              <p className="text-3xl font-bold text-gray-900">{data.esReviewSummary.total}</p>
              <p className="text-xs text-gray-400 mt-1">返信済み {data.esReviewSummary.completed}件</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">新規企業登録</p>
              <p className="text-3xl font-bold text-blue-600">{data.newCompaniesRegistered}</p>
              <p className="text-xs text-gray-400 mt-1">社（当月）</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500 mb-1">全体内定率</p>
              <p className="text-3xl font-bold text-green-600">{data.overallOfferRate}%</p>
              <p className="text-xs text-gray-400 mt-1">{data.totalStudents}名中</p>
            </div>
          </div>

          {/* 面談効果比較（最重要指標） */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-1">面談の効果：内定率比較</h2>
            <p className="text-xs text-gray-400 mb-4">キャリアセンターとの面談経験がある学生とない学生の内定率を比較します</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
                <p className="text-xs font-semibold text-blue-500 mb-1">面談あり</p>
                <p className="text-4xl font-black text-blue-700">{data.offerRateComparison.withMeeting.offerRate}%</p>
                <p className="text-xs text-gray-400 mt-1">{data.offerRateComparison.withMeeting.count}名</p>
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
                <p className="text-xs font-semibold text-gray-500 mb-1">面談なし</p>
                <p className="text-4xl font-black text-gray-600">{data.offerRateComparison.withoutMeeting.offerRate}%</p>
                <p className="text-xs text-gray-400 mt-1">{data.offerRateComparison.withoutMeeting.count}名</p>
              </div>
            </div>
            {data.offerRateComparison.withMeeting.count > 0 && data.offerRateComparison.withoutMeeting.count > 0 && (
              <p className="text-sm text-center mt-4 font-medium text-gray-700">
                面談あり学生は内定率が
                <span className={`font-black mx-1 ${data.offerRateComparison.withMeeting.offerRate > data.offerRateComparison.withoutMeeting.offerRate ? "text-green-600" : "text-gray-500"}`}>
                  {data.offerRateComparison.withMeeting.offerRate - data.offerRateComparison.withoutMeeting.offerRate > 0 ? "+" : ""}
                  {data.offerRateComparison.withMeeting.offerRate - data.offerRateComparison.withoutMeeting.offerRate}pt
                </span>
                高い
              </p>
            )}
          </div>

          {/* 面談アウトカム内訳 */}
          {data.meetingSummary.totalMeetings > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">面談アウトカム内訳</h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(data.meetingSummary.outcomes).map(([outcome, count]) => (
                  <div key={outcome} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${OUTCOME_COLORS[outcome] ?? "bg-gray-100 text-gray-600"}`}>
                    <span className="text-sm font-semibold">{count}件</span>
                    <span className="text-xs">{OUTCOME_LABELS[outcome] ?? outcome}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
