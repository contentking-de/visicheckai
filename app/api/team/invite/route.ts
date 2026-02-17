import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { teamInvitations, teamMembers, users } from "@/lib/schema";
import { eq, and, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getTeamForUser } from "@/lib/rbac";
import { sendTeamInvitationEmail } from "@/lib/email";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamCtx = await getTeamForUser(session.user.id);
  if (!teamCtx) {
    return NextResponse.json({ error: "Kein Team gefunden" }, { status: 404 });
  }

  const invitations = await db
    .select()
    .from(teamInvitations)
    .where(
      and(
        eq(teamInvitations.teamId, teamCtx.teamId),
        isNull(teamInvitations.acceptedAt)
      )
    );

  return NextResponse.json(invitations);
}

export async function POST(request: Request) {
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
      { error: "Nur Owner können Mitglieder einladen" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { email, role = "member" } = body;

  if (!email) {
    return NextResponse.json(
      { error: "E-Mail-Adresse ist erforderlich" },
      { status: 400 }
    );
  }

  if (!["owner", "member"].includes(role)) {
    return NextResponse.json(
      { error: "Ungültige Rolle. Erlaubt: owner, member" },
      { status: 400 }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Check if user is already a team member
  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, normalizedEmail));

  if (existingUser) {
    const [existingMember] = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, teamCtx.teamId),
          eq(teamMembers.userId, existingUser.id)
        )
      );

    if (existingMember) {
      return NextResponse.json(
        { error: "Dieser Nutzer ist bereits Mitglied des Teams" },
        { status: 409 }
      );
    }
  }

  // Check for existing pending invitation
  const [existingInvite] = await db
    .select()
    .from(teamInvitations)
    .where(
      and(
        eq(teamInvitations.teamId, teamCtx.teamId),
        eq(teamInvitations.email, normalizedEmail),
        isNull(teamInvitations.acceptedAt)
      )
    );

  if (existingInvite) {
    return NextResponse.json(
      { error: "Eine Einladung für diese E-Mail-Adresse ist bereits ausstehend" },
      { status: 409 }
    );
  }

  // Pre-register the invited user so they can login via magic link immediately
  if (!existingUser) {
    await db.insert(users).values({
      email: normalizedEmail,
      registeredAt: new Date(),
    });
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

  const [invitation] = await db
    .insert(teamInvitations)
    .values({
      teamId: teamCtx.teamId,
      email: normalizedEmail,
      role,
      invitedBy: session.user.id,
      token,
      expiresAt,
    })
    .returning();

  // Send invitation email
  await sendTeamInvitationEmail({
    to: normalizedEmail,
    inviterName: session.user.name || "Ein Teammitglied",
    teamName: teamCtx.teamName,
    token,
    role,
  });

  return NextResponse.json(invitation);
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
      { error: "Nur Owner können Einladungen zurückziehen" },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const invitationId = searchParams.get("id");

  if (!invitationId) {
    return NextResponse.json(
      { error: "Einladungs-ID ist erforderlich" },
      { status: 400 }
    );
  }

  const [deleted] = await db
    .delete(teamInvitations)
    .where(
      and(
        eq(teamInvitations.id, invitationId),
        eq(teamInvitations.teamId, teamCtx.teamId)
      )
    )
    .returning();

  if (!deleted) {
    return NextResponse.json({ error: "Einladung nicht gefunden" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
