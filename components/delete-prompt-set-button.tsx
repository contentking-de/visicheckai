"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeletePromptSetButton({ promptSetId }: { promptSetId: string }) {
  const router = useRouter();
  const t = useTranslations("PromptSets");

  const handleDelete = async () => {
    if (!confirm(t("confirmDelete"))) return;
    const res = await fetch(`/api/prompt-sets/${promptSetId}`, {
      method: "DELETE",
    });
    if (res.ok) router.refresh();
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleDelete}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}
