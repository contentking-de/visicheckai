import { db } from "@/lib/db";
import { teamInvitations, teamMembers, teams } from "@/lib/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * GET: Validate a token and return invitation details (no auth required).
 * Used by the invite page to show team info before login.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json(
      { error: "Token ist erforderlich" },
      { status: 400 }
    );
  }

  const [invitation] = await db
    .select({
      id: teamInvitations.id,
      email: teamInvitations.email,
      role: teamInvitations.role,
      teamId: teamInvitations.teamId,
      expiresAt: teamInvitations.expiresAt,
      acceptedAt: teamInvitations.acceptedAt,
    })
    .from(teamInvitations)
    .where(eq(teamInvitations.token, token));

  if (!invitation) {
    return NextResponse.json(
      { error: "Einladung nicht gefunden" },
      { status: 404 }
    );
  }

  if (invitation.acceptedAt) {
    return NextResponse.json(
      { error: "AlreadyAccepted" },
      { status: 410 }
    );
  }

  if (new Date(invitation.expiresAt) < new Date()) {
    return NextResponse.json(
      { error: "Expired" },
      { status: 410 }
    );
  }

  // Get team name
  const [team] = await db
    .select({ name: teams.name })
    .from(teams)
    .where(eq(teams.id, invitation.teamId));

  return NextResponse.json({
    email: invitation.email,
    role: invitation.role,
    teamName: team?.name ?? "Team",
  });
}

/**
 * POST: Accept an invitation. Requires authentication.
 * Token-based — the logged-in user joins the team regardless of their email.
 * This handles cases where someone registers with Google using a different email.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const { token } = body;

  if (!token) {
    return NextResponse.json(
      { error: "Token ist erforderlich" },
      { status: 400 }
    );
  }

  // Must be logged in
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "NotAuthenticated" },
      { status: 401 }
    );
  }

  // Find valid invitation
  const [invitation] = await db
    .select()
    .from(teamInvitations)
    .where(
      and(
        eq(teamInvitations.token, token),
        isNull(teamInvitations.acceptedAt),
        gt(teamInvitations.expiresAt, new Date())
      )
    );

  if (!invitation) {
    return NextResponse.json(
      { error: "Einladung nicht gefunden, bereits verwendet oder abgelaufen" },
      { status: 404 }
    );
  }

  // Check if already a member of the target team
  const [existingMember] = await db
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, invitation.teamId),
        eq(teamMembers.userId, session.user.id)
      )
    );

  if (existingMember) {
    await db
      .update(teamInvitations)
      .set({ acceptedAt: new Date() })
      .where(eq(teamInvitations.id, invitation.id));

    return NextResponse.json({
      success: true,
      message: "Sie sind bereits Mitglied dieses Teams",
    });
  }

  // Remove user from any current team (a user belongs to one team at a time)
  await db
    .delete(teamMembers)
    .where(eq(teamMembers.userId, session.user.id));

  // Add user to the invited team
  await db.insert(teamMembers).values({
    teamId: invitation.teamId,
    userId: session.user.id,
    role: invitation.role,
  });

  // Mark invitation as accepted
  await db
    .update(teamInvitations)
    .set({ acceptedAt: new Date() })
    .where(eq(teamInvitations.id, invitation.id));

  return NextResponse.json({
    success: true,
    teamId: invitation.teamId,
    role: invitation.role,
  });
}
