"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useInterviews } from "@/hooks/useInterviews";
import { useCompanies } from "@/hooks/useCompanies";
import { useProfile } from "@/hooks/useProfile";
import { InterviewForm } from "@/components/interviews/InterviewForm";
import { LegacyBadge as Badge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDateTime } from "@/lib/utils";
import { INTERVIEW_MOOD_LABELS, InterviewMood } from "@/types";

interface QuestionFeedback {
  question: string;
  answer: string;
  score: number;
  comment: string;
}

interface AIFeedback {
  score: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  questionFeedbacks: QuestionFeedback[];
  nextAction: string;
}

export default function InterviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { interviews, updateInterview, updateMood, deleteInterview } = useInterviews();
  const { companies } = useCompanies();
  const { profile } = useProfile();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);
  const [feedback, setFeedback] = useState<AIFeedback | null>(null);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const interview = interviews.find((i) => i.id === id);
  const company = interview ? companies.find((c) => c.id === interview.companyId) : null;

  const handleGenerateFeedback = async () => {
    if (!interview) return;
    setIsFeedbackLoading(true);
    setFeedbackError(null);
    try {
      const res = await fetch("/api/ai/interview-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interview,
          profile: profile
            ? {
                careerAxis: profile.careerAxis,
                gakuchika: profile.gakuchika,
                selfPr: profile.selfPr,
                strengths: profile.strengths,
                weaknesses: profile.weaknesses,
              }
            : null,
        }),
      });
      if (!res.ok) throw new Error("フィードバックの生成に失敗しました");
      const data = await res.json();
      setFeedback(data);
    } catch (e) {
      setFeedbackError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setIsFeedbackLoading(false);
    }
  };

  if (!interview) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">面接が見つかりません</p>
        <Link href="/interviews" className="text-blue-600 text-sm mt-2 inline-block">← 面接一覧に戻る</Link>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <Link href="/interviews" className="text-sm text-gray-400 hover:text-gray-600 mb-3 inline-block">← 面接一覧</Link>

      <div className="flex items-start justify-between mb-6">
        <div>
          {company && (
            <Link href={`/companies/${company.id}`} className="text-sm text-blue-500 hover:underline mb-1 inline-block">
              {company.name}
            </Link>
          )}
          <h1 className="text-2xl font-bold text-gray-900">{interview.round}次面接</h1>
          <p className="text-gray-500 mt-1">{formatDateTime(interview.scheduledAt)}</p>
          {interview.interviewers && (
            <p className="text-sm text-gray-500 mt-1">面接官: {interview.interviewers}</p>
          )}
          <div className="mt-2 flex items-center gap-2 flex-wrap">
            <Badge
              variant={
                interview.result === "PASS" ? "success" :
                interview.result === "FAIL" ? "danger" : "default"
              }
            >
              {interview.result === "PASS" ? "通過" : interview.result === "FAIL" ? "不通過" : "結果待ち"}
            </Badge>
            {/* 感情タグ */}
            <div className="flex gap-1">
              {(Object.entries(INTERVIEW_MOOD_LABELS) as [InterviewMood, { emoji: string; label: string }][]).map(([key, { emoji, label }]) => (
                <button
                  key={key}
                  type="button"
                  title={label}
                  onClick={() => void updateMood(interview.id, interview.mood === key ? null : key)}
                  className={`text-lg px-1.5 py-0.5 rounded-lg transition-all ${interview.mood === key ? "bg-[#00c896]/20 ring-2 ring-[#00c896]" : "opacity-40 hover:opacity-80"}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleGenerateFeedback}
            disabled={isFeedbackLoading}
          >
            {isFeedbackLoading ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                生成中...
              </span>
            ) : "AIフィードバックを生成"}
          </Button>
          <Link href={`/interviews/recording?interviewId=${id}`}>
            <Button variant="secondary" size="sm">面接録音AI</Button>
          </Link>
          <Button variant="secondary" size="sm" onClick={() => setIsEditOpen(true)}>編集</Button>
          <Button variant="destructive" size="sm" onClick={() => setIsDeleteConfirm(true)}>削除</Button>
        </div>
      </div>

      {/* 質問・回答 */}
      {interview.questions.length > 0 && (
        <div className="space-y-4 mb-6">
          {interview.questions.map((q, i) => (
            <div key={q.id} className="bg-white rounded-xl border border-gray-100 p-6">
              <p className="text-xs text-gray-400 mb-1">質問 {i + 1}</p>
              <p className="font-medium text-gray-900 mb-3">{q.question || "(質問未入力)"}</p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{q.answer || "(回答未入力)"}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 総評 */}
      {interview.notes && (
        <div className="bg-white rounded-xl border border-gray-100 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-2">総評・振り返り</h2>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{interview.notes}</p>
        </div>
      )}

      {/* AIフィードバックエラー */}
      {feedbackError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <p className="text-sm text-red-600">{feedbackError}</p>
        </div>
      )}

      {/* AIフィードバック */}
      {feedback && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="font-semibold text-gray-900 mb-4">AIフィードバック</h2>

          {/* 総合スコア */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">総合スコア</span>
              <span className="text-sm font-bold text-blue-600">{feedback.score}/100</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className={`bg-blue-500 h-2.5 rounded-full transition-all w-[${feedback.score}%]`}
              />
            </div>
          </div>

          {/* 総評 */}
          <p className="text-sm text-gray-700 mb-5 leading-relaxed">{feedback.summary}</p>

          {/* 良かった点 / 改善点 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-green-700 mb-2">💪 良かった点</p>
              <ul className="space-y-1">
                {feedback.strengths.map((s, i) => (
                  <li key={i} className="text-sm text-green-800 flex items-start gap-1.5">
                    <span className="shrink-0 mt-0.5">・</span>{s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-amber-50 rounded-lg p-4">
              <p className="text-sm font-semibold text-amber-700 mb-2">⚡ 改善点</p>
              <ul className="space-y-1">
                {feedback.improvements.map((s, i) => (
                  <li key={i} className="text-sm text-amber-800 flex items-start gap-1.5">
                    <span className="shrink-0 mt-0.5">・</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* 設問別フィードバック */}
          {feedback.questionFeedbacks && feedback.questionFeedbacks.length > 0 && (
            <div className="border-t border-gray-100 pt-4 mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">── 設問別フィードバック</p>
              <div className="space-y-4">
                {feedback.questionFeedbacks.map((qf, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-1">
                      <p className="text-sm font-medium text-gray-800 flex-1 pr-4">Q: {qf.question}</p>
                      <span className="text-xs font-bold text-blue-600 shrink-0">スコア: {qf.score}/10</span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">A: {qf.answer}</p>
                    <p className="text-xs text-gray-600">📝 コメント: {qf.comment}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 次回に向けて */}
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-700 mb-1">🎯 次回に向けて</p>
            <p className="text-sm text-blue-800">{feedback.nextAction}</p>
          </div>
        </div>
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

      <Modal isOpen={isDeleteConfirm} onClose={() => setIsDeleteConfirm(false)} title="面接を削除" size="sm">
        <p className="text-sm text-gray-600 mb-6">この面接ログを削除しますか？</p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setIsDeleteConfirm(false)}>キャンセル</Button>
          <Button variant="destructive" onClick={() => { deleteInterview(id); router.push("/interviews"); }}>削除する</Button>
        </div>
      </Modal>
    </div>
  );
}
