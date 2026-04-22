"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";
import { useCompanies } from "@/hooks/useCompanies";
import { useEs } from "@/hooks/useEs";
import { useInterviews } from "@/hooks/useInterviews";
import { useObVisits } from "@/hooks/useObVisits";
import { useAptitudeTests } from "@/hooks/useAptitudeTests";
import { PageTutorial, PAGE_TUTORIALS } from "@/components/PageTutorial";

const CACHE_KEY = "careo_weekly_coach";
const CACHE_TTL = 60 * 60 * 1000; // 1時間

interface WeeklyCoachResult {
  reflection: {
    summary: string;
    moodAnalysis?: string;
    highlights: string[];
    challenges: string[];
  };
  thisWeek: {
    focus: string;
    actions: string[];
    encouragement: string;
  };
  insight: string;
}

export default function WeeklyCoachPage() {
  const { profile, loading: profileLoading } = useProfile();
  const { companies, loading: companiesLoading } = useCompanies();
  const { esList, loading: esLoading } = useEs();
  const { interviews, loading: interviewsLoading } = useInterviews();
  const { visits } = useObVisits();
  const { tests } = useAptitudeTests();

  const [result, setResult] = useState<WeeklyCoachResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [limitExceeded, setLimitExceeded] = useState(false);
  const hasAutoRun = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return;
      const { data, ts } = JSON.parse(raw);
      if (Date.now() - ts < CACHE_TTL) setResult(data);
      else localStorage.removeItem(CACHE_KEY);
    } catch { /* ignore */ }
  }, []);

  const run = async () => {
    setLoading(true);
    setError(false);
    setLimitExceeded(false);
    try {
      const esListSlim = esList.map(({ questions: _q, ...rest }) => rest);
      const res = await fetch("/api/ai/weekly-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companies, esList: esListSlim, interviews, profile, obVisits: visits, aptitudeTests: tests }),
      });
      if (res.status === 402) {
        setLimitExceeded(true);
        return;
      }
      if (!res.ok) throw new Error();
      const data = await res.json() as WeeklyCoachResult;
      if (data.reflection) {
        setResult(data);
        localStorage.setItem(CACHE_KEY, JSON.stringify({ data, ts: Date.now() }));
      } else {
        setError(true);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profileLoading || companiesLoading || esLoading || interviewsLoading) return;
    if (result || hasAutoRun.current) return;
    hasAutoRun.current = true;
    void run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileLoading, companiesLoading, esLoading, interviewsLoading]);

  const today = new Date();
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日（${dayNames[today.getDay()]}）`;

  return (
    <div className="p-4 md:p-8">
      <PageTutorial {...PAGE_TUTORIALS["weekly-coach"]} pageKey="weekly-coach" />
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">週次コーチセッション</h1>
          <p className="text-sm text-gray-400 mt-0.5">{dateStr} — AIが先週を振り返り、今週を設計します</p>
        </div>
        <button
          type="button"
          onClick={run}
          disabled={loading}
          className="flex items-center gap-2 bg-[#00c896] hover:bg-[#00b586] disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors"
        >
          {loading ? (
            <>
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              分析中...
            </>
          ) : result ? "再生成" : "セッション開始"}
        </button>
      </div>

      {limitExceeded && (
        <div className="bg-[#00c896]/5 border-2 border-[#00c896]/30 rounded-2xl p-6 mb-4 text-center">
          <p className="text-base font-bold text-gray-900 mb-1">週次コーチは有料プラン限定機能です</p>
          <p className="text-xs text-gray-500 mb-4">先週の面接ログから、感情パターンと次週の注力ポイントをAIが振り返ります</p>
          <Link href="/upgrade" className="inline-block px-5 py-2.5 bg-[#00c896] text-white text-sm font-bold rounded-xl hover:bg-[#00b088] transition-colors">
            有料プランにアップグレード →
          </Link>
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-600 mb-4">
          分析に失敗しました。しばらく後に再試行してください。
        </div>
      )}

      {loading && !result && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="h-3 bg-gray-100 rounded-full animate-pulse w-1/3 mb-3" />
              <div className="h-4 bg-gray-100 rounded-full animate-pulse w-full mb-2" />
              <div className="h-4 bg-gray-100 rounded-full animate-pulse w-4/5" />
            </div>
          ))}
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* 先週の振り返り */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-3">📅 先週の振り返り</p>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">{result.reflection.summary}</p>
            {result.reflection.moodAnalysis && (
              <div className="bg-purple-50 rounded-xl p-3 mb-3">
                <p className="text-xs font-semibold text-purple-700 mb-1">感情パターンから</p>
                <p className="text-sm text-purple-800">{result.reflection.moodAnalysis}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1.5">頑張ったこと</p>
                <ul className="space-y-1">
                  {result.reflection.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                      <span className="text-[#00c896] font-bold shrink-0 mt-0.5">✓</span>{h}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs text-gray-400 font-medium mb-1.5">課題</p>
                <ul className="space-y-1">
                  {result.reflection.challenges.map((c, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-gray-700">
                      <span className="text-amber-500 font-bold shrink-0 mt-0.5">!</span>{c}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 今週のフォーカス */}
          <div className="bg-white border border-[#00c896]/20 rounded-2xl p-5">
            <p className="text-xs font-bold text-[#00a87e] uppercase tracking-wider mb-3">🎯 今週のフォーカス</p>
            <div className="bg-[#00c896]/10 rounded-xl px-4 py-3 mb-4">
              <p className="text-xs text-gray-500 mb-0.5">最優先テーマ</p>
              <p className="text-base font-bold text-[#0D0B21]">{result.thisWeek.focus}</p>
            </div>
            <ul className="space-y-2 mb-4">
              {result.thisWeek.actions.map((action, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="w-5 h-5 rounded-full bg-[#00c896]/20 text-[#00a87e] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                  {action}
                </li>
              ))}
            </ul>
            <div className="bg-[#00c896]/5 border border-[#00c896]/20 rounded-xl px-4 py-2.5">
              <p className="text-sm font-semibold text-[#00a87e]">💬 {result.thisWeek.encouragement}</p>
            </div>
          </div>

          {/* 全体的な気づき */}
          <div className="bg-white border border-gray-100 rounded-2xl p-5">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">💡 コーチからの気づき</p>
            <p className="text-sm text-gray-700 leading-relaxed">{result.insight}</p>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div className="bg-gray-50 border border-gray-100 rounded-2xl p-10 text-center">
          <div className="text-5xl mb-4">🏃</div>
          <p className="text-gray-700 font-semibold mb-1">週次コーチセッションを始めよう</p>
          <p className="text-sm text-gray-400">先週の振り返りと今週のアクションをAIがパーソナライズして提案します</p>
          {profile?.graduationYear && (
            <p className="text-xs text-gray-300 mt-2">面接後に感情タグを記録しておくと、より深い分析ができます</p>
          )}
        </div>
      )}
    </div>
  );
}
