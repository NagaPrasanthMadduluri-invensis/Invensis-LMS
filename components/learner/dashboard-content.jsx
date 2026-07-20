"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen, Award, GraduationCap, Clock, CalendarClock, CheckCircle2,
  ChevronRight, Video, MapPin, Users, ArrowRight, Sparkles, Flame,
  CircleUser, RefreshCw, AlertCircle, Rocket, TrendingUp,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchLearnerDashboard } from "@/services/api/learner/learner-api";

/* ──────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────── */

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function firstNameOf(name = "") {
  return name.trim().split(/\s+/)[0] || "Learner";
}

const MODE = {
  virtual:   { icon: Video, label: "Virtual",   chip: "bg-sky-100 text-sky-700" },
  in_person: { icon: MapPin, label: "In-person", chip: "bg-amber-100 text-amber-700" },
  hybrid:    { icon: Video, label: "Hybrid",    chip: "bg-violet-100 text-violet-700" },
};
function modeOf(m) { return MODE[m] || { icon: Video, label: m || "—", chip: "bg-slate-100 text-slate-600" }; }

const ENROL_BADGE = {
  confirmed:   "bg-emerald-100 text-emerald-700",
  completed:   "bg-violet-100 text-violet-700",
  cancelled:   "bg-rose-100 text-rose-700",
  transferred: "bg-violet-100 text-violet-700",
};
function cap(s = "") { return s.charAt(0).toUpperCase() + s.slice(1); }

/* ──────────────────────────────────────────────────────────
   Mid-light stat card
   ────────────────────────────────────────────────────────── */

const STAT_THEMES = {
  indigo:  { card: "border-violet-200 bg-violet-100",   iconWrap: "bg-violet-200 text-violet-700",   value: "text-violet-900",  label: "text-violet-700/80" },
  sky:     { card: "border-sky-200 bg-sky-100",         iconWrap: "bg-sky-200 text-sky-700",         value: "text-sky-900",     label: "text-sky-700/80" },
  amber:   { card: "border-amber-200 bg-amber-100",     iconWrap: "bg-amber-200 text-amber-700",     value: "text-amber-900",   label: "text-amber-700/80" },
  emerald: { card: "border-emerald-200 bg-emerald-100", iconWrap: "bg-emerald-200 text-emerald-700", value: "text-emerald-900", label: "text-emerald-700/80" },
  fuchsia: { card: "border-fuchsia-200 bg-fuchsia-100", iconWrap: "bg-fuchsia-200 text-fuchsia-700", value: "text-fuchsia-900", label: "text-fuchsia-700/80" },
  violet:  { card: "border-violet-200 bg-violet-100",   iconWrap: "bg-violet-200 text-violet-700",   value: "text-violet-900",  label: "text-violet-700/80" },
};

function StatCard({ icon: Icon, label, value, theme }) {
  return (
    <Card className={`rounded-2xl border p-4 shadow-sm ${theme.card}`}>
      <Box className="flex items-start justify-between">
        <Box className={`flex h-10 w-10 items-center justify-center rounded-xl ${theme.iconWrap}`}>
          <Icon className="h-5 w-5" />
        </Box>
        <Text as="p" className={`text-3xl font-extrabold leading-none ${theme.value}`}>{value}</Text>
      </Box>
      <Text as="p" className={`mt-3 text-xs font-semibold ${theme.label}`}>{label}</Text>
    </Card>
  );
}

/* Panel wrapper */
function Panel({ title, icon: Icon, action, children, className = "" }) {
  return (
    <Card className={`overflow-hidden rounded-2xl border border-slate-200 shadow-sm ${className}`}>
      <Box className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
        <Box className="flex items-center gap-2">
          {Icon && <Icon className="h-4 w-4 text-slate-400" />}
          <Text as="h3" className="text-sm font-semibold text-slate-800">{title}</Text>
        </Box>
        {action}
      </Box>
      <Box className="p-5">{children}</Box>
    </Card>
  );
}

function EmptyState({ icon: Icon, text }) {
  return (
    <Box className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <Icon className="h-8 w-8 text-slate-200" />
      <Text as="p" className="text-sm text-slate-400">{text}</Text>
    </Box>
  );
}

/* ──────────────────────────────────────────────────────────
   Course card (my_courses)
   ────────────────────────────────────────────────────────── */

