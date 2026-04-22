import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import Stripe from "stripe";
import { createClient as createServiceClient } from "@supabase/supabase-js";

export const maxDuration = 30;
// body検証のため raw body が必要
export const runtime = "nodejs";

function service() {
  return createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getUserIdFromCustomer(customerId: string): Promise<string | null> {
  const supabase = service();
  const { data } = await supabase
    .from("user_profiles")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .single();
  return (data?.id as string) ?? null;
}

async function syncSubscription(userId: string, sub: Stripe.Subscription) {
  const supabase = service();
  // active / trialing → pro、それ以外は free
  const isActive = sub.status === "active" || sub.status === "trialing";
  const periodEnd = (sub.items.data[0] as { current_period_end?: number })?.current_period_end;
  await supabase
    .from("user_profiles")
    .update({
      plan: isActive ? "pro" : "free",
      stripe_subscription_id: sub.id,
      plan_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    })
    .eq("id", userId);
}

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "webhook secret not configured" }, { status: 500 });
  }
  const sig = req.headers.get("stripe-signature");
  if (!sig) return NextResponse.json({ error: "missing signature" }, { status: 400 });

  const body = await req.text();
  const stripe = getStripe();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret);
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${err}` }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await getUserIdFromCustomer(sub.customer as string);
        if (userId) await syncSubscription(userId, sub);
        break;
      }
      case "checkout.session.completed": {
        // 通常は subscription.created が先に来るが、念のためここでもsync
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          const sub = await getStripe().subscriptions.retrieve(session.subscription as string);
          const userId = await getUserIdFromCustomer(sub.customer as string);
          if (userId) await syncSubscription(userId, sub);
        }
        break;
      }
    }
  } catch (err) {
    console.error("[stripe webhook]", err);
    return NextResponse.json({ error: "handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
