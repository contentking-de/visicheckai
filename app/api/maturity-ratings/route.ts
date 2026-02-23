import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { maturityRatings } from "@/lib/schema";
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

  const rows = await db
    .select()
    .from(maturityRatings)
    .where(eq(maturityRatings.domainId, domainId));

  const ratings: Record<string, number> = {};
  for (const row of rows) {
    ratings[row.itemKey] = row.rating;
  }

  return NextResponse.json({ ratings });
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

  const { domainId, itemKey, rating } = body as {
    domainId?: string;
    itemKey?: string;
    rating?: number;
  };

  if (!domainId || !itemKey || typeof rating !== "number") {
    return NextResponse.json(
      { error: "domainId, itemKey, and rating are required" },
      { status: 400 }
    );
  }

  if (rating < 1 || rating > 10 || !Number.isInteger(rating)) {
    return NextResponse.json(
      { error: "rating must be an integer between 1 and 10" },
      { status: 400 }
    );
  }

  const allKeys = getAllItemKeys();
  if (!allKeys.includes(itemKey)) {
    return NextResponse.json({ error: "Invalid itemKey" }, { status: 400 });
  }

  try {
    await db
      .insert(maturityRatings)
      .values({
        domainId,
        teamId: session.user.teamId ?? null,
        userId: session.user.id,
        itemKey,
        rating,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [maturityRatings.domainId, maturityRatings.itemKey],
        set: {
          rating,
          userId: session.user.id,
          updatedAt: new Date(),
        },
      });
  } catch (err) {
    console.error("[MaturityRatings] DB error:", err);
    return NextResponse.json(
      { error: "Failed to save rating" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
