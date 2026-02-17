import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { domains } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const teamId = session.user.teamId;

  const userDomains = teamId
    ? await db.select().from(domains).where(eq(domains.teamId, teamId))
    : await db.select().from(domains).where(eq(domains.userId, session.user.id));

  return NextResponse.json(userDomains);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, domainUrl } = body;

  if (!name || !domainUrl) {
    return NextResponse.json(
      { error: "Name und domainUrl sind erforderlich" },
      { status: 400 }
    );
  }

  const [domain] = await db
    .insert(domains)
    .values({
      userId: session.user.id,
      teamId: session.user.teamId ?? null,
      name: String(name),
      domainUrl: String(domainUrl),
    })
    .returning();

  return NextResponse.json(domain);
}
