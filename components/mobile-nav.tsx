"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { LayoutDashboard, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

type MobileNavProps = {
  loginLabel: string;
  signUpLabel: string;
  dashboardLabel?: string;
  pricingLabel?: string;
  faqLabel?: string;
  isLoggedIn?: boolean;
};

export function MobileNav({
  loginLabel,
  signUpLabel,
  dashboardLabel = "Dashboard",
  pricingLabel,
  faqLabel,
  isLoggedIn,
}: MobileNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle className="text-left">Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-4 px-4">
          {pricingLabel && (
            <Button asChild variant="ghost" className="justify-start" onClick={() => setOpen(false)}>
              <Link href="#pricing">{pricingLabel}</Link>
            </Button>
          )}
          {faqLabel && (
            <Button asChild variant="ghost" className="justify-start" onClick={() => setOpen(false)}>
              <Link href="#faq">{faqLabel}</Link>
            </Button>
          )}
          <LanguageSwitcher />
          {isLoggedIn ? (
            <Button asChild variant="ghost" className="justify-start" onClick={() => setOpen(false)}>
              <Link href="/dashboard">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                {dashboardLabel}
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="outline" className="justify-start border-black text-black hover:bg-black/5" onClick={() => setOpen(false)}>
                <Link href="/login">{loginLabel}</Link>
              </Button>
              <Button asChild className="justify-start" onClick={() => setOpen(false)}>
                <Link href="/sign-up">{signUpLabel}</Link>
              </Button>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
