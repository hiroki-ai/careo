"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import Image from "next/image";

export type KareoExpression =
  | "default"
  | "thinking"
  | "celebrating"
  | "sad"
  | "encouraging"
  | "loading"
  | "error"
  | "waving";

interface KareoCharacterProps {
  expression?: KareoExpression;
  size?: number;
  animate?: boolean;
  walking?: boolean;
  className?: string;
}

const floatingVariants: Variants = {
  animate: {
    y: [0, -8, 0],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

const walkingVariants: Variants = {
  animate: {
    x: [0, 4, 0, -4, 0],
    y: [0, -3, 0, -3, 0],
    rotate: [0, 3, 0, -3, 0],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

export function KareoCharacter({
  expression = "default",
  size = 120,
  animate = true,
  walking = false,
  className,
}: KareoCharacterProps) {
  const [useFallback, setUseFallback] = useState(false);
  const variants = walking ? walkingVariants : animate ? floatingVariants : undefined;

  // Try PNG first (AI-generated), fallback to SVG
  const pngSrc = `/kareo/kareo-${expression}.png`;
  const svgSrc = `/kareo/kareo-${expression}.svg`;
  const imageSrc = useFallback ? svgSrc : pngSrc;

  return (
    <motion.div
      className={className}
      style={{ width: size, height: size * (380 / 320) }}
      variants={variants}
      animate={animate || walking ? "animate" : undefined}
    >
      <Image
        src={imageSrc}
        alt="カレオ"
        width={size}
        height={Math.round(size * (380 / 320))}
        style={{ objectFit: "contain" }}
        priority={expression === "default"}
        onError={() => {
          if (!useFallback) setUseFallback(true);
        }}
        unoptimized={!useFallback}
      />
    </motion.div>
  );
}
