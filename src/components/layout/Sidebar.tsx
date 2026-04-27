"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useCoach } from "@/hooks/useCoach";
import { CareoKun } from "@/components/landing/CareoKun";

type NavItemDef = {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  isCoach?: boolean;
};

const navGroups: { label: string; items: NavItemDef[] }[] = [
  {
    label: "ホーム",
    items: [
      {
        href: "/",
        label: "ダッシュボード",
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        ),
      },
      {
        href: "/report",
        label: "PDCAレポート",
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
      {
        href: "/metrics",
        label: "KPI",
        badge: "New",
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 3v18h18M7 14l4-4 4 4 6-6" />
          </svg>
        ),
      },
      {
        href: "/weekly-coach",
        label: "週次コーチ",
        badge: "New",
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "選考管理",
    items: [
      {
        href: "/calendar",
        label: "カレンダー",
        badge: "New",
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
      },
      {
        href: "/coaching",
        label: "コーチングAI",
        badge: "New",
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        ),
      },
      {
        href: "/companies",
        label: "企業管理",
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ),
      },
      {
        href: "/es",
        label: "ES管理",
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
      {
        href: "/interviews",
        label: "面接ログ",
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        ),
      },
      {
        href: "/interviews/recording",
        label: "面接文字起こし",
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
      {
        href: "/deadlines",
        label: "締切一覧",
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        ),
      },
      {
        href: "/events",
        label: "説明会・インターン",
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        ),
      },
    ],
  },
  {
    label: "コミュニティ",
    items: [
      {
        href: "/senpai",
        label: "先輩データ",
        badge: "New",
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        ),
      },
      {
        href: "/insights",
        label: "みんなの就活",
        icon: (
          <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
    ],
  },
];

