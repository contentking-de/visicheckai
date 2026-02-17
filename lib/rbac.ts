import { db } from "@/lib/db";
import {
  teamMembers,
  teams,
  domains,
  promptSets,
  trackingConfigs,
} from "@/lib/schema";
import { eq, type SQL } from "drizzle-orm";
import type { UserRole } from "@/lib/schema";

export type TeamContext = {
  teamId: string;
  teamName: string;
  role: UserRole;
};

/**
 * Returns the team + role for a given user.
 * A user always belongs to exactly one team.
 */
export async function getTeamForUser(
  userId: string
): Promise<TeamContext | null> {
  const [membership] = await db
    .select({
      teamId: teamMembers.teamId,
      teamName: teams.name,
      role: teamMembers.role,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teams.id, teamMembers.teamId))
    .where(eq(teamMembers.userId, userId))
    .limit(1);

  if (!membership) return null;

  return {
    teamId: membership.teamId,
    teamName: membership.teamName,
    role: membership.role as UserRole,
  };
}

/**
 * Creates a new team and adds the user as owner.
 * Called when a new user registers.
 */
export async function createTeamForUser(
  userId: string,
  teamName: string
): Promise<string> {
  const [team] = await db
    .insert(teams)
    .values({ name: teamName })
    .returning();

  await db.insert(teamMembers).values({
    teamId: team.id,
    userId,
    role: "owner",
  });

  return team.id;
}

/**
 * Checks if a user has one of the allowed roles.
 */
export function hasRole(
  userRole: UserRole,
  allowedRoles: UserRole[]
): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Requires the user to be at least an owner (owner or super_admin).
 */
export function isOwnerOrAbove(role: UserRole): boolean {
  return role === "owner" || role === "super_admin";
}

/**
 * Checks if the user is a super admin.
 */
export function isSuperAdmin(role: UserRole): boolean {
  return role === "super_admin";
}

/**
 * Returns the correct WHERE filter for a table based on the user's team.
 * Uses teamId if the user has a team, falls back to userId otherwise.
 */
export function teamFilter(
  table: "domains" | "promptSets" | "trackingConfigs",
  session: { user: { id: string; teamId?: string | null } }
): SQL {
  const teamId = session.user.teamId;
  const tableRef =
    table === "domains"
      ? domains
      : table === "promptSets"
        ? promptSets
        : trackingConfigs;

  if (teamId) {
    return eq(tableRef.teamId, teamId);
  }
  return eq(tableRef.userId, session.user.id);
}
