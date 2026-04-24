import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 10;

/**
 * Pro 30日間無料トライアルを開始。1ユーザー1回のみ。
 * - カード情報不要
 * - plan='pro', plan_period_end = now + 30日 を設定
 * - trial_started_at を記録（再利用防止）
 * - 期限を過ぎると自動的に free に戻る（aiUsageLimit 側で plan_period_end をチェック）
 */
export async function POST() {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("plan, plan_period_end, trial_started_at, stripe_subscription_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json({ success: false, error: "プロフィールが見つかりません" }, { status: 404 });
  }

  if (profile.trial_started_at) {
    return NextResponse.json({ success: false, error: "無料トライアルは既に使用済みです" }, { status: 400 });
  }

  if (profile.stripe_subscription_id) {
    return NextResponse.json({ success: false, error: "既にProプランにご加入いただいています" }, { status: 400 });
  }

  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  // 既に plan_period_end がそれより後（紹介特典等で）なら延長ではなく max を維持
  const currentEnd = profile.plan_period_end ? new Date(profile.plan_period_end) : null;
  const newEnd = currentEnd && currentEnd > periodEnd ? currentEnd : periodEnd;

  const { error } = await supabase
    .from("user_profiles")
    .update({
      plan: "pro",
      plan_period_end: newEnd.toISOString(),
      trial_started_at: now.toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    message: "Pro 30日間無料トライアルを開始しました 🎉",
    trial_ends_at: newEnd.toISOString(),
  });
}
