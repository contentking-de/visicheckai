"use client";

import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  const t = useTranslations("Nav");

  return (
    <Button
      variant="ghost"
      className="w-full justify-start gap-2"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      <LogOut className="h-4 w-4" />
      {t("signOut")}
    </Button>
  );
}
