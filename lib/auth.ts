import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Resend from "next-auth/providers/resend";
import Google from "next-auth/providers/google";
import { db } from "@/lib/db";
import { users, accounts, sessions, verificationTokens } from "@/lib/schema";
import { eq } from "drizzle-orm";

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

      // Google: always allow – the adapter creates the user AFTER this
      // callback returns true, so we can't query the DB here for new users.
      // registeredAt is set in the createUser event below.
      if (account?.provider === "google") {
        return true;
      }

      // Email/Magic Link: only allow pre-registered users
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
  events: {
    async createUser({ user }) {
      // Mark newly created users as registered (covers Google OAuth sign-up)
      if (user.id) {
        await db
          .update(users)
          .set({ registeredAt: new Date() })
          .where(eq(users.id, user.id));
      }
    },
  },
  trustHost: true,
});
