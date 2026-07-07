import { NextResponse } from "next/server";

const TOKEN_COOKIE = "lms_token";
const USER_COOKIE  = "lms_user";

// Reachable without auth.
const PUBLIC_PATHS = ["/login", "/register", "/forgot-password", "/reset-password", "/set-password"];
// Of those, only these bounce an already-authenticated user to their portal.
// Password-flow pages stay reachable even with a stale session (email-link clicks).
const AUTH_REDIRECT_PATHS = ["/login", "/register"];

// Default landing portal per role (API.md §4.4: route by role).
const PORTAL_HOME = {
  admin:   "/admin/dashboard",
  trainer: "/trainer/dashboard",
  sponsor: "/sponsor/dashboard",
  learner: "/dashboard",
};

// Path prefixes each role is confined to. Roles not listed (learner) own the
// remaining authenticated routes (dashboard, my-courses, …).
const ROLE_PREFIX = {
  admin:   "/admin",
  trainer: "/trainer",
  sponsor: "/sponsor",
};

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
  const role = user?.role;
  const home = PORTAL_HOME[role] ?? "/dashboard";

  // ── Public paths ──
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    // Only send authenticated users away from login/register — never from the
    // password-setup/reset pages (they may be following an email link).
    if (isAuthenticated && AUTH_REDIRECT_PATHS.some((path) => pathname.startsWith(path))) {
      return NextResponse.redirect(new URL(home, request.url));
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
  // A role with a dedicated prefix may only browse under that prefix.
  const myPrefix = ROLE_PREFIX[role];

  if (myPrefix) {
    // admin / trainer / sponsor: keep them inside their own portal.
    if (!pathname.startsWith(myPrefix)) {
      return NextResponse.redirect(new URL(home, request.url));
    }
  } else {
    // learner: block access to any other role's prefixed portal.
    const ownsPrefixedPortal = Object.values(ROLE_PREFIX).some((prefix) =>
      pathname.startsWith(prefix)
    );
    if (ownsPrefixedPortal) {
      return NextResponse.redirect(new URL(home, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
