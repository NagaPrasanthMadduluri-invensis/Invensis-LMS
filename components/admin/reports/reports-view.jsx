"use client";

/*
 * Admin Reports — a sales/revenue-first snapshot, distinct from the analytics
 * dashboard. Answers "where are sales happening, and where are they weak?" over
 * a customizable period (last 6/12 months or a custom start–end range), with the
 * same filter vocabulary as analytics. The summary PDF (report-pdf.js) mirrors
 * this layout table-for-table.
 *
 * Presentation is deliberately uniform: one card shell (CARD), one section
 * header (SectionHead), one data table (SalesTable) with aligned numeric columns,
 * a share bar, zebra striping and a Total row — so the page reads as one system.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Wallet, Users, Receipt, TrendingUp, TrendingDown, Globe, BookOpen,
  Layers, Briefcase, Video, CalendarRange, Filter, X, RefreshCw,
  FileDown, Building2, GraduationCap, Repeat, UserPlus,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Box from "@/components/ui/box";
import Text from "@/components/ui/text";
import { useAuth } from "@/hooks/use-auth";
import { fetchSalesReport } from "@/services/api/admin/reports-api";
import { printSalesReport } from "./report-pdf";

const ALL = "all";
const CARD = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm";

const RANGE_OPTIONS = [
  { value: "6m", label: "Last 6 months" },
  { value: "12m", label: "Last 12 months" },
  { value: "24m", label: "Last 24 months" },
  { value: "custom", label: "Custom range" },
  { value: ALL, label: "All time" },
];
const MODE_OPTIONS = [
  { value: "virtual", label: "Virtual" },
  { value: "in_person", label: "In-person" },
  { value: "hybrid", label: "Hybrid" },
  { value: "one_to_one", label: "One-to-one" },
];
const BUCKET_OPTIONS = [
  { value: "direct_online", label: "Direct online" },
  { value: "corporate", label: "Corporate" },
  { value: "one_to_one_coaching", label: "1:1 coaching" },
];
const STATUS_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "ongoing", label: "Ongoing" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];
const SPONSORSHIP_OPTIONS = [
  { value: "self", label: "Self-sponsored" },
  { value: "corporate", label: "Corporate" },
];

const MODE_LABEL = Object.fromEntries(MODE_OPTIONS.map((o) => [o.value, o.label]));
const BUCKET_LABEL = Object.fromEntries(BUCKET_OPTIONS.map((o) => [o.value, o.label]));
const cap = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);

// Start date (YYYY-MM-DD) for a "last N months" preset.
function presetFrom(range) {
  if (range === ALL || range === "custom") return "";
  const months = { "6m": 6, "12m": 12, "24m": 24 }[range] ?? 12;
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

function money(n, currency = "USD") {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency", currency, maximumFractionDigits: 0,
    }).format(Number(n ?? 0));
  } catch {
    return `${currency} ${Number(n ?? 0).toLocaleString()}`;
  }
}

function fmtD(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

/* ── Section eyebrow that separates the three report zones ── */
function SectionTitle({ children, hint }) {
  return (
    <Box className="flex items-baseline gap-3 border-b border-slate-200 pb-2 pt-1">
      <Text as="h2" className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">{children}</Text>
      {hint && <Text as="span" className="text-[11px] text-slate-400">{hint}</Text>}
    </Box>
  );
}

/* ── Card header used by every panel (icon chip + title + optional count) ── */
function SectionHead({ icon: Icon, title, subtitle, danger, count }) {
  return (
    <Box className="mb-3 flex items-center gap-2">
      <Box className={`flex h-7 w-7 items-center justify-center rounded-lg ${danger ? "bg-rose-50 text-rose-500" : "bg-violet-50 text-violet-500"}`}>
        <Icon className="h-4 w-4" />
      </Box>
      <Text as="h3" className="text-sm font-bold text-slate-800">{title}</Text>
      {subtitle && <Text as="span" className="truncate text-[11px] text-slate-400">· {subtitle}</Text>}
      {count != null && (
        <Text as="span" className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-slate-500">{count}</Text>
      )}
    </Box>
  );
}

