import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";

type AuthButtonsProps = {
  loginLabel: string;
  signUpLabel: string;
  dashboardLabel?: string;
  user?: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string | null;
  } | null;
};

export function AuthButtons({
  loginLabel,
  signUpLabel,
  dashboardLabel = "Dashboard",
  user,
}: AuthButtonsProps) {
  if (user) {
    return (
      <>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">
            <LayoutDashboard className="mr-2 h-4 w-4" />
            {dashboardLabel}
          </Link>
        </Button>
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
