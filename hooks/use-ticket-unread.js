"use client";

import { useCallback, useEffect, useState } from "react";
import { unreadTicketCount, TICKETS_SEEN_EVENT } from "@/lib/ticket-unread";

/**
 * Returns the number of the caller's tickets that have unseen replies, for the
 * sidebar badge. `fetchTickets` is the portal-specific list fetcher (learner or
 * admin) — pass a stable, module-level function. Recomputes on mount and
 * whenever a ticket is marked seen (via the TICKETS_SEEN_EVENT).
 */
export function useTicketUnread({ token, userId, fetchTickets }) {
  const [count, setCount] = useState(0);

  const recompute = useCallback(async () => {
    if (!token || !userId || !fetchTickets) return;
    try {
      const res = await fetchTickets({ token });
      setCount(unreadTicketCount(res?.tickets || [], userId));
    } catch {
      setCount(0); // never block the sidebar on a failed fetch
    }
  }, [token, userId, fetchTickets]);

  useEffect(() => { recompute(); }, [recompute]);

  useEffect(() => {
    const handler = () => recompute();
    window.addEventListener(TICKETS_SEEN_EVENT, handler);
    return () => window.removeEventListener(TICKETS_SEEN_EVENT, handler);
  }, [recompute]);

  return count;
}
