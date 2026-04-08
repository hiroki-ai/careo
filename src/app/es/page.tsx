"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEs } from "@/hooks/useEs";
import { useCompanies } from "@/hooks/useCompanies";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatDate, daysUntil } from "@/lib/utils";
import { ES } from "@/types";

export default function EsPage() {
  const router = useRouter();
  const { esList, updateEs } = useEs();
  const { companies } = useCompanies();
  const [filter, setFilter] = useState<"ALL" | "DRAFT" | "SUBMITTED">("ALL");
  const [editingDeadlineId, setEditingDeadlineId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const getCompanyName = (companyId: string) =>
    companies.find((c) => c.id === companyId)?.name ?? "不明な企業";

  const filtered = filter === "ALL" ? esList : esList.filter((e) => e.status === filter);
  const sorted = [...filtered].sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/kareo.png" alt="カレオ" className="w-28 h-auto mx-auto mb-4 opacity-80" />
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

      {/* 証明写真アフィリエイト */}
      <div className="mt-8 border-t border-gray-100 pt-6">
        <p className="text-xs text-gray-400 font-medium mb-2">📸 ES提出前の準備</p>
        <a
          href="https://px.a8.net/svt/ejp?a8mat=4AZIOB+3YW1YQ+2O9U+HVFKY"
          rel="nofollow noopener noreferrer"
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
