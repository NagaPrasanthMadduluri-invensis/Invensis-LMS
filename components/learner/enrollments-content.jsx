"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CreditCard, GraduationCap, CalendarClock, Video, MapPin, Layers, UserRound,
  Building2, Award, BadgeCheck, Clock3, ArrowRight, AlertCircle, CheckCircle2,
  CircleDashed, Mail,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { fetchMyTrainings } from "@/services/api/learner/learner-api";

/* ── formatting ── */
function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}
function dateRange(start, end) {
  if (!start && !end) return "Dates to be confirmed";
  if (!end || start === end) return formatDate(start);
  return `${formatDate(start)} – ${formatDate(end)}`;
}

const MODE = {
  virtual:    { icon: Video,    label: "Live Virtual", chip: "bg-sky-100 text-sky-700" },
  in_person:  { icon: MapPin,   label: "In Person",    chip: "bg-emerald-100 text-emerald-700" },
  hybrid:     { icon: Layers,   label: "Hybrid",       chip: "bg-violet-100 text-violet-700" },
  one_to_one: { icon: UserRound, label: "1-to-1",      chip: "bg-amber-100 text-amber-700" },
};
function modeOf(m) { return MODE[m] || { icon: Video, label: m || "—", chip: "bg-slate-100 text-slate-600" }; }

// Status badge — reflects the training lifecycle for the "next" section.
const STATUS = {
  pending:   { label: "Upcoming",    chip: "bg-amber-100 text-amber-700",   icon: Clock3 },
  scheduled: { label: "Scheduled",   chip: "bg-amber-100 text-amber-700",   icon: Clock3 },
  ongoing:   { label: "In Progress", chip: "bg-sky-100 text-sky-700",       icon: CircleDashed },
  completed: { label: "Completed",   chip: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  cancelled: { label: "Cancelled",   chip: "bg-rose-100 text-rose-700",     icon: AlertCircle },
};
function statusOf(s) { return STATUS[s] || { label: s || "—", chip: "bg-slate-100 text-slate-600", icon: CircleDashed }; }

function isFinished(t) {
  return t.enrolment_status === "completed" || t.status === "completed";
}

/* ── a single completed-training card ── */
function CompletedCard({ t }) {
  const m = modeOf(t.delivery_mode);
  const ModeIcon = m.icon;
  return (
    <Card className="p-0 overflow-hidden border border-slate-200/80 shadow-sm rounded-2xl bg-white flex flex-col">
      <Box className="p-5 flex flex-col gap-3 flex-1">
        <Box className="flex items-start justify-between gap-3">
          <Box className="min-w-0">
            <Text as="h3" className="text-sm font-bold text-slate-800 leading-tight">{t.title}</Text>
            <Text as="span" className="font-mono text-[11px] text-slate-400">{t.code}</Text>
          </Box>
          <Badge className="shrink-0 border-0 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80 text-[10px] font-semibold">
            ● Completed
          </Badge>
        </Box>

        <Box className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-500">
          <Box className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 ${m.chip}`}>
            <ModeIcon className="h-3 w-3" />{m.label}
          </Box>
          <Box className="flex items-center gap-1">
            <CalendarClock className="h-3 w-3" />{dateRange(t.start_date, t.end_date)}
          </Box>
        </Box>

        <Box className="mt-1 space-y-2 border-t border-slate-100 pt-3">
          {/* Trainer */}
          <Box className="flex items-center gap-2">
            <Box className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-50">
              <GraduationCap className="h-3.5 w-3.5 text-violet-600" />
            </Box>
            <Box className="min-w-0">
              <Text as="p" className="text-[10px] uppercase tracking-wide text-slate-400 leading-none">Trainer</Text>
              <Text as="p" className="truncate text-xs font-semibold text-slate-700 mt-0.5">
                {t.trainer_name || "Not assigned"}
              </Text>
            </Box>
          </Box>

          {/* Sponsor — only when someone else paid for this seat */}
          {t.sponsor_email && (
            <Box className="flex items-center gap-2">
              <Box className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-fuchsia-50">
                <Building2 className="h-3.5 w-3.5 text-fuchsia-600" />
              </Box>
              <Box className="min-w-0">
                <Text as="p" className="text-[10px] uppercase tracking-wide text-slate-400 leading-none">Sponsored by</Text>
                <Text as="p" className="truncate text-xs font-semibold text-slate-700 mt-0.5">{t.sponsor_email}</Text>
              </Box>
            </Box>
          )}

          {/* Certificate */}
          <Box className="flex items-center gap-2">
            <Box className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", t.certificate_issued ? "bg-amber-50" : "bg-slate-100")}>
              {t.certificate_issued
                ? <BadgeCheck className="h-3.5 w-3.5 text-amber-600" />
                : <Award className="h-3.5 w-3.5 text-slate-400" />}
            </Box>
            <Box className="min-w-0">
              <Text as="p" className="text-[10px] uppercase tracking-wide text-slate-400 leading-none">Certificate ID</Text>
              {t.certificate_issued ? (
                <Text as="p" className="truncate font-mono text-xs font-semibold text-slate-700 mt-0.5">{t.certificate_id}</Text>
              ) : (
                <Text as="p" className="text-xs font-medium text-amber-600 mt-0.5">Complete feedback to unlock</Text>
              )}
            </Box>
          </Box>
        </Box>

        <Box className="mt-auto pt-1">
          <Button
            render={<Link href="/certificates" />}
            variant="outline"
            className="w-full gap-2 border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            <Award className="h-4 w-4" />
            {t.certificate_issued ? "View certificate" : "Give feedback & download"}
          </Button>
        </Box>
      </Box>
    </Card>
  );
}

/* ── the "next training" highlight + upcoming rows ── */
function NextTrainingCard({ t, highlight }) {
  const m = modeOf(t.delivery_mode);
  const ModeIcon = m.icon;
  const s = statusOf(t.status);
  const StatusIcon = s.icon;
  return (
    <Box className={cn(
      "rounded-2xl border p-5",
      highlight ? "border-violet-200 bg-gradient-to-br from-violet-50/70 to-violet-50/50" : "border-slate-200 bg-white"
    )}>
      <Box className="flex items-start justify-between gap-3">
        <Box className="min-w-0">
          {highlight && (
            <Text as="span" className="text-[10px] font-bold uppercase tracking-wide text-violet-600">Next up</Text>
          )}
          <Text as="h3" className="text-sm font-bold text-slate-800 leading-tight">{t.title}</Text>
          <Text as="span" className="font-mono text-[11px] text-slate-400">{t.code}</Text>
        </Box>
        <Badge className={`shrink-0 border-0 text-[10px] font-semibold ${s.chip}`}>
          <StatusIcon className="mr-1 h-3 w-3" />{s.label}
        </Badge>
      </Box>

      <Box className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-slate-500">
        <Box className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 ${m.chip}`}>
          <ModeIcon className="h-3 w-3" />{m.label}
        </Box>
        <Box className="flex items-center gap-1">
          <CalendarClock className="h-3 w-3" />{dateRange(t.start_date, t.end_date)}
        </Box>
        {t.trainer_name && (
          <Box className="flex items-center gap-1">
            <GraduationCap className="h-3 w-3" />{t.trainer_name}
          </Box>
        )}
        {t.sponsor_email && (
          <Box className="flex items-center gap-1">
            <Mail className="h-3 w-3" />Sponsored by {t.sponsor_email}
          </Box>
        )}
      </Box>

      <Box className="mt-4">
        <Button
          render={<Link href="/my-courses" />}
          size="sm"
          className="h-8 gap-1 rounded-lg border-0 bg-violet-600 text-xs font-semibold text-white hover:bg-violet-700"
        >
          View training <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </Box>
    </Box>
  );
}

