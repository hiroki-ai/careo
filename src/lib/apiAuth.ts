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
 * チャット上限チェック（現在は全ユーザー無制限）
 */
export async function checkDailyChatLimit(_userId: string, _isAdmin: boolean): Promise<
  { allowed: true; errorResponse: null }
> {
  return { allowed: true, errorResponse: null };
}
