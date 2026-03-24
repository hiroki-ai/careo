"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
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
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setError("メールアドレスの確認が完了していません。登録時に届いた確認メールのリンクをクリックしてください。");
      } else {
        setError("メールアドレスまたはパスワードが正しくありません");
      }
      setLoading(false);
    } else {
      // Chrome拡張機能にトークンを送信（インストール済みの場合のみ動作）
      try {
        const supabase2 = createClient();
        const { data: { session } } = await supabase2.auth.getSession();
        if (session?.access_token) {
          window.postMessage({ type: "CAREO_AUTH_TOKEN", token: session.access_token }, window.location.origin);
        }
      } catch {
        // 拡張機能未インストール時は無視
      }
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/icon-new.svg" alt="Careo" className="w-8 h-8 rounded-xl" />
            <h1 className="text-2xl font-bold text-[#0a1628]">Careo</h1>
          </div>
          <p className="text-sm text-gray-400">ログイン</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00c896]"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00c896]"
              placeholder="••••••••"
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "ログイン中..." : "ログイン"}
          </Button>
        </form>
        <p className="text-center text-sm mt-3">
          <Link href="/forgot-password" className="text-[#00c896] hover:underline">
            パスワードを忘れた方はこちら
          </Link>
        </p>
        <p className="text-center text-sm text-gray-500 mt-3">
          アカウントがない方は{" "}
          <Link href="/signup" className="text-[#00c896] hover:underline">新規登録</Link>
        </p>
        <div className="flex justify-center gap-4 mt-6 pt-4 border-t border-gray-100">
          <Link href="/terms" target="_blank" className="text-xs text-gray-400 hover:text-gray-600">利用規約</Link>
          <Link href="/privacy" target="_blank" className="text-xs text-gray-400 hover:text-gray-600">プライバシーポリシー</Link>
        </div>
      </div>
    </div>
  );
}
