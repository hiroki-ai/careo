"use client";

import type { ReactNode } from "react";
import { CareoKun } from "@/components/landing/CareoKun";

type Who = "me" | "careo";

export function ChatBubble({
  who,
  children,
  typing,
  timestamp,
  avatar = true,
}: {
  who: Who;
  children?: ReactNode;
  typing?: boolean;
  timestamp?: string;
  avatar?: boolean;
}) {
  const mine = who === "me";

  if (typing) {
    return (
      <div className="flex gap-2 items-end">
        {avatar && <CareoKun size={30} mood="default" />}
        <div
          className="flex gap-1"
          style={{
            background: "var(--app-surface-0)",
            border: "1px solid var(--app-border)",
            borderRadius: "4px 16px 16px 16px",
            padding: "10px 14px",
          }}
        >
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: "var(--app-text-dim)",
                animation: `app-bubble-dot 1.2s ${i * 0.15}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex gap-2 items-end"
      style={{ flexDirection: mine ? "row-reverse" : "row" }}
    >
      {!mine && avatar && <CareoKun size={30} mood="default" />}
      <div
        style={{
          maxWidth: "82%",
          background: mine ? "var(--app-accent)" : "var(--app-surface-0)",
          color: mine ? "white" : "var(--app-text)",
          border: mine ? "none" : "1px solid var(--app-border)",
          borderRadius: mine ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
          padding: "10px 14px",
          fontSize: 13,
          lineHeight: 1.6,
          boxShadow: mine ? "var(--app-shadow-teal)" : "var(--app-shadow-sm)",
        }}
      >
        {children}
        {timestamp && (
          <div
            style={{
              fontSize: 10,
              marginTop: 4,
              color: mine ? "rgba(255,255,255,.75)" : "var(--app-text-dim)",
              textAlign: mine ? "right" : "left",
            }}
          >
            {timestamp}
          </div>
        )}
      </div>
    </div>
  );
}

export function AiSuggestionCard({
  title,
  body,
  actions,
  tag = "カレオからの提案",
  onAction,
}: {
  title: ReactNode;
  body: ReactNode;
  actions?: string[];
  tag?: string;
  onAction?: (index: number) => void;
}) {
  return (
    <div
      className="flex gap-3"
      style={{
        background: "linear-gradient(160deg, var(--app-accent-soft), var(--app-surface-0) 60%)",
        border: "1px solid rgba(0,200,150,.25)",
        borderRadius: "var(--app-r-lg)",
        padding: 14,
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{ flexShrink: 0, marginTop: 2 }}>
        <CareoKun size={40} mood="cheer" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="inline-flex items-center gap-1.5"
          style={{
            fontSize: 10,
            fontWeight: 800,
            color: "var(--app-accent-deep)",
            background: "white",
            padding: "2px 8px",
            borderRadius: "var(--app-r-pill)",
            marginBottom: 8,
            border: "1px solid rgba(0,200,150,.2)",
          }}
        >
          <span>✨</span>
          {tag}
        </div>
        <div
          className="font-klee"
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: "var(--app-text)",
            marginBottom: 6,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: "var(--app-text-muted)",
            lineHeight: 1.8,
            marginBottom: actions ? 12 : 0,
          }}
        >
          {body}
        </div>
        {actions && (
          <div className="flex flex-wrap gap-2">
            {actions.map((a, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onAction?.(i)}
                style={{
                  padding: "7px 14px",
                  fontSize: 11.5,
                  fontWeight: 700,
                  border: i === 0 ? "none" : "1px solid var(--app-border-strong)",
                  background: i === 0 ? "var(--app-accent)" : "var(--app-surface-0)",
                  color: i === 0 ? "white" : "var(--app-text)",
                  borderRadius: "var(--app-r-pill)",
                  cursor: "pointer",
                  boxShadow: i === 0 ? "var(--app-shadow-teal)" : "none",
                }}
              >
                {a}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function KareoSpeechBubble({
  children,
  mood = "cheer",
  placement = "left",
  size = 40,
}: {
  children: ReactNode;
  mood?: "default" | "cheer" | "think" | "celebrate" | "sleep";
  placement?: "left" | "right";
  size?: number;
}) {
  const isLeft = placement === "left";
  return (
    <div
      className="flex gap-2.5 items-end"
      style={{ flexDirection: isLeft ? "row" : "row-reverse" }}
    >
      <div style={{ flexShrink: 0 }}>
        <CareoKun size={size} mood={mood} />
      </div>
      <div
        className="handwriting-text"
        style={{
          maxWidth: 280,
          position: "relative",
          background: "white",
          color: "var(--app-text)",
          border: "1.5px solid var(--app-text)",
          borderRadius: 16,
          padding: "10px 14px",
          fontSize: 14,
          lineHeight: 1.75,
          boxShadow: "3px 3px 0 var(--app-text)",
        }}
      >
        {children}
        <span
          style={{
            position: "absolute",
            bottom: 8,
            left: isLeft ? -8 : undefined,
            right: !isLeft ? -8 : undefined,
            width: 14,
            height: 14,
            background: "white",
            borderTop: isLeft ? "1.5px solid var(--app-text)" : "none",
            borderRight: isLeft ? "1.5px solid var(--app-text)" : "none",
            borderLeft: !isLeft ? "1.5px solid var(--app-text)" : "none",
            borderBottom: !isLeft ? "1.5px solid var(--app-text)" : "none",
            transform: isLeft ? "rotate(-135deg)" : "rotate(45deg)",
            borderRadius: "0 0 0 4px",
          }}
        />
      </div>
    </div>
  );
}
