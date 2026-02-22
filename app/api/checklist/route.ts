import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { visibilityChecklist, users, domains } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getAllItemKeys } from "@/lib/checklist-data";
import { sendChecklistAssignmentEmail } from "@/lib/email";

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

  const rows = await db
    .select()
    .from(visibilityChecklist)
    .where(eq(visibilityChecklist.domainId, domainId));

  const items: Record<
    string,
    { checked: boolean; notes: string | null; assigneeId: string | null }
  > = {};
  for (const row of rows) {
    items[row.itemKey] = {
      checked: row.checked,
      notes: row.notes,
      assigneeId: row.assigneeId,
    };
  }

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { domainId, itemKey, checked, notes, assigneeId } = body as {
    domainId?: string;
    itemKey?: string;
    checked?: boolean;
    notes?: string;
    assigneeId?: string | null;
  };

  if (!domainId || !itemKey) {
    return NextResponse.json(
      { error: "domainId and itemKey are required" },
      { status: 400 }
    );
  }

  const allKeys = getAllItemKeys();
  if (!allKeys.includes(itemKey)) {
    return NextResponse.json({ error: "Invalid itemKey" }, { status: 400 });
  }

  try {
    const [existing] = await db
      .select()
      .from(visibilityChecklist)
      .where(
        and(
          eq(visibilityChecklist.domainId, domainId),
          eq(visibilityChecklist.itemKey, itemKey)
        )
      )
      .limit(1);

    const newChecked =
      typeof checked === "boolean" ? checked : (existing?.checked ?? false);
    const newNotes =
      typeof notes === "string" ? notes : (existing?.notes ?? null);
    const newAssigneeId =
      assigneeId !== undefined
        ? assigneeId || null
        : (existing?.assigneeId ?? null);

    const previousAssigneeId = existing?.assigneeId ?? null;

    await db
      .insert(visibilityChecklist)
      .values({
        domainId,
        teamId: session.user.teamId ?? null,
        userId: session.user.id,
        itemKey,
        checked: newChecked,
        checkedAt: newChecked ? new Date() : null,
        checkedBy: newChecked ? session.user.id : null,
        notes: newNotes,
        assigneeId: newAssigneeId,
      })
      .onConflictDoUpdate({
        target: [visibilityChecklist.domainId, visibilityChecklist.itemKey],
        set: {
          checked: newChecked,
          checkedAt: newChecked ? new Date() : null,
          checkedBy: newChecked ? session.user.id : null,
          notes: newNotes,
          assigneeId: newAssigneeId,
        },
      });

    if (
      newAssigneeId &&
      newAssigneeId !== session.user.id &&
      newAssigneeId !== previousAssigneeId
    ) {
      const [assignee] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, newAssigneeId))
        .limit(1);

      const [domain] = await db
        .select({ name: domains.name })
        .from(domains)
        .where(eq(domains.id, domainId))
        .limit(1);

      if (assignee?.email) {
        sendChecklistAssignmentEmail({
          to: assignee.email,
          assignerName: session.user.name || "Ein Teammitglied",
          itemLabel: itemKey,
          domainName: domain?.name || domainId,
        }).catch((err) => {
          console.error("[Checklist] Email error:", err);
        });
      }
    }
  } catch (err) {
    console.error("[Checklist] DB error:", err);
    return NextResponse.json(
      { error: "Failed to save checklist item" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
