"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type Mode = "magic" | "password";

export default function CareerPortalLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  // ── マジックリンク送信 ──────────────────────────────────────
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();

    // スタッフ権限チェック（存在しないメールは弾く）
    const { data: exists } = await supabase
      .from("career_center_staff")
      .select("id")
      .eq("university", "上智大学") // RLSの都合でユニバーサルにチェック不可 → メール送信してから先でチェック
      .limit(1);

    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/career-portal/setup`,
        shouldCreateUser: false, // 未登録ユーザーにはリンクを送らない
      },
    });

    if (err) {
      if (err.message.includes("Signups not allowed")) {
        setError("このメールアドレスはキャリアセンター担当者として登録されていません。管理者にお問い合わせください。");
      } else {
        setError(err.message);
      }
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  };

  // ── パスワードログイン ──────────────────────────────────────
  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError("メールアドレスまたはパスワードが正しくありません");
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const { data: staff } = await supabase
      .from("career_center_staff")
      .select("id")
      .eq("user_id", user?.id ?? "")
      .single();

    if (!staff) {
      await supabase.auth.signOut();
      setError("このアカウントにはキャリアセンター担当者の権限がありません。");
      setLoading(false);
      return;
    }

    router.push("/career-portal");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#0d1b2a] flex flex-col items-center justify-center p-4">
      {/* ロゴ */}
      <div className="flex items-center gap-2 mb-8">
        <img src="/icon-192.png" alt="Careo" className="w-8 h-8 rounded-xl" />
        <span className="text-white font-bold text-xl tracking-wide">Careo</span>
        <span className="text-blue-300/60 text-xs border-l border-white/20 pl-3 ml-1">
          Career Center Portal
        </span>
      </div>

      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        {/* マジックリンク送信後 */}
        {sent ? (
          <div className="text-center space-y-4">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900">メールを確認してください</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              <span className="font-medium text-gray-700">{email}</span> に<br />
              ログインリンクをお送りしました。<br />
              メール内のリンクをクリックするとポータルに入れます。
            </p>
            <p className="text-xs text-gray-400">
              メールが届かない場合は迷惑メールフォルダをご確認ください。
            </p>
            <button
              type="button"
              onClick={() => setSent(false)}
              className="text-xs text-blue-500 hover:underline"
            >
              メールアドレスを変更する
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h1 className="text-xl font-bold text-gray-900">担当者ログイン</h1>
              <p className="text-sm text-gray-400 mt-1">
                {mode === "magic"
                  ? "メールアドレスを入力するとログインリンクをお送りします"
                  : "メールアドレスとパスワードでログイン"}
              </p>
            </div>

            {mode === "magic" ? (
              <form onSubmit={handleMagicLink} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="you@university.ac.jp"
                    required
                    autoComplete="email"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0d1b2a] hover:bg-[#1a2d42] disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
                >
                  {loading ? "送信中..." : "ログインリンクを送る"}
                </button>
              </form>
            ) : (
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    メールアドレス
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="you@university.ac.jp"
                    required
                    autoComplete="email"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    パスワード
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0d1b2a] hover:bg-[#1a2d42] disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm"
                >
                  {loading ? "ログイン中..." : "ログイン"}
                </button>
              </form>
            )}

            {/* モード切替 */}
            <div className="mt-5 pt-4 border-t border-gray-100 text-center">
              {mode === "magic" ? (
                <button
                  type="button"
                  onClick={() => { setMode("password"); setError(""); }}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  パスワードでログインする
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { setMode("magic"); setError(""); }}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← メールリンクでログインする
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <p className="text-blue-200/40 text-xs mt-6">
        学生の方は{" "}
        <Link href="/login" className="text-blue-300/60 hover:text-blue-200 underline">
          こちら
        </Link>
      </p>
    </div>
  );
}
