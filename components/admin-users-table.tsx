"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  ChevronDown,
  ChevronRight,
  Globe,
  Users,
  Crown,
  Shield,
  User,
  Loader2,
  FileText,
  MessageSquare,
  Eye,
} from "lucide-react";

type Member = {
  userId: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  joinedAt: string | null;
};

type Domain = {
  id: string;
  name: string;
  domainUrl: string;
};

type PromptSet = {
  id: string;
  name: string;
  promptCount: number;
};

type Team = {
  id: string;
  name: string;
  createdAt: string | null;
  domainCount: number;
  subscription: { plan: string; status: string } | null;
  members: Member[];
  domains: Domain[];
  promptSets: PromptSet[];
};

export function AdminUsersTable() {
  const t = useTranslations("AdminUsers");
  const router = useRouter();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => setTeams(data.teams ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  function toggle(teamId: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(teamId)) next.delete(teamId);
      else next.add(teamId);
      return next;
    });
  }

  const totalMembers = teams.reduce((sum, t) => sum + t.members.length, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <p className="py-10 text-center text-muted-foreground">{t("loadError")}</p>
    );
  }

  async function impersonate(teamId: string) {
    await fetch("/api/admin/impersonate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId }),
    });
    router.push("/dashboard");
    router.refresh();
  }

  function roleIcon(role: string) {
    if (role === "super_admin") return <Shield className="h-3.5 w-3.5 text-red-500" />;
    if (role === "owner") return <Crown className="h-3.5 w-3.5 text-amber-500" />;
    return <User className="h-3.5 w-3.5 text-muted-foreground" />;
  }

  function planBadge(sub: Team["subscription"]) {
    if (!sub) return <span className="text-xs text-muted-foreground">{t("noPlan")}</span>;
    const colors: Record<string, string> = {
      starter: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      team: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
      professional: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    };
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${colors[sub.plan] ?? "bg-muted text-muted-foreground"}`}>
        {sub.plan}
      </span>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-6 text-sm text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <Users className="h-4 w-4" />
          {t("totalTeams", { count: teams.length })}
        </span>
        <span className="flex items-center gap-1.5">
          <User className="h-4 w-4" />
          {t("totalUsers", { count: totalMembers })}
        </span>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">{t("team")}</th>
              <th className="px-4 py-3 text-left font-medium">{t("plan")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("members")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("domains")}</th>
              <th className="px-4 py-3 text-right font-medium">{t("created")}</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => {
              const isOpen = expanded.has(team.id);
              return (
                <TeamRow
                  key={team.id}
                  team={team}
                  isOpen={isOpen}
                  onToggle={() => toggle(team.id)}
                  onImpersonate={() => impersonate(team.id)}
                  roleIcon={roleIcon}
                  planBadge={planBadge}
                  t={t}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TeamRow({
  team,
  isOpen,
  onToggle,
  onImpersonate,
  roleIcon,
  planBadge,
  t,
}: {
  team: Team;
  isOpen: boolean;
  onToggle: () => void;
  onImpersonate: () => void;
  roleIcon: (role: string) => React.ReactNode;
  planBadge: (sub: { plan: string; status: string } | null) => React.ReactNode;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <>
      <tr
        className="cursor-pointer border-b transition-colors hover:bg-muted/30"
        onClick={onToggle}
      >
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="font-medium">{team.name}</span>
          </div>
        </td>
        <td className="px-4 py-3">{planBadge(team.subscription)}</td>
        <td className="px-4 py-3 text-right">{team.members.length}</td>
        <td className="px-4 py-3 text-right">
          <span className="inline-flex items-center gap-1">
            <Globe className="h-3 w-3 text-muted-foreground" />
            {team.domainCount}
          </span>
        </td>
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-3">
            <span className="text-muted-foreground">
              {team.createdAt
                ? new Date(team.createdAt).toLocaleDateString("de-DE", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                : "–"}
            </span>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 gap-1 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onImpersonate();
              }}
              title={t("impersonate")}
            >
              <Eye className="h-3.5 w-3.5" />
              {t("impersonate")}
            </Button>
          </div>
        </td>
      </tr>
      {isOpen && (
        <tr className="border-b bg-muted/10">
          <td colSpan={5} className="px-4 py-4">
            <div className="ml-6 grid gap-6 md:grid-cols-3">
              {/* Members */}
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Users className="h-3.5 w-3.5" />
                  {t("members")} ({team.members.length})
                </h4>
                <div className="space-y-2">
                  {team.members.map((member) => (
                    <div key={member.userId} className="flex items-center gap-2.5">
                      {member.image ? (
                        <img src={member.image} alt="" className="h-6 w-6 rounded-full" />
                      ) : (
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground">
                          {(member.name ?? member.email ?? "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium">
                            {member.name ?? t("unnamed")}
                          </span>
                          {roleIcon(member.role)}
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Domains */}
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Globe className="h-3.5 w-3.5" />
                  {t("domains")} ({team.domains.length})
                </h4>
                {team.domains.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t("noDomains")}</p>
                ) : (
                  <div className="space-y-1.5">
                    {team.domains.map((domain) => (
                      <div key={domain.id} className="rounded-md border bg-background px-3 py-1.5">
                        <p className="text-sm font-medium">{domain.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{domain.domainUrl}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Prompt-Sets */}
              <div>
                <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <FileText className="h-3.5 w-3.5" />
                  {t("promptSets")} ({team.promptSets.length})
                </h4>
                {team.promptSets.length === 0 ? (
                  <p className="text-xs text-muted-foreground">{t("noPromptSets")}</p>
                ) : (
                  <div className="space-y-1.5">
                    {team.promptSets.map((ps) => (
                      <div key={ps.id} className="flex items-center justify-between rounded-md border bg-background px-3 py-1.5">
                        <p className="truncate text-sm font-medium">{ps.name}</p>
                        <span className="ml-2 flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                          <MessageSquare className="h-3 w-3" />
                          {ps.promptCount}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
