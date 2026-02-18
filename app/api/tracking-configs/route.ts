import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { trackingConfigs } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/access";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = session.user.teamId;

  const configs = teamId
    ? await db.select().from(trackingConfigs).where(eq(trackingConfigs.teamId, teamId))
    : await db.select().from(trackingConfigs).where(eq(trackingConfigs.userId, session.user.id));

  return NextResponse.json(configs);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const denied = await requireAccess(session as Parameters<typeof requireAccess>[0]);
  if (denied) return denied;

  const body = await request.json();
  const { domainId, promptSetId, interval } = body;

  if (!domainId || !promptSetId) {
    return NextResponse.json(
      { error: "domainId und promptSetId sind erforderlich" },
      { status: 400 }
    );
  }

  const validInterval =
    interval && ["daily", "weekly", "monthly", "on_demand"].includes(interval)
      ? interval
      : "on_demand";

  let nextRunAt: Date | null = null;
  if (validInterval !== "on_demand") {
    nextRunAt = new Date();
    if (validInterval === "daily") nextRunAt.setDate(nextRunAt.getDate() + 1);
    else if (validInterval === "weekly") nextRunAt.setDate(nextRunAt.getDate() + 7);
    else if (validInterval === "monthly") nextRunAt.setMonth(nextRunAt.getMonth() + 1);
  }

  const [config] = await db
    .insert(trackingConfigs)
    .values({
      userId: session.user.id,
      teamId: session.user.teamId ?? null,
      domainId,
      promptSetId,
      interval: validInterval,
      nextRunAt,
    })
    .returning();

  return NextResponse.json(config);
}
