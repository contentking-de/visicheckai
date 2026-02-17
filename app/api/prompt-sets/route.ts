import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { promptSets } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

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

  const body = await request.json();
  const { name, prompts } = body;

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

  const [promptSet] = await db
    .insert(promptSets)
    .values({
      userId: session.user.id,
      teamId: session.user.teamId ?? null,
      name: String(name),
      prompts: validPrompts,
    })
    .returning();

  return NextResponse.json(promptSet);
}