/* ── section wrapper ── */
function Section({ title, icon: Icon, count, children }) {
  return (
    <Box className="space-y-3">
      <Box className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-slate-400" />}
        <Text as="h2" className="text-sm font-semibold text-slate-800">{title}</Text>
        {count != null && (
          <Box as="span" className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{count}</Box>
        )}
      </Box>
      {children}
    </Box>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <Card className="p-8 border border-slate-200/80 rounded-2xl bg-white text-center">
      <Box className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-3">
        <Icon className="h-6 w-6 text-slate-300" />
      </Box>
      <Text as="p" className="text-sm text-slate-500">{text}</Text>
    </Card>
  );
}

/* ═══════════════════════════════════════════════ Main ══ */
export function EnrollmentsContent() {
  const { token } = useAuth();
  const [trainings, setTrainings] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    if (!token) return;
    fetchMyTrainings({ token })
      .then((d) => { setTrainings(d.trainings || []); setError(null); })
      .catch((e) => setError(e.message));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <Card className="p-6 border border-red-200/60 bg-red-50 rounded-xl">
        <Text as="p" className="text-red-600 text-sm">Failed to load your enrolments: {error}</Text>
      </Card>
    );
  }

  if (!trainings) {
    return (
      <Box className="space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Box className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-56 rounded-2xl" />)}
        </Box>
      </Box>
    );
  }

  const completed = trainings.filter(isFinished);
  // "Next" = everything not yet finished, soonest first; the earliest is highlighted.
  const upcoming = trainings
    .filter((t) => !isFinished(t) && t.status !== "cancelled")
    .sort((a, b) => new Date(a.start_date ?? 0) - new Date(b.start_date ?? 0));

  if (completed.length === 0 && upcoming.length === 0) {
    return <EmptyState icon={CreditCard} text="You're not enrolled in any trainings yet." />;
  }

  return (
    <Box className="space-y-8">
      {/* ── Next training(s) with status ── */}
      <Section title="Next Training" icon={Clock3} count={upcoming.length || null}>
        {upcoming.length === 0 ? (
          <EmptyState icon={Clock3} text="No upcoming trainings — you're all caught up." />
        ) : (
          <Box className="space-y-3">
            {upcoming.map((t, i) => (
              <NextTrainingCard key={t.id} t={t} highlight={i === 0} />
            ))}
          </Box>
        )}
      </Section>

      {/* ── Completed trainings ── */}
      <Section title="Completed Trainings" icon={Award} count={completed.length || null}>
        {completed.length === 0 ? (
          <EmptyState icon={Award} text="No completed trainings yet — finish one to see it here." />
        ) : (
          <Box className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {completed.map((t) => <CompletedCard key={t.id} t={t} />)}
          </Box>
        )}
      </Section>
    </Box>
  );
}
