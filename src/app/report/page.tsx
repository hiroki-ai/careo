"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";
import { useCompanies } from "@/hooks/useCompanies";
import { useEs } from "@/hooks/useEs";
import { useInterviews } from "@/hooks/useInterviews";
import { useObVisits } from "@/hooks/useObVisits";
import { useAptitudeTests } from "@/hooks/useAptitudeTests";
import { useActionItems } from "@/hooks/useActionItems";
import { inferActionLink } from "@/hooks/useActionItems";
import { useToast } from "@/components/ui/Toast";
import { useEvents } from "@/hooks/useEvents";
import { InsightsWidget } from "@/components/dashboard/InsightsWidget";
import { KareoCharacter } from "@/components/kareo/KareoCharacter";
import { PdcaResult } from "@/types";
import { daysUntil } from "@/lib/utils";
import { PageTutorial, PAGE_TUTORIALS } from "@/components/PageTutorial";

const PDCA_CACHE_KEY = "careo_last_pdca";
const PDCA_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const DAILY_MSG_CACHE_KEY = "careo_daily_msg";
const DAILY_MSG_CACHE_TTL = 8 * 60 * 60 * 1000; // 8時間

async function fetchAI<T>(url: string, body: unknown): Promise<T | null | { limitExceeded: true; error: string }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (res.status === 402) {
    const data = await res.json().catch(() => ({ error: "今月の無料枠を使い切りました" }));
    return { limitExceeded: true, error: data.error };
  }
  const text = await res.text();
  if (!text) return null;
  return JSON.parse(text) as T;
}

// ─── ScoreRing ───────────────────────────────────────────────────────────────
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

