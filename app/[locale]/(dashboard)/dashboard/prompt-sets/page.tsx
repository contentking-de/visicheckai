import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { promptSets } from "@/lib/schema";
import { teamFilter } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { PHASE_SUBCATEGORIES, type FunnelPhase } from "@/lib/prompt-categories";

const PHASE_ORDER: FunnelPhase[] = ["awareness", "consideration", "decision", "trust", "usage"];

function groupByPhase(categories: string[]): { phase: FunnelPhase; subs: string[] }[] {
  const groups: { phase: FunnelPhase; subs: string[] }[] = [];
  for (const phase of PHASE_ORDER) {
    const matching = PHASE_SUBCATEGORIES[phase].filter((s) => categories.includes(s));
    if (matching.length > 0) groups.push({ phase, subs: matching });
  }
  return groups;
}

export default async function PromptSetsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const t = await getTranslations("PromptSets");
  const tg = await getTranslations("GeneratePrompts");
  const tc = await getTranslations("Common");

  const sets = await db
    .select()
    .from(promptSets)
    .where(teamFilter("promptSets", session));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
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

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tc("name")}</TableHead>
              <TableHead>{t("intentCategory")}</TableHead>
              <TableHead>{t("promptCount")}</TableHead>
              <TableHead className="w-[100px]">{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
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
              sets.map((set) => {
                const categories = set.intentCategories ?? [];
                const grouped = groupByPhase(categories);
                return (
                  <TableRow key={set.id}>
                    <TableCell className="font-medium">{set.name}</TableCell>
                    <TableCell>
                      {grouped.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {grouped.map(({ phase, subs }) => (
                            <Badge
                              key={phase}
                              variant="outline"
                              className="text-xs"
                              title={subs
                                .map((s) => tg(`sub_${s}` as Parameters<typeof tg>[0]))
                                .join(", ")}
                            >
                              {tg(`phase_${phase}` as Parameters<typeof tg>[0])}
                              {subs.length <
                                PHASE_SUBCATEGORIES[phase].length && (
                                <span className="ml-1 text-muted-foreground">
                                  ({subs.length})
                                </span>
                              )}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </TableCell>
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
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
