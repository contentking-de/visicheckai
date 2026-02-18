import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/rbac";
import { MagazineAdminList } from "@/components/magazine-admin-list";
import type { UserRole } from "@/lib/schema";
import { redirect } from "next/navigation";
import { getLocalePrefix } from "@/lib/locale-href";

export default async function AdminMagazinPage() {
  const prefix = await getLocalePrefix();
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`${prefix}/login`);
  }

  if (!session.user.role || !isSuperAdmin(session.user.role as UserRole)) {
    redirect(`${prefix}/dashboard`);
  }

  return (
    <div className="full-bleed space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Magazin-Verwaltung</h1>
        <p className="text-muted-foreground">
          Erstellen und verwalten Sie Magazin-Beiträge.
        </p>
      </div>
      <MagazineAdminList />
    </div>
  );
}
