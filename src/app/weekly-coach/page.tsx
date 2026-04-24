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
import { CareoKun } from "@/components/landing/CareoKun";
import { AppCard } from "@/components/ui/app";

const CACHE_KEY = "careo_weekly_coach";
const CACHE_TTL = 60 * 60 * 1000;

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

function getWeekRange() {
  const today = new Date();
  const day = today.getDay();
  const diffToStart = (day + 1) % 7;
  const start = new Date(today);
  start.setDate(today.getDate() - diffToStart);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  const fmt = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日`;
  const wd = ["日", "月", "火", "水", "木", "金", "土"];
  return `${fmt(start)} (${wd[start.getDay()]}) 〜 ${fmt(end)} (${wd[end.getDay()]})`;
}

function getWeekNumber() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = (now.getTime() - start.getTime()) / 86400000;
  return Math.ceil((diff + start.getDay() + 1) / 7);
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

  return (
    <div style={{ background: "var(--app-surface-1)", minHeight: "100vh", color: "var(--app-text)" }}>
      <PageTutorial {...PAGE_TUTORIALS["weekly-coach"]} pageKey="weekly-coach" />
      <div
        className="flex flex-col"
        style={{ padding: "22px 16px 120px", maxWidth: 1080, margin: "0 auto", gap: 18 }}
      >
        {/* Header */}
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <div
              style={{
                fontSize: 11,
                color: "var(--app-text-muted)",
                fontWeight: 800,
                letterSpacing: 1.5,
                marginBottom: 6,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span>WEEK {getWeekNumber()} · 2026</span>
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 800,
                  color: "var(--app-accent)",
                  background: "var(--app-accent-soft)",
                  border: "1px solid rgba(0,200,150,.3)",
                  borderRadius: 999,
                  padding: "2px 8px",
                  letterSpacing: 0.5,
                }}
              >
                採用コンサル視点
              </span>
            </div>
            <h1
              className="font-klee"
              style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}
            >
              今週のふりかえり
            </h1>
            <div style={{ fontSize: 12, color: "var(--app-text-muted)", marginTop: 4 }}>
              {getWeekRange()}
            </div>
          </div>
          <button
            type="button"
            onClick={run}
            disabled={loading}
            style={{
              padding: "9px 16px",
              fontSize: 12,
              fontWeight: 800,
              borderRadius: "var(--app-r-pill)",
              background: loading ? "var(--app-surface-2)" : "var(--app-accent)",
              color: loading ? "var(--app-text-muted)" : "white",
              border: "none",
              cursor: loading ? "wait" : "pointer",
              boxShadow: loading ? "none" : "var(--app-shadow-teal)",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {loading ? (
              <>
                <svg className="w-4 h-4" style={{ animation: "app-ring-rotate 1s linear infinite" }} fill="none" viewBox="0 0 24 24">
                  <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                分析中…
              </>
            ) : result ? "再生成" : "セッション開始"}
          </button>
        </div>

        {limitExceeded && (
          <div
            className="text-center"
            style={{
              padding: 24,
              background: "var(--app-accent-soft)",
              border: "1px solid rgba(0,200,150,.3)",
              borderRadius: "var(--app-r-lg)",
            }}
          >
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--app-text)", marginBottom: 6 }}>
              週次コーチは有料プラン限定機能です
            </div>
            <div style={{ fontSize: 11.5, color: "var(--app-text-muted)", marginBottom: 14 }}>
              先週の面接ログから、感情パターンと次週の注力ポイントをAIが振り返ります
            </div>
            <Link
              href="/upgrade"
              style={{
                display: "inline-block",
                padding: "10px 20px",
                fontSize: 13,
                fontWeight: 800,
                borderRadius: "var(--app-r-pill)",
                background: "var(--app-accent)",
                color: "white",
                textDecoration: "none",
                boxShadow: "var(--app-shadow-teal)",
              }}
            >
              有料プランにアップグレード →
            </Link>
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "12px 16px",
              background: "var(--app-danger-soft)",
              border: "1px solid rgba(220,38,38,.22)",
              borderRadius: "var(--app-r-md)",
              fontSize: 12.5,
              color: "var(--app-danger)",
            }}
          >
            分析に失敗しました。しばらく後に再試行してください。
          </div>
        )}

        {loading && !result && (
          <div className="flex flex-col gap-2.5">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  padding: 20,
                  background: "var(--app-surface-0)",
                  border: "1px solid var(--app-border)",
                  borderRadius: "var(--app-r-lg)",
                }}
              >
                <div className="app-skeleton-shimmer" style={{ width: "30%", height: 12, borderRadius: 4, marginBottom: 10 }} />
                <div className="app-skeleton-shimmer" style={{ width: "100%", height: 10, borderRadius: 4, marginBottom: 6 }} />
                <div className="app-skeleton-shimmer" style={{ width: "85%", height: 10, borderRadius: 4 }} />
              </div>
            ))}
          </div>
        )}

        {result && (
          <>
            {/* Hero with Kareo speech */}
            <div
              className="grid items-center"
              style={{
                gridTemplateColumns: "1fr",
                background: "linear-gradient(160deg, var(--app-accent-soft), var(--app-surface-0) 70%)",
                border: "1px solid rgba(0,200,150,.22)",
                borderRadius: "var(--app-r-xl)",
                padding: 20,
                gap: 16,
              }}
            >
              <div className="flex items-start gap-3">
                <div style={{ flexShrink: 0 }}>
                  <CareoKun size={52} mood="celebrate" />
                </div>
                <div
                  className="handwriting-text"
                  style={{
                    fontSize: 14,
                    lineHeight: 1.9,
                    color: "var(--app-text)",
                    background: "white",
                    border: "1.5px solid var(--app-text)",
                    borderRadius: 14,
                    padding: "12px 16px",
                    boxShadow: "3px 3px 0 var(--app-text)",
                    maxWidth: "100%",
                  }}
                >
                  {result.reflection.summary}
                </div>
              </div>
            </div>

            {/* Reflection */}
            <AppCard title="先週の振り返り" accent>
              {result.reflection.moodAnalysis && (
                <div
                  style={{
                    padding: 14,
                    background: "var(--app-accent-soft)",
                    border: "1px solid rgba(0,200,150,.22)",
                    borderRadius: "var(--app-r-md)",
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: "var(--app-accent-deep)",
                      letterSpacing: 1.5,
                      marginBottom: 6,
                    }}
                  >
                    感情パターンから
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--app-text)", lineHeight: 1.8 }}>
                    {result.reflection.moodAnalysis}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: "var(--app-success)",
                      letterSpacing: 1.5,
                      marginBottom: 8,
                    }}
                  >
                    ✓ 頑張ったこと
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                    {result.reflection.highlights.map((h, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2"
                        style={{ fontSize: 12.5, color: "var(--app-text)", lineHeight: 1.8, marginBottom: 6 }}
                      >
                        <span style={{ color: "var(--app-success)", fontWeight: 800, flexShrink: 0 }}>✓</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: "var(--app-warning)",
                      letterSpacing: 1.5,
                      marginBottom: 8,
                    }}
                  >
                    ! 課題
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none" }}>
                    {result.reflection.challenges.map((c, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2"
                        style={{ fontSize: 12.5, color: "var(--app-text)", lineHeight: 1.8, marginBottom: 6 }}
                      >
                        <span style={{ color: "var(--app-warning)", fontWeight: 800, flexShrink: 0 }}>!</span>
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </AppCard>

            {/* This week focus */}
            <AppCard title="今週のフォーカス" accent>
              <div
                style={{
                  padding: "12px 16px",
                  background: "var(--app-accent-soft)",
                  border: "1px solid rgba(0,200,150,.22)",
                  borderRadius: "var(--app-r-md)",
                  marginBottom: 14,
                }}
              >
                <div style={{ fontSize: 10.5, color: "var(--app-text-muted)", marginBottom: 2 }}>
                  最優先テーマ
                </div>
                <div
                  className="font-klee"
                  style={{ fontSize: 16, fontWeight: 700, color: "var(--app-text)" }}
                >
                  {result.thisWeek.focus}
                </div>
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: "none", marginBottom: 14 }}>
                {result.thisWeek.actions.map((action, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5"
                    style={{ fontSize: 13, color: "var(--app-text)", lineHeight: 1.8, marginBottom: 8 }}
                  >
                    <span
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        background: "var(--app-accent-soft)",
                        color: "var(--app-accent-deep)",
                        display: "grid",
                        placeItems: "center",
                        fontSize: 11,
                        fontWeight: 800,
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      {i + 1}
                    </span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
              <div
                style={{
                  padding: "10px 14px",
                  background: "var(--app-accent-soft)",
                  border: "1px solid rgba(0,200,150,.22)",
                  borderRadius: "var(--app-r-md)",
                  fontSize: 13,
                  fontWeight: 700,
                  color: "var(--app-accent-deep)",
                }}
              >
                💬 {result.thisWeek.encouragement}
              </div>
            </AppCard>

            {/* Insight */}
            <AppCard title="コーチからの気づき">
              <div
                style={{
                  fontSize: 13,
                  color: "var(--app-text)",
                  lineHeight: 1.9,
                }}
              >
                💡 {result.insight}
              </div>
            </AppCard>
          </>
        )}

        {!result && !loading && (
          <div
            className="text-center"
            style={{
              padding: "40px 20px",
              background: "var(--app-surface-0)",
              border: "1px dashed var(--app-border-strong)",
              borderRadius: "var(--app-r-lg)",
            }}
          >
            <div style={{ marginBottom: 14 }}>
              <CareoKun size={80} mood="think" />
            </div>
            <div
              className="font-klee"
              style={{ fontSize: 17, fontWeight: 700, color: "var(--app-text)", marginBottom: 6 }}
            >
              週次コーチセッションを始めよう
            </div>
            <div
              style={{
                fontSize: 12.5,
                color: "var(--app-text-muted)",
                lineHeight: 1.8,
                maxWidth: 360,
                margin: "0 auto",
              }}
            >
              先週の振り返りと今週のアクションをAIがパーソナライズして提案します
            </div>
            {profile?.graduationYear && (
              <div
                style={{
                  fontSize: 11,
                  color: "var(--app-text-dim)",
                  marginTop: 10,
                }}
              >
                面接後に感情タグを記録しておくと、より深い分析ができます
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
