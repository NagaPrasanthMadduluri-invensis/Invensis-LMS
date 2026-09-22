"use client";

/*
 * "My Trainings" — every training this learner holds a seat on, grouped by
 * where it sits in their calendar.
 *
 * This replaces the old single-training view, which opened one training (the
 * one `pickDefaultTraining` judged most relevant) and gave no way to reach the
 * others. It also absorbs the separate "My Enrolments" module, whose card
 * design it reuses — two pages listing the same enrolments from the same
 * endpoint was a distinction without a difference.
 *
 * The three groups answer "what do I do next?", in that order: what is running
 * now, what is coming, what is done. Each card links to the full training
 * detail, which is what /my-courses used to render directly.
 *
 * The API already withholds cancelled/suspended trainings and cancelled or
 * transferred seats, so nothing here needs to filter for them — anything that
 * arrives is something the learner is entitled to see.
 */

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen, GraduationCap, CalendarClock, Video, MapPin, Layers, UserRound,
  Building2, Award, Medal, ScrollText, Clock3, CheckCircle2,
  CircleDashed, PlayCircle, ArrowUpRight, Clock, Globe,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { fetchMyTrainings } from "@/services/api/learner/learner-api";
import {
  classifyTrainings,
  isCompletedTraining,
  relativeScheduleLabel,
  todayWallClock,
} from "@/lib/training-groups";
import { formatDate as fmtDate, formatTime as fmtTime, timezoneLabel } from "@/lib/datetime";

/* ── formatting ── */
const formatDate = (iso) => (iso ? fmtDate(iso) : "—");

function dateRange(start, end) {
  if (!start && !end) return "Dates to be confirmed";
  if (!end || start === end) return formatDate(start);
  return `${formatDate(start)} – ${formatDate(end)}`;
}

/* Daily timing, with the zone's own abbreviation appended ("EDT", "IST").
   The stored times ARE the wall clock in the training's timezone, so they are
   printed as-is and the zone is a LABEL, never a conversion — converting would
   shift a 6:30 AM session for every reader (TASTE §6.3). The abbreviation is
   resolved on the start date because it moves with DST. */
function timeRange(t) {
  if (!t.start_time && !t.end_time) return "To be confirmed";
  const span = t.end_time
    ? `${fmtTime(t.start_time)} – ${fmtTime(t.end_time)}`
    : fmtTime(t.start_time);
  const zone = timezoneLabel(t.timezone, t.start_date);
  return zone ? `${span} ${zone}` : span;
}

/* The learning load, as the two or three figures a learner actually weighs up.
   Built from whatever the schedule has — `hours_per_day` in particular is null
   on older schedules — so the strip never shows a blank or a "nullh" tile. */
function loadStats(t) {
  const out = [];
  if (t.duration_hours != null) out.push({ value: `${t.duration_hours}`, unit: "h", label: "Total" });
  if (t.hours_per_day != null) out.push({ value: `${t.hours_per_day}`, unit: "h", label: "Per day" });
  if (t.session_days) out.push({ value: `${t.session_days}`, unit: "", label: t.session_days === 1 ? "Session" : "Sessions" });
  return out;
}

// Tailwind needs the column count as a literal class, not an interpolation.
const STAT_COLS = { 1: "grid-cols-1", 2: "grid-cols-2", 3: "grid-cols-3" };

const MODE = {
  virtual:    { icon: Video,     label: "Live Virtual", chip: "bg-sky-100 text-sky-700" },
  in_person:  { icon: MapPin,    label: "In Person",    chip: "bg-emerald-100 text-emerald-700" },
  hybrid:     { icon: Layers,    label: "Hybrid",       chip: "bg-violet-100 text-violet-700" },
  one_to_one: { icon: UserRound, label: "1-to-1",       chip: "bg-amber-100 text-amber-700" },
};
const modeOf = (m) => MODE[m] || { icon: Video, label: m || "—", chip: "bg-slate-100 text-slate-600" };

