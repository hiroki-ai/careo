"use client";

import Link from "next/link";
import { useInterviews } from "@/hooks/useInterviews";
import { useCompanies } from "@/hooks/useCompanies";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";
import { INTERVIEW_MOOD_LABELS } from "@/types";

export default function InterviewsPage() {
  const { interviews } = useInterviews();
  const { companies } = useCompanies();

  const getCompanyName = (companyId: string) =>
    companies.find((c) => c.id === companyId)?.name ?? "不明な企業";

  const sorted = [...interviews].sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
  );

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
          <img src="/kareo.png" alt="カレオ" className="w-28 h-auto mx-auto mb-4 opacity-80" />
          <p className="text-gray-400 font-medium">面接がまだ登録されていません</p>
          <p className="text-sm text-gray-300 mt-1">企業ページから面接を追加してみよう！</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((interview) => (
            <Link key={interview.id} href={`/interviews/${interview.id}`}>
              <div className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">{getCompanyName(interview.companyId)}</p>
                    <h3 className="font-semibold text-gray-900">{interview.round}次面接</h3>
                    <p className="text-sm text-gray-500 mt-1">{formatDateTime(interview.scheduledAt)}</p>
                    {interview.interviewers && (
                      <p className="text-xs text-gray-400 mt-1">面接官: {interview.interviewers}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
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
                {interview.notes && (
                  <p className="text-sm text-gray-600 mt-3 line-clamp-2">{interview.notes}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
