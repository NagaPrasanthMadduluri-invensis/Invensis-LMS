import { apiClient } from "@/lib/api-client";

const TOKEN_COOKIE = "lms_token";
const USER_COOKIE  = "lms_user";
const TOKEN_MAX_AGE = 60 * 15;          // 15 min — matches server ACCESS_TOKEN_TTL
const USER_MAX_AGE  = 60 * 60 * 24 * 7; // 7 days

/* ──────────────────────────────────────
   API CALLS
   ────────────────────────────────────── */

/**
 * POST /auth/login
 * credentials: "include" is handled by api-client (sends/receives the refresh cookie)
 * Returns { user, accessToken }
 */
export async function loginUser({ email, password }) {
  return apiClient("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

/**
 * POST /auth/refresh
 * Browser auto-sends the httpOnly refresh_token cookie.
 * Returns { user, accessToken } — refresh cookie rotates automatically.
 */
export async function refreshSession() {
  return apiClient("/auth/refresh", { method: "POST" });
}

/**
 * POST /auth/logout
 * Browser auto-sends the refresh_token cookie; server revokes it.
 * Always resolves (server returns 204 even for invalid tokens).
 */
export async function logoutUser() {
  try {
    await apiClient("/auth/logout", { method: "POST" });
  } catch {
    // Swallow errors — we clear local state regardless
  }
}

/**
 * GET /auth/me
 * Returns { user }
 */
export async function getCurrentUser(token) {
  return apiClient("/auth/me", { token });
}

/* ──────────────────────────────────────
   USER NORMALIZATION
   ────────────────────────────────────── */

/**
 * Normalize the API user object into a consistent app shape.
 * API shape: { id, name, email, role, isActive }
 */
export function normalizeUser(apiUser) {
  const name = apiUser.name || "";
  const parts = name.trim().split(/\s+/);
  const initials = parts
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");

  return {
    id: apiUser.id,
    name,
    email: apiUser.email,
    role: apiUser.role,   // string: "admin" | "learner" | "trainer" | "sponsor"
    isActive: apiUser.isActive,
    initials: initials || "U",
  };
}

/* ──────────────────────────────────────
   USER COOKIE HELPERS
   Used to persist the user object across page refreshes for SSR layout checks.
   The access token is NOT stored in cookies — it lives in React state only.
   ────────────────────────────────────── */

/* ──────────────────────────────────────
   TOKEN COOKIE HELPERS
   Access token stored client-side with short TTL (matches server's 15 min lifetime).
   Avoids cross-origin SameSite=Lax issues with the httpOnly refresh cookie.
   ────────────────────────────────────── */

export function setTokenCookie(token) {
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${TOKEN_MAX_AGE}; SameSite=Lax`;
}

export function getTokenFromCookie() {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${TOKEN_COOKIE}=`));
  if (!match) return null;
  return decodeURIComponent(match.split("=").slice(1).join("="));
}

export function clearTokenCookie() {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
}

/* ──────────────────────────────────────
   USER COOKIE HELPERS
   Used to persist the user object across page refreshes for SSR layout checks.
   ────────────────────────────────────── */

/**
 * Store normalized user in a client-readable cookie (SSR layout can read it).
 */
export function setUserCookie(user) {
  const normalized = normalizeUser(user);
  document.cookie = `${USER_COOKIE}=${encodeURIComponent(JSON.stringify(normalized))}; path=/; max-age=${USER_MAX_AGE}; SameSite=Lax`;
  return normalized;
}

/**
 * Read user from cookie — client-side only.
 */
export function getUserFromCookie() {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${USER_COOKIE}=`));
  if (!match) return null;
  try {
    return JSON.parse(decodeURIComponent(match.split("=").slice(1).join("=")));
  } catch {
    return null;
  }
}

/**
 * Clear user cookie — client-side only.
 */
export function clearUserCookie() {
  document.cookie = `${USER_COOKIE}=; path=/; max-age=0`;
}

/* ──────────────────────────────────────
   SERVER-SIDE COOKIE HELPERS
   For use in Next.js layouts / middleware (server components).
   ────────────────────────────────────── */

/**
 * Read user from cookie store (server-side, Next.js layouts).
 */
export function getUserFromCookieServer(cookieStore) {
  const cookie = cookieStore.get(USER_COOKIE);
  if (!cookie?.value) return null;
  try {
    return JSON.parse(decodeURIComponent(cookie.value));
  } catch {
    return null;
  }
}

export { TOKEN_COOKIE, USER_COOKIE };
