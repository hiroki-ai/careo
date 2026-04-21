"use client";

import { forwardRef, useState } from "react";
import type { ReactNode, InputHTMLAttributes, TextareaHTMLAttributes } from "react";

export function FieldGroup({
  label,
  required,
  error,
  hint,
  inline,
  children,
}: {
  label: ReactNode;
  required?: boolean;
  error?: string;
  hint?: string;
  inline?: boolean;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: inline ? "grid" : "block",
        gridTemplateColumns: inline ? "120px 1fr" : undefined,
        gap: inline ? 12 : 0,
        alignItems: inline ? "flex-start" : "stretch",
        marginBottom: 14,
      }}
    >
      <label
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "var(--app-text)",
          display: "block",
          marginBottom: inline ? 0 : 6,
          paddingTop: inline ? 9 : 0,
        }}
      >
        {label}
        {required && <span style={{ color: "var(--app-danger)", marginLeft: 4 }}>*</span>}
      </label>
      <div>
        {children}
        {hint && !error && (
          <div style={{ fontSize: 11, color: "var(--app-text-dim)", marginTop: 5 }}>{hint}</div>
        )}
        {error && (
          <div
            style={{
              fontSize: 11.5,
              color: "var(--app-danger)",
              marginTop: 5,
              fontWeight: 600,
            }}
          >
            ⚠ {error}
          </div>
        )}
      </div>
    </div>
  );
}

type AppInputProps = InputHTMLAttributes<HTMLInputElement> & { error?: boolean };

export const AppInput = forwardRef<HTMLInputElement, AppInputProps>(function AppInput(
  { error, style, ...rest },
  ref
) {
  return (
    <input
      ref={ref}
      {...rest}
      style={{
        width: "100%",
        padding: "9px 12px",
        fontSize: 13,
        border: `1px solid ${error ? "var(--app-danger)" : "var(--app-border-strong)"}`,
        borderRadius: "var(--app-r-md)",
        background: "var(--app-surface-0)",
        color: "var(--app-text)",
        outline: "none",
        boxSizing: "border-box",
        ...style,
      }}
    />
  );
});

type AppTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { error?: boolean };

export const AppTextarea = forwardRef<HTMLTextAreaElement, AppTextareaProps>(function AppTextarea(
  { error, rows = 3, style, ...rest },
  ref
) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      {...rest}
      style={{
        width: "100%",
        padding: "10px 12px",
        fontSize: 13,
        border: `1px solid ${error ? "var(--app-danger)" : "var(--app-border-strong)"}`,
        borderRadius: "var(--app-r-md)",
        background: "var(--app-surface-0)",
        color: "var(--app-text)",
        outline: "none",
        resize: "vertical",
        fontFamily: "inherit",
        boxSizing: "border-box",
        lineHeight: 1.7,
        ...style,
      }}
    />
  );
});

