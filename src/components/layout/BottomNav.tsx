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
  { href: "/events", label: "説明会・インターン", emoji: "🎯" },
  { href: "/es", label: "ES管理", emoji: "📄" },
  { href: "/interviews", label: "面接ログ", emoji: "👥" },
  { href: "/ob-visits", label: "OB/OG訪問", emoji: "🤝" },
  { href: "/mentors", label: "先輩に相談", emoji: "👨‍🎓", comingSoon: true },
  { href: "/tests", label: "筆記試験", emoji: "📝" },
  { href: "/career", label: "自己分析", emoji: "💡" },
  { href: "/insights", label: "みんなの就活", emoji: "🌐" },
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
        <div className="fixed bottom-20 left-0 right-0 z-50 bg-white border-t border-gray-100 rounded-t-3xl shadow-2xl md:hidden">
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 bg-gray-200 rounded-full" />
          </div>
          <div className="px-4 pt-2 pb-8">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">メニュー</p>
            <div className="grid grid-cols-3 gap-3">
              {moreItems.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`relative flex flex-col items-center justify-center gap-2 py-4 rounded-2xl text-center transition-colors ${
                      isActive
                        ? "bg-[#00c896]/12 text-[#00a87e]"
                        : "bg-gray-50 text-gray-600 active:bg-gray-100"
                    }`}
                  >
                    <span className="text-2xl">{item.emoji}</span>
                    <span className="text-xs font-medium leading-tight">{item.label}</span>
                    {"comingSoon" in item && item.comingSoon && (
                      <span className="absolute top-2 right-2 text-[9px] font-bold bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full leading-none">近日</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ボトムナビ本体 */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-100 md:hidden safe-area-padding-bottom">
        <div className="flex items-center justify-around h-20 px-2">
          {/* ホーム・締切 */}
          {mainItems.slice(0, 2).map((item) => {
            const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors relative`}
              >
                <span className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl transition-all ${
                  isActive ? "bg-[#00c896]/12 text-[#00c896]" : "text-gray-400"
                }`}>
                  <span className="[&>svg]:w-6 [&>svg]:h-6">{item.icon}</span>
                  <span className="text-xs font-semibold">{item.label}</span>
                </span>
              </Link>
            );
          })}

          {/* 中央 FAB（クイック追加） */}
          <button
            type="button"
            onClick={() => setShowQuickAdd(true)}
            className="relative flex flex-col items-center justify-center flex-1 gap-1"
          >
            <span className="w-14 h-14 bg-[#00c896] rounded-2xl flex items-center justify-center shadow-xl shadow-[#00c896]/35 -mt-5 active:scale-95 transition-transform">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </span>
            <span className="text-xs font-semibold text-gray-400">記録</span>
          </button>

          {/* コーチ */}
          {mainItems.slice(2).map((item) => {
            const isActive = pathname.startsWith(item.href);
            const showBadge = item.href === "/chat" && chatBadge && !isActive;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors relative`}
              >
                <span className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl transition-all ${
                  isActive ? "bg-[#00c896]/12 text-[#00c896]" : "text-gray-400"
                }`}>
                  <span className="relative [&>svg]:w-6 [&>svg]:h-6">
                    {item.icon}
                    {showBadge && (
                      <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border-2 border-white" />
                    )}
                  </span>
                  <span className="text-xs font-semibold">{item.label}</span>
                </span>
              </Link>
            );
          })}

          {/* もっと */}
          <button
            type="button"
            onClick={() => setShowMore((v) => !v)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors relative`}
          >
            <span className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-2xl transition-all ${
              showMore || isMoreActive ? "bg-[#00c896]/12 text-[#00c896]" : "text-gray-400"
            }`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="text-xs font-semibold">もっと</span>
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
