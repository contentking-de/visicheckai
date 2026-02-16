"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

export function DeleteDomainButton({ domainId }: { domainId: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Domain wirklich löschen?")) return;
    const res = await fetch(`/api/domains/${domainId}`, { method: "DELETE" });
    if (res.ok) router.refresh();
  };

  return (
    <Button variant="ghost" size="icon" onClick={handleDelete}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  );
}
