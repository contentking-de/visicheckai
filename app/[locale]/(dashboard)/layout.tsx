import { auth } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { LanguageSwitcher } from "@/components/language-switcher";
import { UserMenu } from "@/components/user-menu";
import { AccessGate } from "@/components/access-gate";
import { SidebarPlanInfo } from "@/components/sidebar-plan-info";
import { getAccessStatus } from "@/lib/access";
import {
  LayoutDashboard,
  Globe,
  FileText,
  BarChart3,
  Settings,
  ShieldCheck,
  Newspaper,
  Heart,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { isSuperAdmin } from "@/lib/rbac";
import type { UserRole } from "@/lib/schema";
import { redirect } from "next/navigation";
import { getLocalePrefix } from "@/lib/locale-href";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const prefix = await getLocalePrefix();
  const session = await auth();

  if (!session?.user) {
    redirect(`${prefix}/login`);
  }

  const access = await getAccessStatus(
    session.user.id!,
    session.user.teamId,
    session.user.role
  );

  const t = await getTranslations("Nav");

  const navItems = [
    { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/dashboard/domains", label: t("domains"), icon: Globe },
    { href: "/dashboard/prompt-sets", label: t("promptSets"), icon: FileText },
    { href: "/dashboard/configs", label: t("configs"), icon: Settings },
    { href: "/dashboard/runs", label: t("runs"), icon: BarChart3 },
    { href: "/dashboard/sentiment", label: t("sentiment"), icon: Heart },
  ];

  if (session.user.role && isSuperAdmin(session.user.role as UserRole)) {
    navItems.push({
      href: "/dashboard/admin",
      label: t("admin"),
      icon: ShieldCheck,
    });
    navItems.push({
      href: "/dashboard/admin/magazin",
      label: t("magazine"),
      icon: Newspaper,
    });
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col border-r bg-muted/30">
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Image src="/favicon.webp" alt="" width={20} height={20} className="h-5 w-5" />
            visicheck.ai
          </Link>
        </div>
        <nav className="space-y-1 p-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto space-y-2 border-t p-2 px-3 pt-3">
          <SidebarPlanInfo />
          <LanguageSwitcher />
        </div>
      </aside>
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-end gap-3 border-b px-6">
          <span className="text-sm text-muted-foreground">
            {t("welcome", { name: session.user.name ?? "" })}
          </span>
          <UserMenu
            name={session.user.name}
            email={session.user.email}
            image={session.user.image}
            role={session.user.role}
          />
        </header>
        <AccessGate access={access}>
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto max-w-6xl px-4 py-8 has-[.full-bleed]:max-w-none">
              {children}
            </div>
          </main>
        </AccessGate>
      </div>
    </div>
  );
}
