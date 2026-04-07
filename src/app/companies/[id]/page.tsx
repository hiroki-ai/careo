"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCompanies } from "@/hooks/useCompanies";
import { useEs } from "@/hooks/useEs";
import { useInterviews } from "@/hooks/useInterviews";
import { useChat } from "@/hooks/useChat";
import { useProfile } from "@/hooks/useProfile";
import { CompanyForm } from "@/components/companies/CompanyForm";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { COMPANY_STATUS_ORDER, COMPANY_STATUS_LABELS, SelectionSchedule } from "@/types";
import { formatDate, formatDateTime } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

interface ResearchResult {
  overview: string;
  industryPosition?: string;
  strengths: string[];
  culture: string;
  recentNews: string[];
  interviewPoints: string[];
  whyUs: string;
}

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { companies, updateCompany, deleteCompany, addCompany } = useCompanies();
  const { esList } = useEs();
  const { interviews } = useInterviews();
  const { recentUserMessages } = useChat();
  const { profile } = useProfile();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);
  const [isOfferedTypeOpen, setIsOfferedTypeOpen] = useState(false);
  const [aiDetecting, setAiDetecting] = useState(false);
  const [aiDetected, setAiDetected] = useState<{ isInternOffer: boolean | null; reason: string } | null>(null);
  const { showToast } = useToast();

  // 選考日程
  const [schedule, setSchedule] = useState<SelectionSchedule | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  // 企業研究
  const [research, setResearch] = useState<ResearchResult | null>(() => {
    // ai_researchフィールドが既存ならパース
    return null; // companyがまだないので後でセット
  });
  const [researchLoading, setResearchLoading] = useState(false);
  const [researchMemo, setResearchMemo] = useState("");
  const [memoEditing, setMemoEditing] = useState(false);

  const company = companies.find((c) => c.id === id);
  const companyEs = esList.filter((e) => e.companyId === id);
  const companyInterviews = interviews
    .filter((i) => i.companyId === id)
    .sort((a, b) => a.round - b.round);

  // ai_researchの初期化（companyが解決したとき）
  const savedResearch = (() => {
    if (!company?.ai_research) return null;
    try { return JSON.parse(company.ai_research) as ResearchResult; } catch { return null; }
  })();
  const displayResearch = research ?? savedResearch;

  // 選考日程の初期化
  const savedSchedule = (() => {
    if (!company?.selection_schedule) return null;
    try { return JSON.parse(company.selection_schedule) as SelectionSchedule; } catch { return null; }
  })();
  const displaySchedule = schedule ?? savedSchedule;

  // 企業登録後にDBに保存されるまでの間、まだ未取得なら自動フェッチ
  useEffect(() => {
    if (!company || company.selection_schedule || scheduleLoading) return;
    setScheduleLoading(true);
    void fetch("/api/ai/selection-schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        companyName: company.name,
        industry: company.industry,
        graduationYear: profile?.graduationYear,
      }),
    }).then(async (res) => {
      if (!res.ok) return;
      const data = await res.json() as SelectionSchedule;
      setSchedule(data);
      await updateCompany(id, { selection_schedule: JSON.stringify(data) });
    }).catch(() => { /* 失敗は無視 */ })
      .finally(() => setScheduleLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company?.id]);

  const runSchedule = async () => {
    if (!company) return;
    setScheduleLoading(true);
    try {
      const res = await fetch("/api/ai/selection-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: company.name,
          industry: company.industry,
          graduationYear: profile?.graduationYear,
        }),
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json() as SelectionSchedule;
      setSchedule(data);
      await updateCompany(id, { selection_schedule: JSON.stringify(data) });
      showToast("選考日程を更新しました", "success");
    } catch {
      showToast("選考日程の取得に失敗しました", "error");
    } finally {
      setScheduleLoading(false);
    }
  };

  const runResearch = async () => {
    if (!company) return;
    setResearchLoading(true);
    try {
      const res = await fetch("/api/ai/company-research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: company.name,
          industry: company.industry,
          profile: {
            careerAxis: profile?.careerAxis,
            targetIndustries: profile?.targetIndustries,
            graduationYear: profile?.graduationYear,
          },
        }),
      });
      if (!res.ok) throw new Error("failed");
      const data = await res.json() as ResearchResult;
      setResearch(data);
      await updateCompany(id, { ai_research: JSON.stringify(data) });
      showToast("企業分析を保存しました", "success");
    } catch {
      showToast("企業分析に失敗しました。しばらく後に再試行してください。", "error");
    } finally {
      setResearchLoading(false);
    }
  };

  const saveMemo = async () => {
    await updateCompany(id, { notes: researchMemo });
    setMemoEditing(false);
    showToast("メモを保存しました", "success");
  };

  if (!company) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">企業が見つかりません</p>
        <Link href="/companies" className="text-blue-600 text-sm mt-2 inline-block">← 企業一覧に戻る</Link>
      </div>
    );
  }

  const currentStatusIndex = COMPANY_STATUS_ORDER.indexOf(company.status);

  const handleDelete = () => {
    const snapshot = { ...company };
    setIsDeleteConfirm(false);
    router.push("/companies");
    // 即時削除 → UNDOトースト表示
    deleteCompany(id);
    showToast(
      `「${snapshot.name}」を削除しました`,
      "warning",
      {
        label: "元に戻す",
        onClick: async () => {
          // 削除後のrestore: addCompanyで再登録
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = snapshot;
          await addCompany(rest as Parameters<typeof addCompany>[0]);
        },
      },
      8000,
    );
  };

  return (
    <div className="p-4 md:p-8">
      {/* ヘッダー */}
      <div className="mb-6">
        <Link href="/companies" className="text-sm text-gray-400 hover:text-gray-600 mb-3 inline-block">
          ← 企業一覧
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            {company.industry && <p className="text-gray-500 mt-1">{company.industry}</p>}
            <div className="flex flex-wrap gap-3 mt-2">
              {company.mypage_url && (
                <a href={company.mypage_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded-full hover:bg-blue-700 font-medium">
                  マイページを開く →
                </a>
              )}
              {company.url && (
                <a href={company.url} target="_blank" rel="noopener noreferrer"
                  className="text-gray-400 text-sm hover:underline">
                  企業サイト
                </a>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => setIsEditOpen(true)}>編集</Button>
            <Button variant="danger" size="sm" onClick={() => setIsDeleteConfirm(true)}>削除</Button>
          </div>
        </div>
      </div>

      {/* 選考フロー */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <h2 className="font-semibold text-gray-900 mb-4">選考フロー</h2>
        <div className="flex items-center gap-1 flex-wrap">
          {COMPANY_STATUS_ORDER.filter(s => s !== "REJECTED").map((s, i, arr) => {
            const isCurrent = s === company.status;
            const isPast = COMPANY_STATUS_ORDER.indexOf(s) < currentStatusIndex && company.status !== "REJECTED";
            const displayLabel = s === "OFFERED" && company.status === "OFFERED"
              ? (company.is_intern_offer ? "インターン合格" : "内定")
              : COMPANY_STATUS_LABELS[s];
            return (
              <div key={s} className="flex items-center">
                <button
                  onClick={async () => {
                    if (s === "OFFERED") {
                      updateCompany(id, { status: "OFFERED" });
                      setAiDetected(null);
                      setIsOfferedTypeOpen(true);
                      // AI判定を非同期で実行
                      setAiDetecting(true);
                      try {
                        const res = await fetch("/api/ai/detect-offer-type", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            companyName: company!.name,
                            companyNotes: company!.notes,
                            esList: companyEs.map(e => ({ title: e.title, questions: e.questions })),
                            interviewNotes: companyInterviews.map(i => i.notes ?? "").filter(Boolean),
                            recentChatMessages: recentUserMessages,
                          }),
                        });
                        const data = await res.json();
                        setAiDetected(data);
                      } catch {
                        // 判定失敗は無視
                      } finally {
                        setAiDetecting(false);
                      }
                    } else {
                      updateCompany(id, { status: s });
                    }
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                    isCurrent
                      ? "bg-blue-600 text-white ring-2 ring-blue-300"
                      : isPast
                      ? "bg-blue-100 text-blue-600"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {displayLabel}
                </button>
                {i < arr.length - 1 && (
                  <span className="text-gray-300 mx-1">›</span>
                )}
              </div>
            );
          })}
          <div className="ml-2">
            <button
              onClick={() => {
                updateCompany(id, { status: "REJECTED" });
                if (company.status !== "REJECTED") {
                  showToast(
                    "スカウト型サービスも活用してみよう。企業からオファーが届くOfferBoxがおすすめ。",
                    "info",
                    { label: "OfferBoxを見る", onClick: () => window.open("https://offerbox.jp", "_blank") },
                    8000,
                  );
                }
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                company.status === "REJECTED"
                  ? "bg-red-600 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600"
              }`}
            >
              不採用
            </button>
          </div>
        </div>
      </div>

      {/* 選考日程 */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">選考日程</h2>
            {displaySchedule && <p className="text-xs text-gray-400 mt-0.5">AIによる推定（要公式確認）</p>}
          </div>
          <button
            type="button"
            onClick={runSchedule}
            disabled={scheduleLoading}
            className="flex items-center gap-1.5 text-sm font-medium bg-[#00c896] hover:bg-[#00b586] disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {scheduleLoading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                取得中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {displaySchedule ? "再取得" : "日程を取得"}
              </>
            )}
          </button>
        </div>

        {scheduleLoading && !displaySchedule && (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              選考日程を自動取得中...
            </div>
          </div>
        )}

        {!displaySchedule && !scheduleLoading && (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <p className="text-gray-500 text-sm">AIがES・面接・最終面接などの選考スケジュールを推定します</p>
          </div>
        )}

        {displaySchedule && (
          <div className="space-y-4">
            {displaySchedule.overallTimeline && (
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-4 py-2.5">
                <span className="font-medium">全体感：</span>{displaySchedule.overallTimeline}
              </p>
            )}
            <div className="relative">
              <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-100" />
              <div className="space-y-3">
                {displaySchedule.stages.map((stage, i) => (
                  <div key={i} className="flex gap-4 pl-8 relative">
                    <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-[#00c896] border-2 border-white ring-1 ring-[#00c896]/30" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-medium text-sm text-gray-900">{stage.name}</span>
                        <span className="text-xs text-[#00a87e] font-medium">{stage.timing}</span>
                      </div>
                      {stage.notes && <p className="text-xs text-gray-500 mt-0.5">{stage.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {displaySchedule.tips && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-2.5">
                <p className="text-xs font-bold text-amber-600 mb-0.5">ポイント</p>
                <p className="text-sm text-gray-700">{displaySchedule.tips}</p>
              </div>
            )}
            <p className="text-xs text-gray-400">{displaySchedule.disclaimer}</p>
          </div>
        )}
      </div>

      {/* 企業研究 */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-gray-900">企業研究</h2>
            {displayResearch && <p className="text-xs text-gray-400 mt-0.5">AIが生成した分析結果</p>}
          </div>
          <button
            type="button"
            onClick={runResearch}
            disabled={researchLoading}
            className="flex items-center gap-1.5 text-sm font-medium bg-[#00c896] hover:bg-[#00b586] disabled:opacity-50 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {researchLoading ? (
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                {displayResearch ? "再分析" : "AI分析"}
              </>
            )}
          </button>
        </div>

        {!displayResearch && !researchLoading && (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <p className="text-gray-500 text-sm">AIが事業概要・強み・社風・面接対策などを分析します</p>
          </div>
        )}

        {displayResearch && (
          <div className="space-y-5">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">事業概要</p>
              <p className="text-sm text-gray-700 leading-relaxed">{displayResearch.overview}</p>
            </div>
            {displayResearch.industryPosition && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1.5">業界内での立ち位置</p>
                <p className="text-sm text-gray-700 leading-relaxed">{displayResearch.industryPosition}</p>
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1.5">強み</p>
                <ul className="space-y-1">
                  {displayResearch.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
                      <span className="text-blue-400 shrink-0 mt-0.5">▸</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-1.5">社風・働き方</p>
                <p className="text-sm text-gray-700 leading-relaxed">{displayResearch.culture}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-1.5">最近のトピック</p>
              <ul className="space-y-1">
                {displayResearch.recentNews.map((n, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
                    <span className="text-amber-400 shrink-0 mt-0.5">•</span>{n}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold text-[#00a87e] uppercase tracking-wider mb-1.5">面接でよく聞かれること</p>
              <ul className="space-y-1">
                {displayResearch.interviewPoints.map((p, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-sm text-gray-700">
                    <span className="w-4 h-4 rounded-full bg-[#00c896]/20 text-[#00a87e] flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">{i + 1}</span>{p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#00c896]/5 border border-[#00c896]/20 rounded-xl p-4">
              <p className="text-xs font-bold text-[#00a87e] uppercase tracking-wider mb-1.5">志望動機のヒント</p>
              <p className="text-sm text-gray-700 leading-relaxed">{displayResearch.whyUs}</p>
            </div>
          </div>
        )}
      </div>

      {/* メモ */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">メモ</h2>
          {!memoEditing && (
            <button
              type="button"
              onClick={() => { setResearchMemo(company.notes ?? ""); setMemoEditing(true); }}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              編集
            </button>
          )}
        </div>
        {memoEditing ? (
          <div>
            <textarea
              value={researchMemo}
              onChange={e => setResearchMemo(e.target.value)}
              className="w-full border border-gray-200 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#00c896]/30"
              rows={5}
              placeholder="OB訪問のメモ、企業研究のポイントなど自由に書いてください"
            />
            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setMemoEditing(false)} className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5">キャンセル</button>
              <button type="button" onClick={saveMemo} className="text-xs font-medium bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-700 transition-colors">保存</button>
            </div>
          </div>
        ) : company.notes ? (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{company.notes}</p>
        ) : (
          <p className="text-sm text-gray-400">メモはありません。「編集」から追加できます。</p>
        )}
      </div>

      {/* ES一覧 */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">エントリーシート ({companyEs.length}件)</h2>
          <Link href={`/es/new?companyId=${id}`}>
            <Button size="sm">+ ES追加</Button>
          </Link>
        </div>
        {companyEs.length === 0 ? (
          <p className="text-sm text-gray-400">ESが登録されていません</p>
        ) : (
          <div className="space-y-3">
            {companyEs.map((es) => (
              <Link key={es.id} href={`/es/${es.id}`} className="block">
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{es.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{es.questions.length}問</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {es.deadline && (
                      <span className="text-xs text-gray-500">締切: {formatDate(es.deadline)}</span>
                    )}
                    <Badge variant={es.status === "SUBMITTED" ? "success" : "warning"}>
                      {es.status === "SUBMITTED" ? "提出済み" : "下書き"}
                    </Badge>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 面接ログ */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">面接ログ ({companyInterviews.length}件)</h2>
          <Link href={`/interviews/new?companyId=${id}`}>
            <Button size="sm">+ 面接追加</Button>
          </Link>
        </div>
        {companyInterviews.length === 0 ? (
          <p className="text-sm text-gray-400">面接が登録されていません</p>
        ) : (
          <div className="space-y-3">
            {companyInterviews.map((interview) => (
              <Link key={interview.id} href={`/interviews/${interview.id}`} className="block">
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                  <div>
                    <p className="font-medium text-sm text-gray-900">{interview.round}次面接</p>
                    <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(interview.scheduledAt)}</p>
                  </div>
                  <Badge
                    variant={
                      interview.result === "PASS" ? "success" :
                      interview.result === "FAIL" ? "danger" : "default"
                    }
                  >
                    {interview.result === "PASS" ? "通過" : interview.result === "FAIL" ? "不通過" : "結果待ち"}
                  </Badge>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 編集モーダル */}
      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="企業情報を編集">
        <CompanyForm
          initialData={company}
          onSubmit={(data) => {
            updateCompany(id, data);
            setIsEditOpen(false);
          }}
          onCancel={() => setIsEditOpen(false)}
        />
      </Modal>

      {/* OFFERED種別選択モーダル */}
      <Modal isOpen={isOfferedTypeOpen} onClose={() => setIsOfferedTypeOpen(false)} title="おめでとうございます！🎉" size="sm">
        <p className="text-sm text-gray-600 mb-3">
          「{company.name}」の結果を教えてください。
        </p>

        {/* AI判定結果 */}
        <div className="mb-4 px-3 py-2 rounded-lg bg-blue-50 border border-blue-100 text-xs text-blue-700 min-h-[32px] flex items-center gap-2">
          {aiDetecting ? (
            <>
              <svg className="animate-spin w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              AIがESや面接データから判定中...
            </>
          ) : aiDetected ? (
            <>
              <span className="shrink-0">AI判定:</span>
              <span className="font-medium">
                {aiDetected.isInternOffer === true ? "インターン合格っぽい" : aiDetected.isInternOffer === false ? "本選考の内定っぽい" : "判定できませんでした"}
              </span>
              {aiDetected.reason && <span className="text-blue-500">（{aiDetected.reason}）</span>}
            </>
          ) : (
            <span className="text-blue-400">AIがデータを確認します...</span>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => { updateCompany(id, { is_intern_offer: true }); setIsOfferedTypeOpen(false); showToast("インターン合格として記録しました！", "success"); }}
            className={`w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors text-left ${
              aiDetected?.isInternOffer === true
                ? "border-teal-400 bg-teal-100 text-teal-900 ring-2 ring-teal-200"
                : "border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100"
            }`}
          >
            <span className="block text-base flex items-center gap-2">
              インターン合格
              {aiDetected?.isInternOffer === true && <span className="text-xs font-normal bg-teal-200 text-teal-700 px-1.5 py-0.5 rounded">AI判定</span>}
            </span>
            <span className="block text-xs text-teal-600 mt-0.5">インターンシップの選考に合格した</span>
          </button>
          <button
            onClick={() => { updateCompany(id, { is_intern_offer: false }); setIsOfferedTypeOpen(false); showToast("内定おめでとうございます！🎉", "success"); }}
            className={`w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors text-left ${
              aiDetected?.isInternOffer === false
                ? "border-green-400 bg-green-100 text-green-900 ring-2 ring-green-200"
                : "border-green-300 bg-green-50 text-green-800 hover:bg-green-100"
            }`}
          >
            <span className="block text-base flex items-center gap-2">
              内定（本選考）
              {aiDetected?.isInternOffer === false && <span className="text-xs font-normal bg-green-200 text-green-700 px-1.5 py-0.5 rounded">AI判定</span>}
            </span>
            <span className="block text-xs text-green-600 mt-0.5">本選考で内定をもらった</span>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-4 text-center">あとから変更できます</p>
      </Modal>

      {/* 削除確認モーダル */}
      <Modal isOpen={isDeleteConfirm} onClose={() => setIsDeleteConfirm(false)} title="企業を削除" size="sm">
        <p className="text-sm text-gray-600 mb-6">
          「{company.name}」を削除しますか？この操作は取り消せません。
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setIsDeleteConfirm(false)}>キャンセル</Button>
          <Button variant="danger" onClick={handleDelete}>削除する</Button>
        </div>
      </Modal>
    </div>
  );
}
