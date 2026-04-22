"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useCompanies } from "@/hooks/useCompanies";
import { useEs } from "@/hooks/useEs";
import { useInterviews } from "@/hooks/useInterviews";
import { useProfile } from "@/hooks/useProfile";

function rate(numerator: number, denominator: number): string {
  if (denominator === 0) return "—";
  return `${Math.round((numerator / denominator) * 100)}%`;
}

export default function MetricsPage() {
  const { companies } = useCompanies();
  const { esList } = useEs();
  const { interviews } = useInterviews();
  const { profile } = useProfile();
  const isPro = (profile?.plan ?? "free") === "pro";

  // ES 通過率（resultがpassedの件数 / 結果が出たもの）
  const esStats = useMemo(() => {
    const passed = esList.filter(e => e.result === "passed").length;
    const failed = esList.filter(e => e.result === "failed").length;
    const pending = esList.filter(e => e.result === "pending").length;
    const submitted = esList.filter(e => e.status === "SUBMITTED").length;
    const decided = passed + failed;
    return {
      total: esList.length,
      submitted,
      passed,
      failed,
      pending,
      passRate: rate(passed, decided),
      decidedCount: decided,
    };
  }, [esList]);

  // 面接フェーズ別通過率
  const interviewByRound = useMemo(() => {
    const byRound: Record<number, { pass: number; fail: number; pending: number }> = {};
    for (const i of interviews) {
      if (!byRound[i.round]) byRound[i.round] = { pass: 0, fail: 0, pending: 0 };
      if (i.result === "PASS") byRound[i.round].pass += 1;
      else if (i.result === "FAIL") byRound[i.round].fail += 1;
      else byRound[i.round].pending += 1;
    }
    return Object.entries(byRound)
      .map(([round, stats]) => ({
        round: Number(round),
        ...stats,
        passRate: rate(stats.pass, stats.pass + stats.fail),
      }))
      .sort((a, b) => a.round - b.round);
  }, [interviews]);

  // 企業ステータス別
  const offered = companies.filter(c => c.status === "OFFERED");
  const rejected = companies.filter(c => c.status === "REJECTED");
  const active = companies.filter(c => !["OFFERED", "REJECTED", "WISHLIST"].includes(c.status));

  // 業界別 KPI（有料プラン向け詳細）
  const industryStats = useMemo(() => {
    const stats: Record<string, { applied: number; offered: number; rejected: number; active: number }> = {};
    for (const c of companies) {
      const ind = c.industry || "未分類";
      if (!stats[ind]) stats[ind] = { applied: 0, offered: 0, rejected: 0, active: 0 };
      stats[ind].applied += 1;
      if (c.status === "OFFERED") stats[ind].offered += 1;
      else if (c.status === "REJECTED") stats[ind].rejected += 1;
      else if (c.status !== "WISHLIST") stats[ind].active += 1;
    }
    return Object.entries(stats)
      .map(([industry, s]) => ({
        industry,
        ...s,
        offerRate: rate(s.offered, s.applied),
        winRate: rate(s.offered, s.offered + s.rejected),
      }))
      .sort((a, b) => b.applied - a.applied);
  }, [companies]);

  const hasData = esStats.total > 0 || interviews.length > 0 || companies.length > 0;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">KPIダッシュボード</h1>
        <p className="text-sm text-gray-500 mt-1">
          選考の通過率・ボトルネックが一目で見える
        </p>
      </div>

      {!hasData && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
          <p className="text-sm text-amber-800 font-semibold mb-1">まだデータがありません</p>
          <p className="text-xs text-amber-700 mb-4">企業・ES・面接を登録するとKPIが自動計算されます</p>
          <Link href="/companies" className="inline-block px-4 py-2 bg-[#00c896] text-white text-sm font-semibold rounded-lg hover:bg-[#00b088] transition-colors">
            企業を追加する →
          </Link>
        </div>
      )}

      {hasData && (
        <>
          {/* 企業サマリー */}
          <section className="mb-6">
            <h2 className="text-sm font-bold text-gray-700 mb-3">企業サマリー</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard label="応募企業数" value={companies.length} color="blue" />
              <StatCard label="選考中" value={active.length} color="purple" />
              <StatCard label="内定" value={offered.length} color="green" />
              <StatCard label="不採用" value={rejected.length} color="red" />
            </div>
          </section>

          {/* ES通過率 */}
          <section className="mb-6">
            <h2 className="text-sm font-bold text-gray-700 mb-3">ES通過率</h2>
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <div className="flex items-end gap-4 mb-3">
                <div>
                  <p className="text-4xl font-black text-[#00c896]">{esStats.passRate}</p>
                  <p className="text-xs text-gray-500 mt-1">結果判明 {esStats.decidedCount} 件中</p>
                </div>
                <div className="flex-1 flex gap-4 text-xs text-gray-600 flex-wrap">
                  <span>提出済 <b className="text-gray-900">{esStats.submitted}</b></span>
                  <span>通過 <b className="text-emerald-600">{esStats.passed}</b></span>
                  <span>不通過 <b className="text-red-500">{esStats.failed}</b></span>
                  <span>結果待ち <b className="text-amber-500">{esStats.pending}</b></span>
                </div>
              </div>
              {/* プログレスバー */}
              {esStats.decidedCount > 0 && (
                <div className="flex h-2 rounded-full overflow-hidden bg-gray-100">
                  <div className="bg-emerald-500" style={{ width: `${(esStats.passed / esStats.decidedCount) * 100}%` }} />
                  <div className="bg-red-400" style={{ width: `${(esStats.failed / esStats.decidedCount) * 100}%` }} />
                </div>
              )}
            </div>
          </section>

          {/* 面接フェーズ別通過率 */}
          {interviewByRound.length > 0 && (
            <section className="mb-6">
              <h2 className="text-sm font-bold text-gray-700 mb-3">面接フェーズ別通過率</h2>
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="text-left py-2.5 px-4 font-semibold">フェーズ</th>
                      <th className="text-right py-2.5 px-4 font-semibold">通過</th>
                      <th className="text-right py-2.5 px-4 font-semibold">不通過</th>
                      <th className="text-right py-2.5 px-4 font-semibold">待ち</th>
                      <th className="text-right py-2.5 px-4 font-semibold">通過率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {interviewByRound.map((r) => (
                      <tr key={r.round} className="border-t border-gray-100">
                        <td className="py-2.5 px-4 font-semibold text-gray-900">{r.round}次面接</td>
                        <td className="py-2.5 px-4 text-right text-emerald-600 font-semibold">{r.pass}</td>
                        <td className="py-2.5 px-4 text-right text-red-500">{r.fail}</td>
                        <td className="py-2.5 px-4 text-right text-amber-500">{r.pending}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-[#00a87e]">{r.passRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* 業界別分析（プレビュー→有料で詳細） */}
          {industryStats.length > 0 && (
            <section className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-700">業界別の勝率</h2>
                {!isPro && (
                  <Link href="/upgrade" className="text-xs text-[#00a87e] hover:underline font-semibold">
                    有料プランで全業界を表示 →
                  </Link>
                )}
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs text-gray-500">
                    <tr>
                      <th className="text-left py-2.5 px-4 font-semibold">業界</th>
                      <th className="text-right py-2.5 px-4 font-semibold">応募</th>
                      <th className="text-right py-2.5 px-4 font-semibold">内定</th>
                      <th className="text-right py-2.5 px-4 font-semibold">勝率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(isPro ? industryStats : industryStats.slice(0, 2)).map((s) => (
                      <tr key={s.industry} className="border-t border-gray-100">
                        <td className="py-2.5 px-4 font-semibold text-gray-900">{s.industry}</td>
                        <td className="py-2.5 px-4 text-right text-gray-600">{s.applied}</td>
                        <td className="py-2.5 px-4 text-right text-emerald-600 font-semibold">{s.offered}</td>
                        <td className="py-2.5 px-4 text-right font-bold text-[#00a87e]">{s.winRate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!isPro && industryStats.length > 2 && (
                  <div className="bg-gradient-to-b from-transparent to-white px-4 py-5 text-center">
                    <p className="text-xs text-gray-500 mb-2">あと{industryStats.length - 2}業界の詳細・勝ちパターン分析は有料プランで</p>
                    <Link href="/upgrade" className="inline-block px-4 py-2 bg-[#00c896] text-white text-sm font-semibold rounded-lg hover:bg-[#00b088] transition-colors">
                      有料プランにアップグレード →
                    </Link>
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: "blue" | "purple" | "green" | "red" }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    green: "bg-emerald-50 text-emerald-600 border-emerald-100",
    red: "bg-red-50 text-red-500 border-red-100",
  };
  return (
    <div className={`border rounded-2xl p-4 ${colors[color]}`}>
      <p className="text-xs font-semibold opacity-70">{label}</p>
      <p className="text-3xl font-black mt-1">{value}</p>
    </div>
  );
}
