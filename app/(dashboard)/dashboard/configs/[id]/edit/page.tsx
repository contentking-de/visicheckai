import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { trackingConfigs } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { teamFilter } from "@/lib/rbac";
import { notFound } from "next/navigation";
import { ConfigForm } from "@/components/config-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function EditConfigPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const t = await getTranslations("Configs");
  const tc = await getTranslations("Common");

  const { id } = await params;
  const [config] = await db
    .select()
    .from(trackingConfigs)
    .where(and(eq(trackingConfigs.id, id), teamFilter("trackingConfigs", session)));

  if (!config) notFound();

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t("editTitle")}</h1>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/configs" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {tc("back")}
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground">
          {t("editDescription")}
        </p>
      </div>
      <ConfigForm
        config={{
          id: config.id,
          domainId: config.domainId,
          promptSetId: config.promptSetId,
          interval: config.interval,
        }}
      />
    </div>
  );
}
