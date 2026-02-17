import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const path = req.nextUrl.pathname;
  const isAuthPage =
    path.startsWith("/login") || path.startsWith("/sign-up");

  if (isAuthPage && isLoggedIn) {
    // Respect callbackUrl if present (e.g. from invite flow)
    const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
    const target = callbackUrl || "/dashboard";
    return Response.redirect(new URL(target, req.url));
  }

  const isPublic =
    path === "/" ||
    path.startsWith("/login") ||
    path.startsWith("/sign-up") ||
    path.startsWith("/invite/") ||
    path.startsWith("/impressum") ||
    path.startsWith("/datenschutz") ||
    path.startsWith("/agb") ||
    path.startsWith("/ueber-uns") ||
    path.startsWith("/magazin");

  if (!isPublic && !isLoggedIn && !path.startsWith("/api")) {
    return Response.redirect(new URL("/login", req.url));
  }

  return;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\..*|.*\\.svg|.*\\.webp).*)"],
};
