"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { QuickAddModal } from "./QuickAddModal";

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
    href: "/deadlines",
    label: "締切",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  // center: QuickAdd FAB (rendered separately)
  {
    href: "/chat",
    label: "コーチ",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
];

const moreItems = [
  { href: "/companies", label: "企業管理", emoji: "🏢" },
  { href: "/report", label: "PDCA", emoji: "📊" },
  { href: "/calendar", label: "カレンダー", emoji: "📅" },
  { href: "/es", label: "ES管理", emoji: "📄" },
  { href: "/interviews", label: "面接ログ", emoji: "👥" },
  { href: "/ob-visits", label: "OB/OG訪問", emoji: "🤝" },
  { href: "/tests", label: "筆記試験", emoji: "📝" },
  { href: "/career", label: "自己分析", emoji: "💡" },
  { href: "/groups", label: "友達と就活", emoji: "👫" },
  { href: "/import", label: "インポート", emoji: "📥" },
  { href: "/settings", label: "設定", emoji: "⚙️" },
  { href: "/career-center", label: "キャリアセンター", emoji: "🖨️" },
  { href: "/appointments", label: "相談予約", emoji: "📅" },
];

export function BottomNav() {
  const pathname = usePathname();
  const [isAuth, setIsAuth] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [chatBadge, setChatBadge] = useState(false);

  useEffect(() => {
    setChatBadge(!hasChatToday());
  }, [pathname]);

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

  if (!isAuth || pathname.startsWith("/career-portal")) return null;

  const isMoreActive = moreItems.some(item => pathname.startsWith(item.href));

  return (
    <>
      {/* QuickAdd モーダル */}
      <QuickAddModal isOpen={showQuickAdd} onClose={() => setShowQuickAdd(false)} />

      {/* More メニュー オーバーレイ */}
      {showMore && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More メニュー シート */}
      {showMore && (
        <div className="fixed bottom-16 left-0 right-0 z-50 bg-white border-t border-gray-100 rounded-t-3xl shadow-2xl md:hidden">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>
          <div className="px-5 pt-2 pb-6">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">メニュー</p>
            <div className="grid grid-cols-4 gap-2">
              {moreItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl text-center transition-colors ${
                      isActive
                        ? "bg-[#00c896]/10 text-[#00a87e]"
                        : "bg-gray-50 text-gray-600 active:bg-gray-100"
                    }`}
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-[10px] font-medium leading-tight">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ボトムナビ本体 */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 md:hidden safe-area-padding-bottom">
        <div className="flex items-center justify-around h-16 px-1">
          {/* ホーム・締切 */}
          {mainItems.slice(0, 2).map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl transition-colors relative ${
                  isActive ? "text-[#00c896]" : "text-gray-400"
                }`}
              >
                {isActive && (
                  <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[#00c896] rounded-full" />
                )}
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* 中央 FAB（クイック追加） */}
          <button
            type="button"
            onClick={() => setShowQuickAdd(true)}
            className="relative flex flex-col items-center justify-center flex-1"
          >
            <span className="w-12 h-12 bg-[#00c896] rounded-2xl flex items-center justify-center shadow-lg shadow-[#00c896]/40 -mt-4 active:scale-95 transition-transform">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </span>
            <span className="text-[10px] font-medium text-gray-400 mt-0.5">記録</span>
          </button>

          {/* コーチ */}
          {mainItems.slice(2).map((item) => {
            const isActive = pathname.startsWith(item.href);
            const showBadge = item.href === "/chat" && chatBadge && !isActive;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl transition-colors relative ${
                  isActive ? "text-[#00c896]" : "text-gray-400"
                }`}
              >
                {isActive && (
                  <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[#00c896] rounded-full" />
                )}
                <span className="relative">
                  {item.icon}
                  {showBadge && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}
                </span>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* もっと */}
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-2 rounded-xl transition-colors relative ${
              showMore || isMoreActive ? "text-[#00c896]" : "text-gray-400"
            }`}
          >
            {(showMore || isMoreActive) && (
              <span className="absolute top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-[#00c896] rounded-full" />
            )}
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
