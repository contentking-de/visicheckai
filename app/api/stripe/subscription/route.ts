import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAccessStatus } from "@/lib/access";
import { getPromptUsage, countExecutedPrompts } from "@/lib/usage";
import { db } from "@/lib/db";
import { subscriptions, domains } from "@/lib/schema";
import { eq, desc, count } from "drizzle-orm";
import { teamFilter } from "@/lib/rbac";

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

  const isSuperAdmin = session.user.role === "super_admin";

  const usage = await getPromptUsage(
    session.user.id,
    session.user.teamId,
    isSuperAdmin ? false : access.isTrial
  );

  const executed = await countExecutedPrompts(
    session.user.teamId,
    session.user.id,
    usage.periodStart,
    usage.periodEnd,
  );

  const [domainCount] = await db
    .select({ value: count() })
    .from(domains)
    .where(teamFilter("domains", session));

  return NextResponse.json({
    role: session.user.role ?? null,
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
    usage: {
      used: usage.used,
      limit: usage.limit,
      remaining: usage.remaining,
      periodStart: usage.periodStart,
      periodEnd: usage.periodEnd,
      executed,
    },
    domainCount: domainCount?.value ?? 0,
  });
}
