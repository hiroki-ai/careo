"use client";

import Link from "next/link";
import { useProfile } from "@/hooks/useProfile";

interface UpgradeNudgeProps {
  /** Free ユーザーに見せるメッセージ */
  message?: string;
  /** 追加のクラス */
  className?: string;
}

/**
 * Free ユーザー向けの控えめなPro誘導バナー。
 * Pro ユーザーには表示しない。広告削除＋機能解放を同時に訴求。
 */
export function UpgradeNudge({
  message = "Proプランで広告を非表示にして、全機能を無制限に。",
  className = "",
}: UpgradeNudgeProps) {
  const { profile, loading } = useProfile();
  if (loading) return null;
  if (profile?.plan === "pro") return null;

  return (
    <Link
      href="/upgrade"
      className={`block bg-gradient-to-r from-[#00c896]/10 via-[#00b088]/10 to-[#00a87e]/10 border border-[#00c896]/25 rounded-2xl px-4 py-3 hover:from-[#00c896]/15 hover:to-[#00a87e]/15 transition-colors ${className}`}
    >
      <div className="flex items-center gap-3">
        <span className="text-xl shrink-0">✨</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-[#00a87e] truncate">{message}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">月¥480 · 年¥2,800（41%OFF）</p>
        </div>
        <span className="text-xs font-bold text-[#00a87e] shrink-0">→</span>
      </div>
    </Link>
  );
}