/* ── Period-over-period delta (arrow + %) ── */
function Delta({ pct }) {
  if (pct == null) return <Text as="span" className="text-xs font-semibold text-slate-400">n/a</Text>;
  const up = pct >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <Box as="span" className={`inline-flex items-center gap-0.5 text-xs font-bold ${up ? "text-emerald-600" : "text-rose-600"}`}>
      <Icon className="h-3.5 w-3.5" />{up ? "+" : ""}{pct}%
    </Box>
  );
}

/* ── KPI card ── */
const KPI_THEMES = {
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  indigo: "border-violet-200 bg-violet-50 text-violet-700",
  sky: "border-sky-200 bg-sky-50 text-sky-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
};
function KpiCard({ icon: Icon, label, value, sub, theme }) {
  return (
    <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <Box className={`flex h-9 w-9 items-center justify-center rounded-xl border ${KPI_THEMES[theme]}`}>
        <Icon className="h-5 w-5" />
      </Box>
      <Text as="span" className="mt-3 block text-2xl font-extrabold leading-none text-slate-800 tabular-nums">{value}</Text>
      <Text as="span" className="mt-1 block text-xs font-semibold text-slate-600">{label}</Text>
      {sub && <Text as="span" className="mt-0.5 block text-[11px] text-slate-400">{sub}</Text>}
    </Card>
  );
}

