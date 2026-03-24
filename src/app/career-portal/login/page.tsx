"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function CareerPortalLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      if (authError.message.toLowerCase().includes("email not confirmed")) {
        setError("メールアドレスの確認が完了していません。");
      } else {
        setError("メールアドレスまたはパスワードが正しくありません");
      }
      setLoading(false);
      return;
    }

    // スタッフ権限チェック
    const { data: staff } = await supabase
      .from("career_center_staff")
      .select("id")
      .eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "")
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
        <img src="/icon-new.svg" alt="Careo" className="w-8 h-8 rounded-xl" />
        <span className="text-white font-bold text-xl tracking-wide">Careo</span>
        <span className="text-blue-300/60 text-xs border-l border-white/20 pl-3 ml-1">
          Career Center Portal
        </span>
      </div>

      {/* カード */}
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-gray-900">担当者ログイン</h1>
          <p className="text-sm text-gray-400 mt-1">キャリアセンター管理ポータルにアクセス</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
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

        <p className="text-center text-xs text-gray-400 mt-5">
          <Link href="/forgot-password" className="hover:text-gray-600 transition-colors">
            パスワードをお忘れの方
          </Link>
        </p>
      </div>

      {/* 学生向けリンク */}
      <p className="text-blue-200/50 text-xs mt-6">
        学生の方は{" "}
        <Link href="/login" className="text-blue-300 hover:text-blue-200 underline">
          こちら
        </Link>
      </p>
    </div>
  );
}
