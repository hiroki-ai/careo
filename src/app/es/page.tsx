"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEs } from "@/hooks/useEs";
import { useCompanies } from "@/hooks/useCompanies";
import { LegacyBadge as Badge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { formatDate, daysUntil } from "@/lib/utils";
import { ES, EsResult, ES_RESULT_LABELS, EsCommunityInsight } from "@/types";
import { KareoCharacter } from "@/components/kareo/KareoCharacter";

export default function EsPage() {
  const router = useRouter();
  const { esList, updateEs, fetchCommunityInsights } = useEs();
  const { companies } = useCompanies();
  const [filter, setFilter] = useState<"ALL" | "DRAFT" | "SUBMITTED">("ALL");
  const [editingDeadlineId, setEditingDeadlineId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [communityInsights, setCommunityInsights] = useState<EsCommunityInsight[]>([]);
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const getCompanyName = (companyId: string) =>
    companies.find((c) => c.id === companyId)?.name ?? "不明な企業";

  const filtered = filter === "ALL" ? esList : esList.filter((e) => e.status === filter);
  const sorted = [...filtered].sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

  const handleResultChange = async (es: ES, result: EsResult) => {
    setSavingId(es.id);
    await updateEs(es.id, { result });
    setSavingId(null);
  };

  const handleShareToggle = async (es: ES, shared: boolean) => {
    setSavingId(es.id);
    await updateEs(es.id, { isSharedAnonymously: shared });
    setSavingId(null);
  };

  const loadInsights = async () => {
    setInsightsLoading(true);
    setInsightsOpen(true);
    try {
      const data = await fetchCommunityInsights();
      setCommunityInsights(data);
    } finally {
      setInsightsLoading(false);
    }
  };

  const handleDeadlineChange = async (es: ES, value: string) => {
    setSavingId(es.id);
    const deadline = value ? new Date(value).toISOString() : undefined;
    await updateEs(es.id, { companyId: es.companyId, title: es.title, status: es.status, deadline });
    setSavingId(null);
    setEditingDeadlineId(null);
  };

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
            type="button"
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
        <div className="text-center py-12">
          <KareoCharacter expression="encouraging" size={100} className="mx-auto mb-3" />
          <p className="text-gray-400 font-medium">ESがまだ登録されていません</p>
          <p className="text-sm text-gray-300 mt-1">企業ページからESを追加してみよう！</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((es) => {
            const days = es.deadline ? daysUntil(es.deadline) : null;
            const isUrgent = days !== null && days <= 3 && es.status === "DRAFT";
            const isEditing = editingDeadlineId === es.id;
            const isSaving = savingId === es.id;

            return (
              <div
                key={es.id}
                className={`bg-white rounded-xl border ${isUrgent ? "border-red-200" : "border-gray-100"}`}
              >
                {/* メイン情報（タップで詳細へ） */}
                <div
                  className="flex items-start justify-between p-5 cursor-pointer hover:bg-gray-50 rounded-t-xl transition-colors"
                  onClick={() => router.push(`/es/${es.id}`)}
                >
                  <div>
                    <p className="text-xs text-gray-400 mb-1">{getCompanyName(es.companyId)}</p>
                    <h3 className="font-semibold text-gray-900">{es.title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{es.questions.length}問</p>
                  </div>
                  <Badge variant={es.status === "SUBMITTED" ? "success" : "warning"}>
                    {es.status === "SUBMITTED" ? "提出済み" : "下書き"}
                  </Badge>
                </div>

                {/* 結果・共有エリア */}
                <div className="border-t border-gray-100 px-4 py-2.5 flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-500 font-medium">結果:</span>
                    <select
                      aria-label="ES結果"
                      value={es.result ?? "unknown"}
                      onChange={(e) => handleResultChange(es, e.target.value as EsResult)}
                      disabled={savingId === es.id}
                      onClick={(e) => e.stopPropagation()}
                      className={`text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                        es.result === "passed" ? "text-green-700 bg-green-50" :
                        es.result === "failed" ? "text-red-700 bg-red-50" :
                        es.result === "pending" ? "text-amber-700 bg-amber-50" :
                        "text-gray-600 bg-white"
                      }`}
                    >
                      {(Object.entries(ES_RESULT_LABELS) as [EsResult, string][]).map(([val, label]) => (
                        <option key={val} value={val}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer ml-auto" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={es.isSharedAnonymously ?? false}
                      onChange={(e) => handleShareToggle(es, e.target.checked)}
                      disabled={savingId === es.id}
                      className="w-3.5 h-3.5 rounded border-gray-300 text-[#00c896] focus:ring-[#00c896]"
                    />
                    <span className="text-[11px] text-gray-500">匿名でコミュニティに共有</span>
                  </label>
                </div>

                {/* 締切エリア（独立した入力エリア） */}
                <div className="border-t border-gray-100 px-4 py-3">
                  {isEditing ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-gray-500 font-medium">📅 締切日時</span>
                      <input
                        type="datetime-local"
                        aria-label="締切日時"
                        autoFocus
                        defaultValue={es.deadline ? es.deadline.slice(0, 16) : ""}
                        disabled={isSaving}
                        onChange={(e) => {
                          if (e.target.value) handleDeadlineChange(es, e.target.value);
                        }}
                        onBlur={(e) => {
                          if (!isSaving) {
                            if (e.target.value) {
                              handleDeadlineChange(es, e.target.value);
                            } else {
                              setEditingDeadlineId(null);
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
                          onClick={() => setEditingDeadlineId(null)}
                          className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
                        >
                          キャンセル
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setEditingDeadlineId(es.id)}
                      className={`w-full text-left flex items-center justify-between gap-2 rounded-lg px-3 py-2.5 transition-colors active:scale-[0.98] ${
                        es.deadline
                          ? isUrgent
                            ? "text-red-600 font-semibold bg-red-50 hover:bg-red-100"
                            : "text-gray-600 bg-gray-50 hover:bg-gray-100"
                          : "text-blue-500 bg-blue-50 hover:bg-blue-100 border border-dashed border-blue-200"
                      }`}
                    >
                      <span className="text-sm">
                        {es.deadline ? (
                          <>
                            📅 締切: {formatDate(es.deadline)}
                            {days !== null && days >= 0 && <span className="ml-1.5 font-medium">あと{days}日</span>}
                            {days !== null && days < 0 && <span className="ml-1.5">期限切れ</span>}
                          </>
                        ) : (
                          <>📅 締切日を設定する</>
                        )}
                      </span>
                      <span className="text-xs opacity-40 shrink-0">{es.deadline ? "変更" : "＋"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* コミュニティインサイト */}
      <div className="mt-6 bg-gradient-to-r from-[#00c896]/5 to-emerald-50 border border-[#00c896]/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-sm font-semibold text-gray-800">よく聞かれるES設問</p>
            <p className="text-xs text-gray-500 mt-0.5">コミュニティの匿名データから通過率を分析</p>
          </div>
          <button
            type="button"
            onClick={insightsOpen ? () => setInsightsOpen(false) : loadInsights}
            className="text-xs font-bold text-[#00a87e] border border-[#00c896]/50 hover:bg-[#00c896]/10 px-3 py-1.5 rounded-lg transition-colors"
          >
            {insightsOpen ? "閉じる" : "インサイトを見る"}
          </button>
        </div>

        {insightsOpen && (
          <div className="mt-3">
            {insightsLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 py-3">
                <svg className="animate-spin w-4 h-4 text-[#00c896]" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                コミュニティデータを取得中...
              </div>
            ) : communityInsights.length > 0 ? (
              <div className="space-y-2">
                {communityInsights.map((insight, i) => (
                  <div key={i} className="bg-white rounded-lg border border-gray-100 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{insight.question}</p>
                        <p className="text-xs text-gray-400 mt-0.5">回答数: {insight.totalCount}件</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-lg font-bold ${
                          insight.passRate >= 70 ? "text-green-600" :
                          insight.passRate >= 40 ? "text-amber-500" :
                          "text-red-500"
                        }`}>
                          {insight.passRate}%
                        </p>
                        <p className="text-[10px] text-gray-400">通過率</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-gray-500">まだ十分なデータがありません</p>
                <p className="text-xs text-gray-400 mt-1">ESの結果を記録し、匿名共有をONにするとコミュニティインサイトに貢献できます</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ES書き方・添削 外部サービス案内 */}
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-4">
        <p className="text-sm font-semibold text-blue-900 mb-1">✍️ ESの書き方・添削はこちら</p>
        <p className="text-xs text-blue-700 mb-3">Careoは記録と管理に特化しています。ES文章の作成・添削は以下のサービスが便利です。</p>
        <div className="flex flex-wrap gap-2">
          {[
            { name: "就活会議（先輩のES例文）", url: "https://syukatsu-kaigi.jp/" },
            { name: "ワンキャリア（通過ES・選考対策）", url: "https://www.onecareer.jp/" },
            { name: "Unistyle（内定者ES86,000件）", url: "https://unistyleinc.com/" },
            { name: "Claude・ChatGPT（ES下書き補助）", url: "https://claude.ai/" },
          ].map(s => (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer"
              className="text-xs bg-white border border-blue-200 text-blue-800 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
              {s.name} ↗
            </a>
          ))}
        </div>
      </div>

    </div>
  );
}
