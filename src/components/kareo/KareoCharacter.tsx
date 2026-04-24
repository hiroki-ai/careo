"use client";

import { motion, type Variants } from "framer-motion";
import { CareoKun } from "@/components/landing/CareoKun";

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

// KareoExpression → CareoKun mood にマッピング（LP と完全にデザイン統一）
function toMood(expression: KareoExpression): "default" | "cheer" | "think" | "celebrate" | "sleep" {
  switch (expression) {
    case "thinking":
    case "loading":
      return "think";
    case "celebrating":
      return "celebrate";
    case "encouraging":
    case "waving":
      return "cheer";
    case "sad":
    case "error":
    case "default":
    default:
      return "default";
  }
}

const floatingVariants: Variants = {
  animate: {
    y: [0, -8, 0],
    transition: { duration: 2.5, repeat: Infinity, ease: "easeInOut" },
  },
};

const walkingVariants: Variants = {
  animate: {
    x: [0, 4, 0, -4, 0],
    y: [0, -3, 0, -3, 0],
    rotate: [0, 3, 0, -3, 0],
    transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" },
  },
};

/**
 * LP の CareoKun に統一されたマスコット。
 * 既存の KareoCharacter API（expression プロップ等）はラッパーとして維持し、
 * 内部で CareoKun（LP版）を描画することでデザインを統一する。
 */
export function KareoCharacter({
  expression = "default",
  size = 120,
  animate = true,
  walking = false,
  className,
}: KareoCharacterProps) {
  const variants = walking ? walkingVariants : animate ? floatingVariants : undefined;
  const mood = toMood(expression);

  if (!variants) {
    return <CareoKun size={size} mood={mood} className={className} />;
  }

  return (
    <motion.div
      variants={variants}
      animate="animate"
      className={className}
      style={{ display: "inline-block", lineHeight: 0 }}
    >
      <CareoKun size={size} mood={mood} />
    </motion.div>
  );
}
