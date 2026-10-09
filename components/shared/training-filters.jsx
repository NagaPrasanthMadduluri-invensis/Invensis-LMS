"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Search, SlidersHorizontal, CalendarClock, Activity, AlertCircle, Globe, Timer, Calendar, X,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { toDateInput } from "@/lib/datetime";
import { regionForTimezone, REGION_OPTIONS } from "@/lib/region";

export const STATUS_CONFIG = {
  pending:   { label: "Pending",   badge: "bg-warning-subtle text-warning-subtle-foreground ring-1 ring-warning-border" },
  active:    { label: "Active",    badge: "bg-success-subtle text-success-subtle-foreground ring-1 ring-success-border" },
  ongoing:   { label: "Ongoing",   badge: "bg-info-subtle text-info-subtle-foreground ring-1 ring-info-border" },
  completed: { label: "Completed", badge: "bg-surface-muted text-foreground-muted" },
  cancelled: { label: "Cancelled", badge: "bg-error-subtle text-error ring-1 ring-error-border" },
  postponed: { label: "Postponed", badge: "bg-warning-subtle text-warning-subtle-foreground ring-1 ring-warning-border" },
  suspended: { label: "Suspended", badge: "bg-error-subtle text-error-subtle-foreground ring-1 ring-error-border" },
};

export const STATUS_ORDER = ["active", "ongoing", "pending", "postponed", "suspended", "completed", "cancelled"];

