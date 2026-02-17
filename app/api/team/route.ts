import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { teams, teamMembers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTeamForUser } from "@/lib/rbac";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamCtx = await getTeamForUser(session.user.id);
  if (!teamCtx) {
    return NextResponse.json({ error: "Kein Team gefunden" }, { status: 404 });
  }

  return NextResponse.json({
    teamId: teamCtx.teamId,
    teamName: teamCtx.teamName,
    role: teamCtx.role,
  });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamCtx = await getTeamForUser(session.user.id);
  if (!teamCtx) {
    return NextResponse.json({ error: "Kein Team gefunden" }, { status: 404 });
  }

  if (teamCtx.role !== "owner" && teamCtx.role !== "super_admin") {
    return NextResponse.json(
      { error: "Nur Owner können das Team bearbeiten" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { name } = body;

  if (!name) {
    return NextResponse.json({ error: "Name ist erforderlich" }, { status: 400 });
  }

  const [updated] = await db
    .update(teams)
    .set({ name: String(name) })
    .where(eq(teams.id, teamCtx.teamId))
    .returning();

  return NextResponse.json(updated);
}