const bottomItems: NavItemDef[] = [
  {
    href: "/invite",
    label: "友達を招待",
    icon: (
      <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    href: "/import",
    label: "データインポート",
    icon: (
      <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
      </svg>
    ),
  },
  {
    href: "/settings",
    label: "設定",
    icon: (
      <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isAuth, setIsAuth] = useState(false);
  const { coachName } = useCoach();
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setIsAuth(!!data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuth(!!session?.user);
    });
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => {
      subscription.unsubscribe();
      window.removeEventListener("resize", check);
    };
  }, []);

  const toggle = () => {
    setCollapsed((prev) => {
      localStorage.setItem("sidebar-collapsed", String(!prev));
      return !prev;
    });
  };

  if (!isAuth || isMobile) return null;

  const allNavItems = navGroups.flatMap((g) => g.items);
  const wideWidth = 240;
  const narrowWidth = 60;

  return (
    <aside
      className="flex flex-col sticky top-0 h-screen transition-all duration-200 shrink-0"
      style={{
        width: collapsed ? narrowWidth : wideWidth,
        background: "var(--app-surface-0)",
        borderRight: "1px solid var(--app-border)",
        color: "var(--app-text)",
      }}
    >
      {/* ロゴ + 折り畳みトグル */}
      <div
        className="flex items-center shrink-0"
        style={{ padding: collapsed ? "16px 0" : "18px 18px 14px", justifyContent: collapsed ? "center" : "space-between" }}
      >
        {!collapsed ? (
          <>
            <Link href="/" className="flex items-center gap-2.5 flex-1 min-w-0" style={{ textDecoration: "none", color: "inherit" }}>
              <CareoKun size={34} mood="cheer" />
              <div>
                <div className="font-klee" style={{ fontSize: 20, fontWeight: 700, lineHeight: 1, letterSpacing: -0.5 }}>
                  Careo
                </div>
                <div
                  style={{
                    fontSize: 9.5,
                    color: "var(--app-text-dim)",
                    letterSpacing: 1,
                    marginTop: 3,
                    fontWeight: 700,
                  }}
                >
                  AI CAREER COACH
                </div>
              </div>
            </Link>
            <button
              type="button"
              onClick={toggle}
              className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg transition-all"
              style={{ color: "var(--app-text-dim)" }}
              title="折り畳む"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={toggle}
            className="transition-all"
            title="展開"
            aria-label="サイドバーを展開"
          >
            <CareoKun size={32} mood="cheer" />
          </button>
        )}
      </div>

      {/* 検索ショートカット */}
      {!collapsed && (
        <div style={{ padding: "0 12px 10px" }}>
          <button
            type="button"
            onClick={() => {
              const evt = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
              document.dispatchEvent(evt);
            }}
            className="flex items-center gap-2 w-full transition-all"
            style={{
              padding: "8px 10px",
              background: "var(--app-surface-1)",
              border: "1px solid var(--app-border)",
              borderRadius: "var(--app-r-md)",
              color: "var(--app-text-muted)",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="flex-1 text-left">検索...</span>
            <kbd
              className="font-mono"
              style={{
                fontSize: 9,
                padding: "1px 5px",
                background: "var(--app-surface-2)",
                borderRadius: 4,
                color: "var(--app-text-dim)",
              }}
            >
              ⌘K
            </kbd>
          </button>
        </div>
      )}

      {/* メインナビ */}
      <nav
        className="flex-1 overflow-y-auto"
        style={{ padding: collapsed ? "4px 8px" : "4px 10px", display: "flex", flexDirection: "column", gap: 1 }}
      >
        {collapsed ? (
          <>
            {allNavItems.map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  className="relative flex items-center justify-center w-full transition-all"
                  style={{
                    padding: "10px 0",
                    margin: "2px 0",
                    borderRadius: "var(--app-r-md)",
                    background: isActive ? "var(--app-accent-soft)" : "transparent",
                    color: isActive ? "var(--app-accent-deep)" : "var(--app-text-muted)",
                  }}
                >
                  {isActive && (
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
                  {item.icon}
                </Link>
              );
            })}
          </>
        ) : (
          <>
            {navGroups.map((group, gi) => (
              <div key={group.label} style={{ marginTop: gi > 0 ? 12 : 0 }}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: "var(--app-text-dim)",
                    letterSpacing: 1.5,
                    padding: "10px 10px 6px",
                  }}
                >
                  {group.label.toUpperCase()}
                </div>
                {group.items.map((item) => {
                  const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  const label = item.isCoach ? `${coachName}コーチ` : item.label;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="relative flex items-center gap-2.5 transition-all"
                      style={{
                        padding: "9px 12px",
                        borderRadius: "var(--app-r-md)",
                        background: isActive ? "var(--app-accent-soft)" : "transparent",
                        color: isActive ? "var(--app-accent-deep)" : "var(--app-text)",
                        fontSize: 13,
                        fontWeight: isActive ? 700 : 600,
                      }}
                    >
                      {isActive && (
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
                      {item.icon}
                      <span className="flex-1 min-w-0 truncate">{label}</span>
                      {item.badge && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            padding: "2px 6px",
                            background: "var(--app-accent-soft)",
                            color: "var(--app-accent-deep)",
                            borderRadius: "var(--app-r-pill)",
                            letterSpacing: 0.3,
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </>
        )}
      </nav>

      {/* ボトムアイテム */}
      <div
        style={{
          padding: collapsed ? "8px 8px 12px" : "8px 10px 12px",
          borderTop: "1px solid var(--app-border)",
        }}
      >
        {bottomItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className="relative flex items-center transition-all"
              style={{
                padding: collapsed ? "9px 0" : "8px 12px",
                margin: "1px 0",
                borderRadius: "var(--app-r-md)",
                justifyContent: collapsed ? "center" : "flex-start",
                gap: collapsed ? 0 : 10,
                background: isActive ? "var(--app-accent-soft)" : "transparent",
                color: isActive ? "var(--app-accent-deep)" : "var(--app-text-muted)",
                fontSize: 12.5,
                fontWeight: isActive ? 700 : 600,
              }}
            >
              {isActive && !collapsed && (
                <span
                  style={{
                    position: "absolute",
                    left: 0,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 3,
                    height: 16,
                    background: "var(--app-accent)",
                    borderRadius: 2,
                  }}
                />
              )}
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
