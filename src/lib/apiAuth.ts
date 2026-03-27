/**
 * API Route 共通認証ユーティリティ
 * - Supabase セッション検証（ログイン必須）
 */
import { createClient } from "@/lib/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const DAILY_CHAT_LIMIT = 30;

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
 * チャット1日上限チェック
 * - 管理者（ADMIN_EMAIL）: 無制限
 * - ホワイトリスト（CHAT_UNLIMITED_EMAILS）: 無制限
 * - 一般ユーザー: 30回/日
 */
export async function checkDailyChatLimit(userId: string, isAdmin: boolean): Promise<
  { allowed: true; errorResponse: null } |
  { allowed: false; errorResponse: NextResponse }
> {
  if (isAdmin) return { allowed: true, errorResponse: null };

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 今日の00:00（JST）を基準にカウント
  const jstOffset = 9 * 60 * 60 * 1000;
  const nowJst = new Date(Date.now() + jstOffset);
  const todayJst = new Date(nowJst.getFullYear(), nowJst.getMonth(), nowJst.getDate());
  const todayUtc = new Date(todayJst.getTime() - jstOffset).toISOString();

  const { count } = await supabase
    .from("chat_messages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("role", "user")
    .gte("created_at", todayUtc);

  if ((count ?? 0) >= DAILY_CHAT_LIMIT) {
    return {
      allowed: false,
      errorResponse: NextResponse.json(
        { error: `1日のチャット上限（${DAILY_CHAT_LIMIT}回）に達しました。明日またご利用ください。` },
        { status: 429 }
      ),
    };
  }

  return { allowed: true, errorResponse: null };
}
