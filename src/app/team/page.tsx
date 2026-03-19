"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useTeam } from "@/hooks/useTeam";
import { TEAM_MEMBERS } from "@/lib/team/members";

const MEMBER_STYLES: Record<string, { gradient: string; badge: string }> = {
  engineer: {
    gradient: "from-blue-600 to-cyan-500",
    badge: "bg-blue-100 text-blue-700",
  },
  sales: {
    gradient: "from-rose-500 to-orange-500",
    badge: "bg-rose-100 text-rose-700",
  },
  designer: {
    gradient: "from-purple-600 to-pink-500",
    badge: "bg-purple-100 text-purple-700",
  },
  security: {
    gradient: "from-slate-600 to-zinc-500",
    badge: "bg-slate-100 text-slate-700",
  },
};

// 創業者（自分）が担当するタスク
const FOUNDER_TASKS = [
  {
    id: "review",
    label: "チームの成果物をレビュー・採用・却下",
    desc: "毎朝チームダッシュボードを確認。「採用」したものを実際に実行する。",
  },
  {
    id: "x",
    label: "Xへの投稿実行",
    desc: "Nanaが下書きしたX投稿を確認し、自分の言葉に調整してから投稿する。",
  },
  {
    id: "dev",
    label: "Ryoの提案を実装",
    desc: "技術提案の内容を確認し、自分でコードを書いて実装する。",
  },
  {
    id: "design",
    label: "Sakiの提案をUIに反映",
    desc: "デザイン改善提案を確認し、Tailwindのクラスを修正してデプロイする。",
  },
  {
    id: "careo",
    label: "上智キャリアセンターへのアポ取り",
    desc: "Nanaが書いたメールを送信 or キャリアセンターに直接出向いてアポを取る。",
  },
  {
    id: "user",
    label: "27卒先輩・友人へのCareo布教",
    desc: "週3人以上に使ってみてほしいと声をかける。フィードバックをもらう。",
  },
];

export default function TeamPage() {
  const router = useRouter();
  const { data, loading, triggerTask, respond } = useTeam();
  const [triggering, setTriggering] = useState<string | null>(null);
  const [responding, setResponding] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      const admin = data.user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;
      setIsAdmin(admin);
      if (!admin) router.replace("/");
    });
  }, [router]);

  if (isAdmin === null) return null;
  if (!isAdmin) return null;

  const handleTrigger = async (memberId: string) => {
    setTriggering(memberId);
    await triggerTask(memberId);
    setTriggering(null);
  };

  const handleRespond = async (id: string, status: "adopted" | "dismissed") => {
    setResponding(id);
    await respond(id, status);
    setResponding(null);
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const pendingCount = data.filter((d) => d.report?.status === "pending").length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* ヘッダー */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-xl font-bold text-gray-900">チームダッシュボード</h1>
          {pendingCount > 0 && (
            <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {pendingCount}件 確認待ち
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500">
          3人のAIチームが毎朝自律的に動き、成果物を届けます。あなたはレビューして実行するだけ。
        </p>
      </div>

      {/* AIチームメンバーカード */}
      {loading ? (
        <div className="text-center py-16 text-gray-400 text-sm">読み込み中...</div>
      ) : (
        <div className="space-y-4 mb-8">
          {TEAM_MEMBERS.map((member) => {
            const item = data.find((d) => d.member.id === member.id);
            const report = item?.report ?? null;
            const styles = MEMBER_STYLES[member.id];
            const isTriggering = triggering === member.id;
            const isPending = report?.status === "pending";

            return (
              <div
                key={member.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
              >
                {/* メンバーヘッダー */}
                <div
                  className={`bg-gradient-to-r ${styles.gradient} px-4 py-3 flex items-center gap-3`}
                >
                  <span className="text-2xl">{member.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-sm">{member.name}</p>
                    <p className="text-white/70 text-xs">{member.role}</p>
                  </div>
                  {isPending && (
                    <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                      確認待ち
                    </span>
                  )}
                </div>

                <div className="px-4 py-4">
                  {isPending && report ? (
                    <>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">
                        今日の提案
                      </p>
                      <p className="font-semibold text-gray-900 text-sm mb-3">
                        {report.headline}
                      </p>

                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">
                        背景・意図
                      </p>
                      <p className="text-xs text-gray-600 leading-relaxed mb-3">
                        {report.body}
                      </p>

                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide mb-1">
                        成果物
                      </p>
                      <div className="bg-gray-50 rounded-lg p-3 mb-3 relative">
                        <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap pr-16">
                          {report.deliverable}
                        </p>
                        <button
                          onClick={() => handleCopy(report.deliverable, report.id)}
                          className="absolute top-2 right-2 text-[10px] bg-white border border-gray-200 text-gray-500 hover:text-gray-700 px-2 py-1 rounded transition-colors"
                        >
                          {copied === report.id ? "✓ コピー済" : "コピー"}
                        </button>
                      </div>

                      <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-2 mb-3">
                        <p className="text-xs text-indigo-800 font-medium">
                          → {report.action_label}
                        </p>
                      </div>

                      <p className="text-[10px] text-gray-400 mb-3">
                        {new Date(report.created_at).toLocaleDateString("ja-JP", {
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleRespond(report.id, "adopted")}
                          disabled={responding === report.id}
                          className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm py-2 rounded-lg transition-colors"
                        >
                          ✅ 採用
                        </button>
                        <button
                          onClick={() => handleRespond(report.id, "dismissed")}
                          disabled={responding === report.id}
                          className="flex-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-600 font-semibold text-sm py-2 rounded-lg transition-colors"
                        >
                          スキップ
                        </button>
                        <button
                          onClick={() => handleTrigger(member.id)}
                          disabled={isTriggering}
                          className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-600 text-sm py-2 px-3 rounded-lg transition-colors"
                        >
                          {isTriggering ? "生成中..." : "再生成"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-xs text-gray-400 mb-3">
                        {report?.status === "adopted"
                          ? "✅ 採用済み"
                          : report?.status === "dismissed"
                          ? "スキップ済み"
                          : "まだタスクがありません"}
                      </p>
                      <button
                        onClick={() => handleTrigger(member.id)}
                        disabled={isTriggering}
                        className={`bg-gradient-to-r ${styles.gradient} text-white font-semibold text-sm px-6 py-2 rounded-lg transition-opacity disabled:opacity-50`}
                      >
                        {isTriggering
                          ? `${member.name}が考え中...`
                          : `${member.name}にタスクを依頼`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 創業者タスク */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#1a2f4e] to-indigo-900 px-4 py-3 flex items-center gap-2">
          <span className="text-xl">🫵</span>
          <div>
            <p className="text-white font-bold text-sm">あなたがやること</p>
            <p className="text-indigo-300 text-xs">チームの成果物を動かすのは創業者だけ</p>
          </div>
        </div>
        <div className="divide-y divide-gray-50">
          {FOUNDER_TASKS.map((task) => (
            <div key={task.id} className="px-4 py-3 flex items-start gap-3">
              <span className="text-gray-300 mt-0.5 shrink-0">○</span>
              <div>
                <p className="text-sm font-medium text-gray-800">{task.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{task.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
