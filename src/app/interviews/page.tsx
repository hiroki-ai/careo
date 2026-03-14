"use client";

import Link from "next/link";
import { useInterviews } from "@/hooks/useInterviews";
import { useCompanies } from "@/hooks/useCompanies";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDateTime } from "@/lib/utils";

export default function InterviewsPage() {
  const { interviews } = useInterviews();
  const { companies } = useCompanies();

  const getCompanyName = (companyId: string) =>
    companies.find((c) => c.id === companyId)?.name ?? "不明な企業";

  const sorted = [...interviews].sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime()
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">面接ログ</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{interviews.length}件</p>
        </div>
        <Link href="/interviews/new">
          <Button>+ 面接追加</Button>
        </Link>
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/30 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">面接ログを記録しよう</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6 text-center">面接の質問・回答を記録すると<br/>AIが次の面接の対策を提案してくれます</p>
          <Link href="/interviews/new"><Button>+ 最初の面接を記録する</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((interview) => (
            <Link key={interview.id} href={`/interviews/${interview.id}`}>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{getCompanyName(interview.companyId)}</p>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{interview.round}次面接</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formatDateTime(interview.scheduledAt)}</p>
                    {interview.interviewers && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">面接官: {interview.interviewers}</p>
                    )}
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
                {interview.notes && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 line-clamp-2">{interview.notes}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
