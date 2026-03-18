"use client";

import { useEffect, useState } from "react";

interface Meeting {
  id: string;
  topic_owner: string;
  topic: string;
  topic_owner_opening: string;
  discussion: { name: string; role: string; message: string }[];
  conclusion: string;
  recommended_action: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  session_index: number;
}

interface TeamReport {
  id: string;
  member_id: string;
  member_name: string;
  task_type: string;
  headline: string;
  body: string;
  deliverable: string;
  action_label: string;
  status: "pending" | "adopted" | "dismissed";
  created_at: string;
}

const MEMBER_STYLES: Record<string, { gradient: string; emoji: string }> = {
  engineer: { gradient: "from-blue-600 to-cyan-500", emoji: "💻" },
  sales:    { gradient: "from-rose-500 to-orange-500", emoji: "📢" },
  designer: { gradient: "from-purple-600 to-pink-500", emoji: "🎨" },
};

const STATUS_LABELS = {
  meeting: {
    pending:  { label: "Goサイン待ち", cls: "bg-yellow-100 text-yellow-700" },
    approved: { label: "Go", cls: "bg-green-100 text-green-700" },
    rejected: { label: "却下", cls: "bg-red-100 text-red-700" },
  },
  team: {
    pending:   { label: "確認待ち", cls: "bg-yellow-100 text-yellow-700" },
    adopted:   { label: "採用済み", cls: "bg-green-100 text-green-700" },
    dismissed: { label: "スキップ", cls: "bg-gray-100 text-gray-500" },
  },
};

type Tab = "meetings" | "team";
type MemberFilter = "all" | "engineer" | "sales" | "designer";

