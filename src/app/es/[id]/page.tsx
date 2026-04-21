"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEs } from "@/hooks/useEs";
import { useCompanies } from "@/hooks/useCompanies";
import { EsForm } from "@/components/es/EsForm";
import { LegacyBadge as Badge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import { QAPair, EsResult, ES_RESULT_LABELS } from "@/types";

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

export default function EsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { esList, updateEs, deleteEs } = useEs();
  const { companies } = useCompanies();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);
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

  const handleMarkSubmitted = () => {
    updateEs(id, { ...es, status: "SUBMITTED" });
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
    <div className="p-4 md:p-8">
      <Link href="/es" className="text-sm text-gray-400 hover:text-gray-600 mb-3 inline-block">← ES一覧</Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          {company && (
            <Link href={`/companies/${company.id}`} className="text-sm text-blue-500 hover:underline mb-1 inline-block">
              {company.name}
            </Link>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{es.title}</h1>
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <Badge variant={es.status === "SUBMITTED" ? "success" : "warning"}>
              {es.status === "SUBMITTED" ? "提出済み" : "下書き"}
            </Badge>
            {es.deadline && (
              <span className="text-sm text-gray-500">締切: {formatDate(es.deadline)}</span>
            )}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500">結果:</span>
              <select
                aria-label="ES結果"
                value={es.result ?? "unknown"}
                onChange={(e) => updateEs(id, { result: e.target.value as EsResult })}
                className={`text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                  es.result === "passed" ? "text-green-700 bg-green-50" :
                  es.result === "failed" ? "text-red-700 bg-red-50" :
                  es.result === "pending" ? "text-amber-700 bg-amber-50" :
                  "text-gray-600 bg-white"
                }`}
              >
                {(Object.entries(ES_RESULT_LABELS) as [EsResult, string][]).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={es.isSharedAnonymously ?? false}
                onChange={(e) => updateEs(id, { isSharedAnonymously: e.target.checked })}
                className="w-3.5 h-3.5 rounded border-gray-300 text-[#00c896] focus:ring-[#00c896]"
              />
              <span className="text-[11px] text-gray-500">匿名共有</span>
            </label>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {es.status === "DRAFT" && (
            <Button
              size="sm"
              onClick={handleMarkSubmitted}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              提出済みにする
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
          <Button variant="destructive" size="sm" onClick={() => setIsDeleteConfirm(true)}>削除</Button>
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
          <Button variant="destructive" onClick={() => { deleteEs(id); router.push("/es"); }}>削除する</Button>
        </div>
      </Modal>
    </div>
  );
}
