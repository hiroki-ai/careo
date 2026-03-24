"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface EsReview {
  id: string;
  student_user_id: string;
  company_name: string | null;
  status: string;
  ai_generated_at: string | null;
  staff_feedback: string | null;
  created_at: string;
  ai_comment: { score: number; summary: string } | null;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "AI処理中",
  ai_done: "職員確認待ち",
  staff_done: "返信済み",
  closed: "クローズ",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-gray-100 text-gray-600",
  ai_done: "bg-amber-100 text-amber-700",
  staff_done: "bg-green-100 text-green-700",
  closed: "bg-blue-50 text-blue-500",
};

export default function EsReviewsPage() {
  const [reviews, setReviews] = useState<EsReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ai_done");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/career-portal/es-reviews?status=${filter}`)
      .then((r) => r.json())
      .then((d) => setReviews(d.reviews ?? []))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ES添削</h1>
        <p className="text-sm text-gray-500 mt-1">
          学生からのES添削依頼を確認し、AIの一次添削を参考にフィードバックを返してください。
        </p>
      </div>

      {/* フィルタータブ */}
      <div className="flex gap-2">
        {Object.entries(STATUS_LABELS).map(([key, label]) => (
          <button
            type="button"
            key={key}
            onClick={() => setFilter(key)}
            className={`text-sm px-4 py-1.5 rounded-full font-medium transition-colors ${
              filter === key
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-400 text-sm">該当する依頼はありません</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {reviews.map((r) => (
            <div key={r.id} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-base shrink-0">📄</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {r.company_name ?? "企業名未設定"}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                    {r.ai_comment && (
                      <span className="text-xs text-gray-400">
                        AIスコア: <span className="font-semibold text-gray-700">{r.ai_comment.score}点</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(r.created_at).toLocaleDateString("ja-JP")} 依頼
                  </p>
                </div>
              </div>
              <Link
                href={`/career-portal/es-reviews/${r.id}`}
                className="text-xs px-3 py-1.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors font-medium shrink-0"
              >
                {r.status === "ai_done" ? "フィードバックを書く" : "詳細を見る"}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
