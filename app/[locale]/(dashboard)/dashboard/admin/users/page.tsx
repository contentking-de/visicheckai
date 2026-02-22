import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/rbac";
import { getTranslations } from "next-intl/server";
import type { UserRole } from "@/lib/schema";
import { redirect } from "next/navigation";
import { getLocalePrefix } from "@/lib/locale-href";
import { AdminUsersTable } from "@/components/admin-users-table";

export default async function AdminUsersPage() {
  const prefix = await getLocalePrefix();
  const session = await auth();

  if (!session?.user?.id) {
    redirect(`${prefix}/login`);
  }

  if (!session.user.role || !isSuperAdmin(session.user.role as UserRole)) {
    redirect(`${prefix}/dashboard`);
  }

  const t = await getTranslations("AdminUsers");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <AdminUsersTable />
    </div>
  );
}
