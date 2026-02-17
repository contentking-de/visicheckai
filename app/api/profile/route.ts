import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, userProfiles } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, session.user.id));

  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, session.user.id));

  return NextResponse.json({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: profile?.phone ?? "",
    companyName: profile?.companyName ?? "",
    companyStreet: profile?.companyStreet ?? "",
    companyZip: profile?.companyZip ?? "",
    companyCity: profile?.companyCity ?? "",
    companyCountry: profile?.companyCountry ?? "",
    billingDifferent: profile?.billingDifferent ?? false,
    billingCompanyName: profile?.billingCompanyName ?? "",
    billingStreet: profile?.billingStreet ?? "",
    billingZip: profile?.billingZip ?? "",
    billingCity: profile?.billingCity ?? "",
    billingCountry: profile?.billingCountry ?? "",
  });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  // Update user name
  await db
    .update(users)
    .set({ name: body.name })
    .where(eq(users.id, session.user.id));

  // Upsert profile
  const [existing] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, session.user.id));

  const profileData = {
    phone: body.phone ?? "",
    companyName: body.companyName ?? "",
    companyStreet: body.companyStreet ?? "",
    companyZip: body.companyZip ?? "",
    companyCity: body.companyCity ?? "",
    companyCountry: body.companyCountry ?? "",
    billingDifferent: body.billingDifferent ?? false,
    billingCompanyName: body.billingDifferent ? (body.billingCompanyName ?? "") : "",
    billingStreet: body.billingDifferent ? (body.billingStreet ?? "") : "",
    billingZip: body.billingDifferent ? (body.billingZip ?? "") : "",
    billingCity: body.billingDifferent ? (body.billingCity ?? "") : "",
    billingCountry: body.billingDifferent ? (body.billingCountry ?? "") : "",
    updatedAt: new Date(),
  };

  if (existing) {
    await db
      .update(userProfiles)
      .set(profileData)
      .where(eq(userProfiles.userId, session.user.id));
  } else {
    await db.insert(userProfiles).values({
      userId: session.user.id,
      ...profileData,
    });
  }

  return NextResponse.json({ success: true });
}
