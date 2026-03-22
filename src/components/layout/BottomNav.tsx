"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function hasChatToday(): boolean {
  try {
    const last = localStorage.getItem("careo_last_chat_date");
    return last === new Date().toDateString();
  } catch { return false; }
}

const mainItems = [
  {
    href: "/",
    label: "ホーム",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/companies",
    label: "企業",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    href: "/chat",
    label: "コーチ",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
  {
    href: "/es",
    label: "ES",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

const moreItems = [
  { href: "/interviews", label: "面接ログ" },
  { href: "/ob-visits", label: "OB/OG訪問" },
  { href: "/tests", label: "筆記試験" },
  { href: "/career", label: "自己分析" },
  { href: "/deadlines", label: "締切一覧" },
  { href: "/groups", label: "友達と就活" },
  { href: "/report", label: "レポート" },
  { href: "/insights", label: "みんなの就活" },
  { href: "/settings", label: "設定" },
];

export function BottomNav() {
  const pathname = usePathname();
  const [isAuth, setIsAuth] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [chatBadge, setChatBadge] = useState(false);

  useEffect(() => {
    // チャット未実施の日はバッジを表示
    setChatBadge(!hasChatToday());
  }, [pathname]);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => setIsAuth(!!data.user));
  }, []);

  useEffect(() => {
    setShowMore(false);
  }, [pathname]);

  if (!isAuth) return null;

  return (
    <>
      {showMore && (
        <div
          className="fixed inset-0 z-40 bg-black/40"
          onClick={() => setShowMore(false)}
        />
      )}

      {showMore && (
        <div className="fixed bottom-16 left-0 right-0 z-50 bg-white border-t border-gray-200 rounded-t-2xl shadow-xl md:hidden">
          <div className="px-4 pt-3 pb-2">
            <p className="text-xs font-semibold text-gray-400 mb-3">メニュー</p>
            <div className="grid grid-cols-4 gap-2">
              {moreItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center justify-center gap-1 py-3 rounded-xl text-center transition-colors ${
                      isActive ? "bg-[#00c896]/10 text-[#00c896]" : "bg-gray-50 text-gray-600"
                    }`}
                  >
                    <span className="text-[11px] font-medium leading-tight">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
          <div className="h-safe-area-inset-bottom" />
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 md:hidden">
        <div className="flex items-center justify-around h-16 px-2">
          {mainItems.map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            const showBadge = item.href === "/chat" && chatBadge && !isActive;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-lg transition-colors relative ${
                  isActive ? "text-[#00c896]" : "text-gray-400"
                }`}
              >
                <span className="relative">
                  {item.icon}
                  {showBadge && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
                  )}
                </span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          <button
            onClick={() => setShowMore((v) => !v)}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-lg transition-colors ${
              showMore ? "text-[#00c896]" : "text-gray-400"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <span className="text-[10px] font-medium">もっと</span>
          </button>
        </div>
      </nav>
    </>
  );
}
