import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { domains } from "@/lib/schema";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { DeleteDomainButton } from "@/components/delete-domain-button";

export default async function DomainsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const userDomains = await db
    .select()
    .from(domains)
    .where(eq(domains.userId, session.user.id));

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Domains</h1>
          <p className="text-muted-foreground">
            Verwalten Sie Ihre Domains und Marken
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/domains/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Domain hinzufügen
          </Link>
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Domain / URL</TableHead>
              <TableHead className="w-[100px]">Aktionen</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userDomains.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  Noch keine Domains.{" "}
                  <Link href="/dashboard/domains/new" className="text-primary underline">
                    Erste hinzufügen
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
