/**
 * AI機能の無料ユーザー向け月次回数制限
 *
 * 使い方:
 *   const { allowed, remaining, limit } = await checkAndConsumeAiUsage(userId, "next-action");
 *   if (!allowed) return NextResponse.json({ error: ..., limit, used }, { status: 402 });
 *
 * 有料ユーザー（plan='pro'）は無制限。
 */
import { createClient } from "@supabase/supabase-js";

export type AiFeature =
  | "next-action"
  | "pdca"
  | "insights"
  | "company-suggest"
  | "weekly-coach"
  | "industry-analysis";

// フィーチャーごとの月次上限（0 = ロック、-1 = 無制限）
// 無料プランの制限値。有料プランは全て無制限。
export const FREE_MONTHLY_LIMITS: Record<AiFeature, number> = {
  "next-action": 2,
  "pdca": 1,
  "insights": 1,
  "company-suggest": 3,
  "weekly-coach": 0,       // 完全ロック
  "industry-analysis": 0,  // 完全ロック
};

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * ユーザーが Pro プランかを判定
 */
export async function isProUser(userId: string): Promise<boolean> {
  const supabase = service();
  const { data } = await supabase
    .from("user_profiles")
    .select("plan")
    .eq("id", userId)
    .single();
  return (data?.plan ?? "free") === "pro";
}

export interface UsageResult {
  allowed: boolean;
  remaining: number;       // 今月残り（Proは-1 = 無制限）
  limit: number;           // 上限（Proは-1）
  feature: AiFeature;
  plan: "free" | "pro";
}

/**
 * 使用回数をチェック＋インクリメントする。
 * - Pro: 常に allowed、remaining は -1（無制限）
 * - Free: 上限内なら +1 して allowed、超えたら拒否（インクリメントしない）
 * - 上限が 0 の機能は常に拒否（有料専用）
 */
export async function checkAndConsumeAiUsage(
  userId: string,
  feature: AiFeature
): Promise<UsageResult> {
  const isPro = await isProUser(userId);
  if (isPro) {
    return { allowed: true, remaining: -1, limit: -1, feature, plan: "pro" };
  }

  const limit = FREE_MONTHLY_LIMITS[feature];

  // ロック機能（上限0）は事前に拒否してインクリメントしない
  if (limit === 0) {
    return { allowed: false, remaining: 0, limit: 0, feature, plan: "free" };
  }

  const supabase = service();
  // 現在値を取得
  const { data: currentData } = await supabase.rpc("get_ai_usage", {
    p_user_id: userId,
    p_feature: feature,
  });
  const currentCount = (currentData as number | null) ?? 0;

  // 上限超えチェック
  if (currentCount >= limit) {
    return { allowed: false, remaining: 0, limit, feature, plan: "free" };
  }

  // インクリメント
  const { data: incData } = await supabase.rpc("increment_ai_usage", {
    p_user_id: userId,
    p_feature: feature,
    p_limit: limit,
  });
  const row = Array.isArray(incData) ? incData[0] : incData;
  const newCount = (row?.new_count as number) ?? currentCount + 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - newCount),
    limit,
    feature,
    plan: "free",
  };
}

/**
 * 使用回数をインクリメントせず、残数だけ見る（UI表示用）
 */
export async function peekAiUsage(
  userId: string,
  feature: AiFeature
): Promise<{ used: number; limit: number; remaining: number; plan: "free" | "pro" }> {
  const isPro = await isProUser(userId);
  if (isPro) {
    return { used: 0, limit: -1, remaining: -1, plan: "pro" };
  }
  const limit = FREE_MONTHLY_LIMITS[feature];
  const supabase = service();
  const { data } = await supabase.rpc("get_ai_usage", {
    p_user_id: userId,
    p_feature: feature,
  });
  const used = (data as number | null) ?? 0;
  return { used, limit, remaining: Math.max(0, limit - used), plan: "free" };
}
