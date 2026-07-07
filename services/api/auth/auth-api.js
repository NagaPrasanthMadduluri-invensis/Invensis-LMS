import { apiClient } from "@/lib/api-client";

const TOKEN_COOKIE = "lms_token";
const USER_COOKIE  = "lms_user";
const META_COOKIE  = "lms_meta";        // capabilities + sponsor (client-readable)
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

/**
 * POST /auth/forgot-password
 * Always resolves 200 with the same message (no account enumeration).
 * Returns { message }.
 */
export async function forgotPassword({ email }) {
  return apiClient("/auth/forgot-password", { method: "POST", body: { email } });
}

/**
 * POST /auth/set-password
 * Serves BOTH the account-setup and password-reset email links.
 * `token` comes from the email link's ?token= query param.
 * Returns { message }. Errors: 422 validation, 400 invalid/expired/used token.
 */
export async function setPassword({ token, password }) {
  return apiClient("/auth/set-password", { method: "POST", body: { token, password } });
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
   CAPABILITIES & SPONSOR
   See API.md §1.5 — login/refresh/me return a `capabilities` object
   { admin, trainer, sponsor, learner } and a `sponsor` object. Nav/guards
   are driven by capabilities, routing by role. Capabilities are a snapshot
   (not in the JWT) — re-read on every refresh/me.
   ────────────────────────────────────── */

const ROLES = ["admin", "trainer", "sponsor", "learner"];

/**
 * Normalize a capabilities object. If the backend doesn't return one yet
 * (older deploys), derive a single-capability set from the user's role so the
 * frontend keeps working.
 */
export function deriveCapabilities(apiCapabilities, role) {
  if (apiCapabilities && typeof apiCapabilities === "object") {
    return {
      admin:   !!apiCapabilities.admin,
      trainer: !!apiCapabilities.trainer,
      sponsor: !!apiCapabilities.sponsor,
      learner: !!apiCapabilities.learner,
    };
  }
  return ROLES.reduce((acc, r) => ({ ...acc, [r]: r === role }), {});
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
   SESSION META COOKIE (capabilities + sponsor)
   Client-readable; persisted so capabilities survive a page refresh until
   the next /auth/me re-reads the live set.
   ────────────────────────────────────── */

export function setSessionMetaCookie({ capabilities, sponsor }) {
  const payload = JSON.stringify({ capabilities: capabilities ?? null, sponsor: sponsor ?? null });
  document.cookie = `${META_COOKIE}=${encodeURIComponent(payload)}; path=/; max-age=${USER_MAX_AGE}; SameSite=Lax`;
}

export function getSessionMetaFromCookie() {
  if (typeof document === "undefined") return { capabilities: null, sponsor: null };
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${META_COOKIE}=`));
  if (!match) return { capabilities: null, sponsor: null };
  try {
    return JSON.parse(decodeURIComponent(match.split("=").slice(1).join("=")));
  } catch {
    return { capabilities: null, sponsor: null };
  }
}

export function clearSessionMetaCookie() {
  document.cookie = `${META_COOKIE}=; path=/; max-age=0`;
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

export { TOKEN_COOKIE, USER_COOKIE, META_COOKIE };
