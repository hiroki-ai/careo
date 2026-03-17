"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCompanies } from "@/hooks/useCompanies";
import { useEs } from "@/hooks/useEs";
import { useInterviews } from "@/hooks/useInterviews";
import { useChat } from "@/hooks/useChat";
import { CompanyForm } from "@/components/companies/CompanyForm";
import { CompanyResearch } from "@/components/companies/CompanyResearch";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { COMPANY_STATUS_ORDER, COMPANY_STATUS_LABELS } from "@/types";
import { formatDate, formatDateTime } from "@/lib/utils";
import { useToast } from "@/components/ui/Toast";

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { companies, updateCompany, deleteCompany, addCompany } = useCompanies();
  const { esList } = useEs();
  const { interviews } = useInterviews();
  const { recentUserMessages } = useChat();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);
  const [isOfferedTypeOpen, setIsOfferedTypeOpen] = useState(false);
  const [aiDetecting, setAiDetecting] = useState(false);
  const [aiDetected, setAiDetected] = useState<{ isInternOffer: boolean | null; reason: string } | null>(null);
  const { showToast } = useToast();

  const company = companies.find((c) => c.id === id);
  const companyEs = esList.filter((e) => e.companyId === id);
  const companyInterviews = interviews
    .filter((i) => i.companyId === id)
    .sort((a, b) => a.round - b.round);

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
    <div className="p-4 md:p-8 max-w-4xl">
      {/* ヘッダー */}
      <div className="mb-6">
        <Link href="/companies" className="text-sm text-gray-400 hover:text-gray-600 mb-3 inline-block">
          ← 企業一覧
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
            {company.industry && <p className="text-gray-500 mt-1">{company.industry}</p>}
            {company.url && (
              <a href={company.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 text-sm hover:underline mt-1 inline-block">
                {company.url}
              </a>
            )}
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

      {/* メモ */}
      {company.notes && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-2">メモ</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{company.notes}</p>
        </div>
      )}

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

      {/* AI企業研究 */}
      <CompanyResearch
        companyId={id}
        companyName={company.name}
        cachedResearch={company.ai_research}
        onSave={(json) => updateCompany(id, { ai_research: json })}
      />

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
