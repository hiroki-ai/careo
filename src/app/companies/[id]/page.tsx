"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCompanies } from "@/hooks/useCompanies";
import { useEs } from "@/hooks/useEs";
import { useInterviews } from "@/hooks/useInterviews";
import { useProfile } from "@/hooks/useProfile";
import { CompanyForm } from "@/components/companies/CompanyForm";
import { StatusBadge, LegacyBadge as Badge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { COMPANY_STATUS_ORDER, COMPANY_STATUS_LABELS, SelectionSchedule } from "@/types";
import { formatDate, formatDateTime } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { companies, updateCompany, deleteCompany, addCompany } = useCompanies();
  const { esList } = useEs();
  const { interviews } = useInterviews();
  const { profile } = useProfile();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);
  const [isOfferedTypeOpen, setIsOfferedTypeOpen] = useState(false);
  const { showToast } = useToast();

  // 選考日程
  const [schedule, setSchedule] = useState<SelectionSchedule | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const [researchMemo, setResearchMemo] = useState("");
  const [memoEditing, setMemoEditing] = useState(false);

  // マイページ管理
  const [mypageOpen, setMypageOpen] = useState(false);
  const [mypageLoginId, setMypageLoginId] = useState("");
  const [mypagePassword, setMypagePassword] = useState("");
  const [mypageNotes, setMypageNotes] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mypageSaving, setMypageSaving] = useState(false);

  const company = companies.find((c) => c.id === id);
  const companyEs = esList.filter((e) => e.companyId === id);
  const companyInterviews = interviews
    .filter((i) => i.companyId === id)
    .sort((a, b) => a.round - b.round);

  // マイページ情報の初期化
  useEffect(() => {
    if (!company) return;
    setMypageLoginId(company.mypage_login_id ?? "");
    setMypagePassword(company.mypage_password_encrypted ?? "");
    setMypageNotes(company.mypage_notes ?? "");
  }, [company?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveMypage = async () => {
    setMypageSaving(true);
    await updateCompany(id, {
      mypage_login_id: mypageLoginId || undefined,
      mypage_password_encrypted: mypagePassword || undefined,
      mypage_notes: mypageNotes || undefined,
    });
    setMypageSaving(false);
    showToast("マイページ情報を保存しました", "success");
  };

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
            <Button variant="destructive" size="sm" onClick={() => setIsDeleteConfirm(true)}>削除</Button>
          </div>
        </div>
      </div>

      {/* マイページ管理 */}
      <div className="bg-white rounded-xl border border-gray-100 mb-6">
        <button
          type="button"
          onClick={() => setMypageOpen(!mypageOpen)}
          className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors rounded-xl"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <h2 className="font-semibold text-gray-900">マイページ管理</h2>
            {company.mypage_login_id && (
              <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">設定済</span>
            )}
          </div>
          <svg className={`w-4 h-4 text-gray-400 transition-transform ${mypageOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {mypageOpen && (
          <div className="px-5 pb-5 space-y-4 border-t border-gray-100 pt-4">
            {/* マイページURL */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">マイページURL</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={company.mypage_url ?? ""}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-600"
                  placeholder="企業編集から設定"
                />
                {company.mypage_url && (
                  <a
                    href={company.mypage_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shrink-0"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    マイページを開く
                  </a>
                )}
              </div>
            </div>

            {/* ログインID */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">ログインID</label>
              <input
                type="text"
                value={mypageLoginId}
                onChange={(e) => setMypageLoginId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="メールアドレスやID"
              />
            </div>

            {/* パスワード */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">パスワード</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={mypagePassword}
                  onChange={(e) => setMypagePassword(e.target.value)}
                  className="w-full px-3 py-2 pr-10 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="パスワード"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                  title={showPassword ? "隠す" : "表示"}
                >
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* メモ */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">メモ</label>
              <textarea
                value={mypageNotes}
                onChange={(e) => setMypageNotes(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="秘密の質問の回答など"
              />
            </div>

            {/* 保存ボタン */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={saveMypage}
                disabled={mypageSaving}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {mypageSaving ? "保存中..." : "保存する"}
              </button>
            </div>

            <p className="text-[10px] text-gray-400">
              ※ パスワードはブラウザのローカルストレージに保存されます。安全な環境でご利用ください。
            </p>
          </div>
        )}
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
                  onClick={() => {
                    if (s === "OFFERED") {
                      updateCompany(id, { status: "OFFERED" });
                      setIsOfferedTypeOpen(true);
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
        <p className="text-sm text-gray-600 mb-4">
          「{company.name}」の結果を教えてください。
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => { updateCompany(id, { is_intern_offer: true }); setIsOfferedTypeOpen(false); showToast("インターン合格として記録しました！", "success"); }}
            className="w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors text-left border-teal-300 bg-teal-50 text-teal-800 hover:bg-teal-100"
          >
            <span className="block text-base">インターン合格</span>
            <span className="block text-xs text-teal-600 mt-0.5">インターンシップの選考に合格した</span>
          </button>
          <button
            onClick={() => { updateCompany(id, { is_intern_offer: false }); setIsOfferedTypeOpen(false); showToast("内定おめでとうございます！🎉", "success"); }}
            className="w-full px-4 py-3 rounded-xl border-2 font-medium transition-colors text-left border-green-300 bg-green-50 text-green-800 hover:bg-green-100"
          >
            <span className="block text-base">内定（本選考）</span>
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
          <Button variant="destructive" onClick={handleDelete}>削除する</Button>
        </div>
      </Modal>
    </div>
  );
}
