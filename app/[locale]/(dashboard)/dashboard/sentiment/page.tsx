import { getTranslations } from "next-intl/server";
import { SentimentCharts } from "@/components/sentiment-charts";

export default async function SentimentPage() {
  const t = await getTranslations("Sentiment");

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>
      <SentimentCharts />
    </div>
  );
}
