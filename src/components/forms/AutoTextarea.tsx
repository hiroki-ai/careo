"use client";

import { useEffect, useRef } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

export function AutoTextarea({
  value, onChange, placeholder, minRows = 2, maxRows = 12, className = "", disabled, ariaLabel,
}: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const lineHeight = parseInt(getComputedStyle(el).lineHeight || "20", 10) || 20;
    const min = lineHeight * minRows;
    const max = lineHeight * maxRows;
    const next = Math.max(min, Math.min(max, el.scrollHeight));
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  }, [value, minRows, maxRows]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      aria-label={ariaLabel}
      rows={minRows}
      className={`w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00c896] focus:border-transparent resize-none leading-relaxed ${className}`}
    />
  );
}
