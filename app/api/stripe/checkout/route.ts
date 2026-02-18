import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { teams, userProfiles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";
import { PLANS } from "@/lib/plans";
import type { PlanId } from "@/lib/schema";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.teamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { planId } = (await req.json()) as { planId: PlanId };
  const plan = PLANS[planId];
  if (!plan) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const teamId = session.user.teamId;

  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId));

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, session.user.id));

  const billingAddress = profile?.billingDifferent
    ? {
        line1: profile.billingStreet || undefined,
        city: profile.billingCity || undefined,
        postal_code: profile.billingZip || undefined,
        country: profile.billingCountry || undefined,
      }
    : {
        line1: profile?.companyStreet || undefined,
        city: profile?.companyCity || undefined,
        postal_code: profile?.companyZip || undefined,
        country: profile?.companyCountry || undefined,
      };

  const hasAddress = billingAddress.line1 && billingAddress.country;

  let stripeCustomerId = team.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: session.user.email!,
      name: session.user.name ?? undefined,
      metadata: { teamId, userId: session.user.id },
      ...(hasAddress && { address: billingAddress }),
    });
    stripeCustomerId = customer.id;

    await db
      .update(teams)
      .set({ stripeCustomerId })
      .where(eq(teams.id, teamId));
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const taxEnabled = process.env.STRIPE_TAX_ENABLED === "true";

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    success_url: `${baseUrl}/dashboard/billing?success=true`,
    cancel_url: `${baseUrl}/dashboard/billing?canceled=true`,
    ...(taxEnabled && {
      automatic_tax: { enabled: true },
      tax_id_collection: { enabled: true },
      customer_update: {
        address: "auto",
        name: "auto",
      },
    }),
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { teamId, planId },
    },
    metadata: { teamId, planId },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
