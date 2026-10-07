"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrainerLink } from "@/components/admin/entity-links";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Calendar, Users, Clock, UserCheck, UserX, UserPlus,
  ChevronRight, BookOpen, LayoutGrid, Link2, LinkIcon, X, SlidersHorizontal,
  AlertCircle, UploadCloud, Globe, Timer, CalendarClock, Activity,
} from "lucide-react";
import { ImportResourcesDialog } from "@/components/admin/import-resources-dialog";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { formatDate as fmtDate, toDateInput } from "@/lib/datetime";
import { fetchAdminTrainings } from "@/services/api/admin/admin-api";
import { regionForTimezone, REGION_OPTIONS } from "@/lib/region";

const STATUS_CONFIG = {
  pending:   { label: "Pending",   badge: "bg-warning-subtle text-warning-subtle-foreground ring-1 ring-warning-border",   accent: "bg-amber-400" },
  active:    { label: "Active",    badge: "bg-success-subtle text-success-subtle-foreground ring-1 ring-success-border", accent: "bg-success" },
  ongoing:   { label: "Ongoing",   badge: "bg-info-subtle text-info-subtle-foreground ring-1 ring-info-border",       accent: "bg-info" },
  completed: { label: "Completed", badge: "bg-surface-muted text-foreground-muted",                          accent: "bg-slate-400" },
  cancelled: { label: "Cancelled", badge: "bg-error-subtle text-error ring-1 ring-error-border",           accent: "bg-error" },
  postponed: { label: "Postponed", badge: "bg-warning-subtle text-warning-subtle-foreground ring-1 ring-warning-border",  accent: "bg-warning" },
  suspended: { label: "Suspended", badge: "bg-error-subtle text-error-subtle-foreground ring-1 ring-error-border",        accent: "bg-error" },
};

/* Lifecycle order for the status tabs. This is an ORDERING, not a list of tabs
   to render: which tabs appear is decided by the statuses the API actually
   returns. Hardcoding the tabs meant offering Pending and Ongoing — statuses no
   code path ever assigns — so an admin could filter to a bucket that can only
   ever be empty. Anything the API returns that isn't listed here still gets a
   tab, appended at the end, so a new status can never go missing from the UI. */
const STATUS_ORDER = ["active", "ongoing", "pending", "postponed", "suspended", "completed", "cancelled"];

// Fallback label for a status the UI has no config for yet.
const titleCase = (v) => String(v ?? "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const MODE_LABEL = {
  virtual: "Live Virtual", in_person: "In Person", hybrid: "Hybrid", one_to_one: "1-to-1",
};

// Training dates print exactly as the API sent them — see `lib/datetime`.
const formatDate = (d) => fmtDate(d);

function StatCard({ label, value, icon: Icon, bg, border, iconBg, iconCls, valueCls, labelCls }) {
  return (
    <Card className={`rounded-2xl ${border} shadow-sm ${bg} px-5 py-4`}>
      <Box className="flex items-center gap-3">
        <Box className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
          <Icon className={`h-5 w-5 ${iconCls}`} />
        </Box>
        <Box className="min-w-0">
          <Text as="p" className={`text-2xl font-bold ${valueCls} leading-none`}>{value}</Text>
          <Text as="p" className={`text-xs ${labelCls} font-medium mt-1`}>{label}</Text>
        </Box>
      </Box>
    </Card>
  );
}

function CardSkeleton() {
  return (
    <Card className="rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
      <Box className="flex justify-between">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </Box>
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
      <Box className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </Box>
      <Skeleton className="h-9 w-full rounded-xl" />
    </Card>
  );
}

function initialsOf(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join("") || "?";
}

