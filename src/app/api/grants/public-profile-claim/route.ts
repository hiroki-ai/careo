import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { applyProGrant } from "@/lib/proGrants";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 10;

/**
 * 公開プロフィール opt-in → Pro 7日間 付与（1ユーザー1回限り）
 *
 * 前提条件:
 * - user_profiles.is_profile_public = true
 * - public_bio もしくは public_x_handle / public_linkedin_url のいずれかが設定済み
 *
 * Build in Public（PLG映え #29）の起点。プロフィール公開で承認欲求 → Xシェア → 認知拡大の循環を作る。
 */
export async function POST() {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await sb
    .from("user_profiles")
    .select("is_profile_public, public_bio, public_x_handle, public_linkedin_url, username")
    .eq("id", user.id)
    .single();

  if (!profile?.is_profile_public) {
    return NextResponse.json({
      error: "公開プロフィールを有効にしてから請求してください",
    }, { status: 400 });
  }
  if (!profile.username) {
    return NextResponse.json({
      error: "公開URL用のユーザー名を設定してください",
    }, { status: 400 });
  }
  const hasContent = !!(profile.public_bio || profile.public_x_handle || profile.public_linkedin_url);
  if (!hasContent) {
    return NextResponse.json({
      error: "プロフィール文・X・LinkedIn のいずれかを設定してください",
    }, { status: 400 });
  }

  const grant = await applyProGrant(user.id, "public_profile", 7);
  if (!grant.success) {
    return NextResponse.json({
      error: grant.error ?? "付与に失敗しました",
      alreadyClaimed: grant.alreadyClaimed,
    }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    message: "公開プロフィール特典として Pro 7日間が付与されました 🎉",
    newPeriodEnd: grant.newPeriodEnd,
  });
}
