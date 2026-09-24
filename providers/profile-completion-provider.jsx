"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { fetchMyProfile } from "@/services/api/me";
import { fetchMyTrainerProfile } from "@/services/api/trainer/trainer-api";
import { missingProfileFields } from "@/lib/profile-completion";

export const ProfileCompletionContext = createContext(null);

// Flatten a role's profile response into the flat shape REQUIRED keys expect.
function flatten(role, data) {
  if (role === "trainer") return data?.trainer || {};
  // learner: /me/profile → { user, profile }
  const p = data?.profile || {};
  const u = data?.user || {};
  return {
    first_name: p.first_name ?? (u.name ? u.name.split(" ")[0] : null),
    last_name: p.last_name ?? null,
    employment_status: p.employment_status,
    phone: p.phone,
    country: p.country,
    city: p.city,
    company_name: p.company_name,
    industry: p.industry,
    job_title: p.job_title,
    department: p.department,
    years_experience: p.years_experience,
    linkedin_url: p.linkedin_url,
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
      const missing = missingProfileFields(role, flatten(role, data));
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
