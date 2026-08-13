const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Deduped, in-flight access-token refresh. When the 15-min access token expires
// mid-session, the next request 401s; we swap it for a fresh one using the
// 7-day httpOnly refresh cookie and retry — transparently, and only once per
// burst of concurrent 401s (all callers await the same promise).
let refreshPromise = null;

function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      // Dynamic import avoids a load-time cycle (auth-api imports this module).
      const { refreshSession, setTokenCookie, setUserCookie, setSessionMetaCookie } =
        await import("@/services/api/auth/auth-api");
      try {
        const res = await refreshSession();
        if (!res?.accessToken) return null;
        setTokenCookie(res.accessToken);
        if (res.user) setUserCookie(res.user);
        setSessionMetaCookie({ capabilities: res.capabilities ?? null, sponsor: res.sponsor ?? null });
        // Let AuthProvider fold the new token/caps back into React state so
        // subsequent component calls send the fresh token (no repeat 401s).
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("lms:session-refreshed", {
            detail: {
              accessToken: res.accessToken,
              user: res.user ?? null,
              capabilities: res.capabilities ?? null,
              sponsor: res.sponsor ?? null,
            },
          }));
        }
        return res.accessToken;
      } catch {
        return null;
      }
    })();
    refreshPromise.finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

/**
 * Shared API client for all fetch calls.
 * Automatically attaches Bearer token from cookie.
 * Handles JSON parsing and error responses.
 * On a 401 (expired access token) it refreshes once and retries.
 */
export async function apiClient(endpoint, options = {}) {
  const { token, body, method = "GET", headers: customHeaders, _retried, ...rest } = options;

  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...customHeaders,
  };

  // Attach Bearer token if available
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
    credentials: "include",
    ...rest,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, config);

  // Access token expired → refresh once and retry the original request.
  // Skip for the auth endpoints themselves to avoid recursion on a dead session.
  if (res.status === 401 && !_retried && !endpoint.startsWith("/auth/")) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      return apiClient(endpoint, { ...options, token: newToken, _retried: true });
    }
  }

  // Handle non-JSON responses (e.g., file downloads)
  const contentType = res.headers.get("content-type");
  if (contentType && !contentType.includes("application/json")) {
    if (!res.ok) {
      throw new ApiError("Request failed", res.status);
    }
    return res;
  }

  const data = await res.json();

  if (!res.ok) {
    throw new ApiError(
      data.message || data.error || "Something went wrong",
      res.status,
      data.errors || null
    );
  }

  return data;
}

/**
 * Custom error class for API errors with status and field errors
 */
export class ApiError extends Error {
  constructor(message, status, errors = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}
