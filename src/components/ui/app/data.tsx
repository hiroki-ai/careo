"use client";

import type { ReactNode } from "react";

type Tone = "default" | "accent" | "ink";

export function AppCard({
  title,
  subtitle,
  action,
  footer,
  children,
  padded = true,
  accent,
  tone = "default",
}: {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  padded?: boolean;
  accent?: boolean;
  tone?: Tone;
}) {
  const bg =
    tone === "accent"
      ? "linear-gradient(160deg, var(--app-accent-soft), var(--app-surface-0))"
      : tone === "ink"
      ? "var(--careo-ink)"
      : "var(--app-surface-0)";
  const textColor = tone === "ink" ? "white" : "var(--app-text)";

  return (
    <div
      style={{
        background: bg,
        color: textColor,
        border: tone === "ink" ? "none" : "1px solid var(--app-border)",
        borderRadius: "var(--app-r-lg)",
        overflow: "hidden",
        boxShadow: "var(--app-shadow-sm)",
      }}
    >
      {(title || action) && (
        <header
          className="flex items-center gap-3"
          style={{
            padding: "14px 16px 10px",
            borderBottom: padded && children ? "1px solid var(--app-border)" : "none",
          }}
        >
          {accent && (
            <span
              style={{
                width: 3,
                height: 18,
                background: "var(--app-accent)",
                borderRadius: 2,
              }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            {title && (
              <div
                className="font-klee"
                style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.2 }}
              >
                {title}
              </div>
            )}
            {subtitle && (
              <div
                style={{
                  fontSize: 11.5,
                  color: tone === "ink" ? "rgba(255,255,255,.7)" : "var(--app-text-muted)",
                  marginTop: 2,
                }}
              >
                {subtitle}
              </div>
            )}
          </div>
          {action}
        </header>
      )}
      {children && <div style={{ padding: padded ? "12px 16px 16px" : 0 }}>{children}</div>}
      {footer && (
        <footer
          style={{
            padding: "10px 16px",
            background: tone === "ink" ? "rgba(255,255,255,.04)" : "var(--app-surface-1)",
            borderTop: "1px solid var(--app-border)",
            fontSize: 12,
          }}
        >
          {footer}
        </footer>
      )}
    </div>
  );
}

type Trend = "up" | "down" | "flat";

export function StatTile({
  label,
  value,
  unit,
  delta,
  trend = "up",
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  delta?: string;
  trend?: Trend;
  icon?: ReactNode;
  tone?: "default" | "accent";
}) {
  const deltaColor =
    trend === "up"
      ? "var(--app-success)"
      : trend === "down"
      ? "var(--app-danger)"
      : "var(--app-text-muted)";
  const isAccent = tone === "accent";

  return (
    <div
      style={{
        background: isAccent
          ? "linear-gradient(160deg, var(--app-accent-soft), var(--app-surface-0))"
          : "var(--app-surface-0)",
        border: `1px solid ${isAccent ? "rgba(0,200,150,.22)" : "var(--app-border)"}`,
        borderRadius: "var(--app-r-lg)",
        padding: 16,
        minWidth: 0,
      }}
    >
      <div className="flex items-center gap-2" style={{ marginBottom: 10 }}>
        {icon && (
          <span
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: isAccent ? "white" : "var(--app-accent-soft)",
              color: "var(--app-accent-deep)",
              display: "grid",
              placeItems: "center",
              fontSize: 15,
            }}
          >
            {icon}
          </span>
        )}
        <div
          style={{
            fontSize: 11.5,
            color: "var(--app-text-muted)",
            fontWeight: 600,
            letterSpacing: 0.3,
          }}
        >
          {label}
        </div>
      </div>
      <div className="flex items-baseline gap-1">
        <div
          className="font-klee"
          style={{
            fontSize: 30,
            fontWeight: 700,
            lineHeight: 1,
            letterSpacing: -1,
            color: "var(--app-text)",
          }}
        >
          {value}
        </div>
        {unit && (
          <div style={{ fontSize: 12, color: "var(--app-text-muted)", fontWeight: 600 }}>{unit}</div>
        )}
      </div>
      {delta != null && (
        <div
          className="inline-flex items-center gap-1"
          style={{ marginTop: 10, fontSize: 11, fontWeight: 700, color: deltaColor }}
        >
          <span>{trend === "up" ? "↗" : trend === "down" ? "↘" : "→"}</span>
          <span>{delta}</span>
          <span style={{ color: "var(--app-text-dim)", fontWeight: 500 }}>先週比</span>
        </div>
      )}
    </div>
  );
}

export type ListItemStatus = "pending" | "ok" | "ng" | "draft";

