"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode, TouchEvent } from "react";
import { CareoKun } from "@/components/landing/CareoKun";

export function BottomSheet({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title?: ReactNode;
  children: ReactNode;
  onClose?: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
      }}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(13,11,33,.35)",
          animation: "fade-in 0.15s ease-out",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          background: "var(--app-surface-0)",
          color: "var(--app-text)",
          borderRadius: "24px 24px 0 0",
          padding: "10px 18px 20px",
          maxHeight: "75%",
          overflowY: "auto",
          boxShadow: "0 -8px 24px rgba(13,11,33,.12)",
          animation: "app-slide-up-inline 0.3s ease-out",
          paddingBottom: "max(env(safe-area-inset-bottom), 20px)",
        }}
      >
        <div
          style={{
            width: 40,
            height: 4,
            background: "var(--app-border-strong)",
            borderRadius: 2,
            margin: "0 auto 14px",
          }}
        />
        {title && (
          <div
            className="flex items-center justify-between"
            style={{ marginBottom: 12 }}
          >
            <div className="font-klee" style={{ fontSize: 16, fontWeight: 700 }}>
              {title}
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
                  fontSize: 16,
                  padding: 4,
                }}
              >
                ✕
              </button>
            )}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function SwipeableListItem({
  title,
  subtitle,
  leading,
  onEdit,
  onDelete,
  editLabel = "編集",
  deleteLabel = "削除",
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  editLabel?: string;
  deleteLabel?: string;
}) {
  const [revealed, setRevealed] = useState(false);
  const startX = useRef<number | null>(null);
  const deltaX = useRef(0);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    startX.current = e.touches[0].clientX;
    deltaX.current = 0;
  };
  const handleTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    if (startX.current == null) return;
    deltaX.current = e.touches[0].clientX - startX.current;
  };
  const handleTouchEnd = () => {
    if (deltaX.current < -40) setRevealed(true);
    else if (deltaX.current > 40) setRevealed(false);
    startX.current = null;
  };

  const showEdit = Boolean(onEdit);
  const showDelete = Boolean(onDelete);
  const revealWidth = (showEdit ? 64 : 0) + (showDelete ? 64 : 0);

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        borderRadius: "var(--app-r-md)",
        border: "1px solid var(--app-border)",
        background: "var(--app-surface-2)",
        height: 64,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        style={{ position: "absolute", top: 0, right: 0, bottom: 0, display: "flex" }}
      >
        {showEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="flex flex-col items-center justify-center gap-0.5"
            style={{
              width: 64,
              background: "var(--app-warning)",
              color: "white",
              border: "none",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 16 }}>✎</span>
            {editLabel}
          </button>
        )}
        {showDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="flex flex-col items-center justify-center gap-0.5"
            style={{
              width: 64,
              background: "var(--app-danger)",
              color: "white",
              border: "none",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            <span style={{ fontSize: 16 }}>🗑</span>
            {deleteLabel}
          </button>
        )}
      </div>
      <div
        className="flex items-center gap-3"
        style={{
          position: "absolute",
          inset: 0,
          transform: revealed ? `translateX(-${revealWidth}px)` : "translateX(0)",
          transition: "transform .25s ease",
          background: "var(--app-surface-0)",
          padding: "0 14px",
        }}
      >
        {leading ?? (
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: "var(--app-accent-soft)",
              color: "var(--app-accent-deep)",
              display: "grid",
              placeItems: "center",
              fontSize: 15,
              fontWeight: 800,
            }}
          >
            {typeof title === "string" ? title[0] ?? "・" : "・"}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 700,
              color: "var(--app-text)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {title}
          </div>
          {subtitle && (
            <div
              style={{
                fontSize: 11.5,
                color: "var(--app-text-muted)",
                marginTop: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export type PullState = "pulling" | "ready" | "refreshing" | "done";

export function PullToRefreshIndicator({ state = "pulling" }: { state?: PullState }) {
  const map: Record<PullState, { rot: number; label: string; color: string }> = {
    pulling: { rot: 0, label: "下に引いて更新", color: "var(--app-text-muted)" },
    ready: { rot: 180, label: "離して更新", color: "var(--app-accent)" },
    refreshing: { rot: 0, label: "カレオが更新中…", color: "var(--app-accent-deep)" },
    done: { rot: 0, label: "最新になったよ", color: "var(--app-success)" },
  };
  const m = map[state];
  const spinning = state === "refreshing";

  return (
    <div
      className="flex flex-col items-center gap-2"
      style={{
        padding: "16px 0",
        background: "var(--app-surface-1)",
        borderRadius: 12,
        border: "1px dashed var(--app-border-strong)",
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          display: "grid",
          placeItems: "center",
          animation: spinning ? "app-ring-rotate 1s linear infinite" : "none",
          transform: `rotate(${m.rot}deg)`,
          transition: "transform .3s",
        }}
      >
        {state === "done" ? (
          <CareoKun size={28} mood="celebrate" />
        ) : state === "refreshing" ? (
          <CareoKun size={28} mood="cheer" />
        ) : (
          <span style={{ fontSize: 20, color: m.color, fontWeight: 700 }}>↓</span>
        )}
      </div>
      <div style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.label}</div>
    </div>
  );
}
