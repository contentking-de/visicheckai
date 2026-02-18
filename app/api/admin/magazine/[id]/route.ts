import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/rbac";
import { db } from "@/lib/db";
import { magazineArticles } from "@/lib/schema";
import { eq } from "drizzle-orm";
import type { UserRole } from "@/lib/schema";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.role || !isSuperAdmin(session.user.role as UserRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;

  const [article] = await db
    .select()
    .from(magazineArticles)
    .where(eq(magazineArticles.id, id))
    .limit(1);

  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(article);
}

export async function PUT(req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.role || !isSuperAdmin(session.user.role as UserRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;
  const body = await req.json();
  const { title, excerpt, content, coverImage, published } = body;

  const [existing] = await db
    .select()
    .from(magazineArticles)
    .where(eq(magazineArticles.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const publishedAt =
    published && !existing.published ? new Date() : existing.publishedAt;

  const [article] = await db
    .update(magazineArticles)
    .set({
      title: title ?? existing.title,
      excerpt: excerpt !== undefined ? excerpt : existing.excerpt,
      content: content ?? existing.content,
      coverImage: coverImage !== undefined ? coverImage : existing.coverImage,
      published: published ?? existing.published,
      publishedAt,
      updatedAt: new Date(),
    })
    .where(eq(magazineArticles.id, id))
    .returning();

  return NextResponse.json(article);
}

export async function DELETE(_req: Request, ctx: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.role || !isSuperAdmin(session.user.role as UserRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await ctx.params;

  await db
    .delete(magazineArticles)
    .where(eq(magazineArticles.id, id));

  return NextResponse.json({ ok: true });
}
