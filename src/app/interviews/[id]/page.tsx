"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useInterviews } from "@/hooks/useInterviews";
import { useCompanies } from "@/hooks/useCompanies";
import { InterviewForm } from "@/components/interviews/InterviewForm";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDateTime } from "@/lib/utils";
import { INTERVIEW_MOOD_LABELS, InterviewMood } from "@/types";
import { AppCard } from "@/components/ui/app";

export default function InterviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { interviews, updateInterview, updateMood, deleteInterview } = useInterviews();
  const { companies } = useCompanies();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);

  const interview = interviews.find((i) => i.id === id);
  const company = interview ? companies.find((c) => c.id === interview.companyId) : null;

  if (!interview) {
    return (
      <div
        className="text-center"
        style={{ padding: 40, background: "var(--app-surface-1)", minHeight: "100vh" }}
      >
        <div style={{ color: "var(--app-text-muted)", fontSize: 14 }}>面接が見つかりません</div>
        <Link
          href="/interviews"
          style={{
            color: "var(--app-accent-deep)",
            fontSize: 13,
            fontWeight: 700,
            marginTop: 10,
            display: "inline-block",
            textDecoration: "none",
          }}
        >
          ← 面接一覧に戻る
        </Link>
      </div>
    );
  }

  const resultLabel =
    interview.result === "PASS" ? "通過" : interview.result === "FAIL" ? "不通過" : "結果待ち";
  const resultColor =
    interview.result === "PASS"
      ? { bg: "var(--app-success-soft)", fg: "var(--app-success)" }
      : interview.result === "FAIL"
      ? { bg: "var(--app-danger-soft)", fg: "var(--app-danger)" }
      : { bg: "var(--app-surface-2)", fg: "var(--app-text-muted)" };

  return (
    <div style={{ background: "var(--app-surface-1)", minHeight: "100vh", color: "var(--app-text)" }}>
      <div
        className="flex flex-col"
        style={{ padding: "18px 16px 120px", maxWidth: 1080, margin: "0 auto", gap: 16 }}
      >
        <Link
          href="/interviews"
          style={{
            fontSize: 13,
            color: "var(--app-text-muted)",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          ← 面接一覧
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2" style={{ marginBottom: 6, flexWrap: "wrap" }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "3px 9px",
                  background: "#ede9fe",
                  color: "#7c3aed",
                  borderRadius: 4,
                  letterSpacing: 0.5,
                }}
              >
                {interview.round}次面接
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  padding: "3px 9px",
                  background: resultColor.bg,
                  color: resultColor.fg,
                  borderRadius: 4,
                }}
              >
                {resultLabel}
              </span>
            </div>
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
              {interview.round}次面接
            </h1>
            <div style={{ fontSize: 12, color: "var(--app-text-muted)", marginTop: 4 }}>
              {formatDateTime(interview.scheduledAt)}
              {interview.interviewers && <> · 面接官: {interview.interviewers}</>}
            </div>

            {/* Mood tags + anonymous toggle */}
            <div className="flex items-center gap-2 flex-wrap" style={{ marginTop: 10 }}>
              <div className="flex gap-1">
                {(Object.entries(INTERVIEW_MOOD_LABELS) as [InterviewMood, { emoji: string; label: string }][]).map(
                  ([key, { emoji, label }]) => (
                    <button
                      key={key}
                      type="button"
                      title={label}
                      onClick={() => void updateMood(interview.id, interview.mood === key ? null : key)}
                      style={{
                        fontSize: 16,
                        padding: "4px 8px",
                        borderRadius: 8,
                        border: "none",
                        background:
                          interview.mood === key ? "var(--app-accent-soft)" : "transparent",
                        boxShadow:
                          interview.mood === key ? "inset 0 0 0 2px var(--app-accent)" : "none",
                        opacity: interview.mood === key ? 1 : 0.4,
                        cursor: "pointer",
                      }}
                    >
                      {emoji}
                    </button>
                  )
                )}
              </div>
              <label className="flex items-center gap-1.5" style={{ cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={interview.isSharedAnonymously ?? false}
                  onChange={(e) => updateInterview(id, { isSharedAnonymously: e.target.checked })}
                  style={{
                    width: 14,
                    height: 14,
                    accentColor: "var(--app-accent)",
                    cursor: "pointer",
                  }}
                />
                <span style={{ fontSize: 11, color: "var(--app-text-muted)" }}>後輩に匿名共有</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            <Link href={`/interviews/recording?interviewId=${id}`}>
              <Button variant="secondary" size="sm">
                文字起こしを追加
              </Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={() => setIsEditOpen(true)}>
              編集
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setIsDeleteConfirm(true)}>
              削除
            </Button>
          </div>
        </div>

        {/* Q&A log */}
        {interview.questions.length > 0 && (
          <div className="flex flex-col gap-2.5">
            {interview.questions.map((q, i) => (
              <AppCard key={q.id} padded>
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
                    Q{i + 1}
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
                    {q.question || "(質問未入力)"}
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
                  {q.answer || "(回答未入力)"}
                </div>
              </AppCard>
            ))}
          </div>
        )}

        {/* Notes */}
        {interview.notes && (
          <AppCard title="総評・振り返り" padded>
            <div
              style={{
                fontSize: 13,
                color: "var(--app-text)",
                lineHeight: 1.9,
                whiteSpace: "pre-wrap",
              }}
            >
              {interview.notes}
            </div>
          </AppCard>
        )}

        <Modal isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} title="面接を編集" size="lg">
          <InterviewForm
            companies={companies}
            initialData={interview}
            onSubmit={(data) => {
              updateInterview(id, data);
              setIsEditOpen(false);
            }}
            onCancel={() => setIsEditOpen(false)}
          />
        </Modal>

        <Modal
          isOpen={isDeleteConfirm}
          onClose={() => setIsDeleteConfirm(false)}
          title="面接を削除"
          size="sm"
        >
          <p style={{ fontSize: 13, color: "var(--app-text-muted)", marginBottom: 20 }}>
            この面接ログを削除しますか？
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setIsDeleteConfirm(false)}>
              キャンセル
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                deleteInterview(id);
                router.push("/interviews");
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
