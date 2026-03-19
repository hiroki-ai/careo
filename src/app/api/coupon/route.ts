import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

// 有効なクーポンコードは環境変数で管理（カンマ区切り複数可）
// 例: BETA_COUPON_CODES=CAREO2026,FRIEND_XYZ,SOPHIATEST
function getValidCodes(): string[] {
  const raw = process.env.BETA_COUPON_CODES ?? "";
  return raw.split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);
}

export async function POST(req: NextRequest) {
  // 認証チェック
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "認証が必要です" }, { status: 401 });

  const { code } = await req.json() as { code?: string };
  if (!code) return NextResponse.json({ error: "コードを入力してください" }, { status: 400 });

  const normalizedCode = code.trim().toUpperCase();
  const validCodes = getValidCodes();

  if (!validCodes.includes(normalizedCode)) {
    return NextResponse.json({ error: "無効なクーポンコードです" }, { status: 400 });
  }

  // SERVICE_ROLE_KEY でユーザーの plan を更新（RLS bypass）
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // すでにクーポン使用済みかチェック
  const { data: profile } = await adminSupabase
    .from("user_profiles")
    .select("plan, coupon_used")
    .eq("id", user.id)
    .single();

  if (profile?.coupon_used) {
    return NextResponse.json({ error: "すでにクーポンを使用済みです" }, { status: 400 });
  }
  if (profile?.plan === "pro") {
    return NextResponse.json({ error: "すでにProプランです" }, { status: 400 });
  }

  const { error } = await adminSupabase
    .from("user_profiles")
    .update({ plan: "pro", coupon_used: normalizedCode })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, message: "Proプランが有効になりました🎉" });
}
