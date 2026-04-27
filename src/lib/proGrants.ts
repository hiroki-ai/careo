/**
 * Pro 期間付与（サブスク以外の経路）のヘルパー。
 *
 * 用途:
 * - ピークパック単発購入（Stripe webhook から）
 * - ES匿名提供で +30日（/api/grants/es-contribute）
 * - 公開プロフィール opt-in で +7日（/api/grants/public-profile-claim）
 * - 友人紹介・キャンペーン等
 *
 * 仕組み:
 * - `pro_grants` テーブルに記録（user_id, grant_type, grant_days, granted_until）
 * - 同一 grant_type は1ユーザー1回限り（UNIQUE 制約）
 * - user_profiles.plan_period_end を「現在 or 既存期限」+ grant_days に延長
 * - サブスク中（stripe_subscription_id あり）のユーザーには適用しない
 */
import { createClient } from "@supabase/supabase-js";

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export type GrantType =
  | "es_contribute"
  | "public_profile"
  | "pack_summer"
  | "pack_senkou"
  | "campaign";

export interface GrantResult {
  success: boolean;
  error?: string;
  newPeriodEnd?: string;
  alreadyClaimed?: boolean;
}

/**
 * 一回限りの Pro 付与を実行。
 * - 既に同 grant_type で付与済みなら success=false, alreadyClaimed=true
 * - サブスク中ユーザーは success=false
 */
export async function applyProGrant(
  userId: string,
  grantType: GrantType,
  grantDays: number
): Promise<GrantResult> {
  const sb = service();

  const { data: profile } = await sb
    .from("user_profiles")
    .select("stripe_subscription_id, plan_period_end")
    .eq("id", userId)
    .single();

  if (profile?.stripe_subscription_id) {
    return { success: false, error: "サブスク加入中のため付与不要です" };
  }

  // 1回限りチェック
  const { data: existing } = await sb
    .from("pro_grants")
    .select("id")
    .eq("user_id", userId)
    .eq("grant_type", grantType)
    .maybeSingle();
  if (existing) {
    return { success: false, alreadyClaimed: true, error: "この特典は既に取得済みです" };
  }

  const now = new Date();
  const baseEnd = profile?.plan_period_end ? new Date(profile.plan_period_end as string) : null;
  const startFrom = baseEnd && baseEnd > now ? baseEnd : now;
  const newEnd = new Date(startFrom.getTime() + grantDays * 24 * 60 * 60 * 1000);

  const { error: insertErr } = await sb.from("pro_grants").insert({
    user_id: userId,
    grant_type: grantType,
    grant_days: grantDays,
    granted_until: newEnd.toISOString(),
  });
  if (insertErr) {
    return { success: false, error: insertErr.message };
  }

  const { error: updErr } = await sb
    .from("user_profiles")
    .update({ plan: "pro", plan_period_end: newEnd.toISOString() })
    .eq("id", userId);
  if (updErr) {
    return { success: false, error: updErr.message };
  }

  return { success: true, newPeriodEnd: newEnd.toISOString() };
}
