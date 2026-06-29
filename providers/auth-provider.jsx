"use client";

import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  loginUser,
  logoutUser,
  normalizeUser,
  setTokenCookie,
  getTokenFromCookie,
  clearTokenCookie,
  setUserCookie,
  getUserFromCookie,
  clearUserCookie,
} from "@/services/api/auth/auth-api";

export const AuthContext = createContext(null);

const PORTAL_HOME = {
  admin:   "/admin/dashboard",
  trainer: "/trainer/dashboard",
  sponsor: "/dashboard",
  learner: "/dashboard",
};

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [token,   setToken]   = useState(null);
  const [loading, setLoading] = useState(true);
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

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }

    setLoading(false);
  }, []);

  /**
   * Login → store token + user in cookies → redirect by role
   */
  const login = useCallback(
    async ({ email, password }) => {
      const { user: apiUser, accessToken } = await loginUser({ email, password });
      const normalized = normalizeUser(apiUser);

      setTokenCookie(accessToken);
      setUserCookie(apiUser);
      setToken(accessToken);
      setUser(normalized);

      router.push(PORTAL_HOME[normalized.role] ?? "/dashboard");
      return { token: accessToken, user: normalized };
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
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      token,
      loading,
      login,
      logout,
      isAuthenticated: !!user && !!token,
    }),
    [user, token, loading, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
