import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { trackingConfigs } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

function teamOrUserFilter(id: string, session: { user: { id: string; teamId?: string | null } }) {
  const teamId = session.user.teamId;
  if (teamId) {
    return and(eq(trackingConfigs.id, id), eq(trackingConfigs.teamId, teamId));
  }
  return and(eq(trackingConfigs.id, id), eq(trackingConfigs.userId, session.user.id));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [config] = await db
    .delete(trackingConfigs)
    .where(teamOrUserFilter(id, session))
    .returning();

  if (!config) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { interval, domainId, promptSetId } = body;

  const validInterval =
    interval && ["daily", "weekly", "monthly", "on_demand"].includes(interval)
      ? interval
      : undefined;

  const updates: Record<string, unknown> = {};
  if (validInterval) updates.interval = validInterval;
  if (domainId) updates.domainId = domainId;
  if (promptSetId) updates.promptSetId = promptSetId;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const [config] = await db
    .update(trackingConfigs)
    .set(updates)
    .where(teamOrUserFilter(id, session))
    .returning();

  if (!config) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(config);
}