// ─── 進捗統計グリッド ──────────────────────────────────────────────────────
function StatGrid({ companies, esList, interviews, visits, tests }: {
  companies: { status: string }[];
  esList: { status: string }[];
  interviews: { result: string }[];
  visits: unknown[];
  tests: unknown[];
}) {
  const offered = companies.filter(c => c.status === "OFFERED").length;
  const active = companies.filter(c => !["OFFERED", "REJECTED", "WISHLIST"].includes(c.status)).length;
  const rejected = companies.filter(c => c.status === "REJECTED").length;
  const passRate = interviews.length > 0
    ? Math.round(interviews.filter(i => i.result === "PASS").length / interviews.length * 100)
    : null;

  const stats = [
    { label: "登録企業", value: companies.length, unit: "社", color: "text-gray-900" },
    { label: "選考中", value: active, unit: "社", color: "text-blue-600" },
    { label: "内定", value: offered, unit: "社", color: "text-[#00c896]" },
    { label: "不採用", value: rejected, unit: "社", color: "text-red-500" },
    { label: "面接", value: interviews.length, unit: "件", color: "text-purple-600" },
    { label: "面接通過率", value: passRate ?? "—", unit: passRate !== null ? "%" : "", color: "text-orange-500" },
    { label: "ES提出", value: esList.filter(e => e.status === "SUBMITTED").length, unit: "件", color: "text-indigo-600" },
    { label: "OB/OG訪問", value: visits.length, unit: "件", color: "text-teal-600" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 mb-6">
      {stats.map(s => (
        <div key={s.label} className="bg-white rounded-xl border border-gray-100 p-3 text-center">
          <p className={`text-xl font-bold ${s.color}`}>{s.value}<span className="text-xs font-normal text-gray-400 ml-0.5">{s.unit}</span></p>
          <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

// ─── マイルストーンバッジ ─────────────────────────────────────────────────
interface Badge {
  id: string;
  emoji: string;
  label: string;
  desc: string;
  earned: boolean;
}

function computeBadges({
  companies, esList, interviews, visits, tests, pdca,
}: {
  companies: { status: string }[];
  esList: { status: string }[];
  interviews: { result: string }[];
  visits: unknown[];
  tests: unknown[];
  pdca: PdcaResult | null;
}): Badge[] {
  const offered = companies.filter(c => c.status === "OFFERED").length;
  const applied = companies.filter(c => !["WISHLIST"].includes(c.status)).length;
  const passedInterviews = interviews.filter(i => i.result === "PASS").length;
  const submittedEs = esList.filter(e => e.status === "SUBMITTED").length;

  return [
    { id: "first_entry",   emoji: "🌱", label: "スタートダッシュ",   desc: "最初の企業を登録",           earned: companies.length >= 1 },
    { id: "five_apps",     emoji: "📝", label: "行動派",             desc: "5社以上に応募",              earned: applied >= 5 },
    { id: "ten_apps",      emoji: "🔥", label: "全力就活",           desc: "10社以上に応募",             earned: applied >= 10 },
    { id: "first_es",      emoji: "✉️", label: "ES職人",            desc: "ESを1件提出",               earned: submittedEs >= 1 },
    { id: "five_es",       emoji: "📚", label: "ES量産",             desc: "ES 5件以上を提出",           earned: submittedEs >= 5 },
    { id: "first_itvw",    emoji: "🤝", label: "初面接",             desc: "初めての面接に臨んだ",        earned: interviews.length >= 1 },
    { id: "pass_itvw",     emoji: "⭐", label: "通過者",             desc: "面接を1回以上通過",          earned: passedInterviews >= 1 },
    { id: "three_pass",    emoji: "🚀", label: "連続通過",           desc: "面接を3回以上通過",          earned: passedInterviews >= 3 },
    { id: "ob_visit",      emoji: "🎙️", label: "情報収集家",        desc: "OB/OG訪問を実施",           earned: visits.length >= 1 },
    { id: "test_done",     emoji: "🧠", label: "テスト突破",         desc: "筆記試験を受けた",            earned: tests.length >= 1 },
    { id: "pdca_done",     emoji: "📊", label: "PDCA実践者",         desc: "PDCAレポートを実行",         earned: !!pdca },
    { id: "offered",       emoji: "🏆", label: "内定獲得！",          desc: "内定を1社以上獲得",          earned: offered >= 1 },
  ];
}

function MilestoneBadges({ badges }: { badges: Badge[] }) {
  const earned = badges.filter(b => b.earned);
  const notEarned = badges.filter(b => !b.earned);
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">🏅 マイルストーンバッジ</p>
        <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
          {earned.length} / {badges.length}
        </span>
      </div>
      {/* 獲得済み */}
      <div className="flex flex-wrap gap-2 mb-3">
        {earned.map(b => (
          <div key={b.id} title={b.desc} className="flex flex-col items-center gap-0.5 bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-2 min-w-[60px]">
            <span className="text-2xl">{b.emoji}</span>
            <span className="text-[9px] font-bold text-amber-700 text-center leading-tight">{b.label}</span>
          </div>
        ))}
      </div>
      {/* 未獲得（薄く） */}
      <div className="flex flex-wrap gap-2">
        {notEarned.map(b => (
          <div key={b.id} title={b.desc} className="flex flex-col items-center gap-0.5 bg-gray-50 border border-gray-100 rounded-xl px-2.5 py-2 min-w-[60px] opacity-40 grayscale">
            <span className="text-2xl">{b.emoji}</span>
            <span className="text-[9px] font-bold text-gray-400 text-center leading-tight">{b.label}</span>
          </div>
        ))}
      </div>
      {earned.length > 0 && (
        <p className="text-xs text-gray-400 mt-3 text-center">{earned.length}個のバッジを獲得中！ 残り{notEarned.length}個</p>
      )}
    </div>
  );
}

// ─── 就活ジャーニーマップ ─────────────────────────────────────────────────
const JOURNEY_STAGES = [
  { key: "WISHLIST",      label: "気になる",   emoji: "👀" },
  { key: "APPLIED",       label: "応募",       emoji: "📩" },
  { key: "DOCUMENT",      label: "書類",       emoji: "📄" },
  { key: "INTERVIEW_1",   label: "1次面接",    emoji: "💬" },
  { key: "INTERVIEW_2",   label: "2次面接",    emoji: "💬" },
  { key: "FINAL",         label: "最終",       emoji: "🎯" },
  { key: "OFFERED",       label: "内定",       emoji: "🏆" },
] as const;

function JourneyMap({ companies }: { companies: { status: string }[] }) {
  const counts = JOURNEY_STAGES.map(s => ({
    ...s,
    count: companies.filter(c => c.status === s.key).length,
  }));
  const maxCount = Math.max(...counts.map(c => c.count), 1);

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
      <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-4">🗺️ 就活ジャーニーマップ</p>
      <div className="flex items-end gap-1 sm:gap-2">
        {counts.map((s, i) => (
          <div key={s.key} className="flex flex-col items-center flex-1 min-w-0">
            {/* バー */}
            <div className="w-full flex flex-col items-center gap-1">
              {s.count > 0 && (
                <span className="text-xs font-bold text-gray-700">{s.count}</span>
              )}
              <div
                className={`w-full rounded-t-lg transition-all ${s.key === "OFFERED" ? "bg-[#00c896]" : s.key === "WISHLIST" ? "bg-gray-200" : "bg-blue-400"}`}
                style={{ height: `${Math.max(8, (s.count / maxCount) * 80)}px` }}
              />
            </div>
            {/* 矢印 */}
            {i < counts.length - 1 && (
              <div className="hidden sm:block absolute text-gray-300 text-sm" style={{ transform: "translateX(calc(50% + 4px))" }}>›</div>
            )}
            {/* ラベル */}
            <div className="mt-1 text-center">
              <span className="text-base">{s.emoji}</span>
              <p className="text-[8px] sm:text-[9px] text-gray-400 font-medium leading-tight mt-0.5 truncate w-full">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
      {/* インターン統計もあれば補足 */}
      {companies.filter(c => c.status === "INTERN").length > 0 && (
        <p className="text-xs text-teal-600 mt-3 text-center font-medium">
          🌿 インターン中: {companies.filter(c => c.status === "INTERN").length}社
        </p>
      )}
    </div>
  );
}

// ─── 今日のひとことウィジェット ───────────────────────────────────────────
function DailyMessageWidget({ companies, interviews, profile }: {
  companies: { status: string }[];
  interviews: { result: string }[];
  profile: unknown;
}) {
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    try {
      const raw = localStorage.getItem(DAILY_MSG_CACHE_KEY);
      if (raw) {
        const { data, ts } = JSON.parse(raw);
        if (Date.now() - ts < DAILY_MSG_CACHE_TTL) { setMsg(data); setLoading(false); return; }
      }
    } catch { /* ignore */ }

    void fetch("/api/ai/daily-message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companies, interviews, profile }),
    })
      .then(r => r.json())
      .then((d: { message?: string }) => {
        if (d.message) {
          setMsg(d.message);
          try { localStorage.setItem(DAILY_MSG_CACHE_KEY, JSON.stringify({ data: d.message, ts: Date.now() })); } catch { /* ignore */ }
        }
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-[#00c896]/10 to-[#00a87e]/5 border border-[#00c896]/20 rounded-2xl p-4 mb-6">
        <div className="h-4 bg-[#00c896]/10 rounded-full animate-pulse w-3/4" />
      </div>
    );
  }
  if (!msg) return null;
  return (
    <div className="bg-gradient-to-r from-[#00c896]/10 to-[#00a87e]/5 border border-[#00c896]/20 rounded-2xl p-4 mb-6">
      <p className="text-xs font-bold text-[#00a87e] mb-1">💬 カレオからのひとこと</p>
      <p className="text-sm text-gray-800 leading-relaxed">{msg}</p>
    </div>
  );
}

// ─── メインページ ─────────────────────────────────────────────────────────
export default function ReportPage() {
  const { profile, loading: profileLoading, saveLastPdca } = useProfile();
  const { companies, loading: companiesLoading } = useCompanies();
  const { esList, loading: esLoading } = useEs();
  const { interviews, loading: interviewsLoading } = useInterviews();
  const { visits } = useObVisits();
  const { tests } = useAptitudeTests();
  const { pendingItems, completedItems } = useActionItems();
  const { events } = useEvents();
  const { showToast } = useToast();

  const [pdca, setPdca] = useState<PdcaResult | null>(null);
  const [pdcaLoading, setPdcaLoading] = useState(false);
  const [pdcaError, setPdcaError] = useState(false);
  const hasAutoRun = useRef(false);

  // 1. localStorageから即時表示
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PDCA_CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed.data && parsed.ts) {
        if (Date.now() - parsed.ts < PDCA_CACHE_TTL_MS) setPdca(parsed.data);
        else localStorage.removeItem(PDCA_CACHE_KEY);
      } else if (parsed.check) {
        setPdca(parsed);
      }
    } catch { /* ignore */ }
  }, []);

  // 2. Supabaseキャッシュ（デバイス間同期）
  useEffect(() => {
    if (!profile?.lastPdca || !profile.lastPdcaAt) return;
    const age = Date.now() - new Date(profile.lastPdcaAt).getTime();
    if (age < PDCA_CACHE_TTL_MS) setPdca(profile.lastPdca);
  }, [profile?.lastPdca, profile?.lastPdcaAt]);

  const runPdca = async () => {
    setPdcaLoading(true);
    setPdcaError(false);
    try {
      const esListSlim = esList.map(({ questions: _q, ...rest }) => rest);
      const result = await fetchAI<PdcaResult & { error?: string }>("/api/ai/pdca", {
        companies, esList: esListSlim, interviews, profile,
        pendingActions: pendingItems, completedActions: completedItems,
        obVisits: visits, aptitudeTests: tests,
      });
      if (result && "limitExceeded" in result && result.limitExceeded) {
        showToast(
          result.error,
          "warning",
          { label: "アップグレード", onClick: () => window.location.assign("/upgrade") },
          10000,
        );
        setPdcaError(true);
      } else if (result && "error" in result && result.error) {
        showToast(result.error.includes("多すぎ") ? result.error : "分析に失敗しました。しばらく後に再試行してください。", "error");
        setPdcaError(true);
      } else if (result && "check" in result && result.check) {
        setPdca(result);
        try { localStorage.setItem(PDCA_CACHE_KEY, JSON.stringify({ data: result, ts: Date.now() })); } catch { /* ignore */ }
        saveLastPdca(result);
      } else {
        setPdcaError(true);
      }
    } catch (err) {
      console.error("[pdca]", err);
      showToast("分析に失敗しました。しばらく後に再試行してください。", "error");
      setPdcaError(true);
    } finally {
      setPdcaLoading(false);
    }
  };

  useEffect(() => {
    if (profileLoading || companiesLoading || esLoading || interviewsLoading) return;
    if (pdca) return;
    if (hasAutoRun.current) return;
    hasAutoRun.current = true;
    runPdca();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileLoading, companiesLoading, esLoading, interviewsLoading]);

  if (profileLoading) {
    return <div className="p-8 text-gray-400 text-sm">読み込み中...</div>;
  }

  const badges = computeBadges({ companies, esList, interviews, visits, tests, pdca });

  // 3日以内の締切を集計
  const urgentDeadlines = [
    ...esList
      .filter(e => e.deadline && e.status === "DRAFT")
      .map(e => ({ title: `${companies.find(c => c.id === e.companyId)?.name ?? ""} ES`, days: daysUntil(e.deadline!), link: `/es/${e.id}` })),
    ...interviews
      .filter(i => i.result === "PENDING")
      .map(i => ({ title: `${companies.find(c => c.id === i.companyId)?.name ?? ""} ${i.round}次面接`, days: daysUntil(i.scheduledAt), link: `/interviews/${i.id}` })),
    ...events
      .filter(e => e.status === "upcoming")
      .map(e => ({ title: `${e.companyName} ${e.eventType}`, days: daysUntil(e.scheduledAt), link: "/events" })),
  ]
    .filter(d => d.days >= 0 && d.days <= 3)
    .sort((a, b) => a.days - b.days);

  return (
    <div className="p-4 md:p-8">
      <PageTutorial {...PAGE_TUTORIALS["report"]} pageKey="report" />

      {/* 3日以内の締切アラート */}
      {urgentDeadlines.length > 0 && (
        <div className={`rounded-2xl p-4 mb-6 ${
          urgentDeadlines[0].days === 0 ? "bg-red-50 border border-red-200" :
          urgentDeadlines[0].days === 1 ? "bg-amber-50 border border-amber-200" :
          "bg-blue-50 border border-blue-200"
        }`}>
          <div className="flex items-start gap-3">
            <KareoCharacter expression="encouraging" size={48} className="shrink-0" />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-bold ${
                urgentDeadlines[0].days === 0 ? "text-red-700" :
                urgentDeadlines[0].days === 1 ? "text-amber-700" :
                "text-blue-700"
              }`}>
                {urgentDeadlines[0].days === 0
                  ? "今日が締切の予定があります！"
                  : urgentDeadlines[0].days === 1
                  ? "明日締切の予定があります"
                  : `${urgentDeadlines.length}件が3日以内に迫っています`}
              </p>
              <div className="mt-2 space-y-1">
                {urgentDeadlines.slice(0, 4).map((d, i) => (
                  <Link key={i} href={d.link}>
                    <div className="flex items-center gap-2 text-sm hover:underline">
                      <span className={`font-bold ${
                        d.days === 0 ? "text-red-600" : d.days === 1 ? "text-amber-600" : "text-blue-600"
                      }`}>
                        {d.days === 0 ? "今日" : d.days === 1 ? "明日" : `${d.days}日後`}
                      </span>
                      <span className="text-gray-700">{d.title}</span>
                    </div>
                  </Link>
                ))}
              </div>
              {urgentDeadlines.length > 4 && (
                <Link href="/deadlines" className="text-xs text-gray-500 hover:text-gray-700 mt-1 inline-block">
                  他{urgentDeadlines.length - 4}件 →
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ① 今日のひとこと */}
      {!companiesLoading && !interviewsLoading && (
        <DailyMessageWidget companies={companies} interviews={interviews} profile={profile} />
      )}

      {/* ② 進捗統計グリッド */}
      {!companiesLoading && (
        <StatGrid companies={companies} esList={esList} interviews={interviews} visits={visits} tests={tests} />
      )}

      {/* ③ 就活ジャーニーマップ */}
      {!companiesLoading && companies.length > 0 && (
        <JourneyMap companies={companies} />
      )}

      {/* ④ マイルストーンバッジ */}
      <MilestoneBadges badges={badges} />

      {/* ⑤ 週次コーチへのリンク */}
      <Link href="/weekly-coach">
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl p-4 mb-6 flex items-center justify-between hover:shadow-sm transition-shadow cursor-pointer">
          <div>
            <p className="text-xs font-bold text-purple-600 mb-0.5">🏃 週次コーチセッション</p>
            <p className="text-sm text-gray-700">先週の振り返りと今週のアクションをAIが提案</p>
          </div>
          <svg className="w-5 h-5 text-purple-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Link>

      {/* ===== PDCA分析セクション ===== */}
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

            <div className="bg-white border border-[#00c896]/20 rounded-2xl p-5">
              <p className="text-xs font-bold text-[#00a87e] uppercase tracking-wider mb-3">🚀 Act — 来週のアクション</p>
              <div className="bg-[#00c896]/5 rounded-xl px-4 py-2.5 mb-3">
                <p className="text-xs text-gray-500 mb-0.5">最優先事項</p>
                <p className="text-sm font-bold text-[#0D0B21]">{pdca.act.nextWeekFocus}</p>
              </div>
              <ul className="space-y-2">
                {pdca.act.improvements.map((imp, i) => {
                  const link = inferActionLink(imp);
                  return (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="w-5 h-5 rounded-full bg-[#00c896]/20 text-[#00a87e] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                      <span className="flex-1">{imp}</span>
                      {link && (
                        link.external ? (
                          <a href={link.href} target="_blank" rel="noopener noreferrer"
                            className="shrink-0 text-xs font-semibold text-[#00a87e] bg-[#00c896]/10 px-2.5 py-1 rounded-lg hover:bg-[#00c896]/20 transition-colors whitespace-nowrap">
                            {link.label}
                          </a>
                        ) : (
                          <Link href={link.href}
                            className="shrink-0 text-xs font-semibold text-[#00a87e] bg-[#00c896]/10 px-2.5 py-1 rounded-lg hover:bg-[#00c896]/20 transition-colors whitespace-nowrap">
                            {link.label}
                          </Link>
                        )
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* カレオからの気づき */}
      <div className="mb-8">
        <InsightsWidget />
      </div>

    </div>
  );
}
