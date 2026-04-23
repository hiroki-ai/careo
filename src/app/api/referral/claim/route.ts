import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 10;

/**
 * 紹介コードで特典を受け取る。
 * body: { code: string }
 * 成功: { success: true, message }
 * 失敗: { success: false, error }
 *
 * DB側のRPC `grant_referral_rewards` が:
 * - 紹介者/被紹介者 双方に Pro を30日付与
 * - referrals テーブルに記録
 * をトランザクション内で実行する。
 */
export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { code } = await req.json() as { code?: string };
  if (!code || typeof code !== "string") {
    return NextResponse.json({ success: false, error: "紹介コードが必要です" }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await supabase.rpc("grant_referral_rewards", {
    p_referrer_code: code.trim().toUpperCase(),
    p_referee_id: user.id,
  });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.success) {
    return NextResponse.json({ success: false, error: row?.error_msg ?? "紹介特典を付与できませんでした" }, { status: 400 });
  }

  return NextResponse.json({ success: true, message: "あなたと紹介者に Pro プラン30日分が付与されました 🎉" });
}
