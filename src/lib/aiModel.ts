/**
 * AIモデル選択ロジック（プラン × オンボーディングブースト）
 *
 * 設計思想（B2C価格再設計 2026-04-27）:
 * - Free（4日目以降）: Haiku 4.5 — 高速・低コスト
 * - Pro: Sonnet 4.6 — 全データ横断分析の質を担保
 * - Onboarding boost (登録後3日間): Free でも Sonnet 4.6 を解放し
 *   「最高精度の体験」→ 4日目で Haiku に降格 → 物足りなさで課金誘導
 *
 * 使い方:
 *   const { model, plan, boosted } = await selectAiModel(userId);
 *   await anthropic.messages.create({ model, ... });
 */
import { createClient } from "@supabase/supabase-js";
import { isProUser } from "./aiUsageLimit";

export const MODEL_HAIKU = "claude-haiku-4-5-20251001";
export const MODEL_SONNET = "claude-sonnet-4-6";

const ONBOARDING_BOOST_DAYS = 3;

export interface ModelChoice {
  model: string;
  plan: "free" | "pro";
  boosted: boolean; // オンボーディング3日間ブースト中
}

function service() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * ユーザーの登録日時から、オンボーディングブースト期間内かを判定
 */
async function isInOnboardingBoost(userId: string): Promise<boolean> {
  const sb = service();
  const { data } = await sb
    .from("user_profiles")
    .select("created_at")
    .eq("id", userId)
    .single();
  if (!data?.created_at) return false;
  const createdAt = new Date(data.created_at as string);
  const elapsedMs = Date.now() - createdAt.getTime();
  return elapsedMs < ONBOARDING_BOOST_DAYS * 24 * 60 * 60 * 1000;
}

export async function selectAiModel(userId: string): Promise<ModelChoice> {
  const isPro = await isProUser(userId);
  if (isPro) {
    return { model: MODEL_SONNET, plan: "pro", boosted: false };
  }
  const boosted = await isInOnboardingBoost(userId);
  if (boosted) {
    return { model: MODEL_SONNET, plan: "free", boosted: true };
  }
  return { model: MODEL_HAIKU, plan: "free", boosted: false };
}
