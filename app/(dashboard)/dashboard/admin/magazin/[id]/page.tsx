import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { isSuperAdmin } from "@/lib/rbac";
import { db } from "@/lib/db";
import { magazineArticles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { MagazineArticleForm } from "@/components/magazine-article-form";
import type { UserRole } from "@/lib/schema";

type Props = { params: Promise<{ id: string }> };

export default async function EditArticlePage({ params }: Props) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!session.user.role || !isSuperAdmin(session.user.role as UserRole)) {
    redirect("/dashboard");
  }

  const { id } = await params;

  const [article] = await db
    .select()
    .from(magazineArticles)
    .where(eq(magazineArticles.id, id))
    .limit(1);

  if (!article) {
    notFound();
  }

  const serialized = {
    ...article,
    publishedAt: article.publishedAt?.toISOString() ?? null,
    createdAt: article.createdAt?.toISOString() ?? null,
    updatedAt: article.updatedAt?.toISOString() ?? null,
  };

  return (
    <div className="full-bleed space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Artikel bearbeiten</h1>
        <p className="text-muted-foreground">
          Bearbeiten Sie den Magazin-Beitrag.
        </p>
      </div>
      <MagazineArticleForm article={serialized} />
    </div>
  );
}
