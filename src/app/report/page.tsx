"use client";

import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useCompanies } from "@/hooks/useCompanies";
import { useEs } from "@/hooks/useEs";
import { useInterviews } from "@/hooks/useInterviews";
import { useObVisits } from "@/hooks/useObVisits";
import { useAptitudeTests } from "@/hooks/useAptitudeTests";
import { useActionItems } from "@/hooks/useActionItems";

interface PdcaResult {
  plan: { weeklyGoal: string; taskCompletion: string };
  do: { highlights: string[]; totalActivity: string };
  check: { score: number; goodPoints: string[]; issues: string[]; insight: string };
  act: { improvements: string[]; nextWeekFocus: string; encouragement: string };
}

async function fetchAI<T>(url: string, body: unknown, retries = 1): Promise<T | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      try {
        return JSON.parse(text);
      } catch {
        if (attempt === retries) return null;
      }
    } catch {
      if (attempt === retries) return null;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  return null;
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? "#00c896" : score >= 60 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "優秀" : score >= 60 ? "良好" : "要改善";
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative w-24 h-24">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f3f4f6" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="15.9" fill="none"
            stroke={color} strokeWidth="3"
            strokeDasharray={`${score} ${100 - score}`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-gray-900">{score}</span>
          <span className="text-[10px] text-gray-400">/ 100</span>
        </div>
      </div>
      <span className="text-xs font-semibold mt-1" style={{ color }}>{label}</span>
    </div>
  );
}

export default function ReportPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { companies } = useCompanies();
  const { esList } = useEs();
  const { interviews } = useInterviews();
  const { visits } = useObVisits();
  const { tests } = useAptitudeTests();
  const { pendingItems, completedItems } = useActionItems();

  const [pdca, setPdca] = useState<PdcaResult | null>(null);
  const [pdcaLoading, setPdcaLoading] = useState(false);
  const [pdcaError, setPdcaError] = useState(false);

  // localStorageからキャッシュを読み込む
  useEffect(() => {
    try {
      const raw = localStorage.getItem("careo_last_pdca");
      if (raw) setPdca(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const runPdca = async () => {
    setPdcaLoading(true);
    setPdcaError(false);
    const esListSlim = esList.map(({ questions: _q, ...rest }) => rest);
    const result = await fetchAI<PdcaResult>("/api/ai/pdca", {
      companies,
      esList: esListSlim,
      interviews,
      profile,
      pendingActions: pendingItems,
      completedActions: completedItems,
      obVisits: visits,
      aptitudeTests: tests,
    });
    if (result && result.check) {
      setPdca(result);
      try { localStorage.setItem("careo_last_pdca", JSON.stringify(result)); } catch { /* ignore */ }
    } else {
      setPdcaError(true);
    }
    setPdcaLoading(false);
  };

  if (profileLoading) {
    return <div className="p-8 text-gray-400 text-sm">読み込み中...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-3xl">

      {/* ===== PDCA分析セクション（全ユーザー） ===== */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PDCAレポート</h1>
            <p className="text-sm text-gray-400 mt-0.5">AIが就活データ全体を分析・スコアリング</p>
          </div>
          <button
            type="button"
            onClick={runPdca}
            disabled={pdcaLoading}
            className="flex items-center gap-2 bg-[#00c896] hover:bg-[#00b586] disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            {pdcaLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                分析中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {pdca ? "再分析する" : "AI分析を実行"}
              </>
            )}
          </button>
        </div>

        {pdcaError && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600 mb-4">
            分析に失敗しました。しばらく待ってから再試行してください。
          </div>
        )}

        {!pdca && !pdcaLoading && (
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-8 text-center">
            <div className="text-4xl mb-3">📊</div>
            <p className="text-gray-700 font-semibold mb-1">週次PDCA分析を実行しよう</p>
            <p className="text-sm text-gray-400">企業・ES・面接・OB訪問・タスクを横断的にAIが分析します</p>
          </div>
        )}

        {pdca && (
          <div className="space-y-4">
            {/* スコアと概要 */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5 flex gap-6 items-start">
              <ScoreRing score={pdca.check.score} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">今週の総合評価</p>
                <p className="text-gray-800 text-sm leading-relaxed mb-2">{pdca.check.insight}</p>
                <div className="bg-[#00c896]/10 text-[#00a87e] text-xs font-semibold px-3 py-1.5 rounded-lg inline-block">
                  💬 {pdca.act.encouragement}
                </div>
              </div>
            </div>

            {/* Plan / Do */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3">📋 Plan — 今週の目標</p>
                <p className="text-sm font-semibold text-gray-800 mb-2">{pdca.plan.weeklyGoal}</p>
                <p className="text-xs text-gray-400">タスク達成: {pdca.plan.taskCompletion}</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl p-5">
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-3">✅ Do — 実績</p>
                <p className="text-xs text-gray-500 mb-2">{pdca.do.totalActivity}</p>
                <ul className="space-y-1">
                  {pdca.do.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                      <span className="text-purple-400 shrink-0 mt-0.5">•</span>{h}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Check */}
            <div className="bg-white border border-gray-100 rounded-2xl p-5">
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3">🔍 Check — 分析</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-2">良い点</p>
                  <ul className="space-y-1.5">
                    {pdca.check.goodPoints.map((g, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                        <span className="text-[#00c896] font-bold shrink-0 mt-0.5">✓</span>{g}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium mb-2">課題</p>
                  <ul className="space-y-1.5">
                    {pdca.check.issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                        <span className="text-amber-500 font-bold shrink-0 mt-0.5">!</span>{issue}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Act */}
            <div className="bg-white border border-[#00c896]/20 rounded-2xl p-5">
              <p className="text-xs font-bold text-[#00a87e] uppercase tracking-wider mb-3">🚀 Act — 来週のアクション</p>
              <div className="bg-[#00c896]/5 rounded-xl px-4 py-2.5 mb-3">
                <p className="text-xs text-gray-500 mb-0.5">最優先事項</p>
                <p className="text-sm font-bold text-[#0D0B21]">{pdca.act.nextWeekFocus}</p>
              </div>
              <ul className="space-y-2">
                {pdca.act.improvements.map((imp, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="w-5 h-5 rounded-full bg-[#00c896]/20 text-[#00a87e] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                    {imp}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
