"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  "今週やること提案（月2回 / Haiku）",
  "PDCA分析（月1回 / Haiku）",
  "横断インサイト（月1回 / Haiku）",
  "企業推薦（月3回 / Haiku）",
];

const PRO_FEATURES = [
  "Freeプランの全機能",
  "AI分析が Sonnet 4.6 にアップグレード ✨",
  "今週やること提案 無制限（週1自動生成）",
  "PDCA深掘り分析 無制限",
  "横断インサイト 無制限",
  "企業推薦 無制限",
  "週次コーチレポート ✨",
  "業界別勝ちパターン分析 ✨",
  "KPIダッシュボード全業界表示 ✨",
  "広告非表示",
];

const PACK_FEATURES = [
  "Pro 機能 30日間 使い放題",
  "AI分析が Sonnet 4.6 に",
  "サブスク不要・自動更新なし",
  "決済1回で完結（クレカ・コンビニ）",
];

type PackKind = "summer" | "senkou";

function isPackOnSale(pack: PackKind, now: Date = new Date()): boolean {
  const m = now.getMonth() + 1;
  if (pack === "summer") return m >= 5 && m <= 6;
  if (pack === "senkou") return m >= 2 && m <= 4;
  return false;
}

function activePack(now: Date = new Date()): PackKind | null {
  if (isPackOnSale("summer", now)) return "summer";
  if (isPackOnSale("senkou", now)) return "senkou";
  return null;
}

const PACK_LABELS: Record<PackKind, { name: string; subline: string }> = {
  summer: { name: "サマー直前パック", subline: "5〜6月限定 / サマーインターン応募ラッシュを乗り切る" },
  senkou: { name: "本選考ラッシュパック", subline: "2〜4月限定 / 本選考の山場をPro機能で攻略" },
};