export function ListItem({
  leading,
  title,
  subtitle,
  meta,
  trailing,
  onClick,
  status,
}: {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  status?: ListItemStatus;
}) {
  const statusMap: Record<ListItemStatus, { color: string; bg: string; label: string }> = {
    ok: { color: "var(--app-success)", bg: "var(--app-success-soft)", label: "通過" },
    pending: { color: "var(--app-warning)", bg: "var(--app-warning-soft)", label: "進行中" },
    ng: { color: "var(--app-danger)", bg: "var(--app-danger-soft)", label: "見送り" },
    draft: { color: "var(--app-text-muted)", bg: "var(--app-surface-2)", label: "下書き" },
  };
  const s = status ? statusMap[status] : null;

  return (
    <div
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className="flex items-center gap-3"
      style={{
        padding: "12px 14px",
        background: "var(--app-surface-0)",
        borderRadius: "var(--app-r-md)",
        cursor: onClick ? "pointer" : "default",
        border: "1px solid var(--app-border)",
        minHeight: "var(--app-row-h)",
      }}
    >
      {leading && <div style={{ flexShrink: 0 }}>{leading}</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
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
              fontSize: 12,
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
        {meta && (
          <div style={{ fontSize: 11, color: "var(--app-text-dim)", marginTop: 4 }}>{meta}</div>
        )}
      </div>
      {s && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 9px",
            borderRadius: "var(--app-r-pill)",
            background: s.bg,
            color: s.color,
          }}
        >
          {s.label}
        </span>
      )}
      {trailing}
    </div>
  );
}

export function DataRow({
  label,
  value,
  copyable,
  onCopy,
}: {
  label: ReactNode;
  value: ReactNode;
  copyable?: boolean;
  onCopy?: () => void;
}) {
  return (
    <div
      className="items-baseline"
      style={{
        display: "grid",
        gridTemplateColumns: "120px 1fr",
        gap: 12,
        padding: "10px 0",
        borderBottom: "1px solid var(--app-border)",
      }}
    >
      <div style={{ fontSize: 12, color: "var(--app-text-muted)", fontWeight: 600 }}>{label}</div>
      <div
        className="flex items-center gap-2"
        style={{ fontSize: 13.5, color: "var(--app-text)", fontWeight: 500 }}
      >
        <span style={{ flex: 1 }}>{value}</span>
        {copyable && (
          <button
            type="button"
            onClick={onCopy}
            aria-label="コピー"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--app-text-dim)",
              fontSize: 12,
            }}
          >
            ⎘
          </button>
        )}
      </div>
    </div>
  );
}

export function ProgressRing({
  value = 0,
  size = 80,
  sub,
  strokeWidth = 6,
}: {
  value: number;
  size?: number;
  sub?: string;
  strokeWidth?: number;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - strokeWidth * 2) / 2;
  const c = 2 * Math.PI * r;
  const dash = (clamped / 100) * c;

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--app-surface-2)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--app-accent)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
          style={{ transition: "stroke-dasharray .8s ease" }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
        }}
      >
        <div>
          <div
            className="font-klee"
            style={{
              fontSize: size > 70 ? 22 : 16,
              fontWeight: 700,
              color: "var(--app-text)",
              lineHeight: 1,
            }}
          >
            {clamped}
          </div>
          {sub && (
            <div style={{ fontSize: 9, color: "var(--app-text-muted)", marginTop: 2 }}>{sub}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export type TimelineStatus = "done" | "current" | "pending";

export function TimelineEntry({
  time,
  title,
  desc,
  status = "current",
  icon,
  last,
}: {
  time: ReactNode;
  title: ReactNode;
  desc?: ReactNode;
  status?: TimelineStatus;
  icon?: ReactNode;
  last?: boolean;
}) {
  const colors: Record<TimelineStatus, { dot: string; bg: string }> = {
    done: { dot: "var(--app-success)", bg: "var(--app-success-soft)" },
    current: { dot: "var(--app-accent)", bg: "var(--app-accent-soft)" },
    pending: { dot: "var(--app-text-dim)", bg: "var(--app-surface-2)" },
  };
  const c = colors[status];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "48px 1fr", gap: 12, position: "relative" }}>
      <div
        className="flex flex-col items-center"
        style={{ position: "relative" }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            background: c.bg,
            color: c.dot,
            display: "grid",
            placeItems: "center",
            fontSize: 16,
            fontWeight: 700,
            border: `2px solid ${c.dot}`,
            zIndex: 1,
          }}
        >
          {icon}
        </div>
        {!last && (
          <div
            style={{
              width: 2,
              flex: 1,
              background: "var(--app-border)",
              marginTop: -2,
              minHeight: 20,
            }}
          />
        )}
      </div>
      <div style={{ paddingBottom: last ? 0 : 18 }}>
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            color: c.dot,
            letterSpacing: 1,
            marginBottom: 3,
          }}
        >
          {time}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--app-text)", marginBottom: 2 }}>
          {title}
        </div>
        {desc && (
          <div style={{ fontSize: 12, color: "var(--app-text-muted)", lineHeight: 1.7 }}>{desc}</div>
        )}
      </div>
    </div>
  );
}
