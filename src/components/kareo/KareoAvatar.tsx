"use client";

import { useState } from "react";
import Image from "next/image";

interface KareoAvatarProps {
  size?: number;
  className?: string;
}

export function KareoAvatar({ size = 32, className }: KareoAvatarProps) {
  const [useFallback, setUseFallback] = useState(false);
  const imageSrc = useFallback ? "/kareo/kareo-avatar.svg" : "/kareo/kareo-avatar.png";

  return (
    <div
      className={`rounded-full overflow-hidden shrink-0 ${className ?? ""}`}
      style={{ width: size, height: size }}
    >
      <Image
        src={imageSrc}
        alt="カレオ"
        width={size}
        height={size}
        style={{ objectFit: "cover" }}
        onError={() => { if (!useFallback) setUseFallback(true); }}
        unoptimized={!useFallback}
      />
    </div>
  );
}
