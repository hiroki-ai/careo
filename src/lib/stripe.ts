import Stripe from "stripe";

/**
 * サーバー用 Stripe クライアント（API秘密鍵）
 * 必要な環境変数:
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET
 *   STRIPE_PRICE_ID_MONTHLY
 *   STRIPE_PRICE_ID_YEARLY
 *
 * ビルド時に環境変数が未設定でも落ちないよう、遅延初期化する。
 */
let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("STRIPE_SECRET_KEY が未設定です。環境変数を確認してください。");
    }
    _stripe = new Stripe(key, { apiVersion: "2026-03-25.dahlia" });
  }
  return _stripe;
}

export const STRIPE_PRICE_IDS = {
  get monthly() { return process.env.STRIPE_PRICE_ID_MONTHLY ?? ""; },
  get yearly() { return process.env.STRIPE_PRICE_ID_YEARLY ?? ""; },
};

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://careoai.jp";
}
