export const COUNTRIES = [
  "DE", "CH", "AT", "UK", "US", "ES", "FR", "NL",
] as const;

export type Country = (typeof COUNTRIES)[number];

export const DEFAULT_COUNTRY: Country = "DE";

export const COUNTRY_LABELS: Record<Country, { de: string; en: string; fr: string; es: string }> = {
  DE: { de: "Deutschland", en: "Germany", fr: "Allemagne", es: "Alemania" },
  CH: { de: "Schweiz", en: "Switzerland", fr: "Suisse", es: "Suiza" },
  AT: { de: "Österreich", en: "Austria", fr: "Autriche", es: "Austria" },
  UK: { de: "Großbritannien", en: "United Kingdom", fr: "Royaume-Uni", es: "Reino Unido" },
  US: { de: "USA", en: "USA", fr: "États-Unis", es: "EE. UU." },
  ES: { de: "Spanien", en: "Spain", fr: "Espagne", es: "España" },
  FR: { de: "Frankreich", en: "France", fr: "France", es: "Francia" },
  NL: { de: "Niederlande", en: "Netherlands", fr: "Pays-Bas", es: "Países Bajos" },
};

export function isValidCountry(value: unknown): value is Country {
  return typeof value === "string" && COUNTRIES.includes(value as Country);
}

/**
 * Returns the proxy URL for a given country from environment variables.
 * Env var pattern: PROXY_URL_DE, PROXY_URL_CH, etc.
 * Returns undefined if no proxy is configured (e.g. for the default country).
 */
export function getProxyUrl(country: Country): string | undefined {
  return process.env[`PROXY_URL_${country}`] || undefined;
}