export function InlineEditable({
  value,
  onSave,
  multiline,
  placeholder = "クリックして入力",
}: {
  value: string;
  onSave?: (next: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const commit = () => {
    onSave?.(draft);
    setEditing(false);
  };
  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    const sharedStyle: React.CSSProperties = {
      flex: 1,
      padding: multiline ? "6px 8px" : "4px 8px",
      fontSize: 13,
      border: "1.5px solid var(--app-accent)",
      borderRadius: 6,
      outline: "none",
      background: "var(--app-surface-0)",
      color: "var(--app-text)",
      fontFamily: "inherit",
    };
    return (
      <div className="flex gap-1.5 items-start">
        {multiline ? (
          <textarea
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") cancel();
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) commit();
            }}
            rows={3}
            style={{ ...sharedStyle, resize: "vertical" }}
          />
        ) : (
          <input
            value={draft}
            autoFocus
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") commit();
              if (e.key === "Escape") cancel();
            }}
            style={sharedStyle}
          />
        )}
        <button
          type="button"
          onClick={commit}
          style={{
            background: "var(--app-accent)",
            color: "white",
            border: "none",
            borderRadius: 6,
            padding: "4px 10px",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          保存
        </button>
        <button
          type="button"
          onClick={cancel}
          style={{
            background: "none",
            color: "var(--app-text-muted)",
            border: "none",
            padding: "4px 8px",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          取消
        </button>
      </div>
    );
  }

  return (
    <div
      onClick={() => setEditing(true)}
      className="app-editable-hover"
      style={{
        fontSize: 13,
        color: "var(--app-text)",
        cursor: "text",
        padding: "4px 8px",
        margin: "-4px -8px",
        borderRadius: 6,
        transition: "background .15s",
      }}
    >
      {draft || <span style={{ color: "var(--app-text-dim)" }}>{placeholder}</span>}
    </div>
  );
}

export type QuickAction = {
  icon?: ReactNode;
  label: string;
  onClick?: () => void;
};

export function QuickActionBar({
  actions,
  primary,
}: {
  actions: QuickAction[];
  primary?: QuickAction;
}) {
  return (
    <div
      className="flex items-center gap-2"
      style={{
        padding: "8px 10px",
        background: "var(--app-surface-0)",
        border: "1px solid var(--app-border)",
        borderRadius: "var(--app-r-pill)",
        boxShadow: "var(--app-shadow-float)",
        width: "fit-content",
      }}
    >
      {actions.map((a, i) => (
        <button
          key={i}
          type="button"
          onClick={a.onClick}
          className="inline-flex items-center gap-1.5"
          style={{
            padding: "7px 12px",
            border: "none",
            background: "transparent",
            color: "var(--app-text)",
            fontSize: 12.5,
            fontWeight: 600,
            cursor: "pointer",
            borderRadius: "var(--app-r-pill)",
          }}
        >
          {a.icon && <span style={{ fontSize: 14 }}>{a.icon}</span>}
          <span>{a.label}</span>
        </button>
      ))}
      {primary && (
        <button
          type="button"
          onClick={primary.onClick}
          className="inline-flex items-center gap-1.5"
          style={{
            padding: "8px 16px",
            border: "none",
            background: "linear-gradient(135deg, var(--app-accent), var(--app-accent-deep))",
            color: "white",
            fontSize: 12.5,
            fontWeight: 800,
            cursor: "pointer",
            borderRadius: "var(--app-r-pill)",
            boxShadow: "var(--app-shadow-teal)",
          }}
        >
          {primary.icon && <span style={{ fontSize: 14 }}>{primary.icon}</span>}
          <span>{primary.label}</span>
        </button>
      )}
    </div>
  );
}

export type FilterChip = {
  id: string;
  icon?: ReactNode;
  label: string;
  count?: number;
};

export function FilterChipRow({
  chips,
  activeIds,
  onToggle,
}: {
  chips: FilterChip[];
  activeIds: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div
      className="scrollbar-hide"
      style={{
        display: "flex",
        gap: 8,
        overflowX: "auto",
        padding: "4px 2px 10px",
      }}
    >
      {chips.map((c) => {
        const active = activeIds.includes(c.id);
        return (
          <button
            key={c.id}
            type="button"
            onClick={() => onToggle(c.id)}
            className="inline-flex items-center gap-1.5"
            style={{
              flexShrink: 0,
              padding: "7px 14px",
              fontSize: 12,
              fontWeight: 700,
              border: `1px solid ${active ? "var(--app-accent)" : "var(--app-border-strong)"}`,
              background: active ? "var(--app-accent)" : "var(--app-surface-0)",
              color: active ? "white" : "var(--app-text)",
              borderRadius: "var(--app-r-pill)",
              cursor: "pointer",
              transition: "all .15s",
            }}
          >
            {c.icon && <span>{c.icon}</span>}
            <span>{c.label}</span>
            {c.count != null && (
              <span
                style={{
                  fontSize: 10,
                  padding: "1px 6px",
                  borderRadius: 999,
                  background: active ? "rgba(255,255,255,.25)" : "var(--app-surface-2)",
                  color: active ? "white" : "var(--app-text-muted)",
                }}
              >
                {c.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
