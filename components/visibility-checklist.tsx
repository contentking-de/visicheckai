"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Check, ChevronDown, Loader2, MessageSquare, UserPlus, X } from "lucide-react";
import type { ChecklistCategory } from "@/lib/checklist-data";

type Domain = { id: string; name: string; domainUrl: string };
type TeamMember = { userId: string; name: string; image: string | null };

type ItemData = {
  checked: boolean;
  notes: string | null;
  assigneeId: string | null;
};

type Props = {
  domains: Domain[];
  categories: ChecklistCategory[];
  totalItems: number;
  teamMembers: TeamMember[];
};

export function VisibilityChecklist({
  domains,
  categories,
  totalItems,
  teamMembers,
}: Props) {
  const t = useTranslations("Checklist");
  const [selectedDomainId, setSelectedDomainId] = useState<string>(
    domains[0]?.id ?? ""
  );
  const [itemData, setItemData] = useState<Record<string, ItemData>>({});
  const [loading, setLoading] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const [draftAssignees, setDraftAssignees] = useState<Record<string, string | null>>({});
  const [savingItems, setSavingItems] = useState<Set<string>>(new Set());
  const [savedItems, setSavedItems] = useState<Set<string>>(new Set());

  const fetchChecklist = useCallback(async (domainId: string) => {
    if (!domainId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/checklist?domainId=${domainId}`);
      if (res.ok) {
        const data = await res.json();
        setItemData(data.items ?? {});
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedDomainId) {
      setExpandedNotes(new Set());
      fetchChecklist(selectedDomainId);
    }
  }, [selectedDomainId, fetchChecklist]);

  const saveItem = async (
    itemKey: string,
    updates: Partial<{ checked: boolean; notes: string; assigneeId: string | null }>
  ) => {
    try {
      const res = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domainId: selectedDomainId, itemKey, ...updates }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("[Checklist] Save failed:", res.status, err);
      }
    } catch (err) {
      console.error("[Checklist] Network error:", err);
    }
  };

  const toggleItem = async (itemKey: string, checked: boolean) => {
    setItemData((prev) => ({
      ...prev,
      [itemKey]: { ...prev[itemKey], checked, notes: prev[itemKey]?.notes ?? null, assigneeId: prev[itemKey]?.assigneeId ?? null },
    }));
    await saveItem(itemKey, { checked });
  };

  const setDraftNote = (itemKey: string, notes: string) => {
    setDraftNotes((prev) => ({ ...prev, [itemKey]: notes }));
    setSavedItems((prev) => { const n = new Set(prev); n.delete(itemKey); return n; });
  };

  const setDraftAssignee = (itemKey: string, assigneeId: string | null) => {
    setDraftAssignees((prev) => ({ ...prev, [itemKey]: assigneeId }));
    setSavedItems((prev) => { const n = new Set(prev); n.delete(itemKey); return n; });
  };

  const saveDetails = async (itemKey: string) => {
    const data = getItem(itemKey);
    const notes = draftNotes[itemKey] ?? data.notes ?? "";
    const assigneeId = itemKey in draftAssignees ? draftAssignees[itemKey] : data.assigneeId;

    setSavingItems((prev) => new Set(prev).add(itemKey));
    await saveItem(itemKey, { notes, assigneeId });

    setItemData((prev) => ({
      ...prev,
      [itemKey]: { ...prev[itemKey], checked: prev[itemKey]?.checked ?? false, notes, assigneeId: assigneeId ?? null },
    }));
    setDraftNotes((prev) => { const n = { ...prev }; delete n[itemKey]; return n; });
    setDraftAssignees((prev) => { const n = { ...prev }; delete n[itemKey]; return n; });
    setSavingItems((prev) => { const n = new Set(prev); n.delete(itemKey); return n; });
    setSavedItems((prev) => new Set(prev).add(itemKey));
    setTimeout(() => setSavedItems((prev) => { const n = new Set(prev); n.delete(itemKey); return n; }), 2000);
  };

  const hasDraftChanges = (itemKey: string): boolean => {
    const data = getItem(itemKey);
    const notesChanged = itemKey in draftNotes && draftNotes[itemKey] !== (data.notes ?? "");
    const assigneeChanged = itemKey in draftAssignees && draftAssignees[itemKey] !== data.assigneeId;
    return notesChanged || assigneeChanged;
  };

  const toggleNotes = (itemKey: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(itemKey)) next.delete(itemKey);
      else next.add(itemKey);
      return next;
    });
  };

  const getItem = (key: string): ItemData =>
    itemData[key] ?? { checked: false, notes: null, assigneeId: null };

  const checkedCount = Object.values(itemData).filter((d) => d.checked).length;
  const progressPercent =
    totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  const getCategoryProgress = (cat: ChecklistCategory) => {
    const done = cat.items.filter((item) => getItem(item.key).checked).length;
    return { done, total: cat.items.length };
  };

  const getMember = (id: string | null) =>
    teamMembers.find((m) => m.userId === id);

  if (domains.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          {t("noDomains")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Select value={selectedDomainId} onValueChange={setSelectedDomainId}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder={t("selectDomain")} />
          </SelectTrigger>
          <SelectContent>
            {domains.map((d) => (
              <SelectItem key={d.id} value={d.id}>
                {d.name} ({d.domainUrl})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-3">
          <div className="text-sm text-muted-foreground">
            {checkedCount} / {totalItems} {t("completed")}
          </div>
          <Badge
            variant={progressPercent === 100 ? "default" : "secondary"}
            className="tabular-nums"
          >
            {progressPercent}%
          </Badge>
        </div>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {t("loading")}
          </CardContent>
        </Card>
      ) : (
        <Accordion
          type="multiple"
          defaultValue={[categories[0]?.id]}
          className="space-y-3"
        >
          {categories.map((cat) => {
            const { done, total } = getCategoryProgress(cat);
            const catPercent =
              total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <AccordionItem
                key={cat.id}
                value={cat.id}
                className="rounded-lg border bg-card px-4"
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-1 items-center gap-3">
                    <span className="font-semibold">{t(cat.titleKey)}</span>
                    <Badge
                      variant={catPercent === 100 ? "default" : "outline"}
                      className="ml-auto mr-2 tabular-nums text-xs"
                    >
                      {done}/{total}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  {cat.descriptionKey && (
                    <p className="mb-4 text-sm text-muted-foreground">
                      {t(cat.descriptionKey)}
                    </p>
                  )}
                  <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${catPercent}%` }}
                    />
                  </div>
                  <div className="space-y-1">
                    {cat.items.map((item) => {
                      const data = getItem(item.key);
                      const isExpanded = expandedNotes.has(item.key);
                      const assignee = getMember(data.assigneeId);
                      const hasNotes = !!data.notes;

                      return (
                        <div
                          key={item.key}
                          className="rounded-md border border-transparent transition-colors hover:border-border"
                        >
                          {/* Main row */}
                          <div className="flex items-center gap-3 px-2 py-2">
                            <Checkbox
                              checked={data.checked}
                              onCheckedChange={(val) =>
                                toggleItem(item.key, val === true)
                              }
                              className="shrink-0"
                            />
                            <span
                              className={`flex-1 text-sm leading-relaxed ${
                                data.checked
                                  ? "text-muted-foreground line-through"
                                  : ""
                              }`}
                            >
                              {t(item.labelKey)}
                            </span>

                            {/* Assignee avatar (compact) */}
                            {assignee && (
                              <Avatar className="h-5 w-5">
                                <AvatarImage src={assignee.image ?? undefined} />
                                <AvatarFallback className="text-[10px]">
                                  {assignee.name.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            )}

                            {/* Notes indicator + toggle */}
                            <button
                              type="button"
                              onClick={() => toggleNotes(item.key)}
                              className={`flex shrink-0 items-center gap-1 rounded p-1 text-xs transition-colors hover:bg-muted ${
                                isExpanded
                                  ? "text-primary"
                                  : hasNotes
                                    ? "text-primary/70"
                                    : "text-muted-foreground"
                              }`}
                              title={t("notesToggle")}
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              <ChevronDown
                                className={`h-3 w-3 transition-transform ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              />
                            </button>
                          </div>

                          {/* Expanded details */}
                          {isExpanded && (
                            <div className="border-t bg-muted/20 px-3 py-3 space-y-3">
                              {/* Assignee selector */}
                              <div className="flex items-center gap-2">
                                <UserPlus className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                                  {t("assignee")}:
                                </span>
                                <Select
                                  value={
                                    (item.key in draftAssignees
                                      ? draftAssignees[item.key]
                                      : data.assigneeId) ?? "__none__"
                                  }
                                  onValueChange={(val) =>
                                    setDraftAssignee(
                                      item.key,
                                      val === "__none__" ? null : val
                                    )
                                  }
                                >
                                  <SelectTrigger className="h-7 w-full max-w-52 text-xs">
                                    <SelectValue
                                      placeholder={t("unassigned")}
                                    />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__none__">
                                      {t("unassigned")}
                                    </SelectItem>
                                    {teamMembers.map((m) => (
                                      <SelectItem
                                        key={m.userId}
                                        value={m.userId}
                                      >
                                        {m.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                {(item.key in draftAssignees
                                  ? draftAssignees[item.key]
                                  : data.assigneeId) && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() =>
                                      setDraftAssignee(item.key, null)
                                    }
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>

                              {/* Notes textarea */}
                              <Textarea
                                placeholder={t("notesPlaceholder")}
                                value={
                                  item.key in draftNotes
                                    ? draftNotes[item.key]
                                    : data.notes ?? ""
                                }
                                onChange={(e) =>
                                  setDraftNote(item.key, e.target.value)
                                }
                                className="min-h-20 text-sm"
                              />

                              {/* Save button */}
                              <div className="flex items-center justify-end gap-2">
                                {savedItems.has(item.key) && (
                                  <span className="flex items-center gap-1 text-xs text-green-600">
                                    <Check className="h-3 w-3" />
                                    {t("saved")}
                                  </span>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => saveDetails(item.key)}
                                  disabled={
                                    savingItems.has(item.key) ||
                                    !hasDraftChanges(item.key)
                                  }
                                >
                                  {savingItems.has(item.key) ? (
                                    <>
                                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                      {t("saving")}
                                    </>
                                  ) : (
                                    t("saveDetails")
                                  )}
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
