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
  const { interval } = body;

  const validInterval =
    interval && ["daily", "weekly", "monthly", "on_demand"].includes(interval)
      ? interval
      : undefined;

  const [config] = await db
    .update(trackingConfigs)
    .set({
      ...(validInterval && { interval: validInterval }),
    })
    .where(teamOrUserFilter(id, session))
    .returning();

  if (!config) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(config);
}
