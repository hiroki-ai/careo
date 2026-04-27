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

/**
 * ピークパック等の単発購入時、plan_period_end を grant_days 日延長する。
 * - 現在の period_end が未来ならその日付に +grant_days 加算（重ね買い対応）
 * - 過去 or 未設定なら今日 + grant_days
 */
async function applyOneTimeGrant(userId: string, grantDays: number, packType: string | null) {
  const supabase = service();
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("plan_period_end")
    .eq("id", userId)
    .single();

  const now = new Date();
  const baseEnd = profile?.plan_period_end ? new Date(profile.plan_period_end as string) : null;
  const startFrom = baseEnd && baseEnd > now ? baseEnd : now;
  const newEnd = new Date(startFrom.getTime() + grantDays * 24 * 60 * 60 * 1000);

  await supabase
    .from("user_profiles")
    .update({
      plan: "pro",
      plan_period_end: newEnd.toISOString(),
    })
    .eq("id", userId);

  // 監査用ログ（pro_grants テーブルが存在する場合のみ）
  await supabase.from("pro_grants").insert({
    user_id: userId,
    grant_type: packType ? `pack_${packType}` : "pack",
    grant_days: grantDays,
    granted_until: newEnd.toISOString(),
  }).then(() => {}, () => {});
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
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.mode === "subscription" && session.subscription) {
          // 通常は subscription.created が先に来るが、念のためここでもsync
          const sub = await getStripe().subscriptions.retrieve(session.subscription as string);
          const userId = await getUserIdFromCustomer(sub.customer as string);
          if (userId) await syncSubscription(userId, sub);
        } else if (session.mode === "payment" && session.payment_status === "paid") {
          // ピークパック等の単発購入
          const md = session.metadata ?? {};
          const userId = (md.supabase_user_id as string | undefined)
            ?? (session.customer ? await getUserIdFromCustomer(session.customer as string) : null);
          const grantDays = Number(md.grant_days ?? "30");
          const packType = (md.pack_type as string | undefined) ?? null;
          if (userId && grantDays > 0) {
            await applyOneTimeGrant(userId, grantDays, packType);
          }
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
