import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Resend from "next-auth/providers/resend";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { users, accounts, sessions, verificationTokens } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY || process.env.RESEND_API_KEY,
      from: process.env.EMAIL_FROM || "visicheck.ai <onboarding@resend.dev>",
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  pages: {
    signIn: "/login",
    verifyRequest: "/login/verify",
    error: "/login",
  },
  session: {
    strategy: "database",
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async signIn({ user, account }) {
      const email = user.email;
      if (!email) return false;

      if (account?.provider === "google") {
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email));

        if (!dbUser) return false;

        if (dbUser.registeredAt) return true;

        // Check if this is a sign-up intent (cookie set by sign-up page)
        try {
          const cookieStore = await cookies();
          const isSignUp =
            cookieStore.get("signup_intent")?.value === "true";
          if (isSignUp) {
            await db
              .update(users)
              .set({
                registeredAt: new Date(),
                name: user.name || dbUser.name,
              })
              .where(eq(users.id, dbUser.id));
            return true;
          }
        } catch {
          // Cookie access failed
        }

        return "/login?error=NotRegistered";
      }

      if (account?.provider === "resend") {
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.email, email));

        if (dbUser?.registeredAt) return true;
        return "/login?error=NotRegistered";
      }

      return true;
    },
  },
  trustHost: true,
});
