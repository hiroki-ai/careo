"use client";

import { useState } from "react";
import Link from "next/link";
import { useEs } from "@/hooks/useEs";
import { useCompanies } from "@/hooks/useCompanies";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, daysUntil } from "@/lib/utils";

export default function EsPage() {
  const { esList } = useEs();
  const { companies } = useCompanies();
  const [filter, setFilter] = useState<"ALL" | "DRAFT" | "SUBMITTED">("ALL");

  const getCompanyName = (companyId: string) =>
    companies.find((c) => c.id === companyId)?.name ?? "不明な企業";

  const filtered = filter === "ALL" ? esList : esList.filter((e) => e.status === filter);
  const sorted = [...filtered].sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">ES管理</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{esList.length}件</p>
        </div>
        <Link href="/es/new">
          <Button>+ ES追加</Button>
        </Link>
      </div>

      <div className="flex gap-2 mb-6">
        {(["ALL", "DRAFT", "SUBMITTED"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer ${
              filter === f ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
            }`}
          >
            {f === "ALL" ? "すべて" : f === "DRAFT" ? "下書き" : "提出済み"}
            {" "}({f === "ALL" ? esList.length : esList.filter((e) => e.status === f).length})
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">ESを追加しよう</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6 text-center">ESを登録するとAIが設問ごとに<br/>回答を自動生成してくれます</p>
          <Link href="/es/new"><Button>+ 最初のESを追加する</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((es) => {
            const days = es.deadline ? daysUntil(es.deadline) : null;
            const isUrgent = days !== null && days <= 3 && es.status === "DRAFT";
            return (
              <Link key={es.id} href={`/es/${es.id}`}>
                <div className={`bg-white dark:bg-gray-800 rounded-xl border p-5 hover:shadow-md transition-shadow cursor-pointer ${isUrgent ? "border-red-200 dark:border-red-800" : "border-gray-100 dark:border-gray-700"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">{getCompanyName(es.companyId)}</p>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">{es.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{es.questions.length}問</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={es.status === "SUBMITTED" ? "success" : "warning"}>
                        {es.status === "SUBMITTED" ? "提出済み" : "下書き"}
                      </Badge>
                      {es.deadline && (
                        <span className={`text-xs ${isUrgent ? "text-red-600 font-semibold" : "text-gray-400"}`}>
                          締切: {formatDate(es.deadline)}
                          {days !== null && days >= 0 && ` (あと${days}日)`}
                          {days !== null && days < 0 && " (期限切れ)"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
