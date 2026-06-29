import { NextResponse } from "next/server";

const TOKEN_COOKIE = "lms_token";
const USER_COOKIE  = "lms_user";

const PUBLIC_PATHS = ["/login", "/register"];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  const tokenCookie = request.cookies.get(TOKEN_COOKIE);
  const userCookie  = request.cookies.get(USER_COOKIE);

  let user = null;
  if (userCookie?.value) {
    try {
      user = JSON.parse(decodeURIComponent(userCookie.value));
    } catch {
      // Invalid cookie — treat as unauthenticated
    }
  }

  // Both cookies must be present (token can expire while user cookie is still valid)
  const isAuthenticated = !!tokenCookie?.value && !!user;
  const isAdmin   = user?.role === "admin";
  const isTrainer = user?.role === "trainer";

  // ── Public paths ──
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    if (isAuthenticated) {
      let dest = "/dashboard";
      if (isAdmin)   dest = "/admin/dashboard";
      if (isTrainer) dest = "/trainer/dashboard";
      return NextResponse.redirect(new URL(dest, request.url));
    }
    return NextResponse.next();
  }

  // ── Protected paths — require auth ──
  if (!isAuthenticated) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete(TOKEN_COOKIE);
    response.cookies.delete(USER_COOKIE);
    return response;
  }

  // ── Role-based route protection ──

  if (isAdmin && !pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/admin/dashboard", request.url));
  }

  if (isTrainer && !pathname.startsWith("/trainer")) {
    return NextResponse.redirect(new URL("/trainer/dashboard", request.url));
  }

  if (!isAdmin && !isTrainer && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isAdmin && !isTrainer && pathname.startsWith("/trainer")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
