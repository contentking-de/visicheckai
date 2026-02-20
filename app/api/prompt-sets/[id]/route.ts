import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { promptSets } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/access";

function teamOrUserFilter(id: string, session: { user: { id: string; teamId?: string | null } }) {
  const teamId = session.user.teamId;
  if (teamId) {
    return and(eq(promptSets.id, id), eq(promptSets.teamId, teamId));
  }
  return and(eq(promptSets.id, id), eq(promptSets.userId, session.user.id));
}

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
    .where(teamOrUserFilter(id, session));

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
  const denied = await requireAccess(session as Parameters<typeof requireAccess>[0]);
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json();
  const { name, prompts, intentCategories } = body;

  const updates: { name?: string; prompts?: string[]; intentCategories?: string[] | null } = {};
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
  if (intentCategories !== undefined) {
    const valid = Array.isArray(intentCategories)
      ? intentCategories.filter((c: unknown) => typeof c === "string")
      : [];
    updates.intentCategories = valid.length > 0 ? valid : null;
  }

  const [promptSet] = await db
    .update(promptSets)
    .set(updates)
    .where(teamOrUserFilter(id, session))
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
  const denied = await requireAccess(session as Parameters<typeof requireAccess>[0]);
  if (denied) return denied;

  const { id } = await params;
  const [promptSet] = await db
    .delete(promptSets)
    .where(teamOrUserFilter(id, session))
    .returning();

  if (!promptSet) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
