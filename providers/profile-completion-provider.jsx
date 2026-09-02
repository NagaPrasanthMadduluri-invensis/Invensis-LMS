"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { fetchMyProfile } from "@/services/api/me";
import { fetchMyTrainerProfile } from "@/services/api/trainer/trainer-api";

export const ProfileCompletionContext = createContext(null);

// Fields that must be filled for a profile to count as "complete", per role.
// Trainer: everything except `rate` (admin-only anyway). Learner: everything
// except the photo and LinkedIn URL.
const REQUIRED = {
  trainer: [
    { key: "name", label: "Full name" },
    { key: "bio", label: "Bio" },
    { key: "experience", label: "Experience" },
    { key: "city", label: "City" },
    { key: "country", label: "Country" },
    { key: "specializations", label: "Specializations" },
    { key: "resume_key", label: "Resume" },
  ],
  learner: [
    { key: "first_name", label: "First name" },
    { key: "last_name", label: "Last name" },
    { key: "phone", label: "Mobile number" },
    { key: "country", label: "Country" },
    { key: "company_name", label: "Company" },
    { key: "job_title", label: "Job title" },
    { key: "department", label: "Department" },
    { key: "years_experience", label: "Years of experience" },
  ],
};

function isFilled(v) {
  if (v === null || v === undefined) return false;
  if (typeof v === "string") return v.trim() !== "";
  if (Array.isArray(v)) return v.length > 0;
  return true; // numbers (incl. 0), booleans
}

// Flatten a role's profile response into the flat shape REQUIRED keys expect.
function flatten(role, data) {
  if (role === "trainer") return data?.trainer || {};
  // learner: /me/profile → { user, profile }
  const p = data?.profile || {};
  const u = data?.user || {};
  return {
    first_name: p.first_name ?? (u.name ? u.name.split(" ")[0] : null),
    last_name: p.last_name ?? null,
    phone: p.phone,
    country: p.country,
    company_name: p.company_name,
    job_title: p.job_title,
    department: p.department,
    years_experience: p.years_experience,
  };
}

/**
 * Fetches the logged-in trainer's/learner's profile and computes whether it's
 * complete. Mounted only in the trainer & learner shells. Re-checks on each
 * navigation so the red flag / prompt clear as soon as the profile is saved.
 * Other portals have no provider — consumers get null and render nothing.
 */
export function ProfileCompletionProvider({ children }) {
  const { user, token } = useAuth();
  const pathname = usePathname();
  const role = user?.role;
  const tracked = role === "trainer" || role === "learner";

  const [state, setState] = useState({ loading: true, complete: true, missing: [] });
  const [dismissed, setDismissed] = useState(false);

  const check = useCallback(async () => {
    if (!token || !tracked) {
      setState({ loading: false, complete: true, missing: [] });
      return;
    }
    try {
      const data = role === "trainer"
        ? await fetchMyTrainerProfile({ token })
        : await fetchMyProfile({ token });
      const flat = flatten(role, data);
      const missing = REQUIRED[role].filter((f) => !isFilled(flat[f.key]));
      setState({ loading: false, complete: missing.length === 0, missing });
    } catch {
      // On error, don't nag — treat as complete so we never block on a hiccup.
      setState({ loading: false, complete: true, missing: [] });
    }
  }, [token, role, tracked]);

  // Re-check on mount and whenever the route changes (e.g. after saving on the
  // profile page and navigating away, or landing anywhere post-login).
  useEffect(() => { check(); }, [check, pathname]);

  const value = {
    ...state,
    role,
    tracked,
    // The prompt shows while incomplete and not yet dismissed this session.
    promptOpen: tracked && !state.loading && !state.complete && !dismissed,
    dismissPrompt: () => setDismissed(true),
    refresh: check,
  };

  return (
    <ProfileCompletionContext.Provider value={value}>
      {children}
    </ProfileCompletionContext.Provider>
  );
}

// Safe consumer — returns null when there's no provider (admin/sponsor portals).
export function useProfileCompletion() {
  return useContext(ProfileCompletionContext);
}
