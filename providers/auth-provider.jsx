"use client";

import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  loginUser,
  logoutUser,
  getCurrentUser,
  normalizeUser,
  deriveCapabilities,
  setTokenCookie,
  getTokenFromCookie,
  clearTokenCookie,
  setUserCookie,
  getUserFromCookie,
  clearUserCookie,
  setSessionMetaCookie,
  getSessionMetaFromCookie,
  clearSessionMetaCookie,
} from "@/services/api/auth/auth-api";

export const AuthContext = createContext(null);

const PORTAL_HOME = {
  admin:   "/admin/dashboard",
  trainer: "/trainer/dashboard",
  sponsor: "/sponsor/dashboard",
  learner: "/dashboard",
};

export function AuthProvider({ children }) {
  const [user,         setUser]         = useState(null);
  const [token,        setToken]        = useState(null);
  const [capabilities, setCapabilities] = useState(null);
  const [sponsor,      setSponsor]      = useState(null);
  const [loading,      setLoading]      = useState(true);
  const router = useRouter();
  const hydrated = useRef(false);

  // On mount: restore session from cookies.
  // The access token is stored in a 15-min cookie (matches server TTL) so page
  // refreshes don't require a cross-origin /auth/refresh call that fails due to
  // SameSite=Lax on the httpOnly refresh cookie.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const storedToken = getTokenFromCookie();
    const storedUser  = getUserFromCookie();
    const storedMeta  = getSessionMetaFromCookie();

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
      setCapabilities(storedMeta.capabilities ?? deriveCapabilities(null, storedUser.role));
      setSponsor(storedMeta.sponsor ?? null);

      // Best-effort: re-read live capabilities from /auth/me (API.md §1.5).
      // They are a snapshot, not baked into the JWT, and can change after login.
      // Swallow errors and ignore older backends that omit `capabilities`.
      getCurrentUser(storedToken)
        .then((res) => {
          const caps = deriveCapabilities(res.capabilities, res.user?.role ?? storedUser.role);
          setCapabilities(caps);
          setSponsor(res.sponsor ?? null);
          setSessionMetaCookie({ capabilities: res.capabilities ?? null, sponsor: res.sponsor ?? null });
        })
        .catch(() => {});
    }

    setLoading(false);
  }, []);

  /**
   * Login → store token + user + capabilities in cookies → redirect by role
   */
  const login = useCallback(
    async ({ email, password }) => {
      const res = await loginUser({ email, password });
      const { user: apiUser, accessToken } = res;
      const normalized = normalizeUser(apiUser);
      const caps = deriveCapabilities(res.capabilities, apiUser.role);

      setTokenCookie(accessToken);
      setUserCookie(apiUser);
      setSessionMetaCookie({ capabilities: res.capabilities ?? null, sponsor: res.sponsor ?? null });
      setToken(accessToken);
      setUser(normalized);
      setCapabilities(caps);
      setSponsor(res.sponsor ?? null);

      router.push(PORTAL_HOME[normalized.role] ?? "/dashboard");
      return { token: accessToken, user: normalized, capabilities: caps };
    },
    [router]
  );

  /**
   * Logout → revoke refresh token on server → clear all local state
   */
  const logout = useCallback(async () => {
    await logoutUser();
    clearTokenCookie();
    clearUserCookie();
    clearSessionMetaCookie();
    setToken(null);
    setUser(null);
    setCapabilities(null);
    setSponsor(null);
    router.push("/login");
  }, [router]);

  /**
   * Merge a partial update (e.g. a new display name after a profile edit)
   * into the in-memory user and its persisted cookie, without a full refetch.
   */
  const updateUser = useCallback((patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      setUserCookie(next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      capabilities,
      sponsor,
      loading,
      login,
      logout,
      updateUser,
      isAuthenticated: !!user && !!token,
    }),
    [user, token, capabilities, sponsor, loading, login, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
