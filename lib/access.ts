import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, subscriptions } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

const TRIAL_DAYS = 14;

export type AccessStatus = {
  hasAccess: boolean;
  isTrial: boolean;
  trialDaysLeft: number;
  trialEndsAt: Date | null;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
};

export async function getAccessStatus(
  userId: string,
  teamId: string | null | undefined,
  role?: string | null
): Promise<AccessStatus> {
  const noAccess: AccessStatus = {
    hasAccess: false,
    isTrial: false,
    trialDaysLeft: 0,
    trialEndsAt: null,
    subscriptionPlan: null,
    subscriptionStatus: null,
  };

  if (role === "super_admin") {
    return { ...noAccess, hasAccess: true };
  }

  if (teamId) {
    const [sub] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.teamId, teamId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    if (sub && (sub.status === "active" || sub.status === "trialing")) {
      return {
        hasAccess: true,
        isTrial: false,
        trialDaysLeft: 0,
        trialEndsAt: null,
        subscriptionPlan: sub.plan,
        subscriptionStatus: sub.status,
      };
    }
  }

  const [user] = await db
    .select({ registeredAt: users.registeredAt })
    .from(users)
    .where(eq(users.id, userId));

  if (user?.registeredAt) {
    const trialEnd = new Date(user.registeredAt);
    trialEnd.setDate(trialEnd.getDate() + TRIAL_DAYS);
    const daysLeft = Math.ceil(
      (trialEnd.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    if (daysLeft > 0) {
      return {
        hasAccess: true,
        isTrial: true,
        trialDaysLeft: daysLeft,
        trialEndsAt: trialEnd,
        subscriptionPlan: null,
        subscriptionStatus: null,
      };
    }
  }

  return noAccess;
}

/**
 * API route guard. Returns a 403 response if the user has no access, or null if OK.
 * Usage: const denied = await requireAccess(session); if (denied) return denied;
 */
export async function requireAccess(
  session: { user: { id: string; teamId?: string | null; role?: string | null } }
): Promise<NextResponse | null> {
  const access = await getAccessStatus(
    session.user.id,
    session.user.teamId,
    session.user.role
  );
  if (!access.hasAccess) {
    return NextResponse.json(
      { error: "Trial expired. Please subscribe to continue.", code: "TRIAL_EXPIRED" },
      { status: 403 }
    );
  }
  return null;
}
