"use client";

import dynamic from "next/dynamic";

const CookieBanner = dynamic(
  () => import("@/components/cookie-banner").then((mod) => mod.CookieBanner),
  { ssr: false }
);

export function LazyCookieBanner() {
  return <CookieBanner />;
}
