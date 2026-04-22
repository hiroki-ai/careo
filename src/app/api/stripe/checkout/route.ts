import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { getStripe, STRIPE_PRICE_IDS, getAppUrl } from "@/lib/stripe";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const maxDuration = 15;

/**
 * Stripe Checkout セッションを作成。
 * body: { plan: "monthly" | "yearly" }
 * 成功: { url } — クライアントはこのURLにリダイレクトしてStripeで決済
 */
export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { plan } = await req.json() as { plan: "monthly" | "yearly" };
  const priceId = plan === "yearly" ? STRIPE_PRICE_IDS.yearly : STRIPE_PRICE_IDS.monthly;
  if (!priceId) {
    return NextResponse.json({ error: "価格設定が未構成です。管理者にお問い合わせください。" }, { status: 500 });
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // 既存の stripe_customer_id を取得、なければ新規作成
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("stripe_customer_id, plan")
    .eq("id", user.id)
    .single();

  if (profile?.plan === "pro") {
    return NextResponse.json({ error: "既にProプランにご加入いただいています。" }, { status: 400 });
  }

  const stripe = getStripe();
  let customerId = profile?.stripe_customer_id as string | null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await supabase
      .from("user_profiles")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const appUrl = getAppUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/upgrade?success=1`,
    cancel_url: `${appUrl}/upgrade?canceled=1`,
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { supabase_user_id: user.id },
    },
  });

  return NextResponse.json({ url: session.url });
}