export default function HonbuPage() {
  const [tab, setTab] = useState<Tab>("meetings");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [teamReports, setTeamReports] = useState<TeamReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [memberFilter, setMemberFilter] = useState<MemberFilter>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/honbu")
      .then((r) => r.json())
      .then((d) => {
        setMeetings(d.meetings ?? []);
        setTeamReports(d.teamReports ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredReports =
    memberFilter === "all"
      ? teamReports
      : teamReports.filter((r) => r.member_id === memberFilter);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-[#1a2f4e] to-indigo-900 rounded-xl px-5 py-4 mb-6">
        <p className="text-indigo-300 text-xs font-semibold tracking-widest mb-1">CAREO</p>
        <h1 className="text-white text-xl font-bold">本部ダッシュボード</h1>
        <p className="text-indigo-300 text-xs mt-1">
          幹部会議 · チームタスク — 全履歴
        </p>
      </div>

      {/* タブ */}
      <div className="flex gap-2 mb-5">
        <button
          onClick={() => setTab("meetings")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === "meetings"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          🏢 幹部会議 {meetings.length > 0 && `(${meetings.length})`}
        </button>
        <button
          onClick={() => setTab("team")}
          className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
            tab === "team"
              ? "bg-indigo-600 text-white"
              : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          }`}
        >
          👥 チームタスク {teamReports.length > 0 && `(${teamReports.length})`}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">読み込み中...</div>
      ) : tab === "meetings" ? (
        /* ── 幹部会議タブ ── */
        meetings.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            まだ会議記録がありません
          </div>
        ) : (
          <div className="space-y-3">
            {meetings.map((m) => {
              const isExpanded = expandedId === m.id;
              const statusLabel = STATUS_LABELS.meeting[m.status];
              const sessionLabel = m.session_index % 2 === 0 ? "朝9時" : "夜21時";
              const date = new Date(m.created_at).toLocaleDateString("ja-JP", {
                month: "numeric",
                day: "numeric",
              });

              return (
                <div
                  key={m.id}
                  className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                >
                  <div className="px-4 py-3">
                    <div className="flex items-start gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-900 text-sm leading-snug">
                          {m.topic}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {date} {sessionLabel} · {m.topic_owner}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${statusLabel.cls}`}
                      >
                        {statusLabel.label}
                      </span>
                    </div>

                    <div className="bg-indigo-50 rounded-lg px-3 py-2 mb-2">
                      <p className="text-xs text-indigo-800 font-medium">
                        → {m.recommended_action}
                      </p>
                    </div>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : m.id)}
                      className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
                    >
                      <svg
                        className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      {isExpanded ? "閉じる" : "議事録を読む"}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 space-y-3 border-t border-gray-50 pt-3">
                        <div>
                          <p className="text-[10px] text-gray-400 font-semibold mb-1">
                            議題提案（{m.topic_owner}）
                          </p>
                          <p className="text-xs text-gray-600 leading-relaxed">
                            {m.topic_owner_opening}
                          </p>
                        </div>
                        {m.discussion.map((msg, i) => (
                          <div key={i}>
                            <p className="text-[10px] font-bold text-indigo-600 mb-0.5">
                              {msg.name}｜{msg.role}
                            </p>
                            <p className="text-xs text-gray-600 leading-relaxed">
                              {msg.message}
                            </p>
                          </div>
                        ))}
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-[10px] font-semibold text-gray-400 mb-1">
                            まとめ
                          </p>
                          <p className="text-xs text-gray-700 leading-relaxed">
                            {m.conclusion}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* ── チームタスクタブ ── */
        <>
          {/* メンバーフィルター */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {(["all", "engineer", "sales", "designer"] as MemberFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setMemberFilter(f)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  memberFilter === f
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {f === "all"
                  ? "全員"
                  : f === "engineer"
                  ? "💻 Ryo"
                  : f === "sales"
                  ? "📢 Nana"
                  : "🎨 Saki"}
              </button>
            ))}
          </div>

          {filteredReports.length === 0 ? (
            <div className="text-center py-16 text-gray-400 text-sm">
              タスク記録がありません
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((r) => {
                const style = MEMBER_STYLES[r.member_id] ?? MEMBER_STYLES.engineer;
                const statusLabel = STATUS_LABELS.team[r.status as keyof typeof STATUS_LABELS.team];
                const isExpanded = expandedId === r.id;
                const date = new Date(r.created_at).toLocaleDateString("ja-JP", {
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div
                    key={r.id}
                    className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
                  >
                    <div
                      className={`bg-gradient-to-r ${style.gradient} px-4 py-2 flex items-center gap-2`}
                    >
                      <span className="text-base">{style.emoji}</span>
                      <p className="text-white font-bold text-xs flex-1">{r.member_name}</p>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusLabel.cls}`}
                      >
                        {statusLabel.label}
                      </span>
                    </div>

                    <div className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-semibold text-gray-900 text-sm leading-snug flex-1">
                          {r.headline}
                        </p>
                        <p className="text-[10px] text-gray-400 shrink-0">{date}</p>
                      </div>

                      <button
                        onClick={() => setExpandedId(isExpanded ? null : r.id)}
                        className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 transition-colors"
                      >
                        <svg
                          className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                        {isExpanded ? "閉じる" : "詳細を見る"}
                      </button>

                      {isExpanded && (
                        <div className="mt-3 space-y-3 border-t border-gray-50 pt-3">
                          <div>
                            <p className="text-[10px] text-gray-400 font-semibold mb-1">
                              背景・意図
                            </p>
                            <p className="text-xs text-gray-600 leading-relaxed">{r.body}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-gray-400 font-semibold mb-1">
                              成果物
                            </p>
                            <div className="bg-gray-50 rounded-lg p-3 relative">
                              <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap pr-14">
                                {r.deliverable}
                              </p>
                              <button
                                onClick={() => handleCopy(r.deliverable, r.id)}
                                className="absolute top-2 right-2 text-[10px] bg-white border border-gray-200 text-gray-500 hover:text-gray-700 px-2 py-1 rounded transition-colors"
                              >
                                {copiedId === r.id ? "✓ コピー済" : "コピー"}
                              </button>
                            </div>
                          </div>
                          <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2">
                            <p className="text-xs text-indigo-800 font-medium">
                              → {r.action_label}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
