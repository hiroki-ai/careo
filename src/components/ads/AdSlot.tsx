"use client";

import { useEffect, useRef } from "react";
import { useProfile } from "@/hooks/useProfile";

interface AdSlotProps {
  /** AdSenseのad slot ID（Dashboard > 広告 > ユニットで取得） */
  slotId?: string;
  /** 広告フォーマット。AdSense公式の値に準拠 */
  format?: "auto" | "fluid" | "rectangle" | "horizontal" | "vertical";
  /** レスポンシブ対応（推奨） */
  responsive?: boolean;
  /** CSSで高さ等を固定したい時 */
  className?: string;
  /** 目印用のラベル（広告上部に小さく表示。AdSenseポリシー遵守） */
  label?: string;
}

/**
 * Careoの広告スロット。
 * - Pro ユーザーは常に null（広告非表示）
 * - 環境変数 NEXT_PUBLIC_ADSENSE_CLIENT_ID が未設定なら null（審査前）
 * - 設定済みでFreeユーザーのみ AdSense 広告を表示
 *
 * AdSense審査に通ったら `NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-xxxxxxxx` を
 * Vercel環境変数に設定し、各ページの `slotId` に AdSense で発行したスロットIDを指定する。
 */
export function AdSlot({
  slotId,
  format = "auto",
  responsive = true,
  className = "",
  label = "広告",
}: AdSlotProps) {
  const { profile, loading } = useProfile();
  const insRef = useRef<HTMLModElement | null>(null);
  const pushedRef = useRef(false);

  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  const isPro = profile?.plan === "pro";
  const enabled = !!clientId && !!slotId && !isPro && !loading;

  useEffect(() => {
    if (!enabled || pushedRef.current) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      if (!w.adsbygoogle) w.adsbygoogle = [];
      w.adsbygoogle.push({});
      pushedRef.current = true;
    } catch {
      // AdSenseの初期化失敗は無視（アプリを止めない）
    }
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className={`my-4 ${className}`}>
      {label && <div className="text-[10px] text-gray-400 text-center mb-1">{label}</div>}
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={clientId}
        data-ad-slot={slotId}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
      />
    </div>
  );
}
