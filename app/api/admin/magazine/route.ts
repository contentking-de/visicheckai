import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/rbac";
import { db } from "@/lib/db";
import { magazineArticles, users } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import type { UserRole } from "@/lib/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.role || !isSuperAdmin(session.user.role as UserRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const articles = await db
    .select({
      id: magazineArticles.id,
      slug: magazineArticles.slug,
      title: magazineArticles.title,
      excerpt: magazineArticles.excerpt,
      coverImage: magazineArticles.coverImage,
      published: magazineArticles.published,
      publishedAt: magazineArticles.publishedAt,
      createdAt: magazineArticles.createdAt,
      authorName: users.name,
    })
    .from(magazineArticles)
    .leftJoin(users, eq(users.id, magazineArticles.authorId))
    .orderBy(desc(magazineArticles.createdAt));

  return NextResponse.json(articles);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.role || !isSuperAdmin(session.user.role as UserRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { title, excerpt, content, coverImage, published } = body;

  if (!title || !content) {
    return NextResponse.json(
      { error: "Title and content are required" },
      { status: 400 }
    );
  }

  const slug = slugify(title) + "-" + Date.now().toString(36);

  const [article] = await db
    .insert(magazineArticles)
    .values({
      slug,
      title,
      excerpt: excerpt || null,
      content,
      coverImage: coverImage || null,
      authorId: session.user.id,
      published: published ?? false,
      publishedAt: published ? new Date() : null,
    })
    .returning();

  return NextResponse.json(article, { status: 201 });
}
