import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function VerifyPage() {
  const t = await getTranslations("Auth");

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
          <Mail className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">{t("verifyTitle")}</h1>
          <p className="mt-2 text-muted-foreground">
            {t("verifyDescription")}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {t("verifyNotReceived")}{" "}
          <Link href="/login" className="font-medium text-primary underline">
            {t("verifyRetry")}
          </Link>
          .
        </p>
        <Button asChild variant="outline">
          <Link href="/login">{t("useOtherEmail")}</Link>
        </Button>
      </div>
    </div>
  );
}
