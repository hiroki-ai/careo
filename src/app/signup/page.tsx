"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else if (data.session) {
      // メール確認不要の設定：即ログイン済みなのでリダイレクト
      router.push("/");
      router.refresh();
    } else {
      // メール確認が必要な設定：確認メールを送信済み
      setEmailSent(true);
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
          <div className="w-14 h-14 bg-[#00c896]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-[#00c896]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">確認メールを送りました</h2>
          <p className="text-sm text-gray-500 mb-1">
            <span className="font-medium text-gray-700">{email}</span> に確認メールを送りました。
          </p>
          <p className="text-sm text-gray-500 mb-6">
            メール内のリンクをクリックして登録を完了してください。
          </p>
          <p className="text-xs text-gray-400">
            メールが届かない場合は迷惑メールフォルダを確認してください。
          </p>
          <div className="mt-6">
            <Link href="/login" className="text-[#00c896] text-sm hover:underline">
              ログインページへ
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="/icon-new.svg" alt="Careo" className="w-8 h-8 rounded-xl" />
            <h1 className="text-2xl font-bold text-[#0a1628]">Careo</h1>
          </div>
          <p className="text-sm text-gray-400">無料で始める</p>
        </div>
        <form onSubmit={handleSignup} className="space-y-4">
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
            <p className="mt-1.5 text-xs text-[#00c896] font-medium">
              キャリアセンターと連携するには、大学のメールアドレス（〜.ac.jp）での登録が必要です
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">パスワード（6文字以上）</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00c896]"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="space-y-2 py-1">
            <div className="flex items-start gap-2.5">
              <input
                id="agree-terms"
                type="checkbox"
                checked={agreedTerms}
                onChange={(e) => setAgreedTerms(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[#00c896] cursor-pointer shrink-0"
              />
              <label htmlFor="agree-terms" className="text-xs text-gray-600 leading-relaxed cursor-pointer">
                <Link href="/terms" target="_blank" className="text-[#00c896] hover:underline">利用規約</Link>
                に同意します
              </label>
            </div>
            <div className="flex items-start gap-2.5">
              <input
                id="agree-privacy"
                type="checkbox"
                checked={agreedPrivacy}
                onChange={(e) => setAgreedPrivacy(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-gray-300 accent-[#00c896] cursor-pointer shrink-0"
              />
              <label htmlFor="agree-privacy" className="text-xs text-gray-600 leading-relaxed cursor-pointer">
                <Link href="/privacy" target="_blank" className="text-[#00c896] hover:underline">プライバシーポリシー</Link>
                に同意します
              </label>
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading || !agreedTerms || !agreedPrivacy}>
            {loading ? "登録中..." : "アカウントを作成"}
          </Button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          すでにアカウントをお持ちの方は{" "}
          <Link href="/login" className="text-[#00c896] hover:underline">ログイン</Link>
        </p>
        <div className="flex justify-center gap-4 mt-4 pt-4 border-t border-gray-100">
          <Link href="/terms" target="_blank" className="text-xs text-gray-400 hover:text-gray-600">利用規約</Link>
          <Link href="/privacy" target="_blank" className="text-xs text-gray-400 hover:text-gray-600">プライバシーポリシー</Link>
        </div>
      </div>
    </div>
  );
}
