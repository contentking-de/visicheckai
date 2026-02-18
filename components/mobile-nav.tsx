"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { Menu } from "lucide-react";
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
  pricingLabel?: string;
  faqLabel?: string;
};

export function MobileNav({ loginLabel, signUpLabel, pricingLabel, faqLabel }: MobileNavProps) {
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
          <Button asChild variant="ghost" className="justify-start" onClick={() => setOpen(false)}>
            <Link href="/login">{loginLabel}</Link>
          </Button>
          <Button asChild className="justify-start" onClick={() => setOpen(false)}>
            <Link href="/sign-up">{signUpLabel}</Link>
          </Button>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
