"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useInterviews } from "@/hooks/useInterviews";
import { useCompanies } from "@/hooks/useCompanies";
import { InterviewForm } from "@/components/interviews/InterviewForm";
import { LegacyBadge as Badge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { formatDateTime } from "@/lib/utils";
import { INTERVIEW_MOOD_LABELS, InterviewMood } from "@/types";

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
          <Link href={`/interviews/recording?interviewId=${id}`}>
            <Button variant="secondary" size="sm">文字起こしを追加</Button>
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
