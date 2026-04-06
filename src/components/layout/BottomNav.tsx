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
    icon: (active: boolean) => (
      <svg className="w-[22px] h-[22px]" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.75} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/deadlines",
    label: "締切",
    icon: (active: boolean) => (
      <svg className="w-[22px] h-[22px]" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.75} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  // center: QuickAdd FAB
  {
    href: "/chat",
    label: "コーチ",
    icon: (active: boolean) => (
      <svg className="w-[22px] h-[22px]" fill={active ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.75} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
];

// カテゴリ別に整理
const moreCategories = [
  {
    label: "企業・選考",
    items: [
      { href: "/companies", label: "企業管理", emoji: "🏢" },
      { href: "/es", label: "ES管理", emoji: "📄" },
      { href: "/interviews", label: "面接ログ", emoji: "👥" },
      { href: "/calendar", label: "カレンダー", emoji: "📅" },
    ],
  },
  {
    label: "リサーチ・準備",
    items: [
      { href: "/events", label: "説明会", emoji: "🎯" },
      { href: "/ob-visits", label: "OB訪問", emoji: "🤝" },
      { href: "/tests", label: "筆記試験", emoji: "📝" },
      { href: "/career", label: "自己分析", emoji: "💡" },
    ],
  },
  {
    label: "分析・コミュニティ",
    items: [
      { href: "/report", label: "PDCA", emoji: "📊" },
      { href: "/insights", label: "みんなの就活", emoji: "🌐" },
      { href: "/groups", label: "友達と就活", emoji: "👫" },
      { href: "/mentors", label: "先輩相談", emoji: "👨‍🎓", comingSoon: true },
    ],
  },
  {
    label: "その他",
    items: [
      { href: "/import", label: "インポート", emoji: "📥" },
      { href: "/career-center", label: "キャリアセンター", emoji: "🖨️" },
      { href: "/appointments", label: "相談予約", emoji: "📅" },
      { href: "/settings", label: "設定", emoji: "⚙️" },
    ],
  },
];

const moreItems = moreCategories.flatMap(c => c.items);

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
      <QuickAddModal isOpen={showQuickAdd} onClose={() => setShowQuickAdd(false)} />

      {/* More メニュー バックドロップ */}
      {showMore && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
          onClick={() => setShowMore(false)}
        />
      )}

      {/* More メニュー ボトムシート */}
      {showMore && (
        <div className="fixed bottom-[84px] left-0 right-0 z-50 md:hidden animate-slide-up">
          <div className="mx-3 bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-black/12 border border-gray-100/60 overflow-hidden">
            <div className="px-5 pt-4 pb-2">
              {moreCategories.map((cat) => (
                <div key={cat.label} className="mb-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-0.5">
                    {cat.label}
                  </p>
                  <div className="grid grid-cols-4 gap-2">
                    {cat.items.map((item) => {
                      const isActive = pathname.startsWith(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`relative flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl text-center transition-all active:scale-95 ${
                            isActive
                              ? "bg-[#00c896]/12 text-[#00a87e]"
                              : "bg-gray-50 text-gray-600 active:bg-gray-100"
                          }`}
                        >
                          <span className="text-[20px] leading-none">{item.emoji}</span>
                          <span className={`text-[10px] font-semibold leading-tight ${isActive ? "text-[#00a87e]" : "text-gray-500"}`}>
                            {item.label}
                          </span>
                          {"comingSoon" in item && item.comingSoon && (
                            <span className="absolute top-1.5 right-1.5 text-[7px] font-black bg-gradient-to-r from-amber-400 to-orange-400 text-white px-1 py-0.5 rounded-full leading-none">
                              近日
                            </span>
                          )}
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

      {/* ボトムナビ本体 */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden safe-area-padding-bottom">
        {/* グラスモーフィズム背景 */}
        <div className="bg-white/92 backdrop-blur-2xl border-t border-gray-100/80 shadow-[0_-1px_0_rgba(0,0,0,0.04),0_-8px_32px_rgba(0,0,0,0.06)]">
          <div className="flex items-center h-[62px] px-1">

            {/* ホーム・締切 */}
            {mainItems.slice(0, 2).map((item) => {
              const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors"
                >
                  <span className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200 ${
                    isActive ? "bg-[#00c896]/12 text-[#00c896]" : "text-gray-400"
                  }`}>
                    {item.icon(isActive)}
                    <span className={`text-[10px] font-bold tracking-tight ${isActive ? "text-[#00c896]" : "text-gray-400"}`}>
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
              className="relative flex flex-col items-center justify-center flex-1 gap-0.5 h-full"
            >
              <span className="fab-shadow w-[50px] h-[50px] bg-gradient-to-br from-[#00c896] to-[#00a87e] rounded-full flex items-center justify-center -mt-3 active:scale-90 transition-transform duration-150">
                <svg className="w-[22px] h-[22px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
              </span>
              <span className="text-[10px] font-bold text-gray-400 -mt-0.5">記録</span>
            </button>

            {/* コーチ */}
            {mainItems.slice(2).map((item) => {
              const isActive = pathname.startsWith(item.href);
              const showBadge = item.href === "/chat" && chatBadge && !isActive;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors"
                >
                  <span className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200 ${
                    isActive ? "bg-[#00c896]/12 text-[#00c896]" : "text-gray-400"
                  }`}>
                    <span className="relative">
                      {item.icon(isActive)}
                      {showBadge && (
                        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
                      )}
                    </span>
                    <span className={`text-[10px] font-bold tracking-tight ${isActive ? "text-[#00c896]" : "text-gray-400"}`}>
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
              className="flex flex-col items-center justify-center flex-1 h-full gap-0.5"
            >
              <span className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-200 ${
                showMore || isMoreActive ? "bg-[#00c896]/12 text-[#00c896]" : "text-gray-400"
              }`}>
                {showMore ? (
                  <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-[22px] h-[22px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
                <span className={`text-[10px] font-bold tracking-tight ${showMore || isMoreActive ? "text-[#00c896]" : "text-gray-400"}`}>
                  もっと
                </span>
              </span>
            </button>

          </div>
        </div>
      </nav>
    </>
  );
}
