import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { registered: false },
        { status: 400 }
      );
    }

    const [user] = await db
      .select({ registeredAt: users.registeredAt })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()));

    return NextResponse.json({
      registered: !!user?.registeredAt,
    });
  } catch {
    return NextResponse.json(
      { registered: false },
      { status: 500 }
    );
  }
}
