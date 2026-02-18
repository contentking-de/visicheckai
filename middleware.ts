import createIntlMiddleware from "next-intl/middleware";
import { auth } from "@/lib/auth";
import { routing } from "@/i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

function stripLocalePrefix(pathname: string): {
  locale: string | null;
  pathWithoutLocale: string;
} {
  for (const locale of routing.locales) {
    if (pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)) {
      return {
        locale,
        pathWithoutLocale: pathname.slice(`/${locale}`.length) || "/",
      };
    }
  }
  return { locale: null, pathWithoutLocale: pathname };
}

const PUBLIC_PATHS = [
  "/",
  "/login",
  "/sign-up",
  "/invite/",
  "/impressum",
  "/datenschutz",
  "/agb",
  "/ueber-uns",
  "/magazin",
];

function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some(
    (p) => path === p || (p.endsWith("/") ? path.startsWith(p) : path.startsWith(p + "/")),
  );
}

function buildLocalePath(path: string, locale: string): string {
  if (locale === routing.defaultLocale) return path;
  return `/${locale}${path}`;
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api")) {
    return;
  }

  const { locale: pathLocale, pathWithoutLocale } = stripLocalePrefix(pathname);

  const effectiveLocale = pathLocale || routing.defaultLocale;
  const effectivePath = pathLocale ? pathWithoutLocale : pathname;

  const isLoggedIn = !!req.auth;
  const isAuthPage =
    effectivePath.startsWith("/login") ||
    effectivePath.startsWith("/sign-up");

  if (isAuthPage && isLoggedIn) {
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
    const target = callbackUrl || buildLocalePath("/dashboard", effectiveLocale);
    return Response.redirect(new URL(target, req.url));
  }

  if (!isPublicPath(effectivePath) && !isLoggedIn) {
    return Response.redirect(new URL(buildLocalePath("/login", effectiveLocale), req.url));
  }

  return intlMiddleware(req);
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon\\..*|.*\\.svg|.*\\.webp).*)",
  ],
};
