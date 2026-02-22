import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/rbac";
import { db } from "@/lib/db";
import { users, teams, teamMembers, domains, promptSets, subscriptions } from "@/lib/schema";
import { eq, count, sql, desc } from "drizzle-orm";
import type { UserRole } from "@/lib/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.role || !isSuperAdmin(session.user.role as UserRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const allTeams = await db
    .select({
      id: teams.id,
      name: teams.name,
      createdAt: teams.createdAt,
    })
    .from(teams)
    .orderBy(desc(teams.createdAt));

  const allMembers = await db
    .select({
      teamId: teamMembers.teamId,
      userId: teamMembers.userId,
      role: teamMembers.role,
      joinedAt: teamMembers.joinedAt,
      userName: users.name,
      userEmail: users.email,
      userImage: users.image,
    })
    .from(teamMembers)
    .innerJoin(users, eq(users.id, teamMembers.userId));

  const allDomains = await db
    .select({
      id: domains.id,
      teamId: domains.teamId,
      name: domains.name,
      domainUrl: domains.domainUrl,
    })
    .from(domains);

  const allPromptSets = await db
    .select({
      id: promptSets.id,
      teamId: promptSets.teamId,
      name: promptSets.name,
      prompts: promptSets.prompts,
    })
    .from(promptSets);

  const latestSubs = await db
    .select({
      teamId: subscriptions.teamId,
      plan: subscriptions.plan,
      status: subscriptions.status,
    })
    .from(subscriptions)
    .where(
      sql`(${subscriptions.teamId}, ${subscriptions.createdAt}) in (
        select team_id, max(created_at) from subscriptions group by team_id
      )`
    );

  const membersByTeam = new Map<string, typeof allMembers>();
  for (const m of allMembers) {
    const list = membersByTeam.get(m.teamId) ?? [];
    list.push(m);
    membersByTeam.set(m.teamId, list);
  }

  const domainsByTeam = new Map<string, typeof allDomains>();
  for (const d of allDomains) {
    if (!d.teamId) continue;
    const list = domainsByTeam.get(d.teamId) ?? [];
    list.push(d);
    domainsByTeam.set(d.teamId, list);
  }

  const promptSetsByTeam = new Map<string, typeof allPromptSets>();
  for (const ps of allPromptSets) {
    if (!ps.teamId) continue;
    const list = promptSetsByTeam.get(ps.teamId) ?? [];
    list.push(ps);
    promptSetsByTeam.set(ps.teamId, list);
  }

  const subMap = new Map(
    latestSubs.map((s) => [s.teamId, { plan: s.plan, status: s.status }])
  );

  const result = allTeams.map((team) => {
    const teamDomains = domainsByTeam.get(team.id) ?? [];
    const teamPromptSets = promptSetsByTeam.get(team.id) ?? [];
    return {
      id: team.id,
      name: team.name,
      createdAt: team.createdAt,
      domainCount: teamDomains.length,
      subscription: subMap.get(team.id) ?? null,
      members: (membersByTeam.get(team.id) ?? []).map((m) => ({
        userId: m.userId,
        name: m.userName,
        email: m.userEmail,
        image: m.userImage,
        role: m.role,
        joinedAt: m.joinedAt,
      })),
      domains: teamDomains.map((d) => ({
        id: d.id,
        name: d.name,
        domainUrl: d.domainUrl,
      })),
      promptSets: teamPromptSets.map((ps) => ({
        id: ps.id,
        name: ps.name,
        promptCount: ps.prompts?.length ?? 0,
      })),
    };
  });

  return NextResponse.json({ teams: result });
}
