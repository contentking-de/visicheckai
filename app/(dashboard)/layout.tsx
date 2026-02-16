import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/sign-out-button";
import {
  LayoutDashboard,
  Globe,
  FileText,
  BarChart3,
  Settings,
  LogOut,
} from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/domains", label: "Domains", icon: Globe },
    { href: "/dashboard/prompt-sets", label: "Prompt-Sets", icon: FileText },
    { href: "/dashboard/configs", label: "Konfiguration", icon: Settings },
    { href: "/dashboard/runs", label: "Runs", icon: BarChart3 },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col border-r bg-muted/30">
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/dashboard" className="font-semibold">
            Visicheck
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
        <div className="mt-auto border-t p-2">
          <SignOutButton />
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto max-w-6xl px-4 py-8">{children}</div>
      </main>
    </div>
  );
}
