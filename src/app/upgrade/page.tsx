"use client";

import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

const FREE_FEATURES = [
  "企業・ES・面接ログ管理（無制限）",
  "締切カレンダー・スケジュール自動収集",
  "基本KPIダッシュボード（通過率・内定状況）",
  "毎日のモチベメッセージ",
  "停滞選考の自動検知",
  "今週やること提案（月2回）",
  "PDCA分析（月1回）",
  "横断インサイト（月1回）",
  "企業推薦（月3回）",
];

const PRO_FEATURES = [
  "Freeプランの全機能",
  "今週やること提案 無制限（週1自動生成）",
  "PDCA深掘り分析 無制限",
  "横断インサイト 無制限",
  "企業推薦 無制限",
  "週次コーチレポート ✨",
  "業界別勝ちパターン分析 ✨",
  "KPIダッシュボード全業界表示 ✨",
  "広告非表示",
];

function UpgradeInner() {
  const { profile, refetch } = useProfile();
  const { showToast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [coupon, setCoupon] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<null | "monthly" | "yearly">(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);
  const [cycle, setCycle] = useState<"monthly" | "yearly">("yearly");
  const isPro = profile?.plan === "pro";
  const canStartTrial = !isPro && !(profile as { trial_started_at?: string | null } | null)?.trial_started_at;

  const handleStartTrial = async () => {
    setTrialLoading(true);
    try {
      const res = await fetch("/api/trial/start", { method: "POST" });
      const data = await res.json() as { success?: boolean; message?: string; error?: string };
      if (data.success) {
        showToast(data.message ?? "トライアルを開始しました 🎉", "success");
        await refetch();
      } else {
        showToast(data.error ?? "トライアルの開始に失敗しました", "error");
      }
    } finally {
      setTrialLoading(false);
    }
  };

  // Stripe successから戻ってきたらrefetchしてProに切り替わっているか確認
  useEffect(() => {
    if (searchParams.get("success") === "1") {
      showToast("決済が完了しました！Proプランをお楽しみください 🎉", "success");
      // webhook処理を待つため少し遅延させてrefetch
      setTimeout(() => void refetch(), 2000);
    } else if (searchParams.get("canceled") === "1") {
      showToast("決済がキャンセルされました", "info");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleCheckout = async (plan: "monthly" | "yearly") => {
    setCheckoutLoading(plan);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.error ?? "決済ページへの遷移に失敗しました", "error");
      }
    } catch {
      showToast("決済ページへの遷移に失敗しました", "error");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handlePortal = async () => {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        showToast(data.error ?? "契約管理画面を開けませんでした", "error");
      }
    } catch {
      showToast("契約管理画面を開けませんでした", "error");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponLoading(true);
    try {
      const res = await fetch("/api/coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: coupon }),
      });
      const data = await res.json() as { success?: boolean; message?: string; error?: string };
      if (data.success) {
        showToast(data.message ?? "Proプランが有効になりました", "success");
        setCoupon("");
        await refetch();
      } else {
        showToast(data.error ?? "エラーが発生しました", "error");
      }
    } finally {
      setCouponLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8">
      <div className="text-center mb-8">
        <p className="text-xs font-semibold text-[#00a87e] tracking-widest uppercase mb-2">Careo プラン</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isPro ? "✨ Proプラン利用中" : "Proプランにアップグレード"}
        </h1>
        <p className="text-sm text-gray-500">
          {isPro
            ? "全機能が無制限で使えます。"
            : "データが貯まるほど精度が上がる分析を、無制限で。"}
        </p>
      </div>

      {/* 月額/年額 切替 */}
      {!isPro && (
        <div className="flex justify-center mb-6">
          <div className="inline-flex bg-gray-100 rounded-full p-1">
            <button
              type="button"
              onClick={() => setCycle("monthly")}
              className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${
                cycle === "monthly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              月額
            </button>
            <button
              type="button"
              onClick={() => setCycle("yearly")}
              className={`px-4 py-1.5 text-sm font-semibold rounded-full transition-all ${
                cycle === "yearly" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
              }`}
            >
              年額 <span className="text-[10px] ml-1 bg-[#00c896]/15 text-[#00a87e] px-1.5 py-0.5 rounded-full">41%OFF</span>
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Free */}
        <div className={`rounded-2xl border-2 p-6 ${!isPro ? "border-gray-200 bg-white" : "border-gray-200 bg-white"}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold text-gray-700">Free</span>
            {!isPro && (
              <span className="text-[10px] bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full">現在のプラン</span>
            )}
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">¥0</p>
          <p className="text-xs text-gray-400 mb-5">永久無料 + 広告表示</p>
          <ul className="space-y-2">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                <span className="text-green-500 shrink-0 mt-0.5">✓</span>{f}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro */}
        <div className={`rounded-2xl border-2 p-6 ${isPro ? "border-[#00c896] bg-[#00c896]/5" : "border-[#00c896] bg-[#00c896]/5"}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold text-gray-700">Pro</span>
            {isPro && (
              <span className="text-[10px] bg-[#00c896]/15 text-[#00a87e] font-semibold px-2 py-0.5 rounded-full">現在のプラン</span>
            )}
          </div>
          {cycle === "monthly" ? (
            <>
              <p className="text-3xl font-bold text-gray-900 mb-1">¥480<span className="text-sm font-normal text-gray-400">/月</span></p>
              <p className="text-xs text-gray-400 mb-5">いつでも解約可能</p>
            </>
          ) : (
            <>
              <p className="text-3xl font-bold text-gray-900 mb-1">¥2,800<span className="text-sm font-normal text-gray-400">/年</span></p>
              <p className="text-xs text-gray-400 mb-5">月換算 約¥233 / 41%OFF</p>
            </>
          )}
          <ul className="space-y-2 mb-4">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-gray-700">
                <span className="text-[#00a87e] shrink-0 mt-0.5">★</span>{f}
              </li>
            ))}
          </ul>
          {!isPro ? (
            <>
              {canStartTrial && (
                <button
                  type="button"
                  onClick={handleStartTrial}
                  disabled={trialLoading}
                  className="w-full font-black py-3 rounded-xl text-[15px] text-white mb-2"
                  style={{ background: "linear-gradient(135deg, #00c896, #00a87e)", boxShadow: "0 8px 24px rgba(0,200,150,0.35)" }}
                >
                  {trialLoading ? "開始中..." : "🎁 30日間 無料トライアル"}
                </button>
              )}
              {canStartTrial && (
                <p className="text-[10px] text-gray-400 text-center mb-3">クレカ不要 · いつでも解約可 · 1人1回</p>
              )}
              <button
                type="button"
                onClick={() => handleCheckout(cycle)}
                disabled={checkoutLoading !== null}
                className={`w-full ${canStartTrial ? "bg-white border border-[#00c896]/40 text-[#00a87e] hover:bg-[#00c896]/5" : "bg-[#00c896] hover:bg-[#00b088] text-white"} disabled:opacity-60 font-bold py-3 rounded-xl text-sm transition-colors`}
              >
                {checkoutLoading === cycle ? "決済画面へ遷移中..." : canStartTrial ? "今すぐ有料プランで始める" : cycle === "yearly" ? "年額プランにアップグレード" : "月額プランにアップグレード"}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handlePortal}
              disabled={portalLoading}
              className="w-full bg-gray-100 hover:bg-gray-200 disabled:opacity-60 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition-colors"
            >
              {portalLoading ? "契約管理画面を開いています..." : "契約管理・解約はこちら"}
            </button>
          )}
        </div>
      </div>

      {!isPro && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
          <p className="text-sm font-semibold text-amber-800 mb-1">🎟️ クーポンコードをお持ちの方</p>
          <p className="text-xs text-amber-600 mb-3">招待コードを入力するとProプランを無料で使えます</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value.toUpperCase())}
              placeholder="例: CAREO2026"
              className="flex-1 bg-white border border-amber-300 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
              onKeyDown={(e) => e.key === "Enter" && handleCoupon()}
            />
            <Button onClick={handleCoupon} disabled={couponLoading || !coupon.trim()} size="sm">
              {couponLoading ? "確認中..." : "適用"}
            </Button>
          </div>
        </div>
      )}

      <div className="text-center">
        <Link href="/" className="text-xs text-gray-400 hover:text-gray-600">← ダッシュボードに戻る</Link>
      </div>
    </div>
  );
}

export default function UpgradePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">読み込み中...</div>}>
      <UpgradeInner />
    </Suspense>
  );
}
