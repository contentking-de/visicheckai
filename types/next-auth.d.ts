import type { UserRole } from "@/lib/schema";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      teamId?: string | null;
      role?: UserRole | null;
      impersonating?: boolean;
      impersonatingTeamName?: string | null;
    };
  }

  interface User {
    teamId?: string | null;
    role?: UserRole | null;
  }
}
