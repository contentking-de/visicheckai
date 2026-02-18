import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAccessStatus } from "@/lib/access";
import { getPromptUsage } from "@/lib/usage";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = session.user.teamId;
  const access = await getAccessStatus(
    session.user.id,
    teamId,
    session.user.role
  );

  if (!access.hasAccess) {
    return NextResponse.json(
      { error: "No active subscription or trial", code: "NO_ACCESS" },
      { status: 403 }
    );
  }

  const usage = await getPromptUsage(session.user.id, teamId, access.isTrial);

  return NextResponse.json({
    used: usage.used,
    limit: usage.limit,
    remaining: usage.remaining,
    periodStart: usage.periodStart,
    periodEnd: usage.periodEnd,
    isTrial: access.isTrial,
    plan: access.subscriptionPlan,
  });
}
