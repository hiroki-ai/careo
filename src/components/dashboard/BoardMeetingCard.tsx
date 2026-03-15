"use client";

import { useState } from "react";
import { useBoardMeeting } from "@/hooks/useBoardMeeting";

const ROLE_COLORS: Record<string, string> = {
  CEO: "bg-yellow-100 text-yellow-700",
  CTO: "bg-blue-100 text-blue-700",
  CMO: "bg-pink-100 text-pink-700",
  CPO: "bg-purple-100 text-purple-700",
  "Head of Growth": "bg-green-100 text-green-700",
  CFO: "bg-orange-100 text-orange-700",
};

function getRoleColor(role: string) {
  const key = Object.keys(ROLE_COLORS).find((k) => role.includes(k));
  return key ? ROLE_COLORS[key] : "bg-gray-100 text-gray-600";
}

export function BoardMeetingCard() {
  const { meeting, loading, respond } = useBoardMeeting();
  const [expanded, setExpanded] = useState(false);
  const [responding, setResponding] = useState(false);

  if (loading || !meeting) return null;

  const sessionLabel = meeting.session_index % 2 === 0 ? "朝9時" : "夜21時";
  const date = new Date(meeting.created_at).toLocaleDateString("ja-JP", {
    month: "numeric", day: "numeric",
  });

  const handleRespond = async (status: "approved" | "rejected") => {
    setResponding(true);
    await respond(meeting.id, status);
    setResponding(false);
  };

  return (
    <div className="bg-white border border-indigo-100 rounded-xl overflow-hidden shadow-sm mb-4">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-[#1a2f4e] to-indigo-900 px-4 py-3 flex items-center gap-2">
        <span className="text-lg">🏢</span>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">幹部会議レポート</p>
          <p className="text-indigo-300 text-[10px]">{date} {sessionLabel} · 当番: {meeting.topic_owner}</p>
        </div>
        <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
          Goサイン待ち
        </span>
      </div>

      {/* 議題 & 結論 */}
      <div className="px-4 py-3">
        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">議題</p>
        <p className="font-semibold text-gray-900 text-sm mb-3">📋 {meeting.topic}</p>

        <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">推奨アクション</p>
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 mb-3">
          <p className="text-sm text-indigo-900 font-medium">→ {meeting.recommended_action}</p>
        </div>

        {/* 議事録展開 */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1 mb-3"
        >
          <svg className={`w-3 h-3 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          {expanded ? "議事録を閉じる" : "議事録を読む"}
        </button>

        {expanded && (
          <div className="space-y-3 mb-3 border-t border-gray-50 pt-3">
            {/* 議題提案 */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getRoleColor(ROLE_COLORS["CEO"] ? "CEO" : "")}`}>
                  {meeting.topic_owner}
                </span>
                <span className="text-[10px] text-gray-400">議題提案</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed pl-1">{meeting.topic_owner_opening}</p>
            </div>

            {/* 各幹部の発言 */}
            {meeting.discussion.map((msg, i) => (
              <div key={i}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getRoleColor(msg.role)}`}>
                    {msg.name}
                  </span>
                  <span className="text-[10px] text-gray-400">{msg.role}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed pl-1">{msg.message}</p>
              </div>
            ))}

            {/* まとめ */}
            <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
              <p className="text-[10px] font-semibold text-gray-400 mb-1">会議のまとめ</p>
              <p className="text-xs text-gray-700 leading-relaxed">{meeting.conclusion}</p>
            </div>
          </div>
        )}

        {/* Go / 却下 */}
        <div className="flex gap-2">
          <button
            onClick={() => handleRespond("approved")}
            disabled={responding}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm py-2 rounded-lg transition-colors"
          >
            ✅ Go
          </button>
          <button
            onClick={() => handleRespond("rejected")}
            disabled={responding}
            className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-600 font-semibold text-sm py-2 rounded-lg transition-colors"
          >
            ❌ 却下
          </button>
        </div>
      </div>
    </div>
  );
}
