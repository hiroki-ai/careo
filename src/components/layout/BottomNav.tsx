"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { QuickAddModal } from "./QuickAddModal";

const mainItems = [
  {
    href: "/",
    label: "ホーム",
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/deadlines",
    label: "締切",
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    href: "/report",
    label: "PDCA",
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.75} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

const moreCategories = [
  {
    label: "企業・選考",
    items: [
      { href: "/companies", label: "企業管理", emoji: "🏢" },
      { href: "/es", label: "ES管理", emoji: "📄" },
      { href: "/interviews", label: "面接ログ", emoji: "👥" },
      { href: "/interviews/recording", label: "文字起こし", emoji: "📝" },
      { href: "/calendar", label: "カレンダー", emoji: "📅" },
    ],
  },
  {
    label: "分析",
    items: [
      { href: "/metrics", label: "KPI", emoji: "📈" },
      { href: "/report", label: "PDCA", emoji: "📊" },
      { href: "/weekly-coach", label: "週次コーチ", emoji: "🏃" },
      { href: "/senpai", label: "先輩データ", emoji: "🎓" },
      { href: "/insights", label: "みんなの就活", emoji: "🌐" },
      { href: "/events", label: "説明会", emoji: "🎯" },
    ],
  },
  {
    label: "その他",
    items: [
      { href: "/invite", label: "友達招待", emoji: "🎁" },
      { href: "/import", label: "インポート", emoji: "📥" },
      { href: "/settings", label: "設定", emoji: "⚙️" },
    ],
  },
];

const moreItems = moreCategories.flatMap((c) => c.items);

const ACCENT = "var(--app-accent)";
const ACCENT_DEEP = "var(--app-accent-deep)";
const ACCENT_SOFT = "var(--app-accent-soft)";
const SURFACE_0 = "var(--app-surface-0)";
const SURFACE_1 = "var(--app-surface-1)";
const TEXT_MUTED = "var(--app-text-muted)";

export function BottomNav() {
  const pathname = usePathname();
  const [isAuth, setIsAuth] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setIsAuth(!!data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuth(!!session?.user);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setShowMore(false);
  }, [pathname]);

  if (!isAuth) return null;

  const isMoreActive = moreItems.some((item) => pathname.startsWith(item.href));

  return (
    <>
      <QuickAddModal isOpen={showQuickAdd} onClose={() => setShowQuickAdd(false)} />

      {showMore && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(13,11,33,.35)" }}
          onClick={() => setShowMore(false)}
        />
      )}

      {showMore && (
        <div className="fixed bottom-[88px] left-0 right-0 z-50 md:hidden animate-slide-up">
          <div
            className="mx-3 overflow-hidden"
            style={{
              background: SURFACE_0,
              border: "1px solid var(--app-border)",
              borderRadius: 24,
              boxShadow: "var(--app-shadow-float)",
            }}
          >
            <div style={{ padding: "16px 18px 8px" }}>
              {moreCategories.map((cat) => (
                <div key={cat.label} style={{ marginBottom: 14 }}>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      color: "var(--app-text-dim)",
                      letterSpacing: 1.5,
                      margin: "0 0 8px 2px",
                    }}
                  >
                    {cat.label.toUpperCase()}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {cat.items.map((item) => {
                      const isActive = pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className="relative flex flex-col items-center justify-center text-center transition-all active:scale-95"
                          style={{
                            padding: "12px 4px",
                            gap: 4,
                            borderRadius: "var(--app-r-lg)",
                            background: isActive ? ACCENT_SOFT : SURFACE_1,
                            color: isActive ? ACCENT_DEEP : "var(--app-text)",
                          }}
                        >
                          <span style={{ fontSize: 20, lineHeight: 1 }}>{item.emoji}</span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              lineHeight: 1.2,
                              color: isActive ? ACCENT_DEEP : TEXT_MUTED,
                            }}
                          >
                            {item.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          background: SURFACE_0,
          borderTop: "1px solid var(--app-border)",
          boxShadow: "0 -4px 14px rgba(13,11,33,.04)",
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="flex items-center px-1" style={{ height: 72 }}>
          {/* ホーム・締切 */}
          {mainItems.slice(0, 2).map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 h-full transition-colors"
                style={{ gap: 2 }}
              >
                <span
                  className="flex flex-col items-center transition-all"
                  style={{
                    gap: 2,
                    padding: "6px 14px",
                    borderRadius: 18,
                    background: isActive ? ACCENT_SOFT : "transparent",
                    color: isActive ? ACCENT_DEEP : TEXT_MUTED,
                  }}
                >
                  {item.icon(isActive)}
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 0.3,
                      color: isActive ? ACCENT_DEEP : TEXT_MUTED,
                    }}
                  >
                    {item.label}
                  </span>
                </span>
              </Link>
            );
          })}

          {/* 中央 FAB（クイック追加） */}
          <button
            type="button"
            onClick={() => setShowQuickAdd(true)}
            aria-label="クイック追加"
            className="relative flex flex-col items-center justify-center flex-1 h-full"
            style={{ gap: 2 }}
          >
            <span
              className="flex items-center justify-center active:scale-90 transition-transform"
              style={{
                width: 54,
                height: 54,
                background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT_DEEP})`,
                borderRadius: "50%",
                marginTop: -22,
                color: "white",
                boxShadow: "var(--app-shadow-teal), var(--app-shadow-md)",
                border: `4px solid ${SURFACE_0}`,
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, color: TEXT_MUTED, marginTop: -4 }}>記録</span>
          </button>

          {/* PDCA */}
          {mainItems.slice(2).map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 h-full transition-colors"
                style={{ gap: 2 }}
              >
                <span
                  className="flex flex-col items-center transition-all"
                  style={{
                    gap: 2,
                    padding: "6px 14px",
                    borderRadius: 18,
                    background: isActive ? ACCENT_SOFT : "transparent",
                    color: isActive ? ACCENT_DEEP : TEXT_MUTED,
                  }}
                >
                  {item.icon(isActive)}
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: 0.3,
                      color: isActive ? ACCENT_DEEP : TEXT_MUTED,
                    }}
                  >
                    {item.label}
                  </span>
                </span>
              </Link>
            );
          })}

          {/* もっと */}
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            aria-label="もっと"
            aria-expanded={showMore ? "true" : "false"}
            className="flex flex-col items-center justify-center flex-1 h-full"
            style={{ gap: 2 }}
          >
            <span
              className="flex flex-col items-center transition-all"
              style={{
                gap: 2,
                padding: "6px 14px",
                borderRadius: 18,
                background: showMore || isMoreActive ? ACCENT_SOFT : "transparent",
                color: showMore || isMoreActive ? ACCENT_DEEP : TEXT_MUTED,
              }}
            >
              {showMore ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.3,
                  color: showMore || isMoreActive ? ACCENT_DEEP : TEXT_MUTED,
                }}
              >
                もっと
              </span>
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
