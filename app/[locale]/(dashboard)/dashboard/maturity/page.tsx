import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { domains } from "@/lib/schema";
import { teamFilter } from "@/lib/rbac";
import { getTranslations } from "next-intl/server";
import { MaturitySunburst } from "@/components/maturity-sunburst";
import { CHECKLIST_CATEGORIES } from "@/lib/checklist-data";

export default async function MaturityPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const t = await getTranslations("Maturity");

  const userDomains = await db
    .select()
    .from(domains)
    .where(teamFilter("domains", session));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <MaturitySunburst
        domains={userDomains.map((d) => ({
          id: d.id,
          name: d.name,
          domainUrl: d.domainUrl,
        }))}
        categories={CHECKLIST_CATEGORIES}
      />
    </div>
  );
}
