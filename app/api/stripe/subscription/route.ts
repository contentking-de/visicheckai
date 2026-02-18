import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { subscriptions } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session.user.teamId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.teamId, session.user.teamId))
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  if (!sub) {
    return NextResponse.json({ subscription: null });
  }

  return NextResponse.json({
    subscription: {
      plan: sub.plan,
      status: sub.status,
      currentPeriodEnd: sub.currentPeriodEnd,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    },
  });
}
