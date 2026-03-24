"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface ReviewDetail {
  id: string;
  student_user_id: string;
  company_name: string | null;
  status: string;
  es_snapshot: { title: string; questions: { question: string; answer: string }[] };
  student_message: string | null;
  ai_comment: {
    score: number;
    readyToSubmit: boolean;
    checks: { passed: boolean; label: string; detail: string }[];
    summary: string;
    suggestions: string[];
  } | null;
  staff_feedback: string | null;
  created_at: string;
}

export default function EsReviewDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [review, setReview] = useState<ReviewDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/career-portal/es-reviews/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setReview(d.review);
        setFeedback(d.review?.staff_feedback ?? "");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const save = async (close = false) => {
    setSaving(true);
    await fetch(`/api/career-portal/es-reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        staffFeedback: feedback,
        status: close ? "closed" : "staff_done",
      }),
    });
    setSaving(false);
    router.push("/career-portal/es-reviews");
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  if (!review) return <p className="text-gray-500">見つかりません</p>;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/career-portal/es-reviews" className="hover:text-blue-600">ES添削一覧</Link>
        <span>/</span>
        <span className="text-gray-700">{review.company_name ?? "企業名未設定"}</span>
      </div>

      {/* ES内容 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">ES内容（{review.es_snapshot.title}）</h2>
        {review.student_message && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-500 font-medium mb-1">学生からのメモ</p>
            <p className="text-sm text-gray-700">{review.student_message}</p>
          </div>
        )}
        <div className="space-y-4">
          {review.es_snapshot.questions.map((q, i) => (
            <div key={i}>
              <p className="text-xs text-gray-400 mb-1">設問{i + 1}（{q.answer.length}字）</p>
              <p className="text-sm text-gray-700 font-medium mb-1">{q.question}</p>
              <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 leading-relaxed whitespace-pre-wrap">
                {q.answer || <span className="text-gray-300">（未回答）</span>}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* AIの一次添削 */}
      {review.ai_comment && (
        <div className="bg-white rounded-xl border border-emerald-200 p-5">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-semibold text-gray-700">🤖 AIの一次添削（参考）</h2>
            <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${review.ai_comment.score >= 75 ? "bg-green-100 text-green-700" : review.ai_comment.score >= 60 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
              {review.ai_comment.score}点
            </span>
          </div>
          <p className="text-sm text-gray-600 mb-4 bg-emerald-50 p-3 rounded-lg">{review.ai_comment.summary}</p>
          <div className="space-y-2 mb-4">
            {review.ai_comment.checks.map((c, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className={c.passed ? "text-green-500" : "text-red-400"}>
                  {c.passed ? "✓" : "✗"}
                </span>
                <div>
                  <span className="font-medium text-gray-700">{c.label}</span>
                  <span className="text-gray-400 ml-2">{c.detail}</span>
                </div>
              </div>
            ))}
          </div>
          {review.ai_comment.suggestions.length > 0 && (
            <div>
              <p className="text-xs text-gray-400 font-medium mb-2">改善提案</p>
              <ul className="space-y-1">
                {review.ai_comment.suggestions.map((s, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-1.5">
                    <span className="text-blue-400 mt-0.5 shrink-0">→</span>{s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 職員フィードバック入力 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">職員からのフィードバック</h2>
        <textarea
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          placeholder="学生へのフィードバックを入力してください。AIのコメントを参考に、具体的なアドバイスを追加してください。"
          className="w-full border border-gray-200 rounded-lg p-3 text-sm text-gray-700 leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={6}
        />
        <div className="flex items-center gap-3 mt-3">
          <button
            type="button"
            onClick={() => save(false)}
            disabled={saving || !feedback.trim()}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? "保存中..." : "フィードバックを送信"}
          </button>
          <button
            type="button"
            onClick={() => save(true)}
            disabled={saving}
            className="px-4 py-2 bg-gray-100 text-gray-600 text-sm rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            クローズ
          </button>
        </div>
      </div>
    </div>
  );
}
