"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Step = "checking" | "setup" | "done" | "unauthorized";

export default function CareerPortalSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("checking");
  const [staffName, setStaffName] = useState("");
  const [university, setUniversity] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push("/career-portal/login");
        return;
      }
      // スタッフ権限チェック
      const { data: staff } = await supabase
        .from("career_center_staff")
        .select("name, university")
        .eq("user_id", data.user.id)
        .single();

      if (!staff) {
        setStep("unauthorized");
        return;
      }
      setStaffName(staff.name);
      setUniversity(staff.university);

      // すでにパスワード設定済み（user_metadataで管理）
      if (data.user.user_metadata?.portal_pw_configured) {
        router.push("/career-portal");
        return;
      }
      setStep("setup");
    });
  }, [router]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("パスワードは8文字以上で設定してください");
      return;
    }
    if (password !== confirm) {
      setError("パスワードが一致しません");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({
      password,
      data: { portal_pw_configured: true },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    setStep("done");
    setTimeout(() => router.push("/career-portal"), 2000);
    setLoading(false);
  };

  if (step === "checking") {
    return (
      <div className="min-h-screen bg-[#0d1b2a] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/40" />
      </div>
    );
  }

  if (step === "unauthorized") {
    return (
      <div className="min-h-screen bg-[#0d1b2a] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center">
          <p className="text-gray-700 font-semibold mb-2">アクセス権限がありません</p>
          <p className="text-sm text-gray-400 mb-4">
            このメールアドレスはキャリアセンター担当者として登録されていません。
          </p>
          <button
            type="button"
            onClick={async () => {
              const supabase = createClient();
              await supabase.auth.signOut();
              router.push("/career-portal/login");
            }}
            className="text-sm text-blue-600 hover:underline"
          >
            ログインページに戻る
          </button>
        </div>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="min-h-screen bg-[#0d1b2a] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center space-y-3">
          <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-lg font-bold text-gray-900">設定完了！</p>
          <p className="text-sm text-gray-500">ポータルに移動します...</p>
        </div>
      </div>
    );
  }

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

      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        {/* ウェルカムメッセージ */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-xs font-medium px-3 py-1 rounded-full mb-3">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            ログイン認証完了
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            ようこそ、{staffName}さん
          </h1>
          <p className="text-sm text-gray-500 mt-1">{university} キャリアセンター</p>
        </div>

        {/* 説明 */}
        <div className="bg-gray-50 rounded-xl p-4 mb-6 text-sm text-gray-600 leading-relaxed">
          <p className="font-medium text-gray-700 mb-1">次回以降のログインのために</p>
          パスワードを設定してください。設定後はメールアドレスとパスワードでいつでもログインできます。
        </div>

        <form onSubmit={handleSetPassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              新しいパスワード
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="8文字以上"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              パスワード（確認）
            </label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="もう一度入力"
              required
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
            {loading ? "設定中..." : "パスワードを設定してポータルへ"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">
          後で設定する場合は{" "}
          <button
            type="button"
            onClick={() => router.push("/career-portal")}
            className="text-blue-500 hover:underline"
          >
            スキップ
          </button>
        </p>
      </div>
    </div>
  );
}
