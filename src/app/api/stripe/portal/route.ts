import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { getStripe, getAppUrl } from "@/lib/stripe";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const maxDuration = 15;

/**
 * Stripe Billing Portal セッションを作成。
 * Pro ユーザーが解約・支払い方法変更するための公式ポータルに誘導。
 */
export async function POST() {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "Stripe顧客情報が見つかりません。" }, { status: 404 });
  }

  const portal = await getStripe().billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${getAppUrl()}/upgrade`,
  });

  return NextResponse.json({ url: portal.url });
}
