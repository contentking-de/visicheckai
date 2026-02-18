import { getLocale } from "next-intl/server";
import { defaultLocale } from "@/i18n/config";

export async function getLocalePrefix(): Promise<string> {
  const locale = await getLocale();
  return locale === defaultLocale ? "" : `/${locale}`;
}
