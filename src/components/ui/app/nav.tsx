"use client";

import type { ReactNode } from "react";
import { CareoKun } from "@/components/landing/CareoKun";

export type NavItemProps = {
  icon: ReactNode;
  label: string;
  active?: boolean;
  badge?: number | string;
  compact?: boolean;
  onClick?: () => void;
};

export function NavItem({ icon, label, active, badge, compact, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        padding: compact ? "8px 10px" : "10px 12px",
        borderRadius: "var(--app-r-md)",
        border: "none",
        cursor: "pointer",
        background: active ? "var(--app-accent-soft)" : "transparent",
        color: active ? "var(--app-accent-deep)" : "var(--app-text)",
        fontWeight: active ? 700 : 600,
        fontSize: 13,
        textAlign: "left",
        transition: "background .15s",
        position: "relative",
      }}
    >
      {active && (
        <span
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: 3,
            height: 18,
            background: "var(--app-accent)",
            borderRadius: 2,
          }}
        />
      )}
      <span style={{ width: 18, textAlign: "center", fontSize: 15, display: "inline-flex", justifyContent: "center" }}>
        {icon}
      </span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge != null && (
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            padding: "2px 7px",
            background: active ? "var(--app-accent)" : "var(--app-danger)",
            color: "white",
            borderRadius: "var(--app-r-pill)",
            minWidth: 18,
            textAlign: "center",
          }}
        >
          {badge}
        </span>
      )}
    </button>
  );
}

export function BottomNavFAB({ onClick, label = "クイック追加" }: { onClick?: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        position: "relative",
        width: 56,
        height: 56,
        borderRadius: "50%",
        background: "linear-gradient(135deg, var(--app-accent), var(--app-accent-deep))",
        border: "4px solid var(--app-surface-0)",
        color: "white",
        fontSize: 26,
        fontWeight: 600,
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        boxShadow: "var(--app-shadow-teal), var(--app-shadow-md)",
        marginTop: -22,
      }}
    >
      <span style={{ lineHeight: 0 }}>＋</span>
    </button>
  );
}

export type MobileBottomNavItem = {
  id: string;
  icon: ReactNode;
  label: string;
  badge?: number | string;
};

export function MobileBottomNav({
  items,
  activeId,
  onSelect,
  onFab,
}: {
  items: MobileBottomNavItem[];
  activeId: string;
  onSelect: (id: string) => void;
  onFab?: () => void;
}) {
  const left = items.slice(0, 2);
  const right = items.slice(2, 4);
  return (
    <nav
      style={{
        background: "var(--app-surface-0)",
        borderTop: "1px solid var(--app-border)",
        padding: "6px 4px 10px",
        display: "grid",
        gridTemplateColumns: "1fr 1fr 70px 1fr 1fr",
        alignItems: "center",
        boxShadow: "0 -4px 14px rgba(13,11,33,.04)",
      }}
    >
      {left.map((it) => (
        <BottomNavButton
          key={it.id}
          item={it}
          active={activeId === it.id}
          onClick={() => onSelect(it.id)}
        />
      ))}
      <div style={{ display: "grid", placeItems: "center" }}>
        <BottomNavFAB onClick={onFab} />
      </div>
      {right.map((it) => (
        <BottomNavButton
          key={it.id}
          item={it}
          active={activeId === it.id}
          onClick={() => onSelect(it.id)}
        />
      ))}
    </nav>
  );
}

function BottomNavButton({
  item,
  active,
  onClick,
}: {
  item: MobileBottomNavItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        background: "none",
        border: "none",
        cursor: "pointer",
        padding: "8px 4px",
        color: active ? "var(--app-accent-deep)" : "var(--app-text-muted)",
        position: "relative",
      }}
    >
      <span style={{ fontSize: 20, lineHeight: 1 }}>{item.icon}</span>
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5 }}>{item.label}</span>
      {item.badge != null && (
        <span
          style={{
            position: "absolute",
            top: 4,
            right: "28%",
            background: "var(--app-danger)",
            color: "white",
            fontSize: 9,
            fontWeight: 800,
            padding: "1px 5px",
            borderRadius: 999,
          }}
        >
          {item.badge}
        </span>
      )}
    </button>
  );
}

export function AppShellBrand({ label = "Careo", mood = "cheer" as const }: { label?: string; mood?: "default" | "cheer" | "think" | "celebrate" | "sleep" }) {
  return (
    <div className="flex items-center gap-2.5" style={{ padding: "0 8px" }}>
      <CareoKun size={28} mood={mood} />
      <div className="font-klee" style={{ fontSize: 18, fontWeight: 700 }}>
        {label}
      </div>
    </div>
  );
}
