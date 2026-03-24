"use client";

import { useEffect, useState } from "react";

interface Announcement {
  id: string;
  title: string;
  body: string;
  targetGrade: string | null;
  targetGradYear: number | null;
  isPublished: boolean;
  createdAt: string;
}

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", targetGrade: "", targetGradYear: "" });
  const [error, setError] = useState("");

  const load = () =>
    fetch("/api/career-portal/announcements")
      .then((r) => r.json())
      .then((d) => setAnnouncements(d.announcements ?? []))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || !form.body.trim()) {
      setError("タイトルと本文は必須です");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/career-portal/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          body: form.body,
          targetGrade: form.targetGrade || null,
          targetGradYear: form.targetGradYear ? Number(form.targetGradYear) : null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? "送信に失敗しました");
        return;
      }
      setForm({ title: "", body: "", targetGrade: "", targetGradYear: "" });
      setShowForm(false);
      setLoading(true);
      load();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("このアナウンスを削除しますか？")) return;
    await fetch(`/api/career-portal/announcements?id=${id}`, { method: "DELETE" });
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">アナウンス</h1>
          <p className="text-sm text-gray-500 mt-1">学生へのお知らせを作成・管理します</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? "キャンセル" : "+ 新規作成"}
        </button>
      </div>

      {/* 作成フォーム */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-blue-200 p-5 space-y-4">
          <h2 className="text-sm font-semibold text-gray-700">新規アナウンス作成</h2>
          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}
          <div>
            <label className="block text-xs text-gray-500 mb-1">タイトル *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm((v) => ({ ...v, title: e.target.value }))}
              placeholder="例: 就職支援ガイダンスのご案内"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">本文 *</label>
            <textarea
              value={form.body}
              onChange={(e) => setForm((v) => ({ ...v, body: e.target.value }))}
              rows={5}
              placeholder="アナウンスの内容を入力してください..."
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">対象学年（任意）</label>
              <input
                type="text"
                value={form.targetGrade}
                onChange={(e) => setForm((v) => ({ ...v, targetGrade: e.target.value }))}
                placeholder="例: 学部3年"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">対象卒業年度（任意）</label>
              <input
                type="number"
                value={form.targetGradYear}
                onChange={(e) => setForm((v) => ({ ...v, targetGradYear: e.target.value }))}
                placeholder="例: 2027"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
            >
              {submitting ? "送信中..." : "送信する"}
            </button>
          </div>
        </form>
      )}

      {/* 一覧 */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-400 text-sm">アナウンスはまだありません</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-semibold text-gray-900 text-sm">{a.title}</h3>
                    {a.targetGrade && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{a.targetGrade}</span>
                    )}
                    {a.targetGradYear && (
                      <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{a.targetGradYear}卒</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{a.body}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    {new Date(a.createdAt).toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" })}
                  </p>
                </div>
                <button
                  onClick={() => handleDelete(a.id)}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors shrink-0 p-1"
                  title="削除"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
