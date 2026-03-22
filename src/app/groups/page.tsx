"use client";

import { useState, useEffect } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useCompanies } from "@/hooks/useCompanies";
import { useInterviews } from "@/hooks/useInterviews";
import { useActionItems } from "@/hooks/useActionItems";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import Link from "next/link";

interface GroupMember {
  userId: string;
  nickname: string;
  university?: string;
  graduationYear?: number;
  companiesCount: number;
  interviewsCount: number;
  completedActionsCount: number;
  pdcaScore?: number;
  lastActive: string;
}

interface StudyGroup {
  id: string;
  name: string;
  inviteCode: string;
  members: GroupMember[];
  createdAt: string;
}

// DB未実装のため、モックデータで動作するプレビュー版
function GroupPreview() {
  const { profile } = useProfile();
  const { companies } = useCompanies();
  const { interviews } = useInterviews();
  const { completedItems } = useActionItems();

  const mockGroup: StudyGroup = {
    id: "preview",
    name: "28卒就活仲間",
    inviteCode: "CAREO-XXXX",
    createdAt: new Date().toISOString(),
    members: [
      {
        userId: "me",
        nickname: profile?.university ? `${profile.university}の自分` : "自分",
        university: profile?.university,
        graduationYear: profile?.graduationYear,
        companiesCount: companies.filter(c => c.status !== "WISHLIST").length,
        interviewsCount: interviews.length,
        completedActionsCount: completedItems.length,
        lastActive: "今日",
      },
      {
        userId: "mock1",
        nickname: "田中（早稲田）",
        university: "早稲田大学",
        graduationYear: 2028,
        companiesCount: 8,
        interviewsCount: 5,
        completedActionsCount: 12,
        pdcaScore: 72,
        lastActive: "昨日",
      },
      {
        userId: "mock2",
        nickname: "佐藤（慶應）",
        university: "慶應義塾大学",
        graduationYear: 2028,
        companiesCount: 15,
        interviewsCount: 11,
        completedActionsCount: 20,
        pdcaScore: 85,
        lastActive: "2日前",
      },
    ],
  };

  const sortedMembers = [...mockGroup.members].sort(
    (a, b) => (b.completedActionsCount + b.companiesCount) - (a.completedActionsCount + a.companiesCount)
  );

  return (
    <div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <p className="text-sm font-semibold text-amber-800 mb-1">🚧 グループ機能（ベータ版プレビュー）</p>
        <p className="text-xs text-amber-700">
          現在準備中の機能をプレビューしています。招待コードの発行・参加機能は近日公開予定です。
          現在は匿名の模擬データを表示しています。
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-gray-900">{mockGroup.name}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{mockGroup.members.length}人のメンバー</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-1">招待コード（準備中）</p>
            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">{mockGroup.inviteCode}</code>
          </div>
        </div>

        {/* ランキング */}
        <div className="space-y-3">
          {sortedMembers.map((member, rank) => (
            <div
              key={member.userId}
              className={`flex items-center gap-3 p-3 rounded-xl ${
                member.userId === "me"
                  ? "bg-blue-50 border border-blue-100"
                  : "bg-gray-50"
              }`}
            >
              <span className={`text-lg font-bold w-6 text-center shrink-0 ${
                rank === 0 ? "text-amber-500" : rank === 1 ? "text-gray-400" : rank === 2 ? "text-orange-400" : "text-gray-300"
              }`}>
                {rank === 0 ? "🥇" : rank === 1 ? "🥈" : rank === 2 ? "🥉" : `${rank + 1}`}
              </span>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold text-gray-900 truncate">{member.nickname}</p>
                  {member.userId === "me" && (
                    <span className="text-[9px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold shrink-0">自分</span>
                  )}
                </div>
                <p className="text-[10px] text-gray-400">{member.lastActive}にアクティブ</p>
              </div>

              <div className="flex gap-3 text-center">
                <div>
                  <p className="text-sm font-bold text-gray-900">{member.companiesCount}</p>
                  <p className="text-[9px] text-gray-400">社</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{member.interviewsCount}</p>
                  <p className="text-[9px] text-gray-400">面接</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{member.completedActionsCount}</p>
                  <p className="text-[9px] text-gray-400">完了</p>
                </div>
                {member.pdcaScore && (
                  <div>
                    <p className="text-sm font-bold text-indigo-600">{member.pdcaScore}</p>
                    <p className="text-[9px] text-gray-400">PDCA</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        ※ 共有されるのは企業数・面接数・完了アクション数・PDCAスコアのみです。詳細データは非公開です。
      </p>
    </div>
  );
}

export default function GroupsPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleWaitlist = () => {
    if (!email.trim()) return;
    // 実際にはSupabaseに保存する
    setSubmitted(true);
    showToast("登録ありがとうございます！公開時にお知らせします", "success");
  };

  return (
    <div className="p-4 md:p-8 max-w-2xl">
      <div className="mb-6">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 mb-3 inline-block">← ダッシュボード</Link>
        <h1 className="text-2xl font-bold text-gray-900">友達と一緒に就活</h1>
        <p className="text-sm text-gray-500 mt-1">
          就活仲間とグループを作り、進捗を共有し合おう。お互いの進み具合が分かるとモチベーションが上がる。
        </p>
      </div>

      <GroupPreview />

      {/* ウェイトリスト */}
      {!submitted ? (
        <div className="mt-6 bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-indigo-800 mb-1">📬 グループ機能の公開通知を受け取る</p>
          <p className="text-xs text-indigo-600 mb-3">招待コードの発行・友達を招待できる機能が使えるようになったらお知らせします</p>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="メールアドレス"
              className="flex-1 bg-white border border-indigo-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            <Button onClick={handleWaitlist} disabled={!email.trim()} size="sm">
              通知を受け取る
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-2xl p-5 text-center">
          <p className="text-sm font-semibold text-green-800">✅ 登録完了！公開時にお知らせします</p>
        </div>
      )}
    </div>
  );
}
