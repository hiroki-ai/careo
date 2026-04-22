import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { peekAiUsage, FREE_MONTHLY_LIMITS, AiFeature } from "@/lib/aiUsageLimit";

export const maxDuration = 10;

/**
 * 全AI機能の使用状況を返す（UI残数表示用）
 * 返り値: { plan: 'free'|'pro', features: { [feature]: { used, limit, remaining } } }
 */
export async function GET() {
  const { user, errorResponse: authErr } = await requireAuth();
  if (authErr) return authErr;

  const features = Object.keys(FREE_MONTHLY_LIMITS) as AiFeature[];
  const results = await Promise.all(
    features.map(async (f) => [f, await peekAiUsage(user.id, f)] as const)
  );
  const featuresObj: Record<string, { used: number; limit: number; remaining: number }> = {};
  let plan: "free" | "pro" = "free";
  for (const [f, r] of results) {
    featuresObj[f] = { used: r.used, limit: r.limit, remaining: r.remaining };
    plan = r.plan;
  }
  return NextResponse.json({ plan, features: featuresObj });
}
