import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { promptSets } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil } from "lucide-react";
import { DeletePromptSetButton } from "@/components/delete-prompt-set-button";
import { getTranslations } from "next-intl/server";

export default async function PromptSetsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const t = await getTranslations("PromptSets");
  const tc = await getTranslations("Common");

  const sets = await db
    .select()
    .from(promptSets)
    .where(eq(promptSets.userId, session.user.id));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("description")}
          </p>
        </div>
        <Button asChild>
          <Link
            href="/dashboard/prompt-sets/new"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            {t("createPromptSet")}
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tc("name")}</TableHead>
              <TableHead>{t("promptCount")}</TableHead>
              <TableHead className="w-[100px]">{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  {t("empty")}{" "}
                  <Link
                    href="/dashboard/prompt-sets/new"
                    className="text-primary underline"
                  >
                    {t("createFirst")}
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              sets.map((set) => (
                <TableRow key={set.id}>
                  <TableCell className="font-medium">{set.name}</TableCell>
                  <TableCell>{set.prompts?.length ?? 0} {t("prompts")}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/dashboard/prompt-sets/${set.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeletePromptSetButton promptSetId={set.id} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
