"use client";

import type { ReactNode } from "react";
import { CareoKun } from "@/components/landing/CareoKun";

export function EmptyState({
  emoji = "🌱",
  title,
  desc,
  cta,
  ctaIcon,
  onCta,
}: {
  emoji?: string;
  title: ReactNode;
  desc?: ReactNode;
  cta?: string;
  ctaIcon?: ReactNode;
  onCta?: () => void;
}) {
  return (
    <div
      style={{
        textAlign: "center",
        padding: "40px 20px",
        background: "var(--app-surface-0)",
        borderRadius: "var(--app-r-lg)",
        border: "1px dashed var(--app-border-strong)",
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 12, lineHeight: 1 }}>{emoji}</div>
      <div
        className="font-klee"
        style={{ fontSize: 17, fontWeight: 700, color: "var(--app-text)", marginBottom: 6 }}
      >
        {title}
      </div>
      {desc && (
        <div
          style={{
            fontSize: 12.5,
            color: "var(--app-text-muted)",
            lineHeight: 1.8,
            maxWidth: 360,
            margin: "0 auto",
          }}
        >
          {desc}
        </div>
      )}
      {cta && (
        <button
          type="button"
          onClick={onCta}
          className="inline-flex items-center gap-1.5"
          style={{
            marginTop: 18,
            padding: "10px 20px",
            fontSize: 13,
            fontWeight: 700,
            border: "none",
            background: "linear-gradient(135deg, var(--app-accent), var(--app-accent-deep))",
            color: "white",
            borderRadius: "var(--app-r-pill)",
            cursor: "pointer",
            boxShadow: "var(--app-shadow-teal)",
          }}
        >
          {ctaIcon && <span>{ctaIcon}</span>}
          <span>{cta}</span>
        </button>
      )}
    </div>
  );
}

export type SkeletonKind = "card" | "list" | "dashboard";

export function LoadingSkeleton({ kind = "card" }: { kind?: SkeletonKind }) {
  if (kind === "list") {
    return (
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex items-center gap-3"
            style={{
              padding: "12px 14px",
              background: "var(--app-surface-0)",
              borderRadius: "var(--app-r-md)",
              border: "1px solid var(--app-border)",
            }}
          >
            <div className="app-skeleton-shimmer" style={{ width: 36, height: 36, borderRadius: 18 }} />
            <div style={{ flex: 1 }}>
              <div
                className="app-skeleton-shimmer"
                style={{ width: "60%", height: 12, borderRadius: 4, marginBottom: 6 }}
              />
              <div
                className="app-skeleton-shimmer"
                style={{ width: "40%", height: 10, borderRadius: 4 }}
              />
            </div>
            <div
              className="app-skeleton-shimmer"
              style={{ width: 50, height: 18, borderRadius: 999 }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (kind === "dashboard") {
    return (
      <div>
        <div
          className="grid gap-2.5"
          style={{ gridTemplateColumns: "repeat(3, 1fr)", marginBottom: 12 }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="app-skeleton-shimmer"
              style={{ height: 90, borderRadius: "var(--app-r-lg)" }}
            />
          ))}
        </div>
        <div
          className="app-skeleton-shimmer"
          style={{ height: 180, borderRadius: "var(--app-r-lg)" }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        padding: 16,
        background: "var(--app-surface-0)",
        border: "1px solid var(--app-border)",
        borderRadius: "var(--app-r-lg)",
      }}
    >
      <div
        className="app-skeleton-shimmer"
        style={{ width: "45%", height: 14, borderRadius: 4, marginBottom: 10 }}
      />
      <div
        className="app-skeleton-shimmer"
        style={{ width: "100%", height: 10, borderRadius: 4, marginBottom: 6 }}
      />
      <div
        className="app-skeleton-shimmer"
        style={{ width: "85%", height: 10, borderRadius: 4, marginBottom: 6 }}
      />
      <div
        className="app-skeleton-shimmer"
        style={{ width: "60%", height: 10, borderRadius: 4 }}
      />
    </div>
  );
}

export function ErrorCard({
  title = "うまく読み込めませんでした",
  desc,
  onRetry,
}: {
  title?: ReactNode;
  desc?: ReactNode;
  onRetry?: () => void;
}) {
  return (
    <div
      className="flex gap-3 items-start"
      style={{
        padding: 18,
        background: "var(--app-danger-soft)",
        border: "1px solid rgba(220,38,38,.2)",
        borderRadius: "var(--app-r-lg)",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          background: "white",
          display: "grid",
          placeItems: "center",
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        ⚠️
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "var(--app-danger)",
            marginBottom: 4,
          }}
        >
          {title}
        </div>
        {desc && (
          <div
            style={{
              fontSize: 12.5,
              color: "var(--app-text-muted)",
              lineHeight: 1.7,
              marginBottom: onRetry ? 10 : 0,
            }}
          >
            {desc}
          </div>
        )}
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            style={{
              padding: "6px 14px",
              fontSize: 12,
              fontWeight: 700,
              border: "1px solid var(--app-danger)",
              background: "white",
              color: "var(--app-danger)",
              borderRadius: "var(--app-r-pill)",
              cursor: "pointer",
            }}
          >
            🔄 もう一度試す
          </button>
        )}
      </div>
    </div>
  );
}

export type AppToastKind = "success" | "error" | "info" | "careo";

export function AppToast({
  kind = "success",
  title,
  desc,
  onClose,
}: {
  kind?: AppToastKind;
  title: ReactNode;
  desc?: ReactNode;
  onClose?: () => void;
}) {
  const map: Record<Exclude<AppToastKind, "careo">, { icon: string; color: string; bg: string }> = {
    success: { icon: "✓", color: "var(--app-success)", bg: "var(--app-success-soft)" },
    error: { icon: "✕", color: "var(--app-danger)", bg: "var(--app-danger-soft)" },
    info: { icon: "ⓘ", color: "var(--app-info)", bg: "var(--app-info-soft)" },
  };

  return (
    <div
      className="flex items-center gap-2.5"
      style={{
        padding: "10px 14px",
        background: "var(--app-surface-0)",
        borderRadius: "var(--app-r-md)",
        boxShadow: "var(--app-shadow-lg)",
        border: "1px solid var(--app-border)",
        minWidth: 280,
        maxWidth: 380,
      }}
    >
      {kind === "careo" ? (
        <CareoKun size={28} mood="cheer" />
      ) : (
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            background: map[kind].bg,
            color: map[kind].color,
            display: "grid",
            placeItems: "center",
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          {map[kind].icon}
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--app-text)" }}>{title}</div>
        {desc && (
          <div style={{ fontSize: 11.5, color: "var(--app-text-muted)", marginTop: 2 }}>{desc}</div>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--app-text-dim)",
            fontSize: 14,
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