const STATUS = {
  pending:   { label: "Upcoming",    chip: "bg-amber-100 text-amber-700",     icon: Clock3 },
  active:    { label: "Upcoming",    chip: "bg-amber-100 text-amber-700",     icon: Clock3 },
  scheduled: { label: "Scheduled",   chip: "bg-amber-100 text-amber-700",     icon: Clock3 },
  ongoing:   { label: "In Progress", chip: "bg-sky-100 text-sky-700",         icon: CircleDashed },
  completed: { label: "Completed",   chip: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
  postponed: { label: "Postponed",   chip: "bg-orange-100 text-orange-700",   icon: CalendarClock },
};
const statusOf = (s) => STATUS[s] || { label: s || "—", chip: "bg-slate-100 text-slate-600", icon: CircleDashed };

/* ── what this training yields ──
   Three states a learner actually needs to tell apart, and the wording is the
   point of the card: "certification course" alone is ambiguous, because a
   certification course whose exam is INCLUDED yields a letter of attendance,
   not a certificate. Saying only "certified / not certified" would leave the
   most consequential of the three unexplained. */
function credentialInfo(t) {
  if (t.credential_type === "attendance_letter") {
    return {
      kind: "Certification course",
      kindCls: "bg-amber-50 text-amber-700 ring-amber-200",
      KindIcon: Medal,
      doc: "Letter of Course Attendance",
      note: "Your exam is booked with the awarding body — this letter confirms attendance, not the qualification.",
      DocIcon: ScrollText,
      docCls: "bg-amber-50 text-amber-600",
    };
  }
  if (t.is_certification) {
    return {
      kind: "Certification course",
      kindCls: "bg-amber-50 text-amber-700 ring-amber-200",
      KindIcon: Medal,
      doc: "Certificate of Training",
      note: "Exam certification isn't included in this booking.",
      DocIcon: Award,
      docCls: "bg-amber-50 text-amber-600",
    };
  }
  return {
    kind: "Training course",
    kindCls: "bg-slate-100 text-slate-600 ring-slate-200",
    KindIcon: BookOpen,
    doc: "Certificate of Training",
    note: "Awarded by Invensis Learning once your training is complete.",
    DocIcon: Award,
    docCls: "bg-violet-50 text-violet-600",
  };
}

/* What a finished training actually produced, rather than what it promised. */
function outcomeInfo(t, cred) {
  if (t.certificate_issued) {
    return { ...cred, note: `Ready to download — ID ${t.certificate_id}`, tone: "text-emerald-700" };
  }
  if (t.certificate_awaiting_release) {
    return { ...cred, note: "Issued and awaiting release by the administrator.", tone: "text-amber-700" };
  }
  return { ...cred, note: "Not issued yet.", tone: "text-slate-500" };
}

/* ── one aligned detail row ──
   Rendered into the card's shared 3-column grid (icon / label / value) rather
   than as its own flex row, so labels and values line up down the card instead
   of each row finding its own indent. */
function Row({ icon: Icon, label, children, title }) {
  return (
    <>
      <Icon className="h-3.5 w-3.5 self-center text-slate-300" />
      <Text as="span" className="self-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </Text>
      <Text as="span" title={title} className="min-w-0 self-center truncate text-xs font-medium text-slate-700">
        {children}
      </Text>
    </>
  );
}

/* ── one training card ── */
function TrainingCard({ t, today }) {
  const m = modeOf(t.delivery_mode);
  const s = statusOf(t.status);
  const StatusIcon = s.icon;
  const done = isCompletedTraining(t);
  const cred = credentialInfo(t);
  const outcome = done ? outcomeInfo(t, cred) : cred;
  const { KindIcon, DocIcon } = cred;
  const when = relativeScheduleLabel(t, today);
  const stats = loadStats(t);
  // The detail route resolves a training by its code as readily as by its uuid,
  // so the URL stays readable: /my-courses/TRN-2026-0019
  const href = `/my-courses/${encodeURIComponent(t.code ?? t.id)}`;

  return (
    <Card className="flex flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-0 shadow-sm transition-shadow hover:shadow-md">
      <Box className="flex flex-1 flex-col p-5">

        {/* Certification vs training, and the lifecycle status. These are the
            two questions asked of every card, so they lead. */}
        <Box className="flex items-center justify-between gap-2">
          <Box className={cn(
            "inline-flex min-w-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[10px] font-bold uppercase tracking-wide ring-1",
            cred.kindCls
          )}>
            <KindIcon className="h-3 w-3 shrink-0" />
            <Text as="span" className="truncate text-[10px] font-bold uppercase tracking-wide text-inherit">
              {cred.kind}
            </Text>
          </Box>
          <Badge className={cn("shrink-0 border-0 text-[10px] font-semibold", s.chip)}>
            <StatusIcon className="mr-1 h-3 w-3" />{s.label}
          </Badge>
        </Box>

        {/* Title — clamped to two lines so every card in a row is the same
            height regardless of how long a course name runs. */}
        <Text
          as="h3"
          title={t.title}
          className="mt-3 line-clamp-2 min-h-[2.5rem] text-sm font-bold leading-tight text-slate-900"
        >
          {t.title}
        </Text>
        <Box className="mt-1 flex items-center gap-2">
          <Text as="span" className="truncate font-mono text-[11px] text-slate-400">{t.code}</Text>
          {when && (
            <>
              <Text as="span" className="text-slate-200">·</Text>
              <Text as="span" className="shrink-0 text-[11px] font-semibold text-violet-600">{when}</Text>
            </>
          )}
        </Box>

        {/* Learning load up front — the figures a learner weighs before
            opening anything: how many hours in total, how many a day, and how
            many days actually carry a session (8 Oct → 18 Oct is eleven days
            but only eight of them are taught). Equal-width columns with
            dividers, so the numbers line up whether there are two or three. */}
        {stats.length > 0 && (
          <Box className={cn(
            "mt-4 grid divide-x divide-violet-100 overflow-hidden rounded-xl bg-violet-50/60 ring-1 ring-violet-100",
            STAT_COLS[stats.length]
          )}>
            {stats.map((st) => (
              <Box key={st.label} className="px-2 py-2.5 text-center">
                <Text as="p" className="text-base font-extrabold leading-none text-violet-700">
                  {st.value}
                  <Text as="span" className="text-[11px] font-bold text-violet-400">{st.unit}</Text>
                </Text>
                <Text as="p" className="mt-1 text-[9px] font-bold uppercase leading-none tracking-wide text-violet-400">
                  {st.label}
                </Text>
              </Box>
            ))}
          </Box>
        )}

        {/* Facts. One grid for every row, so the label column is a straight
            edge down the card and the values start at the same x. */}
        <Box className="mt-4 grid grid-cols-[0.875rem_4.25rem_minmax(0,1fr)] items-start gap-x-2 gap-y-2.5 border-t border-slate-100 pt-4">
          <Row icon={CalendarClock} label="Dates" title={dateRange(t.start_date, t.end_date)}>
            {dateRange(t.start_date, t.end_date)}
          </Row>
          <Row icon={Clock} label="Time" title={timeRange(t)}>{timeRange(t)}</Row>
          {t.timezone && (
            <Row icon={Globe} label="Timezone" title={t.timezone}>{t.timezone}</Row>
          )}
          <Row icon={m.icon} label="Format">{m.label}</Row>
          <Row icon={GraduationCap} label="Trainer" title={t.trainer_name || ""}>
            {t.trainer_name || "Not assigned yet"}
          </Row>
          {t.sponsor_email && (
            <Row icon={Building2} label="Sponsor" title={t.sponsor_email}>{t.sponsor_email}</Row>
          )}
        </Box>

        {/* What you walk away with. Given its own block rather than another
            fact row, because it is the answer to the question the status badge
            raises and it needs a sentence, not a value. */}
        <Box className="mt-4 flex items-start gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5 ring-1 ring-slate-100">
          <Box className={cn("mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg", cred.docCls)}>
            <DocIcon className="h-3.5 w-3.5" />
          </Box>
          <Box className="min-w-0">
            <Text as="p" className="text-[10px] font-semibold uppercase leading-none tracking-wide text-slate-400">
              {done ? "Your document" : "On completion you receive"}
            </Text>
            <Text as="p" className="mt-1 truncate text-xs font-bold text-slate-800" title={outcome.doc}>
              {outcome.doc}
            </Text>
            <Text as="p" className={cn("mt-0.5 text-[11px] leading-snug", outcome.tone ?? "text-slate-500")}>
              {outcome.note}
            </Text>
          </Box>
        </Box>

        {/* `mt-auto` pins the action to the bottom edge, so buttons line up
            across a row even when one card carries a sponsor and another
            doesn't. */}
        <Box className="mt-auto pt-4">
          <Link
            href={href}
            aria-label={`Open training details for ${t.title}`}
            className="flex h-10 w-full items-center justify-center gap-1.5 rounded-xl bg-violet-600 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
          >
            <Text as="span" className="text-xs font-semibold text-white">View training details</Text>
            <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
          </Link>
        </Box>
      </Box>
    </Card>
  );
}

/* ── group section ── */
function Group({ title, subtitle, icon: Icon, tone, items, empty, today }) {
  return (
    <Box className="space-y-3">
      <Box className="flex items-center gap-2.5">
        <Box className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", tone)}>
          <Icon className="h-4 w-4" />
        </Box>
        <Box className="min-w-0">
          <Box className="flex items-center gap-2">
            <Text as="h2" className="text-sm font-bold text-slate-800">{title}</Text>
            <Text as="span" className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
              {items.length}
            </Text>
          </Box>
          <Text as="p" className="text-[11px] text-slate-400">{subtitle}</Text>
        </Box>
      </Box>

      {items.length === 0 ? (
        <Card className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-5 py-6">
          <Text as="p" className="text-center text-xs text-slate-400">{empty}</Text>
        </Card>
      ) : (
        <Box className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((t) => <TrainingCard key={t.id} t={t} today={today} />)}
        </Box>
      )}
    </Box>
  );
}

