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

export default async function PromptSetsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const sets = await db
    .select()
    .from(promptSets)
    .where(eq(promptSets.userId, session.user.id));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Prompt-Sets</h1>
          <p className="text-muted-foreground">
            Definieren Sie Prompts, mit denen Ihre Sichtbarkeit getrackt wird
          </p>
        </div>
        <Button asChild>
          <Link
            href="/dashboard/prompt-sets/new"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Prompt-Set erstellen
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Anzahl Prompts</TableHead>
              <TableHead className="w-[100px]">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  Noch keine Prompt-Sets.{" "}
                  <Link
                    href="/dashboard/prompt-sets/new"
                    className="text-primary underline"
                  >
                    Erstes erstellen
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              sets.map((set) => (
                <TableRow key={set.id}>
                  <TableCell className="font-medium">{set.name}</TableCell>
                  <TableCell>{set.prompts?.length ?? 0} Prompts</TableCell>
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
