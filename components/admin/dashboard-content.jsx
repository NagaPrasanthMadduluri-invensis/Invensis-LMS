"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Users, GraduationCap, BookOpen, ClipboardList, Award, Gauge,
  UserCheck, CalendarClock, CheckCircle2, RefreshCw, Ticket,
  Video, MapPin, ArrowRight, Clock, Mail, AlertCircle,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchAdminOverview } from "@/services/api/admin/admin-api";

/* ──────────────────────────────────────────────────────────
   Helpers
   ────────────────────────────────────────────────────────── */

function getInitials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "U";
}

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-cyan-100 text-cyan-700",
  "bg-pink-100 text-pink-700",
];

function avatarColor(seed = "") {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

function formatDateTime(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

const STATUS_BADGE = {
  active:      "bg-emerald-100 text-emerald-700",
  ongoing:     "bg-sky-100 text-sky-700",
  pending:     "bg-amber-100 text-amber-700",
  completed:   "bg-indigo-100 text-indigo-700",
  cancelled:   "bg-rose-100 text-rose-700",
  confirmed:   "bg-emerald-100 text-emerald-700",
  transferred: "bg-violet-100 text-violet-700",
  failed:      "bg-rose-100 text-rose-700",
};

function statusClass(s) {
  return STATUS_BADGE[String(s).toLowerCase()] || "bg-slate-100 text-slate-600";
}

function cap(s = "") {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/* ──────────────────────────────────────────────────────────
   Hero metric card — mid-light, colorful
   ────────────────────────────────────────────────────────── */

function HeroCard({ icon: Icon, label, value, sub, theme }) {
  return (
    <Card className={`relative overflow-hidden rounded-2xl border p-5 shadow-sm ${theme.card}`}>
      <Box className={`absolute -right-4 -top-4 opacity-20 ${theme.watermark}`}>
        <Icon className="h-24 w-24" />
      </Box>
      <Box className="relative">
        <Box className={`flex h-10 w-10 items-center justify-center rounded-xl ${theme.iconWrap}`}>
          <Icon className="h-5 w-5" />
        </Box>
        <Text as="h2" className={`mt-4 text-3xl font-extrabold leading-none ${theme.value}`}>{value}</Text>
        <Text as="span" className={`mt-1 block text-sm font-semibold ${theme.label}`}>{label}</Text>
        {sub && <Text as="span" className={`mt-0.5 block text-xs ${theme.sub}`}>{sub}</Text>}
      </Box>
    </Card>
  );
}

/* Mid-light card themes — soft tinted backgrounds, deep-tone text, colored icon chips. */
const HERO_THEMES = {
  indigo:  { card: "border-indigo-200 bg-indigo-100",   watermark: "text-indigo-400",  iconWrap: "bg-indigo-200 text-indigo-700",   value: "text-indigo-900",  label: "text-indigo-800",  sub: "text-indigo-600/80" },
  fuchsia: { card: "border-fuchsia-200 bg-fuchsia-100", watermark: "text-fuchsia-400", iconWrap: "bg-fuchsia-200 text-fuchsia-700", value: "text-fuchsia-900", label: "text-fuchsia-800", sub: "text-fuchsia-600/80" },
  sky:     { card: "border-sky-200 bg-sky-100",         watermark: "text-sky-400",     iconWrap: "bg-sky-200 text-sky-700",         value: "text-sky-900",     label: "text-sky-800",     sub: "text-sky-600/80" },
  emerald: { card: "border-emerald-200 bg-emerald-100", watermark: "text-emerald-400", iconWrap: "bg-emerald-200 text-emerald-700", value: "text-emerald-900", label: "text-emerald-800", sub: "text-emerald-600/80" },
  amber:   { card: "border-amber-200 bg-amber-100",     watermark: "text-amber-400",   iconWrap: "bg-amber-200 text-amber-700",     value: "text-amber-900",   label: "text-amber-800",   sub: "text-amber-600/80" },
  rose:    { card: "border-rose-200 bg-rose-100",       watermark: "text-rose-400",    iconWrap: "bg-rose-200 text-rose-700",       value: "text-rose-900",    label: "text-rose-800",    sub: "text-rose-600/80" },
};

/* ──────────────────────────────────────────────────────────
   Panel wrapper
   ────────────────────────────────────────────────────────── */

function Panel({ title, icon: Icon, action, children, className = "" }) {
  return (
    <Card className={`border border-slate-200 rounded-2xl shadow-sm overflow-hidden ${className}`}>
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

function ViewAll({ href }) {
  return (
    <Link href={href} className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800">
      View all <ArrowRight className="h-3 w-3" />
    </Link>
  );
}

/* ──────────────────────────────────────────────────────────
   Breakdown bar (labelled, colored, proportional)
   ────────────────────────────────────────────────────────── */

function BreakdownRow({ label, value, total, color }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <Box className="space-y-1.5">
      <Box className="flex items-center justify-between">
        <Text as="span" className="text-xs font-medium capitalize text-slate-600">{label}</Text>
        <Text as="span" className="text-xs font-semibold text-slate-800">{value}</Text>
      </Box>
      <Box className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <Box className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </Box>
    </Box>
  );
}

/* Small stat chip for status breakdowns */
function StatChip({ label, value, className }) {
  return (
    <Box className={`rounded-xl px-3 py-2.5 ${className}`}>
      <Text as="span" className="block text-xl font-bold leading-none">{value}</Text>
      <Text as="span" className="mt-1 block text-[11px] font-medium capitalize opacity-80">{label}</Text>
    </Box>
  );
}

/* ──────────────────────────────────────────────────────────
   Skeleton
   ────────────────────────────────────────────────────────── */

function DashboardSkeleton() {
  return (
    <Box className="space-y-6">
      <Box className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </Box>
      <Box className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
        ))}
      </Box>
      <Box className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </Box>
    </Box>
  );
}

/* ──────────────────────────────────────────────────────────
   Main
   ────────────────────────────────────────────────────────── */

export function AdminDashboardContent() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    setRefreshing(true);
    fetchAdminOverview({ token })
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
          <Text as="p" className="text-sm font-semibold text-rose-700">Couldn&rsquo;t load the dashboard</Text>
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
    users = {}, trainers = {}, courses = {}, enrolments = {},
    certificates = {}, tickets = {},
    upcoming_trainings = [], completed_trainings = [],
    recent_enrolments = [], recent_trainers = [],
    generated_at,
  } = data;

  const byRole = users.by_role || {};
  const fillPct = Math.round((courses.fill_rate || 0) * 100);

  const heroCards = [
    {
      icon: Users, label: "Total Users", value: users.total ?? 0,
      sub: `${users.active ?? 0} active · ${users.pending_setup ?? 0} pending setup`,
      theme: HERO_THEMES.indigo,
    },
    {
      icon: GraduationCap, label: "Trainers", value: trainers.total ?? 0,
      sub: `${trainers.assigned ?? 0} assigned · ${trainers.unassigned ?? 0} free`,
      theme: HERO_THEMES.fuchsia,
    },
    {
      icon: BookOpen, label: "Trainings", value: courses.total ?? 0,
      sub: `${courses.upcoming ?? 0} upcoming · ${courses.ongoing ?? 0} ongoing`,
      theme: HERO_THEMES.sky,
    },
    {
      icon: ClipboardList, label: "Enrolments", value: enrolments.total ?? 0,
      sub: `${enrolments.confirmed ?? 0} confirmed · ${enrolments.completed ?? 0} done`,
      theme: HERO_THEMES.emerald,
    },
    {
      icon: Award, label: "Certificates", value: certificates.issued ?? 0,
      sub: `${certificates.trainer_certificates ?? 0} trainer certs`,
      theme: HERO_THEMES.amber,
    },
    {
      icon: Gauge, label: "Seat Fill Rate", value: `${fillPct}%`,
      sub: `${courses.total_enrolled ?? 0} / ${courses.total_capacity ?? 0} seats`,
      theme: HERO_THEMES.rose,
    },
  ];

  return (
    <Box className="space-y-6">

      {/* ── Snapshot bar ── */}
      <Box className="flex items-center justify-between">
        <Box className="flex items-center gap-2 text-slate-400">
          <Box className="h-2 w-2 rounded-full bg-emerald-500" />
          <Text as="span" className="text-xs">
            Live snapshot · updated {generated_at ? timeAgo(generated_at) : "now"}
          </Text>
        </Box>
        <Button size="sm" variant="ghost" onClick={load} disabled={refreshing} className="gap-1.5 text-slate-500 hover:text-slate-800">
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </Box>

      {/* ── Hero metric cards ── */}
      <Box className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {heroCards.map((c) => <HeroCard key={c.label} {...c} />)}
      </Box>

      {/* ── Breakdowns: Users by role · Enrolment status · Capacity ── */}
      <Box className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Users by role */}
        <Panel title="Users by Role" icon={Users} action={<ViewAll href="/admin/users" />}>
          <Box className="space-y-3.5">
            <BreakdownRow label="Learners" value={byRole.learner ?? 0} total={users.total ?? 0} color="bg-indigo-500" />
            <BreakdownRow label="Trainers" value={byRole.trainer ?? 0} total={users.total ?? 0} color="bg-fuchsia-500" />
            <BreakdownRow label="Sponsors" value={byRole.sponsor ?? 0} total={users.total ?? 0} color="bg-sky-500" />
            <BreakdownRow label="Admins"   value={byRole.admin ?? 0}   total={users.total ?? 0} color="bg-amber-500" />
          </Box>
          <Box className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
            {users.participants_total ?? 0} participants on rosters
          </Box>
        </Panel>

        {/* Enrolment status */}
        <Panel title="Enrolment Status" icon={ClipboardList} action={<ViewAll href="/admin/orders" />}>
          <Box className="grid grid-cols-2 gap-2.5">
            <StatChip label="confirmed"   value={enrolments.confirmed ?? 0}   className="bg-emerald-50 text-emerald-700" />
            <StatChip label="completed"   value={enrolments.completed ?? 0}   className="bg-indigo-50 text-indigo-700" />
            <StatChip label="transferred" value={enrolments.transferred ?? 0} className="bg-violet-50 text-violet-700" />
            <StatChip label="cancelled"   value={enrolments.cancelled ?? 0}   className="bg-rose-50 text-rose-700" />
          </Box>
          {enrolments.failed > 0 && (
            <Box className="mt-2.5">
              <StatChip label="failed" value={enrolments.failed} className="bg-red-50 text-red-700" />
            </Box>
          )}
        </Panel>

        {/* Capacity utilisation */}
        <Panel title="Capacity Utilisation" icon={Gauge}>
          <Box className="flex flex-col items-center justify-center py-1">
            <Box className="relative flex h-28 w-28 items-center justify-center">
              <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="10" className="text-slate-100" />
                <circle
                  cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round"
                  className="text-rose-500"
                  strokeDasharray={`${(fillPct / 100) * 264} 264`}
                />
              </svg>
              <Box className="absolute text-center">
                <Text as="span" className="block text-2xl font-extrabold text-slate-800">{fillPct}%</Text>
                <Text as="span" className="block text-[10px] text-slate-400">filled</Text>
              </Box>
            </Box>
            <Text as="span" className="mt-3 text-sm font-medium text-slate-600">
              {courses.total_enrolled ?? 0} of {courses.total_capacity ?? 0} seats
            </Text>
            <Box className="mt-3 flex w-full items-center justify-around border-t border-slate-100 pt-3">
              <Box className="text-center">
                <Text as="span" className="block text-base font-bold text-emerald-600">{courses.meeting_released ?? 0}</Text>
                <Text as="span" className="block text-[10px] text-slate-400">meetings live</Text>
              </Box>
              <Box className="text-center">
                <Text as="span" className="block text-base font-bold text-indigo-600">{courses.completed ?? 0}</Text>
                <Text as="span" className="block text-[10px] text-slate-400">completed</Text>
              </Box>
            </Box>
          </Box>
        </Panel>
      </Box>

      {/* ── Course pipeline strip ── */}
      <Panel title="Course Pipeline" icon={BookOpen} action={<ViewAll href="/admin/courses" />}>
        <Box className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { key: "pending",   color: "bg-amber-50 text-amber-700" },
            { key: "active",    color: "bg-emerald-50 text-emerald-700" },
            { key: "ongoing",   color: "bg-sky-50 text-sky-700" },
            { key: "completed", color: "bg-indigo-50 text-indigo-700" },
            { key: "cancelled", color: "bg-rose-50 text-rose-700" },
          ].map(({ key, color }) => (
            <StatChip key={key} label={key} value={(courses.by_status || {})[key] ?? 0} className={`text-center ${color}`} />
          ))}
        </Box>
      </Panel>

      {/* ── Upcoming trainings ── */}
      <Panel title="Upcoming Trainings" icon={CalendarClock} action={<ViewAll href="/admin/courses" />}>
        {upcoming_trainings.length === 0 ? (
          <EmptyState icon={CalendarClock} text="No upcoming trainings scheduled" />
        ) : (
          <Box className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {upcoming_trainings.map((t) => {
              const pct = t.capacity > 0 ? Math.round((t.enrolled_count / t.capacity) * 100) : 0;
              return (
                <Box key={t.id} className="rounded-xl border border-slate-200 p-4 transition-colors hover:border-indigo-300 hover:bg-slate-50/60">
                  <Box className="flex items-start justify-between gap-3">
                    <Box className="min-w-0">
                      <Text as="p" className="truncate text-sm font-semibold text-slate-800">{t.title}</Text>
                      <Text as="span" className="font-mono text-[11px] text-slate-400">{t.code}</Text>
                    </Box>
                    <Badge variant="secondary" className={`shrink-0 border-0 text-[10px] ${statusClass(t.status)}`}>
                      {cap(t.status)}
                    </Badge>
                  </Box>

                  <Box className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    <Box className="flex items-center gap-1">
                      {t.delivery_mode === "virtual"
                        ? <Video className="h-3 w-3 text-sky-500" />
                        : <MapPin className="h-3 w-3 text-amber-500" />}
                      {cap(t.delivery_mode || "—")}
                    </Box>
                    <Box className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(t.start_date)} – {formatDate(t.end_date)}
                    </Box>
                  </Box>

                  <Box className="mt-3 space-y-1">
                    <Box className="flex items-center justify-between text-[11px]">
                      <Text as="span" className="text-slate-500">{t.enrolled_count}/{t.capacity} enrolled</Text>
                      <Text as="span" className="font-semibold text-slate-700">{pct}%</Text>
                    </Box>
                    <Box className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                      <Box className={`h-full rounded-full ${pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-indigo-500" : "bg-amber-500"}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </Box>
                  </Box>

                  <Box className="mt-3 flex items-center gap-1.5 border-t border-slate-100 pt-2.5 text-[11px]">
                    {t.trainer_assigned ? (
                      <>
                        <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                        <Text as="span" className="text-slate-600">{t.trainer_name}</Text>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-3.5 w-3.5 text-amber-500" />
                        <Text as="span" className="text-amber-600">No trainer assigned</Text>
                      </>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Panel>

      {/* ── Recent enrolments + Recent trainers ── */}
      <Box className="grid grid-cols-1 gap-4 lg:grid-cols-2">

        {/* Recent enrolments */}
        <Panel title="Recent Enrolments" icon={ClipboardList} action={<ViewAll href="/admin/orders" />}>
          {recent_enrolments.length === 0 ? (
            <EmptyState icon={ClipboardList} text="No recent enrolments" />
          ) : (
            <Box className="divide-y divide-slate-100">
              {recent_enrolments.map((e) => (
                <Box key={e.enrolment_id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <Box className="flex min-w-0 items-center gap-2.5">
                    <Box className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${avatarColor(e.participant_email)}`}>
                      {getInitials(e.participant_name)}
                    </Box>
                    <Box className="min-w-0">
                      <Text as="p" className="truncate text-xs font-semibold text-slate-800">{e.participant_name}</Text>
                      <Text as="span" className="block truncate text-[11px] text-slate-400">{e.training_title}</Text>
                    </Box>
                  </Box>
                  <Box className="shrink-0 text-right">
                    <Badge variant="secondary" className={`border-0 text-[10px] ${statusClass(e.status)}`}>{cap(e.status)}</Badge>
                    <Text as="span" className="mt-0.5 block text-[10px] text-slate-400">{timeAgo(e.enrolled_at)}</Text>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Panel>

        {/* Recent trainers */}
        <Panel title="Recent Trainers" icon={GraduationCap} action={<ViewAll href="/admin/trainers" />}>
          {recent_trainers.length === 0 ? (
            <EmptyState icon={GraduationCap} text="No trainers onboarded yet" />
          ) : (
            <Box className="divide-y divide-slate-100">
              {recent_trainers.map((tr) => (
                <Box key={tr.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <Box className="flex min-w-0 items-center gap-2.5">
                    <Box className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${avatarColor(tr.email)}`}>
                      {getInitials(tr.name)}
                    </Box>
                    <Box className="min-w-0">
                      <Text as="p" className="truncate text-xs font-semibold text-slate-800">{tr.name}</Text>
                      <Text as="span" className="flex items-center gap-1 truncate text-[11px] text-slate-400">
                        <Mail className="h-3 w-3" />{tr.email}
                      </Text>
                    </Box>
                  </Box>
                  <Box className="shrink-0 text-right">
                    <Badge variant="secondary" className={`border-0 text-[10px] ${tr.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {tr.is_active ? "Active" : "Inactive"}
                    </Badge>
                    <Text as="span" className="mt-0.5 block text-[10px] text-slate-400">{formatDate(tr.created_at)}</Text>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Panel>
      </Box>

      {/* ── Completed trainings (only when present) ── */}
      {completed_trainings.length > 0 && (
        <Panel title="Recently Completed Trainings" icon={CheckCircle2}>
          <Box className="divide-y divide-slate-100">
            {completed_trainings.map((t) => (
              <Box key={t.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <Box className="min-w-0">
                  <Text as="p" className="truncate text-xs font-semibold text-slate-800">{t.title}</Text>
                  <Text as="span" className="font-mono text-[11px] text-slate-400">{t.code}</Text>
                </Box>
                <Box className="shrink-0 text-right">
                  <Text as="span" className="block text-xs font-semibold text-slate-700">{t.enrolled_count}/{t.capacity}</Text>
                  <Text as="span" className="block text-[10px] text-slate-400">{formatDate(t.end_date)}</Text>
                </Box>
              </Box>
            ))}
          </Box>
        </Panel>
      )}

      {/* ── Support tickets (placeholder-aware) ── */}
      <Panel title="Support Tickets" icon={Ticket} action={<ViewAll href="/admin/tickets" />}>
        {tickets.supported ? (
          <Box className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <StatChip label="open"        value={tickets.open ?? 0}        className="bg-amber-50 text-amber-700" />
            <StatChip label="in progress" value={tickets.in_progress ?? 0} className="bg-sky-50 text-sky-700" />
            <StatChip label="resolved"    value={tickets.resolved ?? 0}    className="bg-emerald-50 text-emerald-700" />
            <StatChip label="closed"      value={tickets.closed ?? 0}      className="bg-slate-100 text-slate-600" />
          </Box>
        ) : (
          <Box className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
            <Ticket className="h-5 w-5 shrink-0 text-slate-300" />
            <Text as="span" className="text-xs text-slate-500">
              Support ticketing isn&rsquo;t available yet — live counts will appear here once the feature ships.
            </Text>
          </Box>
        )}
      </Panel>

    </Box>
  );
}

/* ──────────────────────────────────────────────────────────
   Empty state
   ────────────────────────────────────────────────────────── */

function EmptyState({ icon: Icon, text }) {
  return (
    <Box className="flex flex-col items-center justify-center gap-2 py-8 text-center">
      <Icon className="h-8 w-8 text-slate-200" />
      <Text as="p" className="text-sm text-slate-400">{text}</Text>
    </Box>
  );
}