export const titleCase = (v) => String(v ?? "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/* A future, still-"active" training reads as "Upcoming" rather than "Active". */
export function statusBadge(training) {
  const cfg = STATUS_CONFIG[training?.status] || STATUS_CONFIG.active;
  const today = toDateInput();
  if (training?.status === "active" && training?.start_date && training.start_date > today) {
    return { label: "Upcoming", badge: "bg-primary-subtle text-primary ring-1 ring-primary-border" };
  }
  return { label: cfg.label, badge: cfg.badge };
}

/* Shared training-list filters — used by both the admin and trainer lists so
   they behave identically. Returns the filtered list plus the ready filter bar. */
export function useTrainingFilters(trainings, { initialStatus = "all", searchPlaceholder = "Search by training ID or title...", showDue = true } = {}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [regionFilter, setRegionFilter] = useState("");
  const [durationFilter, setDurationFilter] = useState("");

  const list = Array.isArray(trainings) ? trainings : [];
  const today = toDateInput();

  const statusCounts = list.reduce((acc, t) => { acc[t.status] = (acc[t.status] || 0) + 1; return acc; }, {});

  const filtered = list.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch =
      (t.title ?? "").toLowerCase().includes(q) ||
      (t.code ?? "").toLowerCase().includes(q) ||
      (t.event_code ?? "").toLowerCase().includes(q);
    if (!matchesSearch) return false;
    // Lifecycle / status — single-select group (only one active at a time).
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

  const hasFilters = !!search || statusFilter !== "all" || !!dateFrom || !!dateTo || !!regionFilter || !!durationFilter;
  const clearFilters = () => { setSearch(""); setStatusFilter("all"); setDateFrom(""); setDateTo(""); setRegionFilter(""); setDurationFilter(""); };

  const dueCount = list.filter((t) => t.due_for_update).length;
  const upcomingCount = list.filter((t) => t.start_date && t.start_date > today).length;
  const ongoingCount = list.filter((t) => t.start_date && t.end_date && t.start_date <= today && t.end_date >= today).length;
  const durationOptions = [...new Set(list.map((t) => t.hours_per_day).filter((v) => v != null))].sort((a, b) => a - b);

  const STATUS_TABS = [
    { key: "all", label: "All" },
    ...Object.keys(statusCounts)
      .filter((k) => k !== "ongoing" && (statusCounts[k] > 0 || k === statusFilter))
      .sort((a, b) => {
        const ia = STATUS_ORDER.indexOf(a), ib = STATUS_ORDER.indexOf(b);
        return (ia === -1 ? STATUS_ORDER.length : ia) - (ib === -1 ? STATUS_ORDER.length : ib);
      })
      .map((k) => ({ key: k, label: STATUS_CONFIG[k]?.label ?? titleCase(k) })),
  ];

  const chip = (key, label, Icon, count, activeCls) => (
    <button
      type="button"
      onClick={() => setStatusFilter(key)}
      aria-pressed={statusFilter === key}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
        statusFilter === key ? activeCls : "bg-surface border-border text-foreground-muted hover:border-border-strong hover:bg-surface-hover"
      }`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />} {label}
      <Text as="span" className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold leading-none tabular-nums ${
        statusFilter === key ? "bg-white/20 text-white" : "bg-surface-muted text-foreground-muted"
      }`}>{count}</Text>
    </button>
  );

  const bar = (
    <Card className="rounded-2xl border border-slate-200/80 shadow-sm p-3.5 space-y-3.5">
      <Box className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle" />
        <Input
          placeholder={searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoComplete="off"
          className="pl-10 pr-9 h-10 text-sm bg-surface-hover border-border rounded-xl focus-visible:ring-2 focus-visible:ring-focus focus-visible:border-primary-border"
        />
        {search && (
          <button type="button" onClick={() => setSearch("")} aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-subtle hover:text-foreground-muted transition-colors">
            <X className="h-4 w-4" />
          </button>
        )}
      </Box>

      <Box className="h-px bg-surface-muted" />

      <Box className="flex items-center gap-3 flex-wrap">
        <SlidersHorizontal className="h-4 w-4 text-foreground-subtle shrink-0" />
        <Box className="flex items-center gap-1.5 flex-wrap">
          {STATUS_TABS.map((tab) =>
            chip(tab.key, tab.label, null, tab.key === "all" ? list.length : (statusCounts[tab.key] || 0), "bg-primary border-primary text-primary-foreground shadow-sm"),
          )}
          <Box className="mx-1 h-5 w-px bg-surface-muted shrink-0" aria-hidden="true" />
          {chip("upcoming", "Upcoming", CalendarClock, upcomingCount, "bg-primary border-primary text-primary-foreground shadow-sm")}
          {chip("ongoing", "Ongoing", Activity, ongoingCount, "bg-success border-success text-success-foreground shadow-sm")}
          {showDue && chip("due", "Due for update", AlertCircle, dueCount, "bg-warning border-warning text-warning-foreground shadow-sm")}
          {hasFilters && (
            <button type="button" onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-lg border border-transparent px-3 py-1.5 text-xs font-semibold text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground">
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </Box>
        <Text as="p" className="ml-auto text-xs text-foreground-subtle shrink-0 tabular-nums">
          Showing {filtered.length} of {list.length}
        </Text>
      </Box>

      <Box className="h-px bg-surface-muted" />

      <Box className="flex items-center gap-2.5 flex-wrap">
        <Box className="flex items-center gap-1.5 h-9 px-2.5 bg-surface-hover border border-border rounded-xl">
          <Globe className="h-4 w-4 text-foreground-subtle shrink-0" />
          <select value={regionFilter} onChange={(e) => setRegionFilter(e.target.value)}
            className="h-8 bg-transparent text-xs font-medium text-foreground-muted focus:outline-none">
            <option value="">All regions</option>
            {REGION_OPTIONS.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
          </select>
        </Box>
        <Box className="flex items-center gap-1.5 h-9 px-2.5 bg-surface-hover border border-border rounded-xl">
          <Timer className="h-4 w-4 text-foreground-subtle shrink-0" />
          <select value={durationFilter} onChange={(e) => setDurationFilter(e.target.value)}
            className="h-8 bg-transparent text-xs font-medium text-foreground-muted focus:outline-none">
            <option value="">Any duration</option>
            {durationOptions.map((h) => <option key={h} value={String(h)}>{h}hrs</option>)}
          </select>
        </Box>
        <Box className="flex items-center gap-1.5 h-9 px-2.5 bg-surface-hover border border-border rounded-xl">
          <Calendar className="h-4 w-4 text-foreground-subtle shrink-0" />
          <input type="date" value={dateFrom} max={dateTo || undefined} onChange={(e) => setDateFrom(e.target.value)}
            className="h-8 bg-transparent text-xs font-medium text-foreground-muted focus:outline-none" title="Start date from" />
          <Text as="span" className="text-foreground-subtle text-xs">–</Text>
          <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(e) => setDateTo(e.target.value)}
            className="h-8 bg-transparent text-xs font-medium text-foreground-muted focus:outline-none" title="Start date to" />
        </Box>
      </Box>
    </Card>
  );

  return { filtered, bar };
}
