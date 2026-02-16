import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { promptSets } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [promptSet] = await db
    .select()
    .from(promptSets)
    .where(and(eq(promptSets.id, id), eq(promptSets.userId, session.user.id!)));

  if (!promptSet) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(promptSet);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, prompts } = body;

  const updates: { name?: string; prompts?: string[] } = {};
  if (name !== undefined) updates.name = String(name);
  if (Array.isArray(prompts)) {
    updates.prompts = prompts.filter((p: unknown) => typeof p === "string");
    if (updates.prompts.length === 0) {
      return NextResponse.json(
        { error: "Mindestens ein Prompt erforderlich" },
        { status: 400 }
      );
    }
  }

  const [promptSet] = await db
    .update(promptSets)
    .set(updates)
    .where(and(eq(promptSets.id, id), eq(promptSets.userId, session.user.id!)))
    .returning();

  if (!promptSet) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(promptSet);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const [promptSet] = await db
    .delete(promptSets)
    .where(and(eq(promptSets.id, id), eq(promptSets.userId, session.user.id!)))
    .returning();

  if (!promptSet) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
