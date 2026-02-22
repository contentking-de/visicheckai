import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { domains, teamMembers, users } from "@/lib/schema";
import { teamFilter, getTeamForUser } from "@/lib/rbac";
import { eq } from "drizzle-orm";
import { getTranslations } from "next-intl/server";
import { VisibilityChecklist } from "@/components/visibility-checklist";
import { CHECKLIST_CATEGORIES, getTotalItemCount } from "@/lib/checklist-data";

export default async function ChecklistPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const t = await getTranslations("Checklist");

  const [userDomains, teamCtx] = await Promise.all([
    db.select().from(domains).where(teamFilter("domains", session)),
    getTeamForUser(session.user.id),
  ]);

  let members: { userId: string; name: string | null; email: string | null; image: string | null }[] = [];
  if (teamCtx) {
    members = await db
      .select({
        userId: teamMembers.userId,
        name: users.name,
        email: users.email,
        image: users.image,
      })
      .from(teamMembers)
      .innerJoin(users, eq(users.id, teamMembers.userId))
      .where(eq(teamMembers.teamId, teamCtx.teamId));
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <VisibilityChecklist
        domains={userDomains.map((d) => ({
          id: d.id,
          name: d.name,
          domainUrl: d.domainUrl,
        }))}
        categories={CHECKLIST_CATEGORIES}
        totalItems={getTotalItemCount()}
        teamMembers={members.map((m) => ({
          userId: m.userId,
          name: m.name ?? m.email ?? "Unbekannt",
          image: m.image,
        }))}
      />
    </div>
  );
}
