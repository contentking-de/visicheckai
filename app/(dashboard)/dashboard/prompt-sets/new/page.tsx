import { PromptSetForm } from "@/components/prompt-set-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function NewPromptSetPage() {
  const t = await getTranslations("PromptSets");
  const tc = await getTranslations("Common");

  return (
    <div className="space-y-8">
      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard/prompt-sets" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            {tc("back")}
          </Link>
        </Button>
        <h1 className="mt-4 text-2xl font-bold">{t("newTitle")}</h1>
        <p className="text-muted-foreground">
          {t("newDescription")}
        </p>
      </div>
      <PromptSetForm />
    </div>
  );
}
