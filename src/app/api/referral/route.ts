import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 10;

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * 自分の紹介コード、紹介実績、被紹介状況を取得。
 * 返り値: {
 *   referralCode: string,
 *   referralUrl: string,
 *   referrerCount: number,  // 自分が紹介した人数
 *   referredBy: string|null, // 自分を紹介したユーザーのID
 *   plan: 'free'|'pro',
 *   planPeriodEnd: string|null,
 * }
 */
export async function GET() {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const supabase = service();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("referral_code, referred_by_user_id, plan, plan_period_end")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "プロフィールが見つかりません" }, { status: 404 });
  }

  const { count } = await supabase
    .from("referrals")
    .select("*", { count: "exact", head: true })
    .eq("referrer_id", user.id);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://careoai.jp";
  const code = profile.referral_code as string | null;
  return NextResponse.json({
    referralCode: code,
    referralUrl: code ? `${appUrl}/?ref=${code}` : null,
    referrerCount: count ?? 0,
    referredBy: profile.referred_by_user_id,
    plan: profile.plan ?? "free",
    planPeriodEnd: profile.plan_period_end,
  });
}