function TrainingCard({ training, onClick }) {
  const statusCfg = STATUS_CONFIG[training.status] || STATUS_CONFIG.active;
  const hasTrainer = training.trainer_assigned;

  return (
    <Card
      className="rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer bg-surface overflow-hidden group flex flex-col"
      onClick={onClick}
    >
      <Box className="p-5 flex flex-col flex-1 gap-4">

        {/* Row 1: Training ID + schedule event code + Status.
            The event code is the CMS's own identifier for the schedule
            ("INL000055") — the same value printed on a certificate as its
            Course Identifier. It is shown next to the Training ID so an admin
            can match a training here against the schedule in the CMS without
            opening it. Older/manually created schedules have none, and the
            chip is then omitted rather than shown empty. */}
        <Box className="flex items-center justify-between gap-2">
          <Box className="flex min-w-0 items-center gap-1.5">
            <Text as="span" className="shrink-0 text-[11px] font-mono font-bold text-primary bg-primary-subtle ring-1 ring-primary-border px-2.5 py-1 rounded-lg tracking-wide">
              {training.code}
            </Text>
            {training.event_code && (
              <Text
                as="span"
                title={`Schedule event code · ${training.event_code}`}
                className="shrink-0 text-[11px] font-mono font-bold text-foreground-muted bg-surface-hover ring-1 ring-border px-2.5 py-1 rounded-lg tracking-wide"
              >
                {training.event_code}
              </Text>
            )}
          </Box>
          <Box className="flex shrink-0 items-center gap-1.5">
            {training.due_for_update && (
              <Badge className="text-[10px] font-semibold border-0 bg-warning-subtle text-warning-subtle-foreground ring-1 ring-warning-border">Due for Update</Badge>
            )}
            <Badge className={`text-[10px] font-semibold border-0 ${statusCfg.badge}`}>{statusCfg.label}</Badge>
          </Box>
        </Box>

        {/* Title */}
        <Text as="h3" className="text-base font-bold text-foreground leading-snug line-clamp-2 min-h-[2.75rem] break-words hyphens-none group-hover:text-primary transition-colors">
          {training.title}
        </Text>

        {/* Metadata pills */}
        <Box className="flex flex-wrap gap-2">
          <Box className="flex items-center gap-2 bg-surface-hover border border-slate-200/70 rounded-xl px-3 py-2">
            <Calendar className="h-3.5 w-3.5 text-foreground-subtle shrink-0" />
            <Text as="span" className="text-xs font-medium text-foreground-muted leading-none">{formatDate(training.start_date)}</Text>
          </Box>
          <Box className="flex items-center gap-2 bg-surface-hover border border-slate-200/70 rounded-xl px-3 py-2">
            <Clock className="h-3.5 w-3.5 text-foreground-subtle shrink-0" />
            <Text as="span" className="text-xs font-medium text-foreground-muted leading-none">
              {MODE_LABEL[training.delivery_mode] || training.delivery_mode}
              {training.duration_hours != null && ` · ${training.duration_hours}h`}
            </Text>
          </Box>
          <Box className="flex items-center gap-2 bg-surface-hover border border-slate-200/70 rounded-xl px-3 py-2">
            <Users className="h-3.5 w-3.5 text-foreground-subtle shrink-0" />
            <Text as="span" className="text-xs font-medium text-foreground-muted leading-none">{training.enrolled_count}/{training.capacity} seats</Text>
          </Box>
          {training.hours_per_day != null && (
            <Box className="flex items-center gap-2 bg-info-subtle border border-info-border rounded-xl px-3 py-2" title="Session length per day">
              <Timer className="h-3.5 w-3.5 text-info shrink-0" />
              <Text as="span" className="text-xs font-medium text-info-subtle-foreground leading-none">{training.hours_per_day}hrs</Text>
            </Box>
          )}
          {(() => {
            const region = regionForTimezone(training.timezone);
            return region ? (
              <Box className="flex items-center gap-2 bg-info-subtle border border-info-border rounded-xl px-3 py-2" title={`Region · ${training.timezone}`}>
                <Globe className="h-3.5 w-3.5 text-info shrink-0" />
                <Text as="span" className="text-xs font-medium text-info-subtle-foreground leading-none">{region.label}</Text>
              </Box>
            ) : null;
          })()}
          {training.setup_pending_count > 0 && (
            <Box
              className="flex items-center gap-2 bg-warning-subtle border border-warning-border rounded-xl px-3 py-2"
              title="Enrolled learners who haven't set up their account yet"
            >
              <UserX className="h-3.5 w-3.5 text-warning shrink-0" />
              <Text as="span" className="text-xs font-medium text-warning-subtle-foreground leading-none">{training.setup_pending_count} setup pending</Text>
            </Box>
          )}
        </Box>

        {/* Info blocks — trainer + meeting link */}
        <Box className="flex-1 flex flex-col gap-2.5">

          {/* Trainer block */}
          {hasTrainer ? (
            <Box className="flex items-center gap-3 bg-success-subtle ring-1 ring-success-border rounded-xl px-3.5 py-3">
              <Box className="w-8 h-8 rounded-full bg-success flex items-center justify-center shrink-0 shadow-sm">
                <Text as="span" className="text-[11px] font-bold text-success-foreground leading-none">{initialsOf(training.trainer_name)}</Text>
              </Box>
              <Box className="min-w-0 flex-1">
                <Text as="p" className="text-[10px] font-bold text-success uppercase tracking-widest leading-none mb-0.5">Trainer</Text>
                <TrainerLink id={training.trainer_id} className="block text-sm font-semibold text-success-subtle-foreground truncate">{training.trainer_name}</TrainerLink>
              </Box>
              <UserCheck className="h-4 w-4 text-success shrink-0" />
            </Box>
          ) : (
            <Box
              className="flex items-center justify-between gap-3 bg-warning-subtle ring-1 ring-warning-border rounded-xl px-3.5 py-3 hover:bg-warning-subtle transition-colors"
              onClick={(e) => { e.stopPropagation(); onClick(); }}
            >
              <Box className="flex items-center gap-3 min-w-0">
                <Box className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center shrink-0">
                  <UserX className="h-3.5 w-3.5 text-warning-subtle-foreground" />
                </Box>
                <Box className="min-w-0">
                  <Text as="p" className="text-[10px] font-bold text-warning-subtle-foreground uppercase tracking-widest leading-none mb-0.5">No Trainer</Text>
                  <Text as="p" className="text-[11px] text-warning">Click to assign</Text>
                </Box>
              </Box>
              <Box className="flex items-center gap-1 bg-error hover:bg-error text-error-foreground text-[11px] font-bold px-3 py-1.5 rounded-lg shrink-0 transition-colors shadow-sm">
                <UserPlus className="h-3 w-3" />
                Assign
              </Box>
            </Box>
          )}

          {/* Meeting link block */}
          {training.meeting_released ? (
            <Box className="flex items-center gap-3 bg-primary-subtle ring-1 ring-primary-border rounded-xl px-3.5 py-3">
              <Box className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm">
                <Link2 className="h-3.5 w-3.5 text-primary-foreground" />
              </Box>
              <Box className="min-w-0 flex-1">
                <Text as="p" className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none mb-0.5">Meeting Link</Text>
                <Text as="p" className="text-sm font-semibold text-primary">Released to participants</Text>
              </Box>
              <Box className="w-2 h-2 rounded-full bg-violet-500 shrink-0 shadow-sm" />
            </Box>
          ) : training.meeting_url ? (
            <Box className="flex items-center gap-3 bg-warning-subtle ring-1 ring-warning-border rounded-xl px-3.5 py-3">
              <Box className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shrink-0 shadow-sm">
                <LinkIcon className="h-3.5 w-3.5 text-warning-foreground" />
              </Box>
              <Box className="min-w-0 flex-1">
                <Text as="p" className="text-[10px] font-bold text-warning-subtle-foreground uppercase tracking-widest leading-none mb-0.5">Meeting Link</Text>
                <Text as="p" className="text-sm font-semibold text-warning-subtle-foreground">Set · Not yet released</Text>
              </Box>
              <Box className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            </Box>
          ) : (
            <Box className="flex items-center gap-3 bg-surface-hover ring-1 ring-border rounded-xl px-3.5 py-3">
              <Box className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center shrink-0">
                <LinkIcon className="h-3.5 w-3.5 text-foreground-muted" />
              </Box>
              <Box className="min-w-0 flex-1">
                <Text as="p" className="text-[10px] font-bold text-foreground-subtle uppercase tracking-widest leading-none mb-0.5">Meeting Link</Text>
                <Text as="p" className="text-sm font-medium text-foreground-muted">Not configured</Text>
              </Box>
              <Box className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
            </Box>
          )}

        </Box>

        {/* Footer */}
        <Box className="pt-3 border-t border-border">
          <Button
            size="sm"
            className="w-full h-9 bg-primary text-primary-foreground hover:bg-primary-hover text-xs font-semibold rounded-xl border-0 gap-1.5"
          >
            Manage Training <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </Box>

      </Box>
    </Card>
  );
}

