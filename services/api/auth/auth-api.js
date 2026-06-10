import { apiClient } from "@/lib/api-client";

const TOKEN_COOKIE = "lms_token";
const USER_COOKIE = "lms_user";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/* ──────────────────────────────────────
   API CALLS
   ────────────────────────────────────── */

/**
 * POST /auth/login
 * Returns { token, user }
 */
export async function loginUser({ email, password }) {
  return apiClient("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

/**
 * POST /auth/register
 * Returns { token, user }
 */
export async function registerUser({ firstName, lastName, email, password, passwordConfirmation }) {
  return apiClient("/auth/register", {
    method: "POST",
    body: {
      first_name: firstName,
      last_name: lastName,
      email,
      password,
      password_confirmation: passwordConfirmation,
    },
  });
}

/**
 * POST /auth/logout
 * Revokes the current Bearer token on the server
 */
export async function logoutUser(token) {
  try {
    await apiClient("/auth/logout", {
      method: "POST",
      token,
    });
  } catch {
    // Swallow errors — we clear cookies regardless
  }
}

/**
 * GET /auth/me
 * Returns { user } for the current token
 */
export async function getCurrentUser(token) {
  return apiClient("/auth/me", { token });
}

/* ──────────────────────────────────────
   COOKIE HELPERS — CLIENT SIDE
   ────────────────────────────────────── */

/**
 * Normalize API user object into our app's user shape
 */
function normalizeUser(apiUser) {
  const firstName = apiUser.first_name || "";
  const lastName = apiUser.last_name || "";
  const name = `${firstName} ${lastName}`.trim();
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return {
    id: apiUser.id,
    firstName,
    lastName,
    name,
    email: apiUser.email,
    role: apiUser.role || { name: "Customer", slug: "customer" },
    initials,
    isActive: apiUser.is_active,
  };
}

/**
 * Save token + user to cookies (client-side)
 */
export function setAuthCookies({ token, user }) {
  const normalizedUser = normalizeUser(user);

  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
  document.cookie = `${USER_COOKIE}=${encodeURIComponent(JSON.stringify(normalizedUser))}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;

  return normalizedUser;
}

/**
 * Read token from cookie (client-side)
 */
export function getTokenFromCookie() {
  if (typeof document === "undefined") return null;

  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${TOKEN_COOKIE}=`));

  if (!match) return null;
  return decodeURIComponent(match.split("=").slice(1).join("="));
}

/**
 * Read user from cookie (client-side)
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
 * Clear all auth cookies (client-side)
 */
export function clearAuthCookies() {
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${USER_COOKIE}=; path=/; max-age=0`;
}

/* ──────────────────────────────────────
   COOKIE HELPERS — SERVER SIDE
   (for layouts and middleware)
   ────────────────────────────────────── */

/**
 * Read token from server cookie store
 */
export function getTokenFromCookieServer(cookieStore) {
  const cookie = cookieStore.get(TOKEN_COOKIE);
  return cookie?.value ? decodeURIComponent(cookie.value) : null;
}

/**
 * Read user from server cookie store
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

export { TOKEN_COOKIE, USER_COOKIE, normalizeUser };
