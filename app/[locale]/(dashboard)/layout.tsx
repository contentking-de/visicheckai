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
  PieChart,
  Eye,
  Users,
  ClipboardCheck,
  Gauge,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import { isSuperAdmin } from "@/lib/rbac";
import type { UserRole } from "@/lib/schema";
import { redirect } from "next/navigation";
import { getLocalePrefix } from "@/lib/locale-href";
import { OnboardingModal } from "@/components/onboarding-modal";
import { ImpersonationBanner } from "@/components/impersonation-banner";
import { DashboardMobileNav } from "@/components/dashboard-mobile-nav";
import { Providers } from "@/components/providers";

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

  const dataItems = [
    { href: "/dashboard/runs", label: t("runs"), icon: BarChart3, iconName: "BarChart3" },
    { href: "/dashboard/sentiment", label: t("sentiment"), icon: Heart, iconName: "Heart" },
    { href: "/dashboard/analytics", label: t("analytics"), icon: PieChart, iconName: "PieChart" },
  ];

  const todoItems = [
    { href: "/dashboard/checklist", label: t("checklist"), icon: ClipboardCheck, iconName: "ClipboardCheck" },
    { href: "/dashboard/maturity", label: t("maturity"), icon: Gauge, iconName: "Gauge" },
  ];

  const settingsItems = [
    { href: "/dashboard/domains", label: t("domains"), icon: Globe, iconName: "Globe" },
    { href: "/dashboard/prompt-sets", label: t("promptSets"), icon: FileText, iconName: "FileText" },
    { href: "/dashboard/configs", label: t("configs"), icon: Settings, iconName: "Settings" },
  ];

  const adminItems: typeof dataItems = [];
  if (session.user.role && isSuperAdmin(session.user.role as UserRole)) {
    adminItems.push({
      href: "/dashboard/admin",
      label: t("admin"),
      icon: ShieldCheck,
      iconName: "ShieldCheck",
    });
    adminItems.push({
      href: "/dashboard/admin/users",
      label: t("adminUsers"),
      icon: Users,
      iconName: "Users",
    });
    adminItems.push({
      href: "/dashboard/admin/magazin",
      label: t("magazine"),
      icon: Newspaper,
      iconName: "Newspaper",
    });
  }

  const mobileMainItems = [
    { href: "/dashboard", label: t("dashboard"), iconName: "LayoutDashboard" },
    { href: "/dashboard/visibility", label: t("visibility"), iconName: "Eye" },
  ];

  const mobileSections = [
    {
      title: t("sectionData"),
      items: dataItems.map((item) => ({
        href: item.href,
        label: item.label,
        iconName: item.iconName,
      })),
    },
    {
      title: t("sectionTodo"),
      items: todoItems.map((item) => ({
        href: item.href,
        label: item.label,
        iconName: item.iconName,
      })),
    },
    {
      title: t("sectionSettings"),
      items: settingsItems.map((item) => ({
        href: item.href,
        label: item.label,
        iconName: item.iconName,
      })),
    },
    ...(adminItems.length > 0
      ? [
          {
            title: t("sectionAdmin"),
            items: adminItems.map((item) => ({
              href: item.href,
              label: item.label,
              iconName: item.iconName,
            })),
          },
        ]
      : []),
  ];

  return (
    <Providers>
    <div className="flex min-h-screen overflow-x-hidden">
      <aside className="sticky top-0 hidden h-screen w-56 flex-col border-r bg-muted/30 md:flex">
        <div className="flex h-16 shrink-0 items-center border-b px-4">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <Image src="/favicon.webp" alt="" width={20} height={20} className="h-5 w-5" />
            visicheck.ai
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <LayoutDashboard className="h-4 w-4" />
            {t("dashboard")}
          </Link>
          <Link
            href="/dashboard/visibility"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Eye className="h-4 w-4" />
            {t("visibility")}
          </Link>
          <div className="mt-4 space-y-1">
            <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sectionData")}
            </p>
            {dataItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-6 space-y-1">
            <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sectionTodo")}
            </p>
            {todoItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-6 space-y-1">
            <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("sectionSettings")}
            </p>
            {settingsItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
          {adminItems.length > 0 && (
            <div className="mt-6 space-y-1">
              <p className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("sectionAdmin")}
              </p>
              {adminItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </nav>
        <div className="shrink-0 space-y-2 border-t p-2 px-3 pt-3">
          <SidebarPlanInfo />
          <LanguageSwitcher />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        {session.user.impersonating && session.user.impersonatingTeamName && (
          <ImpersonationBanner teamName={session.user.impersonatingTeamName} />
        )}
        <header className="flex h-14 items-center gap-3 border-b px-4 md:h-16 md:justify-end md:px-6">
          <DashboardMobileNav
            mainItems={mobileMainItems}
            sections={mobileSections}
          />
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold md:hidden"
          >
            <Image src="/favicon.webp" alt="" width={20} height={20} className="h-5 w-5" />
            <span className="text-sm">visicheck.ai</span>
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <OnboardingModal />
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {t("welcome", { name: session.user.name ?? "" })}
            </span>
            <UserMenu
              name={session.user.name}
              email={session.user.email}
              image={session.user.image}
              role={session.user.role}
            />
          </div>
        </header>
        <AccessGate access={access}>
          <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
            <div className="mx-auto max-w-6xl px-4 py-4 md:py-8 has-[.full-bleed]:max-w-none">
              {children}
            </div>
          </main>
        </AccessGate>
      </div>
    </div>
    </Providers>
  );
}
