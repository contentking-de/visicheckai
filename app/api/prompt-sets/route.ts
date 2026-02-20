import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { promptSets } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAccess } from "@/lib/access";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = session.user.teamId;

  const sets = teamId
    ? await db.select().from(promptSets).where(eq(promptSets.teamId, teamId))
    : await db.select().from(promptSets).where(eq(promptSets.userId, session.user.id));

  return NextResponse.json(sets);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const denied = await requireAccess(session as Parameters<typeof requireAccess>[0]);
  if (denied) return denied;

  const body = await request.json();
  const { name, prompts, intentCategories } = body;

  if (!name || !Array.isArray(prompts)) {
    return NextResponse.json(
      { error: "Name und prompts (Array) sind erforderlich" },
      { status: 400 }
    );
  }

  const validPrompts = prompts.filter((p: unknown) => typeof p === "string");
  if (validPrompts.length === 0) {
    return NextResponse.json(
      { error: "Mindestens ein Prompt erforderlich" },
      { status: 400 }
    );
  }

  const validCategories = Array.isArray(intentCategories)
    ? intentCategories.filter((c: unknown) => typeof c === "string")
    : null;

  const [promptSet] = await db
    .insert(promptSets)
    .values({
      userId: session.user.id,
      teamId: session.user.teamId ?? null,
      name: String(name),
      prompts: validPrompts,
      intentCategories: validCategories && validCategories.length > 0 ? validCategories : null,
    })
    .returning();

  return NextResponse.json(promptSet);
}
