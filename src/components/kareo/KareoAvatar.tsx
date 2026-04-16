"use client";

import Image from "next/image";

interface KareoAvatarProps {
  size?: number;
  className?: string;
}

export function KareoAvatar({ size = 32, className }: KareoAvatarProps) {
  return (
    <div
      className={`rounded-full overflow-hidden shrink-0 ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/kareo/kareo-avatar.svg"
        alt="カレオ"
        width={size}
        height={size}
        style={{ objectFit: "cover" }}
      />
    </div>
  );
}