function CourseCard({ course }) {
  const m = modeOf(course.delivery_mode);
  const ModeIcon = m.icon;
  const pct = Math.round(course.progress_pct ?? 0);
  return (
    <Link
      href="/my-courses"
      className="block rounded-xl border border-slate-200 p-4 transition-colors hover:border-violet-300 hover:bg-slate-50/60"
    >
      <Box className="flex items-start justify-between gap-3">
        <Box className="min-w-0">
          <Text as="p" className="truncate text-sm font-semibold text-slate-800">{course.title}</Text>
          <Text as="span" className="font-mono text-[11px] text-slate-400">{course.code}</Text>
        </Box>
        <Badge className={`shrink-0 border-0 text-[10px] font-semibold ${ENROL_BADGE[course.enrolment_status] || "bg-slate-100 text-slate-600"}`}>
          {cap(course.enrolment_status)}
        </Badge>
      </Box>

      <Box className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
        <Box className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 ${m.chip}`}>
          <ModeIcon className="h-3 w-3" />{m.label}
        </Box>
        <Box className="flex items-center gap-1">
          <CalendarClock className="h-3 w-3" />
          {formatDate(course.start_date)} – {formatDate(course.end_date)}
        </Box>
        {course.duration_hours != null && (
          <Box className="flex items-center gap-1">
            <Clock className="h-3 w-3" />{course.duration_hours}h
          </Box>
        )}
      </Box>

      <Box className="mt-3 space-y-1">
        <Box className="flex items-center justify-between text-[11px]">
          <Text as="span" className="text-slate-500">
            {course.completed_sessions ?? 0}/{course.total_sessions ?? 0} sessions
          </Text>
          <Text as="span" className="font-semibold text-slate-700">{pct}%</Text>
        </Box>
        <Box className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <Box className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-500" style={{ width: `${Math.min(pct, 100)}%` }} />
        </Box>
      </Box>

      <Box className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
        {course.days_until_start > 0 ? (
          <Text as="span" className="text-[11px] font-medium text-amber-600">Starts in {course.days_until_start} day{course.days_until_start !== 1 ? "s" : ""}</Text>
        ) : course.status === "completed" ? (
          <Text as="span" className="text-[11px] font-medium text-violet-600">Completed</Text>
        ) : (
          <Text as="span" className="text-[11px] font-medium text-emerald-600">In progress</Text>
        )}
        <Box className="flex items-center gap-1 text-[11px]">
          {course.meeting_released ? (
            <><Video className="h-3 w-3 text-emerald-500" /><Text as="span" className="text-emerald-600">Meeting live</Text></>
          ) : course.delivery_mode !== "in_person" ? (
            <Text as="span" className="text-slate-400">Meeting pending</Text>
          ) : null}
        </Box>
      </Box>
    </Link>
  );
}

/* ──────────────────────────────────────────────────────────
   Skeleton
   ────────────────────────────────────────────────────────── */

function DashboardSkeleton() {
  return (
    <Box className="space-y-6">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Box className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </Box>
      <Skeleton className="h-64 rounded-2xl" />
      <Box className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Skeleton className="h-56 rounded-2xl" />
        <Skeleton className="h-56 rounded-2xl" />
      </Box>
    </Box>
  );
}

/* ──────────────────────────────────────────────────────────
   Main
   ────────────────────────────────────────────────────────── */

export function DashboardContent() {
  const { user, token, sponsor } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    setRefreshing(true);
    fetchLearnerDashboard({ token })
      .then((d) => { setData(d); setError(null); })
      .catch((err) => setError(err.message))
      .finally(() => setRefreshing(false));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <Box className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5">
        <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
        <Box>
          <Text as="p" className="text-sm font-semibold text-rose-700">Couldn&rsquo;t load your dashboard</Text>
          <Text as="span" className="text-xs text-rose-600">{error}</Text>
        </Box>
        <Button size="sm" variant="outline" onClick={load} className="ml-auto border-rose-200 text-rose-700 hover:bg-rose-100">
          Retry
        </Button>
      </Box>
    );
  }

  if (!data) return <DashboardSkeleton />;

  const {
    learner = {}, stats = {}, my_courses = {},
    certificates = [], journey = [], upcoming_cohorts = [],
  } = data;

  const inProgress = my_courses.in_progress || [];
  const upcoming = my_courses.upcoming || [];
  const completed = my_courses.completed || [];
  const allCourses = [...inProgress, ...upcoming, ...completed];
  const completionPct = Math.round((stats.completion_rate ?? 0) * 100);

  const statCards = [
    { icon: BookOpen,      label: "Total Enrolments", value: stats.total_enrolments ?? 0, theme: STAT_THEMES.indigo },
    { icon: TrendingUp,    label: "In Progress",      value: stats.in_progress ?? 0,      theme: STAT_THEMES.sky },
    { icon: CalendarClock, label: "Upcoming",         value: stats.upcoming ?? 0,         theme: STAT_THEMES.amber },
    { icon: CheckCircle2,  label: "Completed",        value: stats.completed ?? 0,        theme: STAT_THEMES.emerald },
    { icon: Award,         label: "Certificates",     value: stats.certificates_earned ?? 0, theme: STAT_THEMES.fuchsia },
    { icon: Clock,         label: "Learning Hours",   value: stats.learning_hours ?? 0,   theme: STAT_THEMES.violet },
  ];

  return (
    <Box className="space-y-6">

      {/* ── Welcome banner ── */}
      <Card className="overflow-hidden rounded-2xl border border-violet-100 shadow-sm p-0" >
        <Box className="flex flex-wrap items-center gap-5 bg-gradient-to-r from-violet-50 via-purple-50 to-violet-50 px-6 py-5">
          <Avatar className="h-14 w-14 shrink-0 shadow-sm ring-2 ring-violet-200">
            {learner.avatar_url && <AvatarImage src={learner.avatar_url} alt={learner.name} />}
            <AvatarFallback className="bg-violet-600 text-xl font-bold text-white">
              {user?.initials || firstNameOf(learner.name)[0] || "L"}
            </AvatarFallback>
          </Avatar>
          <Box className="min-w-[180px] flex-1">
            <Text as="h2" className="text-lg font-bold leading-tight text-slate-800">
              Welcome back, {firstNameOf(learner.name)}!
            </Text>
            <Text as="p" className="mt-1 text-xs text-slate-500">
              {(learner.job_title || learner.company_name)
                ? [learner.job_title, learner.company_name].filter(Boolean).join(" · ")
                : `Member since ${formatDate(learner.member_since)}`}
              {sponsor?.name && <> · Sponsored by <span className="font-semibold text-violet-600">{sponsor.name}</span></>}
            </Text>
          </Box>

          {/* Completion ring */}
          <Box className="flex items-center gap-3 rounded-xl bg-white/70 px-4 py-2.5 shadow-sm">
            <Box className="relative flex h-12 w-12 items-center justify-center">
              <svg className="h-12 w-12 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="12" className="text-slate-100" />
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="12" strokeLinecap="round"
                  className="text-violet-500" strokeDasharray={`${(completionPct / 100) * 264} 264`} />
              </svg>
              <Text as="span" className="absolute text-[11px] font-bold text-slate-700">{completionPct}%</Text>
            </Box>
            <Box>
              <Text as="span" className="block text-[11px] font-semibold text-slate-700">Completion</Text>
              <Text as="span" className="block text-[10px] text-slate-400">overall progress</Text>
            </Box>
          </Box>

          <Button
            render={<Link href="/courses" />}
            className="h-9 shrink-0 gap-1 rounded-xl border-0 bg-violet-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-violet-700"
          >
            Browse Courses <ChevronRight className="h-4 w-4" />
          </Button>
        </Box>
      </Card>

      {/* ── Stat cards ── */}
      <Box className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {statCards.map((c) => <StatCard key={c.label} {...c} />)}
      </Box>

      {/* ── My Courses ── */}
      <Panel title="My Courses" icon={GraduationCap} action={
        <Link href="/my-courses" className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-800">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      }>
        {allCourses.length === 0 ? (
          <EmptyState icon={BookOpen} text="You're not enrolled in any courses yet." />
        ) : (
          <Box className="space-y-5">
            {inProgress.length > 0 && (
              <CourseGroup label="In Progress" color="text-sky-600" courses={inProgress} />
            )}
            {upcoming.length > 0 && (
              <CourseGroup label="Upcoming" color="text-amber-600" courses={upcoming} />
            )}
            {completed.length > 0 && (
              <CourseGroup label="Completed" color="text-emerald-600" courses={completed} />
            )}
          </Box>
        )}
      </Panel>

      {/* ── Journey + Certificates ── */}
      <Box className="grid grid-cols-1 gap-5 lg:grid-cols-2">

        {/* Learning journey */}
        <Panel title="Learning Journey" icon={Rocket}>
          {journey.length === 0 ? (
            <EmptyState icon={Rocket} text="Your learning journey starts here." />
          ) : (
            <Box className="relative pl-2">
              {[...journey].reverse().map((j, i, arr) => {
                const done = j.type === "completed";
                return (
                  <Box key={`${j.training_code}-${j.type}-${i}`} className="relative flex gap-3 pb-4 last:pb-0">
                    {i < arr.length - 1 && <Box className="absolute left-[11px] top-6 h-full w-px bg-slate-200" />}
                    <Box className={`z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${done ? "bg-emerald-100" : "bg-violet-100"}`}>
                      {done ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <GraduationCap className="h-3.5 w-3.5 text-violet-600" />}
                    </Box>
                    <Box className="min-w-0 pt-0.5">
                      <Text as="p" className="text-xs font-semibold text-slate-800">
                        {done ? "Completed" : "Enrolled in"} {j.title}
                      </Text>
                      <Text as="span" className="text-[11px] text-slate-400">{j.training_code} · {formatDate(j.date)}</Text>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </Panel>

        {/* Certificates */}
        <Panel title="Certificates" icon={Award}>
          {certificates.length === 0 ? (
            <EmptyState icon={Award} text="No certificates earned yet — finish a course to earn one." />
          ) : (
            <Box className="divide-y divide-slate-100">
              {certificates.map((cert, i) => (
                <Box key={cert.id || cert.training_code || i} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <Box className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                    <Award className="h-4 w-4 text-emerald-600" />
                  </Box>
                  <Box className="min-w-0 flex-1">
                    <Text as="p" className="truncate text-sm font-semibold text-slate-800">{cert.title || cert.course_name}</Text>
                    <Text as="span" className="text-[11px] text-slate-400">
                      {cert.training_code ? `${cert.training_code} · ` : ""}Issued {formatDate(cert.completed_at || cert.issued_at)}
                    </Text>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Panel>
      </Box>

      {/* ── Upcoming cohorts (register CTA) ── */}
      {upcoming_cohorts.length > 0 && (
        <Panel title="Open Cohorts — Register Now" icon={Sparkles} action={
          <Link href="/courses" className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-800">
            Browse all <ArrowRight className="h-3 w-3" />
          </Link>
        }>
          <Box className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {upcoming_cohorts.map((c) => {
              const m = modeOf(c.delivery_mode);
              const ModeIcon = m.icon;
              return (
                <Box key={c.schedule_id} className="rounded-xl border border-slate-200 p-4">
                  <Box className="flex items-start justify-between gap-2">
                    <Text as="p" className="min-w-0 truncate text-sm font-semibold text-slate-800">{c.title}</Text>
                    {c.is_full ? (
                      <Badge className="shrink-0 border-0 bg-rose-100 text-[10px] font-semibold text-rose-700">Full</Badge>
                    ) : c.filling_fast ? (
                      <Badge className="shrink-0 border-0 bg-amber-100 text-[10px] font-semibold text-amber-700"><Flame className="mr-0.5 h-3 w-3" />Filling fast</Badge>
                    ) : null}
                  </Box>
                  <Box className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    <Box className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 ${m.chip}`}>
                      <ModeIcon className="h-3 w-3" />{m.label}
                    </Box>
                    <Box className="flex items-center gap-1"><CalendarClock className="h-3 w-3" />{formatDate(c.start_date)}</Box>
                    {c.duration_hours != null && <Box className="flex items-center gap-1"><Clock className="h-3 w-3" />{c.duration_hours}h</Box>}
                  </Box>
                  <Box className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
                    <Box className="flex items-center gap-1 text-[11px] text-slate-500">
                      <Users className="h-3 w-3" />{c.seats_left} of {c.capacity} left
                    </Box>
                    <Text as="span" className="text-[11px] font-medium text-violet-600">Starts in {c.starts_in_days}d</Text>
                  </Box>
                  <Button
                    render={<Link href="/courses" />}
                    size="sm"
                    disabled={c.is_full}
                    className="mt-3 h-8 w-full rounded-lg border-0 bg-violet-600 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    {c.is_full ? "Cohort full" : "Register now"}
                  </Button>
                </Box>
              );
            })}
          </Box>
        </Panel>
      )}

      {/* ── Snapshot footer ── */}
      <Box className="flex items-center justify-between px-1">
        <Box className="flex items-center gap-2 text-slate-400">
          <CircleUser className="h-3.5 w-3.5" />
          <Text as="span" className="text-[11px]">{learner.email}</Text>
        </Box>
        <Button size="sm" variant="ghost" onClick={load} disabled={refreshing} className="gap-1.5 text-slate-500 hover:text-slate-800">
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </Box>

    </Box>
  );
}

/* ──────────────────────────────────────────────────────────
   Course group (labelled row of course cards)
   ────────────────────────────────────────────────────────── */

function CourseGroup({ label, color, courses }) {
  return (
    <Box>
      <Text as="p" className={`mb-2.5 text-[11px] font-bold uppercase tracking-wide ${color}`}>
        {label} · {courses.length}
      </Text>
      <Box className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {courses.map((c) => <CourseCard key={c.id} course={c} />)}
      </Box>
    </Box>
  );
}
