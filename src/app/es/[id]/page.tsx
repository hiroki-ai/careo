"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEs } from "@/hooks/useEs";
import { useCompanies } from "@/hooks/useCompanies";
import { useProfile } from "@/hooks/useProfile";
import { EsForm } from "@/components/es/EsForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import { QAPair } from "@/types";
import type { EsCheckResult } from "@/app/api/ai/es-check/route";

function EsQuestionCard({
  qa,
  index,
}: {
  qa: QAPair;
  index: number;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-6">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-xs text-gray-400 mb-1">設問 {index + 1}</p>
          <p className="font-medium text-gray-900">{qa.question || "(設問未入力)"}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-2">
        <p className="text-sm text-gray-700 whitespace-pre-wrap">
          {qa.answer || "(回答未入力)"}
        </p>
      </div>
      {qa.answer && (
        <p className="text-xs text-gray-400 text-right">{qa.answer.length}字</p>
      )}
    </div>
  );
}

// ES提出前チェックモーダル
function EsCheckModal({
  isOpen,
  onClose,
  onConfirmSubmit,
  checkResult,
  loading,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirmSubmit: () => void;
  checkResult: EsCheckResult | null;
  loading: boolean;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="📋 ES提出前チェック" size="lg">
      {loading && (
        <div className="py-8 text-center">
          <div className="w-10 h-10 border-4 border-indigo-300 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-500">カレオがESをチェック中...</p>
          <p className="text-xs text-gray-400 mt-1">自己分析との整合性・文体・具体性を確認しています</p>
        </div>
      )}

      {!loading && checkResult && (
        <div>
          {/* スコア */}
          <div className="flex items-center gap-4 mb-5 p-4 bg-gray-50 rounded-xl">
            <div className="text-center">
              <p className={`text-4xl font-bold ${
                checkResult.score >= 75 ? "text-emerald-600" :
                checkResult.score >= 60 ? "text-amber-500" :
                "text-red-500"
              }`}>
                {checkResult.score}
              </p>
              <p className="text-xs text-gray-500">/ 100点</p>
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900 mb-1">{checkResult.summary}</p>
              <div className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                checkResult.readyToSubmit
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}>
                {checkResult.readyToSubmit ? "✓ 提出OK" : "⚠ 改善推奨"}
              </div>
            </div>
          </div>

          {/* チェックリスト */}
          <div className="space-y-2 mb-4">
            {checkResult.checks.map((check, i) => (
              <div key={i} className={`flex items-start gap-2.5 p-3 rounded-lg ${
                check.passed ? "bg-green-50" : "bg-red-50"
              }`}>
                <span className={`shrink-0 mt-0.5 font-bold text-sm ${check.passed ? "text-green-600" : "text-red-500"}`}>
                  {check.passed ? "✓" : "✕"}
                </span>
                <div>
                  <p className="text-xs font-semibold text-gray-800">{check.label}</p>
                  <p className="text-[11px] text-gray-500 mt-0.5">{check.detail}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 改善提案 */}
          {checkResult.suggestions.length > 0 && (
            <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-amber-800 mb-2">💡 カレオの改善提案</p>
              <ul className="space-y-1">
                {checkResult.suggestions.map((s, i) => (
                  <li key={i} className="text-xs text-amber-700 flex gap-1.5">
                    <span className="shrink-0">•</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose}>修正する</Button>
            <Button
              onClick={onConfirmSubmit}
              variant={checkResult.readyToSubmit ? "primary" : "secondary"}
            >
              {checkResult.readyToSubmit ? "このまま提出済みにする" : "改善せずに提出済みにする"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function EsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { esList, updateEs, deleteEs } = useEs();
  const { companies } = useCompanies();
  const { profile } = useProfile();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);
  const [isCheckOpen, setIsCheckOpen] = useState(false);
  const [checkResult, setCheckResult] = useState<EsCheckResult | null>(null);
  const [checkLoading, setCheckLoading] = useState(false);
  const [reviewRequesting, setReviewRequesting] = useState(false);
  const [reviewSent, setReviewSent] = useState(false);

  const es = esList.find((e) => e.id === id);
  const company = es ? companies.find((c) => c.id === es.companyId) : null;

  if (!es) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">ESが見つかりません</p>
        <Link href="/es" className="text-blue-600 text-sm mt-2 inline-block">← ES一覧に戻る</Link>
      </div>
    );
  }

  // ES提出ボタン: チェックを走らせてからモーダル表示
  const handleSubmitClick = async () => {
    setIsCheckOpen(true);
    setCheckResult(null);
    setCheckLoading(true);

    // 過去ESの回答を集める（重複チェック用）
    const previousAnswers = esList
      .filter(e => e.id !== id && e.status === "SUBMITTED")
      .flatMap(e => e.questions.map(q => q.answer))
      .filter(Boolean)
      .slice(0, 6);

    try {
      const res = await fetch("/api/ai/es-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          es: {
            title: es.title,
            questions: es.questions.map(q => ({ question: q.question, answer: q.answer })),
          },
          profile,
          companyName: company?.name ?? "不明",
          previousEsAnswers: previousAnswers,
        }),
      });
      const data = await res.json() as EsCheckResult;
      setCheckResult(data);
    } catch {
      setCheckResult({
        score: 0,
        readyToSubmit: true,
        checks: [],
        summary: "チェックを取得できませんでした",
        suggestions: [],
      });
    } finally {
      setCheckLoading(false);
    }
  };

  const handleConfirmSubmit = () => {
    updateEs(id, { ...es, status: "SUBMITTED" });
    setIsCheckOpen(false);
  };

  const handleReviewRequest = async () => {
    setReviewRequesting(true);
    try {
      await fetch("/api/es-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ esEntryId: id }),
      });
      setReviewSent(true);
    } finally {
      setReviewRequesting(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-3xl">
      <Link href="/es" className="text-sm text-gray-400 hover:text-gray-600 mb-3 inline-block">← ES一覧</Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          {company && (
            <Link href={`/companies/${company.id}`} className="text-sm text-blue-500 hover:underline mb-1 inline-block">
              {company.name}
            </Link>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{es.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <Badge variant={es.status === "SUBMITTED" ? "success" : "warning"}>
              {es.status === "SUBMITTED" ? "提出済み" : "下書き"}
            </Badge>
            {es.deadline && (
              <span className="text-sm text-gray-500">締切: {formatDate(es.deadline)}</span>
            )}
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {es.status === "DRAFT" && (
            <Button
              size="sm"
              onClick={handleSubmitClick}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              📋 提出前チェック
            </Button>
          )}
          {reviewSent ? (
            <span className="text-xs text-emerald-600 font-medium self-center">✓ 添削依頼済み</span>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleReviewRequest}
              disabled={reviewRequesting}
            >
              {reviewRequesting ? "送信中..." : "📝 添削依頼"}
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => setIsEditOpen(true)}>編集</Button>
          <Button variant="danger" size="sm" onClick={() => setIsDeleteConfirm(true)}>削除</Button>
        </div>
      </div>

      {/* 設問・回答 */}
      <div className="space-y-4">
        {es.questions.map((q, i) => (
          <EsQuestionCard
            key={q.id}
            qa={q}
            index={i}
          />
        ))}
      </div>

      <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="ESを編集" size="lg">
        <EsForm
          companies={companies}
          initialData={es}
          onSubmit={(data) => {
            updateEs(id, data);
            setIsEditOpen(false);
          }}
          onCancel={() => setIsEditOpen(false)}
        />
      </Modal>

      <Modal isOpen={isDeleteConfirm} onClose={() => setIsDeleteConfirm(false)} title="ESを削除" size="sm">
        <p className="text-sm text-gray-600 mb-6">「{es.title}」を削除しますか？</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setIsDeleteConfirm(false)}>キャンセル</Button>
          <Button variant="danger" onClick={() => { deleteEs(id); router.push("/es"); }}>削除する</Button>
        </div>
      </Modal>

      {/* ES提出前チェックモーダル（戦略3）*/}
      <EsCheckModal
        isOpen={isCheckOpen}
        onClose={() => setIsCheckOpen(false)}
        onConfirmSubmit={handleConfirmSubmit}
        checkResult={checkResult}
        loading={checkLoading}
      />
    </div>
  );
}
