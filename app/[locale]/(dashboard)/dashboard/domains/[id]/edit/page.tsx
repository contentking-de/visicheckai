import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { domains } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { teamFilter } from "@/lib/rbac";
import { notFound } from "next/navigation";
import { DomainForm } from "@/components/domain-form";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function EditDomainPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id } = await params;
  const [domain] = await db
    .select()
    .from(domains)
    .where(and(eq(domains.id, id), teamFilter("domains", session)));

  if (!domain) notFound();

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Domain bearbeiten</h1>
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/domains" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </Link>
          </Button>
        </div>
        <p className="text-muted-foreground">{domain.name}</p>
      </div>
      <DomainForm domain={domain} />
    </div>
  );
}