export function TrainingsList() {
  const { token } = useAuth();
  const router = useRouter();
  const [trainings, setTrainings] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");
  const [importOpen, setImportOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [regionFilter, setRegionFilter] = useState("");     // region key
  const [durationFilter, setDurationFilter] = useState(""); // hours_per_day
  const [error, setError] = useState(null);

  const pathname = usePathname();

  // Keying on `pathname` (not just `token`) forces a refetch every time the
  // admin navigates back to this list — e.g. via the "Courses" <Link> from a
  // training's detail page after reassigning a trainer. Without it, Next.js's
  // client-side route cache can restore this component without remounting it,
  // so a mount-only fetch would never see the update.
  useEffect(() => {
    if (!token) return;
    fetchAdminTrainings({ token })
      .then((data) => setTrainings(data.trainings || []))
      .catch((err) => setError(err.message));
  }, [token, pathname]);

  if (error) {
    return (
      <Card className="p-6 rounded-2xl border-0 bg-error-subtle shadow-sm">
        <Text as="p" className="text-error text-sm">Failed to load trainings: {error}</Text>
      </Card>
    );
  }

  if (!trainings) {
    return (
      <Box className="space-y-6">
        <Box className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </Box>
        <Box className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </Box>
      </Box>
    );
  }

  const unassigned = trainings.filter((t) => !t.trainer_assigned).length;
  const statusCounts = trainings.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});
  // Declared before `filtered` — the filter reads `today`, and a const used
  // before its declaration is a temporal-dead-zone error.
  const today = toDateInput();
  const filtered = trainings.filter((t) => {
    const q = search.toLowerCase();
    // The event code is searchable too — an admin arriving from the CMS has
    // the INL code in hand, not the Training ID.
    const matchesSearch =
      t.title.toLowerCase().includes(q) ||
      t.code.toLowerCase().includes(q) ||
      (t.event_code ?? "").toLowerCase().includes(q);
    if (!matchesSearch) return false;
    // Lifecycle / status — a single-select group (only one active at a time):
    //   upcoming = starts in the future; ongoing = running now; due = ended but
    //   not marked completed; otherwise a real training status (or "all").
    if (statusFilter === "upcoming") {
      if (!(t.start_date && t.start_date > today)) return false;
    } else if (statusFilter === "ongoing") {
      if (!(t.start_date && t.end_date && t.start_date <= today && t.end_date >= today)) return false;
    } else if (statusFilter === "due") {
      if (!t.due_for_update) return false;
    } else if (statusFilter !== "all" && t.status !== statusFilter) {
      return false;
    }
    if (dateFrom && (!t.start_date || t.start_date < dateFrom)) return false;
    if (dateTo && (!t.start_date || t.start_date > dateTo)) return false;
    if (regionFilter && regionForTimezone(t.timezone)?.key !== regionFilter) return false;
    if (durationFilter && String(t.hours_per_day) !== durationFilter) return false;
    return true;
  });

  const hasFilters = !!search || statusFilter !== "all"
    || !!dateFrom || !!dateTo || !!regionFilter || !!durationFilter;

  function clearFilters() {
    setSearch(""); setStatusFilter("all");
    setDateFrom(""); setDateTo(""); setRegionFilter(""); setDurationFilter("");
  }

  const dueCount = trainings.filter((t) => t.due_for_update).length;
  const upcomingCount = trainings.filter((t) => t.start_date && t.start_date > today).length;
  const ongoingCount = trainings.filter((t) => t.start_date && t.end_date && t.start_date <= today && t.end_date >= today).length;
  // Only offer the per-day durations actually present, smallest first.
  const durationOptions = [...new Set(trainings.map((t) => t.hours_per_day).filter((v) => v != null))].sort((a, b) => a - b);

  /* Tabs come from the statuses present in the response. `statusCounts` is
     already derived from `trainings`, so this needs no second pass over the
     data. The selected tab is kept even once it empties, so the list can't
     reshuffle under a reader who has just filtered by it. */
  const STATUS_TABS = [
    { key: "all", label: "All" },
    ...Object.keys(statusCounts)
      // "ongoing" is offered as a date-based lifecycle chip below, not a raw tab.
      .filter((k) => k !== "ongoing" && (statusCounts[k] > 0 || k === statusFilter))
      .sort((a, b) => {
        const ia = STATUS_ORDER.indexOf(a), ib = STATUS_ORDER.indexOf(b);
        return (ia === -1 ? STATUS_ORDER.length : ia) - (ib === -1 ? STATUS_ORDER.length : ib);
      })
      .map((k) => ({ key: k, label: STATUS_CONFIG[k]?.label ?? titleCase(k) })),
  ];

  return (
    <Box className="space-y-6">
      {/* Bulk actions */}
      <Box className="flex justify-end">
        <Button variant="outline" onClick={() => setImportOpen(true)}
          className="h-9 gap-1.5 border-border text-foreground hover:bg-surface-muted">
          <UploadCloud className="h-4 w-4" /> Import resources (CSV)
        </Button>
      </Box>
      <ImportResourcesDialog open={importOpen} onOpenChange={setImportOpen} />

      {/* Stat cards */}
      <Box className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Trainings"   value={trainings.length}              icon={LayoutGrid}
          bg="bg-primary-subtle"  border="border border-primary-border"  iconBg="bg-primary-subtle"  iconCls="text-primary"  valueCls="text-primary"  labelCls="text-primary" />
        <StatCard label="Trainer Assigned"  value={trainings.length - unassigned} icon={UserCheck}
          bg="bg-success-subtle" border="border border-success-border" iconBg="bg-success-subtle" iconCls="text-success" valueCls="text-success-subtle-foreground" labelCls="text-success" />
        <StatCard label="Awaiting Trainer"  value={unassigned}                    icon={UserX}
          bg="bg-warning-subtle"   border="border border-warning-border"   iconBg="bg-warning-subtle"   iconCls="text-warning"   valueCls="text-warning-subtle-foreground"   labelCls="text-warning" />
      </Box>

      {/* Toolbar: search + status filters */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm p-3.5 space-y-3.5">
        {/* Search */}
        <Box className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle" />
          <Input
            placeholder="Search by training ID, event code or title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            className="pl-10 pr-9 h-10 text-sm bg-surface-hover border-border rounded-xl focus-visible:ring-2 focus-visible:ring-violet-400/40 focus-visible:border-primary-border"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-subtle hover:text-foreground-muted transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </Box>

        <Box className="h-px bg-surface-muted" />

        {/* Status filters + result count */}
        <Box className="flex items-center gap-3 flex-wrap">
          <SlidersHorizontal className="h-4 w-4 text-foreground-subtle shrink-0" />
          <Box className="flex items-center gap-1.5 flex-wrap">
            {STATUS_TABS.map((tab) => {
              const count = tab.key === "all" ? trainings.length : (statusCounts[tab.key] || 0);
              const activeTab = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                    activeTab
                      ? "bg-primary border-primary text-primary-foreground shadow-sm"
                      : "bg-surface border-border text-foreground-muted hover:border-border-strong hover:bg-surface-hover"
                  }`}
                >
                  {tab.label}
                  <Text
                    as="span"
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums ${
                      activeTab ? "bg-white/20 text-white" : "bg-surface-muted text-foreground-muted"
                    }`}
                  >
                    {count}
                  </Text>
                </button>
              );
            })}

            {/* Lifecycle filters — part of the SAME single-select group as the
                status tabs above, so only one filter is ever active at a time. */}
            <Box className="mx-1 h-5 w-px bg-surface-muted shrink-0" aria-hidden="true" />
            <button
              type="button"
              onClick={() => setStatusFilter("upcoming")}
              aria-pressed={statusFilter === "upcoming"}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === "upcoming"
                  ? "bg-primary border-primary text-primary-foreground shadow-sm"
                  : "bg-surface border-border text-foreground-muted hover:border-primary-border hover:text-primary"
              }`}
            >
              <CalendarClock className="h-3.5 w-3.5" /> Upcoming
              <Text as="span" className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums ${
                statusFilter === "upcoming" ? "bg-white/20 text-white" : "bg-surface-muted text-foreground-muted"
              }`}>{upcomingCount}</Text>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("ongoing")}
              aria-pressed={statusFilter === "ongoing"}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === "ongoing"
                  ? "bg-success border-success text-success-foreground shadow-sm"
                  : "bg-surface border-border text-foreground-muted hover:border-success-border hover:text-success"
              }`}
            >
              <Activity className="h-3.5 w-3.5" /> Ongoing
              <Text as="span" className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums ${
                statusFilter === "ongoing" ? "bg-white/20 text-white" : "bg-surface-muted text-foreground-muted"
              }`}>{ongoingCount}</Text>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter("due")}
              aria-pressed={statusFilter === "due"}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
                statusFilter === "due"
                  ? "bg-warning border-warning text-warning-foreground shadow-sm"
                  : "bg-surface border-border text-foreground-muted hover:border-warning-border hover:text-warning"
              }`}
            >
              <AlertCircle className="h-3.5 w-3.5" /> Due for update
              <Text as="span" className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums ${
                statusFilter === "due" ? "bg-white/20 text-white" : "bg-surface-muted text-foreground-muted"
              }`}>{dueCount}</Text>
            </button>

            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-xs font-semibold text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" /> Clear
              </button>
            )}
          </Box>
          <Text as="p" className="ml-auto text-xs text-foreground-subtle shrink-0 tabular-nums">
            Showing {filtered.length} of {trainings.length}
          </Text>
        </Box>

        <Box className="h-px bg-surface-muted" />

        {/* Region / duration / start-date range filters */}
        <Box className="flex items-center gap-2.5 flex-wrap">
          {/* Region */}
          <Box className="flex items-center gap-1.5 h-9 px-2.5 bg-surface-hover border border-border rounded-xl">
            <Globe className="h-4 w-4 text-foreground-subtle shrink-0" />
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="h-8 bg-transparent text-xs font-medium text-foreground-muted focus:outline-none"
            >
              <option value="">All regions</option>
              {REGION_OPTIONS.map((r) => (
                <option key={r.key} value={r.key}>{r.label}</option>
              ))}
            </select>
          </Box>

          {/* Per-day duration */}
          <Box className="flex items-center gap-1.5 h-9 px-2.5 bg-surface-hover border border-border rounded-xl">
            <Timer className="h-4 w-4 text-foreground-subtle shrink-0" />
            <select
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
              className="h-8 bg-transparent text-xs font-medium text-foreground-muted focus:outline-none"
            >
              <option value="">Any duration</option>
              {durationOptions.map((h) => (
                <option key={h} value={String(h)}>{h}hrs</option>
              ))}
            </select>
          </Box>

          {/* Start-date range */}
          <Box className="flex items-center gap-1.5 h-9 px-2.5 bg-surface-hover border border-border rounded-xl">
            <Calendar className="h-4 w-4 text-foreground-subtle shrink-0" />
            <input
              type="date"
              value={dateFrom}
              max={dateTo || undefined}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-8 bg-transparent text-xs font-medium text-foreground-muted focus:outline-none"
              title="Start date from"
            />
            <Text as="span" className="text-foreground-subtle text-xs">–</Text>
            <input
              type="date"
              value={dateTo}
              min={dateFrom || undefined}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-8 bg-transparent text-xs font-medium text-foreground-muted focus:outline-none"
              title="Start date to"
            />
          </Box>
        </Box>
      </Card>

      {filtered.length === 0 ? (
        <Card className="p-14 text-center rounded-2xl border border-slate-200/80 shadow-sm bg-surface">
          <Box className="w-14 h-14 rounded-2xl bg-surface-muted flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-7 w-7 text-foreground-subtle" />
          </Box>
          <Text as="p" className="text-sm font-semibold text-foreground-muted">
            {search || statusFilter !== "all" ? "No trainings match your filters" : "No trainings yet"}
          </Text>
        </Card>
      ) : (
        <Box className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((t) => (
            <TrainingCard key={t.id} training={t} onClick={() => router.push(`/admin/courses/${t.id}`)} />
          ))}
        </Box>
      )}
    </Box>
  );
}
