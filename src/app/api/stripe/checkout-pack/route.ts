import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/apiAuth";
import { getStripe, STRIPE_PRICE_IDS, getAppUrl, isPackOnSale, PackType } from "@/lib/stripe";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const maxDuration = 15;

/**
 * 期間限定ピークパック（30日間 Pro 単発購入 ¥980）
 * body: { pack: "summer" | "senkou" }
 *
 * - mode: "payment"（サブスクではなく単発）
 * - 決済成功後、webhook で plan_period_end を +30日 延長
 * - 既存サブスク中ユーザーは購入不可
 * - 販売期間外は購入不可（isPackOnSale で判定）
 */
export async function POST(req: NextRequest) {
  const { user, errorResponse } = await requireAuth();
  if (errorResponse) return errorResponse;

  const { pack } = await req.json() as { pack: PackType };
  if (pack !== "summer" && pack !== "senkou") {
    return NextResponse.json({ error: "不正なパック種別です" }, { status: 400 });
  }
  if (!isPackOnSale(pack)) {
    return NextResponse.json({ error: "このパックは現在販売期間外です" }, { status: 400 });
  }

  const priceId = pack === "summer" ? STRIPE_PRICE_IDS.summerPack : STRIPE_PRICE_IDS.senkouPack;
  if (!priceId) {
    return NextResponse.json({ error: "価格設定が未構成です。管理者にお問い合わせください。" }, { status: 500 });
  }

  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("stripe_customer_id, stripe_subscription_id")
    .eq("id", user.id)
    .single();

  if (profile?.stripe_subscription_id) {
    return NextResponse.json({
      error: "既に Pro サブスクご加入中です。パックは追加購入できません。",
    }, { status: 400 });
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
    mode: "payment",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/upgrade?pack_success=1`,
    cancel_url: `${appUrl}/upgrade?canceled=1`,
    payment_intent_data: {
      metadata: { supabase_user_id: user.id, pack_type: pack, grant_days: "30" },
    },
    metadata: { supabase_user_id: user.id, pack_type: pack, grant_days: "30" },
  });

  return NextResponse.json({ url: session.url });
}
