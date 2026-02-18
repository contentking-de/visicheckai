import { getLocale } from "next-intl/server";
import { defaultLocale, locales, type Locale } from "@/i18n/config";

export async function getLocalePrefix(): Promise<string> {
  const locale = await getLocale();
  return locale === defaultLocale ? "" : `/${locale}`;
}

export function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL)
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

/**
 * Build a hreflang alternates map for a given path per locale.
 * `slugsByLocale` overrides the path segment per locale (for translated slugs).
 */
export function buildHreflangAlternates(
  path: string,
  slugsByLocale?: Partial<Record<Locale, string>>
): Record<string, string> {
  const base = getBaseUrl().replace(/\/$/, "");
  const alternates: Record<string, string> = {};

  for (const locale of locales) {
    const localeSlug = slugsByLocale?.[locale];
    const localePath = localeSlug ? path.replace(/\/[^/]+$/, `/${localeSlug}`) : path;
    const prefix = locale === defaultLocale ? "" : `/${locale}`;
    alternates[locale] = `${base}${prefix}${localePath}`;
  }

  alternates["x-default"] = alternates[defaultLocale];
  return alternates;
}
