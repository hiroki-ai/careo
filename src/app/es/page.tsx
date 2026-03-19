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
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ES管理</h1>
          <p className="text-sm text-gray-500 mt-1">{esList.length}件</p>
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
              filter === f ? "bg-blue-600 text-white" : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            {f === "ALL" ? "すべて" : f === "DRAFT" ? "下書き" : "提出済み"}
            {" "}({f === "ALL" ? esList.length : esList.filter((e) => e.status === f).length})
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 text-gray-400">ESが登録されていません</div>
      ) : (
        <div className="space-y-3">
          {sorted.map((es) => {
            const days = es.deadline ? daysUntil(es.deadline) : null;
            const isUrgent = days !== null && days <= 3 && es.status === "DRAFT";
            return (
              <Link key={es.id} href={`/es/${es.id}`}>
                <div className={`bg-white rounded-xl border p-5 hover:shadow-md transition-shadow cursor-pointer ${isUrgent ? "border-red-200" : "border-gray-100"}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-gray-400 mb-1">{getCompanyName(es.companyId)}</p>
                      <h3 className="font-semibold text-gray-900">{es.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{es.questions.length}問</p>
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

      {/* ES書き方・添削 外部サービス案内 */}
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-900 mb-1">✍️ ESの書き方・添削はこちら</p>
        <p className="text-xs text-blue-700 mb-3">Careoは記録と管理に特化しています。ES文章の作成・添削は以下のサービスが便利です。</p>
        <div className="flex flex-wrap gap-2">
          {[
            { name: "就活会議（先輩のES例文）", url: "https://syukatsu-kaigi.jp" },
            { name: "ワンキャリア（通過ES・選考対策）", url: "https://www.onecareer.jp" },
            { name: "Unistyle（内定者ESデータベース）", url: "https://unistyle.jp" },
            { name: "Claude・ChatGPT（ES下書き補助）", url: "https://claude.ai" },
          ].map(s => (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
              className="text-xs bg-white border border-blue-200 text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
              {s.name} ↗
            </a>
          ))}
        </div>
      </div>

      {/* 証明写真アフィリエイト */}
      <div className="mt-8 border-t border-gray-100 pt-6">
        <p className="text-xs text-gray-400 font-medium mb-2">📸 ES提出前の準備</p>
        <a
          href="https://px.a8.net/svt/ejp?a8mat=4AZIOB+3YW1YQ+2O9U+HVFKY"
          rel="nofollow"
          target="_blank"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-4 py-2 rounded-full transition-colors"
        >
          カメラのキタムラで証明写真を撮る →
        </a>
        {/* A8.net トラッキングピクセル */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img width={1} height={1} src="https://www13.a8.net/0.gif?a8mat=4AZIOB+3YW1YQ+2O9U+HVFKY" alt="" style={{ display: "none" }} />
      </div>
    </div>
  );
}
