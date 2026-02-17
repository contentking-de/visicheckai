import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { promptSets } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { teamFilter } from "@/lib/rbac";
import { notFound } from "next/navigation";
import { PromptSetForm } from "@/components/prompt-set-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function EditPromptSetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { id } = await params;
  const [promptSet] = await db
    .select()
    .from(promptSets)
    .where(and(eq(promptSets.id, id), teamFilter("promptSets", session)));

  if (!promptSet) notFound();

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/prompt-sets" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Link>
        </Button>
        <h1 className="mt-4 text-2xl font-bold">Prompt-Set bearbeiten</h1>
        <p className="text-muted-foreground">{promptSet.name}</p>
      </div>
      <PromptSetForm promptSet={promptSet} />
    </div>
  );
}
