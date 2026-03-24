"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { EVENT_TYPE_LABELS, EventType } from "@/types";

interface EventDetail {
  event: { id: string; title: string; eventType: EventType; heldAt: string; description: string | null };
  attendees: { id: string; studentUserId: string; faculty: string; grade: string; graduationYear: number; attendedAt: string }[];
  activityStats: { beforeAvg: number; afterAvg: number };
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<EventDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/career-portal/events/${id}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  if (!data) return <p className="text-gray-500">見つかりません</p>;

  const { event, attendees, activityStats } = data;
  const diff = activityStats.afterAvg - activityStats.beforeAvg;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center gap-2 text-sm text-gray-400">
        <Link href="/career-portal/events" className="hover:text-blue-600">イベント一覧</Link>
        <span>/</span>
        <span className="text-gray-700">{event.title}</span>
      </div>

      {/* イベント概要 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{event.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                {EVENT_TYPE_LABELS[event.eventType]}
              </span>
              <span className="text-sm text-gray-500">{new Date(event.heldAt).toLocaleDateString("ja-JP")}</span>
            </div>
            {event.description && <p className="text-sm text-gray-600 mt-2">{event.description}</p>}
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-gray-900">{attendees.length}</p>
            <p className="text-xs text-gray-400">参加者</p>
          </div>
        </div>
      </div>

      {/* 効果測定 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">参加前後の活動量比較（企業登録数 前後30日）</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-xl">
            <p className="text-2xl font-bold text-gray-700">{activityStats.beforeAvg}</p>
            <p className="text-xs text-gray-400 mt-1">参加前30日 平均</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-xl flex flex-col items-center justify-center">
            <p className={`text-2xl font-bold ${diff > 0 ? "text-green-600" : diff < 0 ? "text-red-500" : "text-gray-400"}`}>
              {diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1)}
            </p>
            <p className="text-xs text-gray-400 mt-1">変化</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-xl">
            <p className="text-2xl font-bold text-green-700">{activityStats.afterAvg}</p>
            <p className="text-xs text-gray-400 mt-1">参加後30日 平均</p>
          </div>
        </div>
        {attendees.length === 0 && (
          <p className="text-xs text-gray-400 text-center mt-3">参加者を登録すると効果測定が表示されます</p>
        )}
      </div>

      {/* 参加者一覧 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">参加者一覧（{attendees.length}名）</h2>
        {attendees.length === 0 ? (
          <p className="text-sm text-gray-400">まだ参加者が登録されていません</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {attendees.map((a) => (
              <div key={a.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-gray-800">{a.faculty} · {a.grade}</p>
                  <p className="text-xs text-gray-400">{a.graduationYear}卒</p>
                </div>
                <Link
                  href={`/career-portal/students/${a.studentUserId}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  詳細 →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
