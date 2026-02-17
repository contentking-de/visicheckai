import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { createTeamForUser, getTeamForUser } from "@/lib/rbac";

export async function POST(request: NextRequest) {
  try {
    const { name, email } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizedEmail));

    if (existingUser?.registeredAt) {
      return NextResponse.json(
        { error: "AlreadyRegistered" },
        { status: 409 }
      );
    }

    let userId: string;

    if (existingUser) {
      // User exists but not registered (e.g. from failed Google login attempt)
      await db
        .update(users)
        .set({ name, registeredAt: new Date() })
        .where(eq(users.id, existingUser.id));
      userId = existingUser.id;
    } else {
      // Create new user
      const [newUser] = await db
        .insert(users)
        .values({
          name,
          email: normalizedEmail,
          registeredAt: new Date(),
        })
        .returning();
      userId = newUser.id;
    }

    // Create team if user doesn't already have one
    const existingTeam = await getTeamForUser(userId);
    if (!existingTeam) {
      await createTeamForUser(userId, `${name}s Team`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
