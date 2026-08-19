"use client";

import { useEffect, useState } from "react";
import { CalendarClock, Video, Users2, ArrowRight, Clock, Globe } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchUpcomingCohorts } from "@/services/api/learner/learner-api";

const MODE_LABEL = {
  live_virtual: "Live Virtual",
  virtual: "Live Virtual",
  classroom: "Classroom",
  in_person: "Classroom",
  self_paced: "Self-paced",
};

const COHORT_LIMIT = 3;

function fmtDateRange(start, end) {
  if (!start) return "—";
  const opts = { day: "numeric", month: "short", year: "numeric" };
  const s = new Date(start).toLocaleDateString("en-US", opts);
  if (!end || end === start) return s;
  const e = new Date(end).toLocaleDateString("en-US", opts);
  return `${s} – ${e}`;
}

function fmtTime(t) {
  if (!t) return null;
  const [h, m] = String(t).split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m || 0), 0, 0);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function fmtPrice(amount, currency) {
  if (amount == null) return null;
  const n = Number(amount);
  if (!Number.isFinite(n)) return null;
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currency || "USD", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `${currency || ""} ${n}`.trim();
  }
}

function CohortCard({ c }) {
  const mode = MODE_LABEL[c.training_mode] || c.training_mode || "Training";
  const time = fmtTime(c.start_time);
  const price = fmtPrice(c.final_price, c.currency_code);
  const seatsLeft = c.capacity != null && c.enrolled_count != null ? c.capacity - c.enrolled_count : null;

  return (
    <Box className="rounded-xl border border-slate-200 bg-white p-4 transition-all hover:border-violet-200 hover:shadow-sm">
      <Box className="flex items-start justify-between gap-3">
        <Box className="flex items-center gap-2 min-w-0">
          <Box className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50">
            <CalendarClock className="h-4 w-4 text-violet-600" />
          </Box>
          <Box className="min-w-0">
            <Text as="p" className="text-sm font-semibold text-slate-800 leading-tight">
              {fmtDateRange(c.start_date, c.end_date)}
            </Text>
            {c.event_code && (
              <Text as="span" className="text-[11px] text-slate-400 font-mono">{c.event_code}</Text>
            )}
          </Box>
        </Box>
        {price && (
          <Text as="span" className="text-sm font-bold text-slate-900 shrink-0">{price}</Text>
        )}
      </Box>

      <Box className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <Box className="flex items-center gap-1.5">
          <Video className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <Text as="span" className="text-xs text-slate-600">{mode}</Text>
        </Box>
        {time && (
          <Box className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <Text as="span" className="text-xs text-slate-600">
              {time}{c.timezone_code ? ` ${c.timezone_code}` : ""}
            </Text>
          </Box>
        )}
        {c.batch_type && (
          <Badge className="border-0 bg-slate-100 text-slate-600 text-[10px] font-medium capitalize">{c.batch_type}</Badge>
        )}
        {seatsLeft != null && seatsLeft > 0 && (
          <Box className="flex items-center gap-1.5 ml-auto">
            <Users2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
            <Text as="span" className="text-[11px] font-medium text-emerald-600">{seatsLeft} seats left</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}

export function UpcomingCohortsPanel() {
  const { token } = useAuth();
  const [cohorts, setCohorts] = useState(null); // null = loading

  useEffect(() => {
    if (!token) return;
    let alive = true;
    fetchUpcomingCohorts({ token, limit: COHORT_LIMIT })
      .then((res) => { if (alive) setCohorts(res?.cohorts || []); })
      .catch(() => { if (alive) setCohorts([]); });
    return () => { alive = false; };
  }, [token]);

  // While loading, show a light skeleton; if there are none, hide the panel entirely.
  if (cohorts === null) {
    return (
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-3">
        <Skeleton className="h-5 w-48 rounded" />
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
      </Card>
    );
  }
  if (cohorts.length === 0) return null;

  return (
    <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <Box className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <Box className="flex items-center gap-2.5">
          <Box className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50">
            <CalendarClock className="h-4 w-4 text-violet-500" />
          </Box>
          <Box>
            <Text as="h3" className="text-sm font-bold text-slate-800 leading-tight">Upcoming Cohorts</Text>
            <Text as="p" className="text-[11px] text-slate-400">More batches for your course</Text>
          </Box>
        </Box>
        <Globe className="h-4 w-4 text-slate-300" />
      </Box>

      <Box className="p-5 space-y-3">
        {cohorts.map((c) => <CohortCard key={c.id ?? c.event_code} c={c} />)}

        <Button
          variant="outline"
          nativeButton={false}
          className="w-full h-10 border-slate-200 text-violet-600 hover:text-violet-700 hover:border-violet-300 rounded-xl text-sm font-semibold"
          render={<a href="#" />}
        >
          View more cohorts <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
        </Button>
      </Box>
    </Card>
  );
}