/* ═══════════════════════════════════════════════ Main ══ */
export function MyTrainingsList() {
  const { token } = useAuth();
  const [trainings, setTrainings] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    if (!token) return;
    fetchMyTrainings({ token })
      .then((d) => { setTrainings(d?.trainings ?? d ?? []); setError(null); })
      .catch((e) => setError(e.message || String(e)));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <Card className="rounded-xl border border-red-200/60 bg-red-50 p-6">
        <Text as="p" className="text-sm text-red-600">Failed to load your trainings: {error}</Text>
      </Card>
    );
  }

  if (!trainings) {
    return (
      <Box className="space-y-6">
        {Array.from({ length: 2 }).map((_, g) => (
          <Box key={g} className="space-y-3">
            <Skeleton className="h-8 w-48 rounded-xl" />
            <Box className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-60 rounded-2xl" />)}
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  // One clock reading for the whole render, so two cards can never disagree
  // about what "today" is.
  const today = todayWallClock();
  const { upcoming, ongoing, completed } = classifyTrainings(trainings, today);

  if (trainings.length === 0) {
    return (
      <Card className="rounded-2xl border border-slate-200/80 bg-white px-6 py-16 text-center">
        <Box className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50">
          <BookOpen className="h-7 w-7 text-violet-300" />
        </Box>
        <Text as="h3" className="text-sm font-bold text-slate-700">You&apos;re not enrolled in a training yet</Text>
        <Text as="p" className="mx-auto mt-1.5 max-w-sm text-xs text-slate-400">
          Enrolments are set up by our team. Once a seat is booked for you it will appear here.
        </Text>
      </Card>
    );
  }

  return (
    <Box className="space-y-8">
      <Group
        title="Ongoing" subtitle="Running right now" icon={PlayCircle}
        tone="bg-sky-100 text-sky-600" items={ongoing} today={today}
        empty="No training is running at the moment."
      />
      <Group
        title="Upcoming" subtitle="Scheduled ahead of you" icon={Clock3}
        tone="bg-amber-100 text-amber-600" items={upcoming} today={today}
        empty="Nothing scheduled — you're all caught up."
      />
      <Group
        title="Completed" subtitle="Finished trainings and their certificates" icon={Award}
        tone="bg-emerald-100 text-emerald-600" items={completed} today={today}
        empty="No completed trainings yet."
      />
    </Box>
  );
}
