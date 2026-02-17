import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { domains } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

function teamOrUserFilter(id: string, session: { user: { id: string; teamId?: string | null } }) {
  const teamId = session.user.teamId;
  if (teamId) {
    return and(eq(domains.id, id), eq(domains.teamId, teamId));
  }
  return and(eq(domains.id, id), eq(domains.userId, session.user.id));
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
  const [domain] = await db
    .select()
    .from(domains)
    .where(teamOrUserFilter(id, session));

  if (!domain) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(domain);
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
  const { name, domainUrl } = body;

  const [domain] = await db
    .update(domains)
    .set({
      ...(name !== undefined && { name: String(name) }),
      ...(domainUrl !== undefined && { domainUrl: String(domainUrl) }),
    })
    .where(teamOrUserFilter(id, session))
    .returning();

  if (!domain) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(domain);
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
  const [domain] = await db
    .delete(domains)
    .where(teamOrUserFilter(id, session))
    .returning();

  if (!domain) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
