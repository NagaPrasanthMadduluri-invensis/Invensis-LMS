"use client";

import { useContext } from "react";
import { AuthContext } from "@/providers/auth-provider";

/**
 * Hook to access auth state and actions across the entire app.
 *
 * Returns:
 *   user          — { id, name, email, role, isActive, initials }
 *   token         — Bearer token string
 *   capabilities  — { admin, trainer, sponsor, learner } (API.md §1.5) — drives nav/guards
 *   sponsor       — { id, name, email } | null — who paid for this learner
 *   loading       — true while hydrating from cookies
 *   isAuthenticated — boolean
 *   login({ email, password })    — authenticate and redirect by role
 *   register({ firstName, lastName, email, password, passwordConfirmation }) — create account
 *   logout()      — revoke token on server, clear cookies, redirect to /login
 *   updateUser(patch) — merge a partial update (e.g. a new name) into user + its cookie
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
