"use client";

import { useState } from "react";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/components/ui/Toast";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

const FREE_FEATURES = [
  "企業管理（無制限）",
  "ES管理・AI生成（無制限）",
  "面接ログ（無制限）",
  "PDCA週次レポート",
  "内定予測AI",
  "カレオコーチ（1日30回まで）",
  "OB/OG訪問ログ",
  "筆記試験管理",
  "カレオからの気づき通知",
  "進捗ベンチマーク",
];

const PRO_FEATURES = [
  "カレオコーチ（無制限）✨",
  "Freeプランの全機能",
  "ES提出前AIチェック（無制限）✨",
  "キャリアセンター向けレポート出力 ✨",
  "就活軸の成熟度トラッキング ✨",
  "（今後）優先サポート",
];

export default function UpgradePage() {
  const { profile, refetch } = useProfile();
  const { showToast } = useToast();
  const [coupon, setCoupon] = useState("");
  const [loading, setLoading] = useState(false);
  const isPro = profile?.plan === "pro";

  const handleCoupon = async () => {
    if (!coupon.trim()) return;
    setLoading(true);
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
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 pb-24 md:pb-8">
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <p className="text-xs font-semibold text-indigo-600 tracking-widest uppercase mb-2">Careo プラン</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isPro ? "✨ Proプラン利用中" : "Proプランにアップグレード"}
        </h1>
        <p className="text-sm text-gray-500">
          {isPro
            ? "カレオコーチが無制限で使えます。就活を全力でサポートします。"
            : "カレオコーチの1日制限をなくして、就活を加速させよう。"}
        </p>
      </div>

      {/* 料金カード */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Free */}
        <div className={`rounded-2xl border-2 p-6 ${!isPro ? "border-indigo-600 bg-indigo-50/40" : "border-gray-200 bg-white"}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold text-gray-700">Free</span>
            {!isPro && (
              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">現在のプラン</span>
            )}
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">¥0</p>
          <p className="text-xs text-gray-400 mb-5">永久無料</p>
          <ul className="space-y-2">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-gray-600">
                <span className="text-green-500 shrink-0 mt-0.5">✓</span>{f}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro */}
        <div className={`rounded-2xl border-2 p-6 ${isPro ? "border-indigo-600 bg-indigo-50/40" : "border-gray-200 bg-white"}`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-bold text-gray-700">Pro</span>
            {isPro && (
              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">現在のプラン</span>
            )}
          </div>
          <p className="text-3xl font-bold text-gray-900 mb-1">¥980<span className="text-sm font-normal text-gray-400">/月</span></p>
          <p className="text-xs text-gray-400 mb-5">クレジットカード決済（近日公開）</p>
          <ul className="space-y-2">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-gray-700">
                <span className="text-indigo-500 shrink-0 mt-0.5">★</span>{f}
              </li>
            ))}
          </ul>
          {!isPro && (
            <button
              disabled
              className="mt-5 w-full bg-indigo-200 text-indigo-500 cursor-not-allowed font-semibold py-2.5 rounded-xl text-sm"
            >
              決済機能 準備中...
            </button>
          )}
        </div>
      </div>

      {/* クーポンコード入力 */}
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
            <Button onClick={handleCoupon} disabled={loading || !coupon.trim()} size="sm">
              {loading ? "確認中..." : "適用"}
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
