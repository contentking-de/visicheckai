import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { domains } from "@/lib/schema";
import { teamFilter } from "@/lib/rbac";
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
import { DeleteDomainButton } from "@/components/delete-domain-button";
import { getTranslations } from "next-intl/server";

export default async function DomainsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const t = await getTranslations("Domains");
  const tc = await getTranslations("Common");

  const userDomains = await db
    .select()
    .from(domains)
    .where(teamFilter("domains", session));

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
          <Link href="/dashboard/domains/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t("addDomain")}
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tc("name")}</TableHead>
              <TableHead>{t("domainUrl")}</TableHead>
              <TableHead className="w-[100px]">{tc("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userDomains.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  {t("empty")}{" "}
                  <Link href="/dashboard/domains/new" className="text-primary underline">
                    {t("addFirst")}
                  </Link>
                </TableCell>
              </TableRow>
            ) : (
              userDomains.map((domain) => (
                <TableRow key={domain.id}>
                  <TableCell className="font-medium">{domain.name}</TableCell>
                  <TableCell>{domain.domainUrl}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button asChild variant="ghost" size="icon">
                        <Link href={`/dashboard/domains/${domain.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <DeleteDomainButton domainId={domain.id} />
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
