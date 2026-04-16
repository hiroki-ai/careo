"use client";

import { KareoCharacter } from "./KareoCharacter";

interface KareoLoadingProps {
  message?: string;
  size?: number;
  className?: string;
}

export function KareoLoading({
  message = "読み込み中...",
  size = 80,
  className,
}: KareoLoadingProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 py-8 ${className ?? ""}`}>
      <KareoCharacter expression="loading" size={size} animate />
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-gray-400">{message}</span>
        <span className="inline-flex gap-0.5">
          <span className="w-1.5 h-1.5 bg-[#00c896] rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 bg-[#00c896] rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 bg-[#00c896] rounded-full animate-bounce [animation-delay:300ms]" />
        </span>
      </div>
    </div>
  );
}