/* ── Filter select (mirrors analytics: base UI Select needs an items map) ── */
function FilterSelect({ value, onChange, placeholder, options, allLabel }) {
  const items = { [ALL]: allLabel, ...Object.fromEntries(options.map((o) => [o.value, o.label])) };
  return (
    <Select value={value} onValueChange={onChange} items={items}>
      <SelectTrigger className="h-9 w-full min-w-0 bg-white text-xs sm:w-[150px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ── The one revenue table used everywhere: rank · name · revenue · enrolments ·
   share bar, with zebra rows and a Total footer. `rank={false}` for time series. ── */
function SalesTable({ icon: Icon, title, subtitle, rows = [], nameKey, nameLabel, currency, formatName, danger, rank = true }) {
  const totalRev = rows.reduce((s, r) => s + (r.revenue ?? 0), 0);
  const totalEnr = rows.reduce((s, r) => s + (r.enrolments ?? 0), 0);
  return (
    <Card className={CARD}>
      <SectionHead icon={Icon} title={title} subtitle={subtitle} danger={danger} count={rows.length || null} />
      {rows.length === 0 ? (
        <Text as="p" className="py-8 text-center text-xs italic text-slate-400">No sales in this period.</Text>
      ) : (
        <Box className="overflow-x-auto">
          <Box as="table" className="w-full border-collapse text-xs">
            <Box as="thead">
              <Box as="tr" className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
                {rank && <Box as="th" className="w-7 py-2 pr-1 text-left font-semibold">#</Box>}
                <Box as="th" className="py-2 pr-2 text-left font-semibold">{nameLabel}</Box>
                <Box as="th" className="py-2 px-2 text-right font-semibold">Revenue</Box>
                <Box as="th" className="py-2 px-2 text-right font-semibold">Enrol.</Box>
                <Box as="th" className="w-28 py-2 pl-2 text-right font-semibold">Share</Box>
              </Box>
            </Box>
            <Box as="tbody">
              {rows.map((r, i) => {
                const share = totalRev > 0 ? ((r.revenue ?? 0) / totalRev) * 100 : 0;
                const name = formatName ? formatName(r[nameKey]) : r[nameKey];
                return (
                  <Box as="tr" key={`${r[nameKey]}-${i}`} className="border-b border-slate-50 odd:bg-white even:bg-slate-50/40 hover:bg-slate-50">
                    {rank && <Box as="td" className="py-2 pr-1 text-left font-semibold tabular-nums text-slate-300">{i + 1}</Box>}
                    <Box as="td" className="max-w-[180px] truncate py-2 pr-2 font-medium text-slate-700" title={name}>{name}</Box>
                    <Box as="td" className="py-2 px-2 text-right font-bold tabular-nums text-slate-800">{money(r.revenue, currency)}</Box>
                    <Box as="td" className="py-2 px-2 text-right tabular-nums text-slate-500">{(r.enrolments ?? 0).toLocaleString()}</Box>
                    <Box as="td" className="py-2 pl-2">
                      <Box className="flex items-center justify-end gap-2">
                        <Box className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100">
                          <Box className={`h-full rounded-full ${danger ? "bg-rose-400" : "bg-violet-400"}`} style={{ width: `${Math.round(share)}%` }} />
                        </Box>
                        <Text as="span" className="w-8 text-right tabular-nums text-[11px] text-slate-400">{share.toFixed(0)}%</Text>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
            {rows.length > 1 && (
              <Box as="tfoot">
                <Box as="tr" className="border-t-2 border-slate-200">
                  {rank && <Box as="td" className="py-2" />}
                  <Box as="td" className="py-2 pr-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">Total</Box>
                  <Box as="td" className="py-2 px-2 text-right font-extrabold tabular-nums text-slate-900">{money(totalRev, currency)}</Box>
                  <Box as="td" className="py-2 px-2 text-right font-bold tabular-nums text-slate-600">{totalEnr.toLocaleString()}</Box>
                  <Box as="td" className="py-2 pl-2 text-right text-[11px] font-semibold tabular-nums text-slate-400">100%</Box>
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Card>
  );
}

/* ── Growth & momentum ── */
function MomentumCard({ comparison, summary, currency }) {
  const { delta, previous, previous_period } = comparison;
  const noPrior = (previous.revenue_total ?? 0) === 0 && (previous.paying_enrolments ?? 0) === 0;
  const items = [
    { label: "Revenue", value: money(summary.revenue_total, currency), pct: delta.revenue_pct, prev: money(previous.revenue_total, currency) },
    { label: "Paying enrolments", value: (summary.paying_enrolments ?? 0).toLocaleString(), pct: delta.enrolments_pct, prev: (previous.paying_enrolments ?? 0).toLocaleString() },
    { label: "Avg / enrolment", value: money(summary.avg_per_enrolment, currency), pct: delta.avg_pct, prev: money(previous.avg_per_enrolment, currency) },
  ];
  return (
    <Card className={CARD}>
      <SectionHead icon={TrendingUp} title="Momentum" subtitle={`vs previous period (${fmtD(previous_period.from)} – ${fmtD(previous_period.to)})`} />
      {noPrior && (
        <Text as="p" className="mb-3 rounded-lg bg-amber-50 px-3 py-1.5 text-[11px] font-medium text-amber-700">
          No sales in the previous period — nothing to compare yet.
        </Text>
      )}
      <Box className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {items.map((it) => (
          <Box key={it.label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <Text as="span" className="block text-xs font-semibold text-slate-500">{it.label}</Text>
            <Box className="mt-1 flex items-baseline gap-2">
              <Text as="span" className="text-xl font-extrabold tabular-nums text-slate-800">{it.value}</Text>
              {noPrior ? <Text as="span" className="text-[11px] font-semibold text-violet-500">new</Text> : <Delta pct={it.pct} />}
            </Box>
            <Text as="span" className="mt-0.5 block text-[11px] text-slate-400">{noPrior ? "no prior-period data" : `was ${it.prev}`}</Text>
          </Box>
        ))}
      </Box>
    </Card>
  );
}

/* ── Learner retention ── */
function RetentionCard({ retention }) {
  const r = retention ?? {};
  return (
    <Card className={CARD}>
      <SectionHead icon={Repeat} title="Learner retention" subtitle="in period" />
      <Box className="flex items-stretch gap-3">
        <Box className="flex w-28 flex-col items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 p-3">
          <Text as="span" className="text-2xl font-extrabold tabular-nums text-emerald-700">{r.repeat_rate ?? 0}%</Text>
          <Text as="span" className="text-[11px] font-semibold text-emerald-700">Repeat rate</Text>
        </Box>
        <Box className="flex flex-1 flex-col justify-center gap-2">
          <Box className="flex items-center justify-between border-b border-slate-50 pb-2 text-sm">
            <Text as="span" className="flex items-center gap-1.5 text-slate-600"><UserPlus className="h-3.5 w-3.5" /> New learners</Text>
            <Text as="span" className="font-bold tabular-nums text-slate-800">{(r.new_learners ?? 0).toLocaleString()}</Text>
          </Box>
          <Box className="flex items-center justify-between text-sm">
            <Text as="span" className="flex items-center gap-1.5 text-slate-600"><Users className="h-3.5 w-3.5" /> Returning learners</Text>
            <Text as="span" className="font-bold tabular-nums text-slate-800">{(r.returning_learners ?? 0).toLocaleString()}</Text>
          </Box>
        </Box>
      </Box>
    </Card>
  );
}

/* ── Trainer utilization + top trainers by load ── */
function TrainersCard({ trainers, topTrainers = [], currency }) {
  const t = trainers ?? {};
  const tiles = [
    { label: "Engaged", value: (t.engaged ?? 0).toLocaleString() },
    { label: "Trainings", value: (t.trainings ?? 0).toLocaleString() },
    { label: "Rev / trainer", value: money(t.revenue_per_trainer, currency) },
  ];
  return (
    <Card className={CARD}>
      <SectionHead icon={GraduationCap} title="Trainer utilization" subtitle="in period" />
      <Box className="grid grid-cols-3 gap-2">
        {tiles.map((x) => (
          <Box key={x.label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 text-center">
            <Text as="span" className="block text-lg font-extrabold tabular-nums text-slate-800">{x.value}</Text>
            <Text as="span" className="text-[10px] font-semibold uppercase text-slate-500">{x.label}</Text>
          </Box>
        ))}
      </Box>
      {topTrainers.length > 0 && (
        <Box className="mt-4 overflow-x-auto">
          <Box as="table" className="w-full border-collapse text-xs">
            <Box as="thead">
              <Box as="tr" className="border-b border-slate-200 text-[10px] uppercase tracking-wide text-slate-400">
                <Box as="th" className="py-2 pr-2 text-left font-semibold">Top trainers by load</Box>
                <Box as="th" className="py-2 px-2 text-right font-semibold">Trainings</Box>
                <Box as="th" className="py-2 pl-2 text-right font-semibold">Learners</Box>
              </Box>
            </Box>
            <Box as="tbody">
              {topTrainers.map((tt, i) => (
                <Box as="tr" key={`${tt.name}-${i}`} className="border-b border-slate-50 odd:bg-white even:bg-slate-50/40 hover:bg-slate-50">
                  <Box as="td" className="max-w-[180px] truncate py-2 pr-2 font-medium text-slate-700" title={tt.name}>{tt.name}</Box>
                  <Box as="td" className="py-2 px-2 text-right tabular-nums text-slate-600">{(tt.trainings ?? 0).toLocaleString()}</Box>
                  <Box as="td" className="py-2 pl-2 text-right tabular-nums text-slate-600">{(tt.participants ?? 0).toLocaleString()}</Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Card>
  );
}

function ViewSkeleton() {
  return (
    <Box className="space-y-6">
      <Skeleton className="h-16 rounded-2xl" />
      <Box className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </Box>
      <Box className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72 rounded-2xl" />)}
      </Box>
    </Box>
  );
}

/* ────────────────────────────────────────────────────────── */
export function ReportsView() {
  const { token } = useAuth();

  const [range, setRange] = useState("12m");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [mode, setMode] = useState(ALL);
  const [bucket, setBucket] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [location, setLocation] = useState(ALL);
  const [sponsorship, setSponsorship] = useState(ALL);
  const [trainer, setTrainer] = useState(ALL);

  const [data, setData] = useState(null);
  const [trainerOptions, setTrainerOptions] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const isCustom = range === "custom";

  const filters = useMemo(() => ({
    from: isCustom ? customFrom : presetFrom(range),
    // "Last N months" is a bounded window ending today — set the upper bound too,
    // otherwise the range is open-ended and (with future-dated records) leaks in
    // data beyond the selected span. "All time" stays unbounded; custom uses the
    // entered end date.
    to: isCustom ? customTo : range === ALL ? "" : new Date().toISOString().slice(0, 10),
    delivery_mode: mode === ALL ? "" : mode,
    bucket: bucket === ALL ? "" : bucket,
    status: status === ALL ? "" : status,
    location: location === ALL ? "" : location,
    sponsorship: sponsorship === ALL ? "" : sponsorship,
    trainer_id: trainer === ALL ? "" : trainer,
  }), [isCustom, customFrom, customTo, range, mode, bucket, status, location, sponsorship, trainer]);

  // A custom range needs both ends before we query.
  const customIncomplete = isCustom && (!customFrom || !customTo);
  const trainerName = trainer === ALL ? null : trainerOptions.find((t) => t.id === trainer)?.name;

  const load = useCallback(() => {
    if (!token || customIncomplete) return;
    setLoading(true);
    fetchSalesReport({ token, filters })
      .then((d) => {
        setData(d);
        setError(null);
        if (d.trainer_options?.length) setTrainerOptions(d.trainer_options);
        if (d.location_options?.length) setLocationOptions(d.location_options);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, filters, customIncomplete]);

  useEffect(() => { load(); }, [load]);

  const resetFilters = () => {
    setRange("12m"); setCustomFrom(""); setCustomTo("");
    setMode(ALL); setBucket(ALL); setStatus(ALL);
    setLocation(ALL); setSponsorship(ALL); setTrainer(ALL);
  };
  const hasActiveFilters =
    range !== "12m" || mode !== ALL || bucket !== ALL || status !== ALL ||
    location !== ALL || sponsorship !== ALL || trainer !== ALL;

  const downloadSummary = () => {
    if (data) printSalesReport(data, { trainerName });
  };

  const cur = data?.currency ?? "USD";
  const locationOpts = locationOptions.map((l) => ({ value: l, label: l }));

  return (
    <Box className="space-y-6">
      {/* Filter bar */}
      <Card className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <Box className="flex flex-wrap items-center gap-2">
          <Box className="mr-1 flex items-center gap-1.5 text-slate-500">
            <Filter className="h-4 w-4" />
            <Text as="span" className="text-xs font-semibold">Filters</Text>
          </Box>

          <FilterSelect value={range} onChange={setRange} placeholder="Period" allLabel="All time" options={RANGE_OPTIONS.filter((o) => o.value !== ALL)} />
          {isCustom && (
            <Box className="flex items-center gap-1.5">
              <CalendarRange className="h-4 w-4 text-slate-400" />
              <Input type="date" value={customFrom} max={customTo || undefined} onChange={(e) => setCustomFrom(e.target.value)} className="h-9 w-[145px] bg-white text-xs" />
              <Text as="span" className="text-xs text-slate-400">to</Text>
              <Input type="date" value={customTo} min={customFrom || undefined} onChange={(e) => setCustomTo(e.target.value)} className="h-9 w-[145px] bg-white text-xs" />
            </Box>
          )}

          <FilterSelect value={mode} onChange={setMode} placeholder="Mode" allLabel="All modes" options={MODE_OPTIONS} />
          <FilterSelect value={bucket} onChange={setBucket} placeholder="Bucket" allLabel="All buckets" options={BUCKET_OPTIONS} />
          <FilterSelect value={status} onChange={setStatus} placeholder="Status" allLabel="All statuses" options={STATUS_OPTIONS} />
          <FilterSelect value={sponsorship} onChange={setSponsorship} placeholder="Sponsorship" allLabel="All sponsorship" options={SPONSORSHIP_OPTIONS} />
          {locationOpts.length > 0 && (
            <FilterSelect value={location} onChange={setLocation} placeholder="Location" allLabel="All locations" options={locationOpts} />
          )}
          {trainerOptions.length > 0 && (
            <FilterSelect value={trainer} onChange={setTrainer} placeholder="Trainer" allLabel="All trainers" options={trainerOptions.map((t) => ({ value: t.id, label: t.name }))} />
          )}

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={resetFilters} className="h-9 text-xs text-slate-500">
              <X className="h-3.5 w-3.5" /> Reset
            </Button>
          )}

          <Box className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={load} className="h-9 text-xs" disabled={loading || customIncomplete}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
            </Button>
            <Button size="sm" onClick={downloadSummary} className="h-9 text-xs" disabled={!data || loading}>
              <FileDown className="h-3.5 w-3.5" /> Download PDF
            </Button>
          </Box>
        </Box>
        {customIncomplete && (
          <Text as="p" className="mt-2 text-[11px] text-amber-600">Pick both a start and end date to run the custom range.</Text>
        )}
      </Card>

      {error && (
        <Card className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</Card>
      )}

      {loading || !data ? (
        <ViewSkeleton />
      ) : (
        <>
          {/* ── Overview ── */}
          <SectionTitle hint={data.filters?.from ? `${fmtD(data.filters.from)} – ${fmtD(data.filters.to) || "today"}` : "all time"}>
            Overview
          </SectionTitle>
          <Box className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-5">
            <KpiCard icon={Wallet} theme="emerald" label="Total revenue" value={money(data.summary.revenue_total, cur)} sub={`${cur} · paid seats`} />
            <KpiCard icon={Receipt} theme="indigo" label="Paying enrolments" value={(data.summary.paying_enrolments ?? 0).toLocaleString()} sub={`${(data.summary.enrolments_total ?? 0).toLocaleString()} total`} />
            <KpiCard icon={TrendingUp} theme="sky" label="Avg / enrolment" value={money(data.summary.avg_per_enrolment, cur)} />
            <KpiCard icon={Users} theme="violet" label="Participants" value={(data.summary.participants ?? 0).toLocaleString()} />
            <KpiCard icon={Layers} theme="amber" label="Orders" value={(data.summary.orders ?? 0).toLocaleString()} />
          </Box>
          {data.comparison && <MomentumCard comparison={data.comparison} summary={data.summary} currency={cur} />}

          {/* ── Sales breakdown ── */}
          <SectionTitle hint="revenue counts confirmed + completed seats">Sales breakdown</SectionTitle>
          <Box className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SalesTable icon={Globe} title="Sales by location" subtitle="where sales happen" rows={data.sales_by_location} nameKey="location" nameLabel="Location" currency={cur} />
            <SalesTable icon={TrendingDown} title="Low-performing locations" subtitle="bottom 5" rows={data.low_performing_locations} nameKey="location" nameLabel="Location" currency={cur} danger />
            <SalesTable icon={BookOpen} title="Sales by course" rows={data.sales_by_course} nameKey="title" nameLabel="Course" currency={cur} />
            <SalesTable icon={Layers} title="Sales by pricing tier" rows={data.sales_by_tier} nameKey="tier" nameLabel="Tier" currency={cur} />
            <SalesTable icon={Briefcase} title="Sales by sponsorship" rows={data.sales_by_sponsorship} nameKey="sponsorship" nameLabel="Sponsorship" currency={cur} formatName={cap} />
            <SalesTable icon={Video} title="Sales by delivery mode" rows={data.sales_by_delivery_mode} nameKey="delivery_mode" nameLabel="Mode" currency={cur} formatName={(v) => MODE_LABEL[v] ?? v} />
          </Box>
          <SalesTable icon={CalendarRange} title="Sales over time" subtitle="monthly · share of period" rows={data.sales_over_time} nameKey="month" nameLabel="Month" currency={cur} rank={false} />

          {/* ── Customers & trainers ── */}
          <SectionTitle>Customers &amp; trainers</SectionTitle>
          <Box className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <SalesTable
              icon={Building2}
              title="Top corporate accounts"
              subtitle={
                data.concentration?.top5_pct != null
                  ? `top 5 = ${data.concentration.top5_pct}% of revenue · ${data.concentration.companies_total} accounts`
                  : `${data.concentration?.companies_total ?? 0} accounts`
              }
              rows={data.top_companies}
              nameKey="company"
              nameLabel="Company"
              currency={cur}
            />
            <RetentionCard retention={data.learner_retention} />
          </Box>
          <TrainersCard trainers={data.trainers} topTrainers={data.top_trainers} currency={cur} />

          <Text as="p" className="pt-1 text-center text-[11px] text-slate-400">
            Generated {new Date(data.generated_at).toLocaleString("en-US")} · figures count confirmed + completed enrolments
          </Text>
        </>
      )}
    </Box>
  );
}
