import { getTranslations } from "next-intl/server";
import { BillingPage } from "@/components/billing-page";

export default async function BillingRoute() {
  const t = await getTranslations("Billing");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <BillingPage />
    </div>
  );
}
