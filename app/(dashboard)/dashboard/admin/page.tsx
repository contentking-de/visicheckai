import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/rbac";
import { AdminCharts } from "@/components/admin-charts";
import { getTranslations } from "next-intl/server";
import type { UserRole } from "@/lib/schema";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!session.user.role || !isSuperAdmin(session.user.role as UserRole)) {
    redirect("/dashboard");
  }

  const t = await getTranslations("Admin");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <AdminCharts />
    </div>
  );
}
