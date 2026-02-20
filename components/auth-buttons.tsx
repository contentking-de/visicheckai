"use client";

import { useSession } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/user-menu";
import { LayoutDashboard } from "lucide-react";

type AuthButtonsProps = {
  loginLabel: string;
  signUpLabel: string;
  dashboardLabel?: string;
};

export function AuthButtons({
  loginLabel,
  signUpLabel,
  dashboardLabel = "Dashboard",
}: AuthButtonsProps) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return <div className="h-9 w-20" />;
  }

  if (session?.user) {
    return (
      <>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            {dashboardLabel}
          </Link>
        </Button>
        <UserMenu
          name={session.user.name}
          email={session.user.email}
          image={session.user.image}
          role={(session.user as { role?: string }).role}
        />
      </>
    );
  }

  return (
    <>
      <Button asChild variant="outline" size="lg" className="border-black text-black hover:bg-black/5">
        <Link href="/login">{loginLabel}</Link>
      </Button>
      <Button asChild size="lg">
        <Link href="/sign-up">{signUpLabel}</Link>
      </Button>
    </>
  );
}
