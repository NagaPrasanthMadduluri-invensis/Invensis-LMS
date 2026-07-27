"use client";

import { useEffect, useState } from "react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchLearnerDashboard, fetchTrainingDetail } from "@/services/api/learner/learner-api";
import { isSessionLive } from "@/components/learner/dashboard/dashboard-utils";

// Only trainings already under way can have a session running right now, and
// a learner realistically has one or two — cap the detail fan-out anyway.
const DETAIL_FETCH_LIMIT = 2;
// Session boundaries move on the minute, so re-check on that cadence.
const POLL_MS = 60_000;

/**
 * Green "Session live now" pill in the learner top nav. Renders nothing unless
 * a session window is genuinely open — it's a status light, not a label, so an
 * always-on version would be worse than none.
 */
export function SessionLiveIndicator() {
  const { token } = useAuth();
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    async function check() {
      try {
        const dashboard = await fetchLearnerDashboard({ token });
        const ongoing = (dashboard?.my_courses?.in_progress ?? []).slice(0, DETAIL_FETCH_LIMIT);
        if (ongoing.length === 0) {
          if (!cancelled) setLive(false);
          return;
        }
        const details = await Promise.all(
          ongoing.map((c) => fetchTrainingDetail({ token, trainingRef: c.code }).catch(() => null))
        );
        const anyLive = details.some((d) => (d?.sessions ?? []).some((s) => isSessionLive(s)));
        if (!cancelled) setLive(anyLive);
      } catch {
        // A status light must never surface an error — stay dark instead.
        if (!cancelled) setLive(false);
      }
    }

    check();
    const id = setInterval(check, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [token]);

  if (!live) return null;

  return (
    <Box className="flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5">
      <Box className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-emerald-500" />
      <Text as="span" className="text-xs font-semibold text-emerald-700">
        Session live now
      </Text>
    </Box>
  );
}
