"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEs } from "@/hooks/useEs";
import { useCompanies } from "@/hooks/useCompanies";
import { EsForm } from "@/components/es/EsForm";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDate } from "@/lib/utils";
import { QAPair, EsResult, ES_RESULT_LABELS } from "@/types";
import { AppCard } from "@/components/ui/app";

function EsQuestionCard({ qa, index }: { qa: QAPair; index: number }) {
  return (
    <AppCard padded>
      <div className="flex items-start gap-2.5" style={{ marginBottom: 10 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            background: "var(--app-accent-soft)",
            color: "var(--app-accent-deep)",
            display: "grid",
            placeItems: "center",
            fontSize: 12,
            fontWeight: 800,
            flexShrink: 0,
          }}
        >
          Q{index + 1}
        </div>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: "var(--app-text)",
            lineHeight: 1.6,
            flex: 1,
          }}
        >
          {qa.question || "(設問未入力)"}
        </div>
      </div>
      <div
        style={{
          padding: 14,
          background: "var(--app-surface-1)",
          borderRadius: "var(--app-r-sm)",
          fontSize: 13,
          color: "var(--app-text)",
          lineHeight: 1.9,
          whiteSpace: "pre-wrap",
        }}
      >
        {qa.answer || "(回答未入力)"}
      </div>
      {qa.answer && (
        <div
          style={{
            fontSize: 10.5,
            color: "var(--app-text-dim)",
            textAlign: "right",
            marginTop: 6,
            fontFamily: "ui-monospace, monospace",
          }}
        >
          {qa.answer.length}字
        </div>
      )}
    </AppCard>
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
      <div
        className="text-center"
        style={{ padding: 40, background: "var(--app-surface-1)", minHeight: "100vh" }}
      >
        <div style={{ color: "var(--app-text-muted)", fontSize: 14 }}>ESが見つかりません</div>
        <Link
          href="/es"
          style={{
            color: "var(--app-accent-deep)",
            fontSize: 13,
            fontWeight: 700,
            marginTop: 10,
            display: "inline-block",
            textDecoration: "none",
          }}
        >
          ← ES一覧に戻る
        </Link>
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

  const statusColor =
    es.status === "SUBMITTED"
      ? { bg: "var(--app-success-soft)", fg: "var(--app-success)" }
      : { bg: "var(--app-warning-soft)", fg: "var(--app-warning)" };

  return (
    <div style={{ background: "var(--app-surface-1)", minHeight: "100vh", color: "var(--app-text)" }}>
      <div
        className="flex flex-col"
        style={{ padding: "18px 16px 120px", maxWidth: 1080, margin: "0 auto", gap: 16 }}
      >
        <Link
          href="/es"
          style={{
            fontSize: 13,
            color: "var(--app-text-muted)",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          ← ES一覧
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            {company && (
              <Link
                href={`/companies/${company.id}`}
                style={{
                  fontSize: 12,
                  color: "var(--app-accent-deep)",
                  fontWeight: 700,
                  textDecoration: "none",
                  marginBottom: 4,
                  display: "inline-block",
                }}
              >
                {company.name} →
              </Link>
            )}
            <h1
              className="font-klee"
              style={{ fontSize: 26, fontWeight: 700, margin: 0, letterSpacing: -0.5 }}
            >
              {es.title}
            </h1>
            <div className="flex items-center gap-2.5 flex-wrap" style={{ marginTop: 10 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "3px 9px",
                  background: statusColor.bg,
                  color: statusColor.fg,
                  borderRadius: 4,
                }}
              >
                {es.status === "SUBMITTED" ? "提出済み" : "下書き"}
              </span>
              {es.deadline && (
                <span style={{ fontSize: 12, color: "var(--app-text-muted)" }}>
                  締切: {formatDate(es.deadline)}
                </span>
              )}
              <div className="flex items-center gap-1.5">
                <span style={{ fontSize: 11, color: "var(--app-text-muted)" }}>結果:</span>
                <select
                  aria-label="ES結果"
                  value={es.result ?? "unknown"}
                  onChange={(e) => updateEs(id, { result: e.target.value as EsResult })}
                  style={{
                    fontSize: 11,
                    border: "1px solid var(--app-border-strong)",
                    borderRadius: 8,
                    padding: "3px 8px",
                    outline: "none",
                    background: "var(--app-surface-0)",
                    color: "var(--app-text)",
                  }}
                >
                  {(Object.entries(ES_RESULT_LABELS) as [EsResult, string][]).map(
                    ([val, label]) => (
                      <option key={val} value={val}>
                        {label}
                      </option>
                    )
                  )}
                </select>
              </div>
              <label className="flex items-center gap-1.5" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={es.isSharedAnonymously ?? false}
                  onChange={(e) => updateEs(id, { isSharedAnonymously: e.target.checked })}
                  style={{
                    width: 14,
                    height: 14,
                    accentColor: "var(--app-accent)",
                    cursor: "pointer",
                  }}
                />
                <span style={{ fontSize: 11, color: "var(--app-text-muted)" }}>匿名共有</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            {es.status === "DRAFT" && (
              <Button size="sm" onClick={handleMarkSubmitted}>
                提出済みにする
              </Button>
            )}
            {reviewSent ? (
              <span
                style={{
                  fontSize: 11,
                  color: "var(--app-success)",
                  fontWeight: 700,
                  alignSelf: "center",
                }}
              >
                ✓ 添削依頼済み
              </span>
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
            <Button variant="secondary" size="sm" onClick={() => setIsEditOpen(true)}>
              編集
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setIsDeleteConfirm(true)}>
              削除
            </Button>
          </div>
        </div>

        {/* Q&A */}
        <div className="flex flex-col gap-2.5">
          {es.questions.map((q, i) => (
            <EsQuestionCard key={q.id} qa={q} index={i} />
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

        <Modal
          isOpen={isDeleteConfirm}
          onClose={() => setIsDeleteConfirm(false)}
          title="ESを削除"
          size="sm"
        >
          <p style={{ fontSize: 13, color: "var(--app-text-muted)", marginBottom: 20 }}>
            「{es.title}」を削除しますか？
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsDeleteConfirm(false)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteEs(id);
                router.push("/es");
              }}
            >
              削除する
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
