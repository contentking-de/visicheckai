import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isSuperAdmin } from "@/lib/rbac";
import { cookies } from "next/headers";
import type { UserRole } from "@/lib/schema";

const COOKIE_NAME = "impersonate_team_id";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!session.user.role || !isSuperAdmin(session.user.role as UserRole)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { teamId } = await req.json();
  if (!teamId || typeof teamId !== "string") {
    return NextResponse.json({ error: "teamId required" }, { status: 400 });
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, teamId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 4, // 4 hours
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);

  return NextResponse.json({ ok: true });
}
