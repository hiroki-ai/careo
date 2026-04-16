"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useInterviews } from "@/hooks/useInterviews";
import { useCompanies } from "@/hooks/useCompanies";
import { LegacyBadge as Badge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";
import { INTERVIEW_MOOD_LABELS } from "@/types";
import { Interview } from "@/types";
import { KareoCharacter } from "@/components/kareo/KareoCharacter";

export default function InterviewsPage() {
  const router = useRouter();
  const { interviews, updateInterview } = useInterviews();
  const { companies } = useCompanies();
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const getCompanyName = (companyId: string) =>
    companies.find((c) => c.id === companyId)?.name ?? "不明な企業";

  const sorted = [...interviews].sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
  );

  const handleScheduleChange = async (interview: Interview, value: string) => {
    if (!value) return;
    setSavingId(interview.id);
    await updateInterview(interview.id, {
      companyId: interview.companyId,
      round: interview.round,
      scheduledAt: new Date(value).toISOString(),
      result: interview.result,
      interviewers: interview.interviewers,
      notes: interview.notes,
      mood: interview.mood,
    });
    setSavingId(null);
    setEditingScheduleId(null);
  };

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">面接ログ</h1>
          <p className="text-sm text-gray-500 mt-1">{interviews.length}件</p>
        </div>
        <Link href="/interviews/new">
          <Button>+ 面接追加</Button>
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <KareoCharacter expression="encouraging" size={100} className="mx-auto mb-3" />
          <p className="text-gray-400 font-medium">面接がまだ登録されていません</p>
          <p className="text-sm text-gray-300 mt-1">企業ページから面接を追加してみよう！</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((interview) => {
            const isEditing = editingScheduleId === interview.id;
            const isSaving = savingId === interview.id;
            const isPast = new Date(interview.scheduledAt) < new Date();

            return (
              <div
                key={interview.id}
                className="bg-white rounded-xl border border-gray-100"
              >
                {/* メイン情報（タップで詳細へ） */}
                <div
                  className="flex items-start justify-between p-5 cursor-pointer hover:bg-gray-50 rounded-t-xl transition-colors"
                  onClick={() => router.push(`/interviews/${interview.id}`)}
                >
                  <div>
                    <p className="text-xs text-gray-400 mb-1">{getCompanyName(interview.companyId)}</p>
                    <h3 className="font-semibold text-gray-900">{interview.round}次面接</h3>
                    {interview.interviewers && (
                      <p className="text-xs text-gray-400 mt-1">面接官: {interview.interviewers}</p>
                    )}
                    {interview.notes && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{interview.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {interview.mood && (
                      <span className="text-lg" title={INTERVIEW_MOOD_LABELS[interview.mood].label}>
                        {INTERVIEW_MOOD_LABELS[interview.mood].emoji}
                      </span>
                    )}
                    <Badge
                      variant={
                        interview.result === "PASS" ? "success" :
                        interview.result === "FAIL" ? "danger" : "default"
                      }
                    >
                      {interview.result === "PASS" ? "通過" : interview.result === "FAIL" ? "不通過" : "結果待ち"}
                    </Badge>
                  </div>
                </div>

                {/* 日程エリア（独立した入力エリア） */}
                <div className="border-t border-gray-100 px-4 py-3">
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-500 font-medium">🗓 日時</span>
                      <input
                        type="datetime-local"
                        aria-label="面接日時"
                        autoFocus
                        defaultValue={interview.scheduledAt.slice(0, 16)}
                        disabled={isSaving}
                        onChange={(e) => {
                          if (e.target.value) handleScheduleChange(interview, e.target.value);
                        }}
                        onBlur={(e) => {
                          if (!isSaving) {
                            if (e.target.value) {
                              handleScheduleChange(interview, e.target.value);
                            } else {
                              setEditingScheduleId(null);
                            }
                          }
                        }}
                        className="flex-1 min-w-0 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                      />
                      {isSaving ? (
                        <span className="text-xs text-gray-400">保存中...</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingScheduleId(null)}
                          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
                        >
                          キャンセル
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingScheduleId(interview.id)}
                      className={`w-full text-left flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 transition-colors active:scale-[0.98] ${
                        isPast && interview.result === "PENDING"
                          ? "text-amber-600 bg-amber-50 hover:bg-amber-100"
                          : "text-gray-600 bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <span className="text-sm">
                        🗓 {formatDateTime(interview.scheduledAt)}
                        {!isPast && (
                          <span className="ml-2 text-xs text-blue-500 font-medium">
                            あと{Math.ceil((new Date(interview.scheduledAt).getTime() - Date.now()) / 86400000)}日
                          </span>
                        )}
                      </span>
                      <span className="text-xs opacity-40 shrink-0">変更</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
