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
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">面接が登録されていません</div>
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
