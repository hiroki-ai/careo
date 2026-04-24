"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { KareoCharacter } from "@/components/kareo/KareoCharacter";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/";

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
      {
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
      }
      router.push(nextPath);
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "#fcfbf8" }}>
      <div
        className="absolute pointer-events-none"
        style={{ top: 40, right: -60, width: 300, height: 300, background: "radial-gradient(circle, rgba(0,200,150,0.12), transparent 65%)", filter: "blur(40px)" }}
      />
      <div
        className="absolute pointer-events-none"
        style={{ bottom: 0, left: -80, width: 280, height: 280, background: "radial-gradient(circle, rgba(255,200,100,0.18), transparent 65%)", filter: "blur(40px)" }}
      />
      <div className="w-full max-w-sm relative">
        <div className="flex flex-col items-center mb-5">
          <KareoCharacter expression="waving" size={96} />
          <div className="bg-white rounded-2xl rounded-tl-none px-5 py-3 shadow-lg max-w-xs relative -mt-1" style={{ border: "1px solid rgba(0,200,150,0.2)" }}>
            <div className="absolute -top-3 left-0 w-4 h-4 bg-white rotate-[-35deg] rounded-tl-sm" style={{ borderLeft: "1px solid rgba(0,200,150,0.2)", borderTop: "1px solid rgba(0,200,150,0.2)" }} />
            <p className="text-sm font-semibold text-[#0D0B21] leading-relaxed">
              おかえり！<span className="text-[#00a87e]">就活の続き、一緒にやろう。</span>
            </p>
          </div>
        </div>
        <div className="bg-white rounded-3xl shadow-xl p-8" style={{ border: "1px solid rgba(13,11,33,0.06)" }}>
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-192.png" alt="Careo" className="w-8 h-8 rounded-xl" />
            <h1 className="font-klee text-2xl font-bold text-[#0D0B21]">Careo</h1>
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
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white font-black py-3 rounded-xl text-[15px] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #00c896, #00a87e)",
              boxShadow: "0 8px 24px rgba(0,200,150,0.33)",
            }}
          >
            {loading ? "ログイン中..." : "ログイン"}
          </button>
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
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
