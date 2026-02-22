"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SidebarPlanInfo } from "@/components/sidebar-plan-info";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Eye,
  BarChart3,
  Heart,
  PieChart,
  Globe,
  FileText,
  Settings,
  ShieldCheck,
  Users,
  Newspaper,
  ClipboardCheck,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  iconName: string;
};

type NavSection = {
  title: string;
  items: NavItem[];
};

type DashboardMobileNavProps = {
  mainItems: NavItem[];
  sections: NavSection[];
};

const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  Eye,
  BarChart3,
  Heart,
  PieChart,
  Globe,
  FileText,
  Settings,
  ShieldCheck,
  Users,
  Newspaper,
  ClipboardCheck,
};

export function DashboardMobileNav({
  mainItems,
  sections,
}: DashboardMobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (href: string) => {
    const clean = pathname.replace(/^\/(de|en|fr|es)/, "");
    if (href === "/dashboard") return clean === "/dashboard";
    return clean.startsWith(href);
  };

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
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b px-4 py-4">
          <SheetTitle className="flex items-center gap-2 text-left">
            <Image
              src="/favicon.webp"
              alt=""
              width={20}
              height={20}
              className="h-5 w-5"
            />
            visicheck.ai
          </SheetTitle>
          <SheetDescription className="sr-only">
            Dashboard Navigation
          </SheetDescription>
        </SheetHeader>

        <nav className="flex-1 overflow-y-auto p-2">
          {mainItems.map((item) => {
            const Icon = ICONS[item.iconName];
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "bg-primary/10 text-primary"
                    : "hover:bg-muted"
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
              </Link>
            );
          })}

          {sections.map((section) => (
            <div key={section.title} className="mt-4 space-y-1">
              <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {section.title}
              </p>
              {section.items.map((item) => {
                const Icon = ICONS[item.iconName];
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-muted"
                    }`}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="shrink-0 space-y-2 border-t p-2 px-3 pt-3">
          <SidebarPlanInfo />
          <LanguageSwitcher />
        </div>
      </SheetContent>
    </Sheet>
  );
}
