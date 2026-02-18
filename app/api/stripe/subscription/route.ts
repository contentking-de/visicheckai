import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAccessStatus } from "@/lib/access";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.teamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const access = await getAccessStatus(
    session.user.id,
    session.user.teamId,
    session.user.role
  );

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.teamId, session.user.teamId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  return NextResponse.json({
    subscription: sub
      ? {
          plan: sub.plan,
          status: sub.status,
          currentPeriodEnd: sub.currentPeriodEnd,
          cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        }
      : null,
    trial: {
      isTrial: access.isTrial,
      daysLeft: access.trialDaysLeft,
      endsAt: access.trialEndsAt,
      hasAccess: access.hasAccess,
    },
  });
}
