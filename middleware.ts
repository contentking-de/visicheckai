import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const path = req.nextUrl.pathname;
  const isAuthPage =
    path.startsWith("/login") || path.startsWith("/sign-up");

  if (isAuthPage && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", req.url));
  }

  const isPublic =
    path === "/" ||
    path.startsWith("/login") ||
    path.startsWith("/sign-up");

  if (!isPublic && !isLoggedIn && !path.startsWith("/api")) {
    return Response.redirect(new URL("/login", req.url));
  }

  return;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
