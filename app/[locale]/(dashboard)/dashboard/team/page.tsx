"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserPlus, Trash2, Mail, Clock, CheckCircle2 } from "lucide-react";

type Member = {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  userName: string | null;
  userEmail: string | null;
  userImage: string | null;
};

type Invitation = {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
};

type TeamInfo = {
  teamId: string;
  teamName: string;
  role: string;
};

export default function TeamPage() {
  const t = useTranslations("Team");
  const tc = useTranslations("Common");

  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"member" | "owner">("member");
  const [sending, setSending] = useState(false);
  const [successEmail, setSuccessEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isOwner = team?.role === "owner" || team?.role === "super_admin";

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [teamRes, membersRes, invitesRes] = await Promise.all([
        fetch("/api/team"),
        fetch("/api/team/members"),
        fetch("/api/team/invite"),
      ]);

      if (teamRes.ok) setTeam(await teamRes.json());
      if (membersRes.ok) setMembers(await membersRes.json());
      if (invitesRes.ok) setInvitations(await invitesRes.json());
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setSending(true);
    setError(null);
    setSuccessEmail(null);

    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
      });

      if (res.ok) {
        setSuccessEmail(inviteEmail.trim());
        setInviteEmail("");
        setInviteRole("member");
        // Reload invitations
        const invitesRes = await fetch("/api/team/invite");
        if (invitesRes.ok) setInvitations(await invitesRes.json());
      } else {
        const data = await res.json();
        setError(data.error || t("inviteError"));
      }
    } catch {
      setError(t("inviteError"));
    } finally {
      setSending(false);
    }
  }

  async function handleRevoke(invitationId: string) {
    try {
      const res = await fetch(`/api/team/invite?id=${invitationId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
      } else {
        setError(t("revokeError"));
      }
    } catch {
      setError(t("revokeError"));
    }
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm(t("confirmRemove"))) return;

    try {
      const res = await fetch(`/api/team/members?memberId=${memberId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setMembers((prev) => prev.filter((m) => m.id !== memberId));
      } else {
        const data = await res.json();
        setError(data.error || t("removeError"));
      }
    } catch {
      setError(t("removeError"));
    }
  }

  function roleLabel(role: string) {
    if (role === "owner") return t("owner");
    if (role === "super_admin") return t("superAdmin");
    return t("member");
  }

  function roleBadgeVariant(role: string) {
    if (role === "owner") return "default" as const;
    if (role === "super_admin") return "destructive" as const;
    return "secondary" as const;
  }

  function getInitials(name: string | null, email: string | null) {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.[0]?.toUpperCase() ?? "U";
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 border-gray-300 border-t-black rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      {/* Invite Form (only for owners) */}
      {isOwner && (
        <div className="rounded-lg border p-6 space-y-4">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              {t("inviteTitle")}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t("inviteDescription")}
            </p>
          </div>

          <form onSubmit={handleInvite} className="flex items-end gap-3">
            <div className="flex-1 space-y-2">
              <Label htmlFor="invite-email">{t("emailLabel")}</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder={t("emailPlaceholder")}
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                required
              />
            </div>
            <div className="w-40 space-y-2">
              <Label>{t("roleLabel")}</Label>
              <Select
                value={inviteRole}
                onValueChange={(v) => setInviteRole(v as "member" | "owner")}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">{t("member")}</SelectItem>
                  <SelectItem value="owner">{t("owner")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={sending}>
              <Mail className="h-4 w-4 mr-2" />
              {sending ? tc("sending") : t("sendInvite")}
            </Button>
          </form>

          {/* Success message */}
          {successEmail && (
            <div className="flex items-center gap-2 rounded-md bg-green-50 border border-green-200 p-3 text-sm text-green-800">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>
                {t("inviteSentDesc", { email: successEmail })}
              </span>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
              {error}
            </div>
          )}
        </div>
      )}

      {/* Non-owners info */}
      {!isOwner && (
        <div className="rounded-md bg-muted/50 border p-4 text-sm text-muted-foreground">
          {t("ownerOnly")}
        </div>
      )}

      {/* Members Table */}
      <div>
        <h2 className="text-lg font-semibold mb-3">{t("members")}</h2>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{tc("name")}</TableHead>
                <TableHead>{t("role")}</TableHead>
                <TableHead>{t("joinedAt")}</TableHead>
                {isOwner && (
                  <TableHead className="w-[80px]">{tc("actions")}</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isOwner ? 4 : 3}
                    className="text-center text-muted-foreground py-8"
                  >
                    {t("noMembers")}
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => {
                  const isSelf = team?.teamId && member.userId === team?.teamId;
                  return (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            {member.userImage && (
                              <AvatarImage
                                src={member.userImage}
                                alt={member.userName ?? ""}
                              />
                            )}
                            <AvatarFallback className="text-xs">
                              {getInitials(member.userName, member.userEmail)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {member.userName ?? "–"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {member.userEmail}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant(member.role)}>
                          {roleLabel(member.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {member.joinedAt ? formatDate(member.joinedAt) : "–"}
                      </TableCell>
                      {isOwner && (
                        <TableCell>
                          {!isSelf && member.role !== "owner" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleRemoveMember(member.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pending Invitations (only for owners) */}
      {isOwner && (
        <div>
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t("pendingInvites")}
          </h2>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("emailLabel")}</TableHead>
                  <TableHead>{t("role")}</TableHead>
                  <TableHead>{t("expiresAt")}</TableHead>
                  <TableHead className="w-[80px]">{tc("actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground py-8"
                    >
                      {t("noPendingInvites")}
                    </TableCell>
                  </TableRow>
                ) : (
                  invitations.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell className="font-medium">
                        {invite.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant(invite.role)}>
                          {roleLabel(invite.role)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(invite.expiresAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive text-xs"
                          onClick={() => handleRevoke(invite.id)}
                        >
                          {t("revokeInvite")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
