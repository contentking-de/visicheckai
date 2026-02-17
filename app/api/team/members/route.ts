import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { teamMembers, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
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

  const members = await db
    .select({
      id: teamMembers.id,
      userId: teamMembers.userId,
      role: teamMembers.role,
      joinedAt: teamMembers.joinedAt,
      userName: users.name,
      userEmail: users.email,
      userImage: users.image,
    })
    .from(teamMembers)
    .innerJoin(users, eq(users.id, teamMembers.userId))
    .where(eq(teamMembers.teamId, teamCtx.teamId));

  return NextResponse.json(members);
}

export async function DELETE(request: Request) {
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
      { error: "Nur Owner können Mitglieder entfernen" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const memberId = searchParams.get("memberId");

  if (!memberId) {
    return NextResponse.json(
      { error: "memberId ist erforderlich" },
      { status: 400 }
    );
  }

  // Owners can't remove themselves
  const [targetMember] = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.id, memberId),
        eq(teamMembers.teamId, teamCtx.teamId)
      )
    );

  if (!targetMember) {
    return NextResponse.json({ error: "Mitglied nicht gefunden" }, { status: 404 });
  }

  if (targetMember.userId === session.user.id) {
    return NextResponse.json(
      { error: "Sie können sich nicht selbst entfernen" },
      { status: 400 }
    );
  }

  if (targetMember.role === "owner" && teamCtx.role !== "super_admin") {
    return NextResponse.json(
      { error: "Owner können nur von Super-Admins entfernt werden" },
      { status: 403 }
    );
  }

  await db
    .delete(teamMembers)
    .where(eq(teamMembers.id, memberId));

  return NextResponse.json({ success: true });
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
      { error: "Nur Owner können Rollen ändern" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { memberId, role } = body;

  if (!memberId || !role) {
    return NextResponse.json(
      { error: "memberId und role sind erforderlich" },
      { status: 400 }
    );
  }

  if (!["owner", "member"].includes(role)) {
    return NextResponse.json(
      { error: "Ungültige Rolle. Erlaubt: owner, member" },
      { status: 400 }
    );
  }

  // Can't change your own role
  const [targetMember] = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.id, memberId),
        eq(teamMembers.teamId, teamCtx.teamId)
      )
    );

  if (!targetMember) {
    return NextResponse.json({ error: "Mitglied nicht gefunden" }, { status: 404 });
  }

  if (targetMember.userId === session.user.id) {
    return NextResponse.json(
      { error: "Sie können Ihre eigene Rolle nicht ändern" },
      { status: 400 }
    );
  }

  const [updated] = await db
    .update(teamMembers)
    .set({ role })
    .where(eq(teamMembers.id, memberId))
    .returning();

  return NextResponse.json(updated);
}