function UpgradeInner() {
  const { profile, refetch } = useProfile();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const [coupon, setCoupon] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<null | "monthly" | "yearly" | "pack">(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [trialLoading, setTrialLoading] = useState(false);
  const [grantLoading, setGrantLoading] = useState<null | "public_profile">(null);
  const [cycle, setCycle] = useState<"monthly" | "yearly">("yearly");
  const isPro = profile?.plan === "pro";
  const canStartTrial = !isPro && !(profile as { trial_started_at?: string | null } | null)?.trial_started_at;

  // オンボーディング3日ブースト判定（フロント表示用）
  const createdAt = profile?.createdAt ? new Date(profile.createdAt) : null;
  const boostMs = 3 * 24 * 60 * 60 * 1000;
  const inBoost = !isPro && createdAt && Date.now() - createdAt.getTime() < boostMs;
  const boostRemainingHrs = createdAt
    ? Math.max(0, Math.ceil((createdAt.getTime() + boostMs - Date.now()) / (1000 * 60 * 60)))
    : 0;

  const sellingPack = activePack();

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

  useEffect(() => {
    if (searchParams.get("success") === "1") {
      showToast("決済が完了しました！Proプランをお楽しみください 🎉", "success");
      setTimeout(() => void refetch(), 2000);
    } else if (searchParams.get("pack_success") === "1") {
      showToast("パック購入完了！30日間 Pro が解放されました 🔓", "success");
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
      if (data.url) window.location.href = data.url;
      else showToast(data.error ?? "決済ページへの遷移に失敗しました", "error");
    } catch {
      showToast("決済ページへの遷移に失敗しました", "error");
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handlePackCheckout = async (pack: PackKind) => {
    setCheckoutLoading("pack");
    try {
      const res = await fetch("/api/stripe/checkout-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
      else showToast(data.error ?? "決済ページへの遷移に失敗しました", "error");
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
      if (data.url) window.location.href = data.url;
      else showToast(data.error ?? "契約管理画面を開けませんでした", "error");
    } catch {
      showToast("契約管理画面を開けませんでした", "error");
    } finally {
      setPortalLoading(false);
    }
  };

  const handleClaimPublicProfile = async () => {
    setGrantLoading("public_profile");
    try {
      const res = await fetch("/api/grants/public-profile-claim", { method: "POST" });
      const data = await res.json() as { success?: boolean; message?: string; error?: string };
      if (data.success) {
        showToast(data.message ?? "Pro 7日間が付与されました 🎉", "success");
        await refetch();
      } else {
        showToast(data.error ?? "請求に失敗しました", "error");
      }
    } finally {
      setGrantLoading(null);
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
            : "AIモデルが Haiku → Sonnet 4.6 に。データが貯まるほど精度が上がる分析を、無制限で。"}
        </p>
      </div>

      {/* オンボーディングブースト中バナー */}
      {inBoost && (
        <div className="mb-6 rounded-2xl p-4 border-2 border-[#00c896] bg-gradient-to-br from-[#00c896]/10 to-[#00a87e]/10">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🎁</span>
            <p className="text-sm font-bold text-[#00a87e]">登録3日間ブースト中</p>
            <span className="ml-auto text-[10px] bg-white px-2 py-0.5 rounded-full font-semibold text-[#00a87e]">
              残り約{boostRemainingHrs}時間
            </span>
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">
            無料プランでも AI が Sonnet 4.6（Pro 同等）で動作中。
            <strong>next-action / pdca / industry-analysis を最初の3日で試して</strong>、
            最高精度の分析を体験してください。
          </p>
        </div>
      )}

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
        <div className="rounded-2xl border-2 border-gray-200 bg-white p-6">
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
        <div className="rounded-2xl border-2 border-[#00c896] bg-[#00c896]/5 p-6">
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

      {/* 期間限定パック（販売期間中のみ表示） */}
      {!isPro && sellingPack && (
        <div className="mb-8 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-amber-500 text-white font-bold px-2 py-0.5 rounded-full">期間限定</span>
            <span className="text-sm font-bold text-amber-900">{PACK_LABELS[sellingPack].name}</span>
          </div>
          <p className="text-xs text-amber-700 mb-3">{PACK_LABELS[sellingPack].subline}</p>
          <div className="flex items-baseline gap-2 mb-3">
            <p className="text-3xl font-bold text-gray-900">¥980</p>
            <p className="text-xs text-gray-500">/ 30日 一括</p>
            <p className="text-[10px] text-gray-400 ml-auto">サブスク登録なし</p>
          </div>
          <ul className="space-y-1.5 mb-4">
            {PACK_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-xs text-gray-700">
                <span className="text-amber-500 shrink-0 mt-0.5">⚡</span>{f}
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => handlePackCheckout(sellingPack)}
            disabled={checkoutLoading !== null}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            {checkoutLoading === "pack" ? "決済画面へ遷移中..." : "30日間パックを購入"}
          </button>
          <p className="text-[10px] text-amber-700/70 text-center mt-2">
            この勝負の1ヶ月だけ、Pro機能をフル活用したい人向け。
          </p>
        </div>
      )}

      {/* 代替アクションで Pro を獲得 */}
      {!isPro && (
        <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-bold text-gray-800 mb-1">💡 課金以外で Pro を獲得</p>
          <p className="text-[11px] text-gray-500 mb-4">
            Careoのデータベースを充実させてくれる人には Pro 期間をプレゼント（各1回限り・サブスク中は対象外）
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
              <span className="text-xl">📝</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">提出済みESを匿名で共有</p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                  ES画面の「匿名で共有してProを獲得」ボタンから。後輩への学びとなり、あなたには <strong>Pro 30日間</strong>。
                </p>
                <p className="text-[10px] text-[#00a87e] mt-1">
                  ※ 共有先は Careoユーザー間（公開添削チャレンジ・29卒共有プール）のみ。広告主には絶対に渡しません。
                </p>
              </div>
              <Link href="/es" className="text-xs font-semibold text-[#00a87e] underline whitespace-nowrap self-center">
                ES画面へ
              </Link>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-xl bg-gray-50">
              <span className="text-xl">🌐</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">公開プロフィールを設定</p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                  ユーザー名・自己紹介を入力して公開すると <strong>Pro 7日間</strong>。
                  Build in Public の起点として `/u/yourname` で就活ログを公開できます。
                </p>
              </div>
              <button
                type="button"
                onClick={handleClaimPublicProfile}
                disabled={grantLoading === "public_profile"}
                className="text-xs font-semibold text-[#00a87e] hover:text-[#008666] disabled:opacity-50 whitespace-nowrap self-center"
              >
                {grantLoading === "public_profile" ? "請求中..." : "請求する"}
              </button>
            </li>
          </ul>
        </div>
      )}

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

      <div className="rounded-2xl bg-[#00c896]/5 border border-[#00c896]/20 p-5 mb-6">
        <p className="text-sm font-bold text-[#00a87e] mb-2">🛡 Careoの「売らない」宣言</p>
        <ul className="space-y-1.5 text-xs text-gray-600">
          <li className="flex items-start gap-2"><span className="text-[#00a87e] shrink-0">✓</span>あなたのデータは1円にも換金しません。広告主にも人材会社にも売りません</li>
          <li className="flex items-start gap-2"><span className="text-[#00a87e] shrink-0">✓</span>スカウト・営業電話は一切発生しません</li>
          <li className="flex items-start gap-2"><span className="text-[#00a87e] shrink-0">✓</span>収益源は ¥480 サブスク・期間限定パック・無料プランの非連動広告だけ</li>
          <li className="flex items-start gap-2"><span className="text-[#00a87e] shrink-0">✓</span>匿名共有されたESは Careoユーザー間でしか流通しません</li>
        </ul>
        <p className="text-[11px] text-gray-400 mt-2">
          あなたが顧客です。企業側の都合で設計を曲げることはありません。
          <Link href="/privacy" className="text-[#00a87e] underline">詳細</Link>
        </p>
      </div>

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
