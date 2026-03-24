/**
 * API Route 共通認証ユーティリティ
 * - Supabase セッション検証（ログイン必須）
 */
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * リクエストからSupabaseセッションを検証してユーザーを返す。
 * 未認証の場合は 401 レスポンスを返す。
 */
export async function requireAuth(): Promise<
  { user: { id: string; email?: string }; errorResponse: null } |
  { user: null; errorResponse: NextResponse }
> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: "認証が必要です" }, { status: 401 }),
    };
  }
  return { user: data.user, errorResponse: null };
}

/**
 * 管理者専用APIルート用の認証。
 * 未認証 or 非管理者の場合は 401/403 レスポンスを返す。
 * ADMIN_EMAIL 環境変数（サーバー専用）でメールアドレスを照合する。
 */
export async function requireAdmin(): Promise<
  { user: { id: string; email?: string }; errorResponse: null } |
  { user: null; errorResponse: NextResponse }
> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: "認証が必要です" }, { status: 401 }),
    };
  }
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail || data.user.email !== adminEmail) {
    return {
      user: null,
      errorResponse: NextResponse.json({ error: "権限がありません" }, { status: 403 }),
    };
  }
  return { user: data.user, errorResponse: null };
}

/**
 * キャリアセンタースタッフ専用APIルート用の認証。
 * 未認証 or career_center_staff テーブルに存在しない場合は 401/403 を返す。
 */
export async function requireCareerCenterStaff(): Promise<
  { user: { id: string; email?: string }; staff: { id: string; university: string; name: string; role: string }; errorResponse: null } |
  { user: null; staff: null; errorResponse: NextResponse }
> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return {
      user: null, staff: null,
      errorResponse: NextResponse.json({ error: "認証が必要です" }, { status: 401 }),
    };
  }
  const { data: staffRow } = await supabase
    .from("career_center_staff")
    .select("id, university, name, role")
    .eq("user_id", data.user.id)
    .single();
  if (!staffRow) {
    return {
      user: null, staff: null,
      errorResponse: NextResponse.json({ error: "権限がありません" }, { status: 403 }),
    };
  }
  return { user: data.user, staff: staffRow, errorResponse: null };
}

/**
 * チャット上限チェック（現在は全ユーザー無制限）
 */
export async function checkDailyChatLimit(_userId: string, _isAdmin: boolean): Promise<
  { allowed: true; errorResponse: null }
> {
  return { allowed: true, errorResponse: null };
}
