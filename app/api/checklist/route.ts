import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { visibilityChecklist } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAllItemKeys } from "@/lib/checklist-data";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const domainId = searchParams.get("domainId");

  if (!domainId) {
    return NextResponse.json(
      { error: "domainId is required" },
      { status: 400 }
    );
  }

  const items = await db
    .select()
    .from(visibilityChecklist)
    .where(
      and(
        eq(visibilityChecklist.domainId, domainId),
        eq(visibilityChecklist.checked, true)
      )
    );

  const checkedKeys = items.map((item) => item.itemKey);
  return NextResponse.json({ checkedKeys });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { domainId, itemKey, checked } = body;

  if (!domainId || !itemKey || typeof checked !== "boolean") {
    return NextResponse.json(
      { error: "domainId, itemKey and checked are required" },
      { status: 400 }
    );
  }

  const allKeys = getAllItemKeys();
  if (!allKeys.includes(itemKey)) {
    return NextResponse.json(
      { error: "Invalid itemKey" },
      { status: 400 }
    );
  }

  if (checked) {
    await db
      .insert(visibilityChecklist)
      .values({
        domainId,
        teamId: session.user.teamId ?? null,
        userId: session.user.id,
        itemKey,
        checked: true,
        checkedAt: new Date(),
        checkedBy: session.user.id,
      })
      .onConflictDoUpdate({
        target: [visibilityChecklist.domainId, visibilityChecklist.itemKey],
        set: {
          checked: true,
          checkedAt: new Date(),
          checkedBy: session.user.id,
        },
      });
  } else {
    await db
      .delete(visibilityChecklist)
      .where(
        and(
          eq(visibilityChecklist.domainId, domainId),
          eq(visibilityChecklist.itemKey, itemKey)
        )
      );
  }

  return NextResponse.json({ ok: true });
}
