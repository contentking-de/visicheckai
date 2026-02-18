import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/rbac";
import { MagazineArticleForm } from "@/components/magazine-article-form";
import type { UserRole } from "@/lib/schema";

export default async function NewArticlePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!session.user.role || !isSuperAdmin(session.user.role as UserRole)) {
    redirect("/dashboard");
  }

  return (
    <div className="full-bleed space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Neuer Artikel</h1>
        <p className="text-muted-foreground">
          Erstellen Sie einen neuen Magazin-Beitrag.
        </p>
      </div>
      <MagazineArticleForm />
    </div>
  );
}
