import { auth } from "@/lib/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage =
    req.nextUrl.pathname.startsWith("/login") ||
    req.nextUrl.pathname === "/login";

  if (isAuthPage && isLoggedIn) {
    return Response.redirect(new URL("/dashboard", req.url));
  }

  const path = req.nextUrl.pathname;
  const isPublic =
    path === "/" ||
    path === "/login" ||
    path.startsWith("/login/");

  if (!isPublic && !isLoggedIn && !path.startsWith("/api")) {
    return Response.redirect(new URL("/login", req.url));
  }

  return;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
