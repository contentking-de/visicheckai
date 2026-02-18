import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { teams } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session.user.teamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, session.user.teamId));

  if (!team?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account found" },
      { status: 404 }
    );
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: team.stripeCustomerId,
    return_url: `${baseUrl}/dashboard/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
