import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import { subscriptions, teams } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getPlanByPriceId } from "@/lib/plans";
import type Stripe from "stripe";
import type { PlanId } from "@/lib/schema";

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.subscription) {
        const sub = await stripe.subscriptions.retrieve(
          session.subscription as string
        );
        await upsertSubscription(sub);
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      await upsertSubscription(sub);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await db
        .update(subscriptions)
        .set({
          status: "canceled",
          cancelAtPeriodEnd: false,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.stripeSubscriptionId, sub.id));
      break;
    }

    default:
      break;
  }

  return NextResponse.json({ received: true });
}

async function upsertSubscription(sub: Stripe.Subscription) {
  const priceId = sub.items.data[0]?.price?.id;
  if (!priceId) return;

  const plan = getPlanByPriceId(priceId);
  const planId: PlanId = plan?.id ?? (sub.metadata.planId as PlanId) ?? "starter";

  let teamId = sub.metadata.teamId;

  if (!teamId) {
    const customerId =
      typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.stripeCustomerId, customerId));
    if (!team) {
      console.error("No team found for Stripe customer:", customerId);
      return;
    }
    teamId = team.id;
  }

  const currentPeriodStart = new Date(sub.items.data[0].current_period_start * 1000);
  const currentPeriodEnd = new Date(sub.items.data[0].current_period_end * 1000);

  const values = {
    teamId,
    stripeSubscriptionId: sub.id,
    stripePriceId: priceId,
    plan: planId,
    status: sub.status as typeof subscriptions.$inferInsert.status,
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    updatedAt: new Date(),
  };

  const [existing] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, sub.id));

  if (existing) {
    await db
      .update(subscriptions)
      .set(values)
      .where(eq(subscriptions.stripeSubscriptionId, sub.id));
  } else {
    await db.insert(subscriptions).values(values);
  }
}
