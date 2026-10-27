"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { fetchCurrentWebinar } from "@/services/api/webinars-api";

/* Fetches the webinar the banner should currently show (the backend applies the
   "active + starts >6h from now, soonest first" rule) and shares it so both the
   banner and the sidebar (which shifts down only when a banner is present) react
   to the same state. Refetches periodically so a long-open page auto-advances. */

const WebinarBannerContext = createContext({ webinar: null });

const REFRESH_MS = 10 * 60 * 1000; // 10 minutes

export function WebinarBannerProvider({ children }) {
  const { token } = useAuth();
  const [webinar, setWebinar] = useState(null);

  useEffect(() => {
    if (!token) { setWebinar(null); return; }
    let cancelled = false;
    const load = () =>
      fetchCurrentWebinar({ token })
        .then((d) => { if (!cancelled) setWebinar(d.webinar || null); })
        .catch(() => { if (!cancelled) setWebinar(null); });
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => { cancelled = true; clearInterval(id); };
  }, [token]);

  return (
    <WebinarBannerContext.Provider value={{ webinar }}>
      {children}
    </WebinarBannerContext.Provider>
  );
}

export function useWebinarBanner() {
  return useContext(WebinarBannerContext);
}
