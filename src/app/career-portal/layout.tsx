"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function PasswordSetupBanner() {
  const [show, setShow] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("portal_pw_set")) setShow(true);
  }, []);

  if (!show) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) { setError("8文字以上で設定してください"); return; }
    if (password !== confirm) { setError("パスワードが一致しません"); return; }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password });
    if (err) { setError(err.message); setLoading(false); return; }
    localStorage.setItem("portal_pw_set", "1");
    setDone(true);
    setTimeout(() => setShow(false), 2000);
    setLoading(false);
  };

  return (
    <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4">
      {done ? (
        <p className="text-sm text-green-600 font-medium">パスワードを設定しました！</p>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2 mb-3">
            <div>
              <p className="text-sm font-semibold text-amber-800">パスワードを設定してください</p>
              <p className="text-xs text-amber-600 mt-0.5">次回以降のログインに使用します</p>
            </div>
            <button type="button" onClick={() => { localStorage.setItem("portal_pw_set", "1"); setShow(false); }}
              className="text-amber-400 hover:text-amber-600 text-xs">スキップ</button>
          </div>
          <form onSubmit={handleSubmit} className="flex flex-wrap gap-2 items-end">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)}
              placeholder="新しいパスワード（8文字以上）"
              className="border border-amber-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 w-52" />
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)}
              placeholder="確認用パスワード"
              className="border border-amber-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300 w-44" />
            <button type="submit" disabled={loading}
              className="bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">
              {loading ? "設定中..." : "設定する"}
            </button>
            {error && <p className="w-full text-xs text-red-500">{error}</p>}
          </form>
        </>
      )}
    </div>
  );
}

const navItems = [
  {
    href: "/career-portal",
    label: "ダッシュボード",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    href: "/career-portal/students",
    label: "学生一覧",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    href: "/career-portal/announcements",
    label: "アナウンス",
    icon: (
      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
      </svg>
    ),
  },
];

export default function CareerPortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [staffName, setStaffName] = useState<string>("");
  const [university, setUniversity] = useState<string>("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: staff } = await supabase
        .from("career_center_staff")
        .select("name, university")
        .eq("user_id", data.user.id)
        .single();
      if (staff) {
        setStaffName(staff.name);
        setUniversity(staff.university);
      }
    });
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/career-portal/login");
  };

  if (pathname === "/career-portal/login") return <>{children}</>;

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* サイドバー */}
      <aside className="w-56 shrink-0 flex flex-col sticky top-0 h-screen bg-[#0d1b2a] text-white">
        {/* ロゴ */}
        <div className="px-4 pt-5 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2 mb-0.5">
            <img src="/icon-new.svg" alt="Careo" className="w-7 h-7 rounded-lg shrink-0" />
            <span className="font-bold text-lg tracking-wide">Careo</span>
          </div>
          <p className="text-blue-200/50 text-[10px] tracking-widest uppercase pl-9">Career Center</p>
        </div>

        {/* 大学名バッジ */}
        {university && (
          <div className="px-4 py-2.5 border-b border-white/10">
            <span className="text-xs text-blue-200/70 bg-blue-900/40 px-2 py-1 rounded-full">
              {university}
            </span>
          </div>
        )}

        {/* ナビ */}
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          <p className="text-blue-200/40 text-[10px] font-semibold uppercase tracking-widest px-3 pt-1 pb-1.5">メニュー</p>
          {navItems.map((item) => {
            const isActive = item.href === "/career-portal"
              ? pathname === "/career-portal"
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium ${
                  isActive
                    ? "bg-blue-500/20 text-white"
                    : "text-blue-100/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* フッター */}
        <div className="border-t border-white/10 px-4 py-3">
          {staffName && (
            <p className="text-xs text-blue-200/60 mb-2 truncate">{staffName}</p>
          )}
          <button
            onClick={handleSignOut}
            className="w-full text-left text-xs text-blue-200/50 hover:text-white transition-colors py-1"
          >
            ログアウト
          </button>
        </div>
      </aside>

      {/* メインコンテンツ */}
      <main className="flex-1 min-w-0 p-6 overflow-auto">
        <PasswordSetupBanner />
        {children}
      </main>
    </div>
  );
}
