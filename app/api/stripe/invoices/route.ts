import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { teams } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { stripe } from "@/lib/stripe";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.teamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, session.user.teamId));

  if (!team?.stripeCustomerId) {
    return NextResponse.json({ invoices: [] });
  }

  const stripeInvoices = await stripe.invoices.list({
    customer: team.stripeCustomerId,
    limit: 24,
  });

  const invoices = stripeInvoices.data.map((inv) => ({
    id: inv.id,
    number: inv.number,
    status: inv.status,
    amount: inv.total,
    currency: inv.currency,
    created: inv.created,
    periodStart: inv.period_start,
    periodEnd: inv.period_end,
    pdfUrl: inv.invoice_pdf,
    hostedUrl: inv.hosted_invoice_url,
  }));

  return NextResponse.json({ invoices });
}
