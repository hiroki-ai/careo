/**
 * API Route 共通認証ユーティリティ
 * - Supabase セッション検証（ログイン必須）
 * - チャット1日メッセージ上限チェック（プランベース）
 */
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

// プランごとの1日チャット上限
export const DAILY_CHAT_LIMITS = {
  free: 30,
  pro: Infinity, // Proは無制限
  admin: Infinity,
} as const;

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
 * 今日のユーザーチャット送信数をチェック。
 * プランに応じた上限を適用。上限に達していれば 429 を返す。
 */
export async function checkDailyChatLimit(userId: string, isAdmin: boolean): Promise<
  { allowed: true; errorResponse: null } |
  { allowed: false; errorResponse: NextResponse }
> {
  if (isAdmin) return { allowed: true, errorResponse: null };

  const supabase = await createClient();

  // ユーザーのプランを取得
  const { data: profileRow } = await supabase
    .from("user_profiles")
    .select("plan")
    .eq("id", userId)
    .single();
  const plan = ((profileRow?.plan ?? "free") as "free" | "pro");

  if (plan === "pro") return { allowed: true, errorResponse: null };

  // Freeプランのみカウントチェック
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("chat_messages")
    .select("*", { count: "exact", head: true })
    .eq("role", "user")
    .gte("created_at", todayStart.toISOString());

  const todayCount = count ?? 0;
  const limit = DAILY_CHAT_LIMITS.free;

  if (todayCount >= limit) {
    return {
      allowed: false,
      errorResponse: new NextResponse(
        JSON.stringify({
          error: `本日のチャット上限（${limit}回）に達しました。Proプランにアップグレードすると無制限になります🚀`,
          dailyCount: todayCount,
          limit,
          upgradeUrl: "/upgrade",
        }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      ),
    };
  }

  return { allowed: true, errorResponse: null };
}
