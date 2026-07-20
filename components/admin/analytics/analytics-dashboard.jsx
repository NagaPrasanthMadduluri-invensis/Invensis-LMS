"use client";

/*
 * Admin analytics dashboard — a dynamic, filterable view of trainers,
 * participants, sessions, trainings and the upcoming pipeline. A single filter
 * bar (time range + delivery mode + bucket + status + trainer) re-queries
 * GET /admin/analytics; every chart and KPI reflects the active filters.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Users, GraduationCap, BookOpen, ClipboardList, Gauge, CalendarClock,
  CheckCircle2, RefreshCw, Video, MapPin, Clock, AlertCircle, UserCheck,
  Filter, X, TrendingUp, PieChart as PieIcon, BarChart3, Activity,
  Layers, Presentation, Flame, ClipboardCheck, Globe,
  Wallet, Briefcase, Building2, Star, Landmark,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import Box from "@/components/ui/box";
import Text from "@/components/ui/text";
import { useAuth } from "@/hooks/use-auth";
import { fetchAdminAnalytics } from "@/services/api/admin/admin-api";
import {
  ChartCard,
  EnrolmentsOverTimeChart,
  ParticipantGrowthChart,
  TrainingStatusChart,
  EnrolmentStatusChart,
  DeliveryModeChart,
  BucketChart,
  CapacityChart,
  SessionsOverTimeChart,
  TopTrainersChart,
  CourseDemandChart,
  AttendanceChart,
  DurationChart,
  LocationChart,
  SponsorshipChart,
  JobTitleChart,
  DepartmentChart,
  TopCompaniesChart,
  ExperienceChart,
  MODE_LABEL,
  BUCKET_LABEL,
} from "./analytics-charts";

/* ── helpers ── */
const ALL = "all";

function presetFrom(preset) {
  if (preset === ALL) return "";
  const months = { "3m": 3, "6m": 6, "12m": 12, "24m": 24 }[preset] ?? 12;
  const d = new Date();
  d.setMonth(d.getMonth() - months);
  return d.toISOString().slice(0, 10);
}

const RANGE_OPTIONS = [
  { value: "3m", label: "Last 3 months" },
  { value: "6m", label: "Last 6 months" },
  { value: "12m", label: "Last 12 months" },
  { value: "24m", label: "Last 24 months" },
  { value: ALL, label: "All time" },
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

function timeAgo(iso) {
  if (!iso) return "now";
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  return hrs < 24 ? `${hrs}h ago` : `${Math.round(hrs / 24)}d ago`;
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return iso;
  }
}

const cap = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);

const STATUS_BADGE = {
  active: "bg-emerald-100 text-emerald-700",
  ongoing: "bg-violet-100 text-violet-700",
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-violet-100 text-violet-700",
  cancelled: "bg-rose-100 text-rose-700",
};

/* ── KPI card ── */
const KPI_THEMES = {
  indigo: "border-violet-200 bg-violet-50 text-violet-700",
  violet: "border-violet-200 bg-violet-50 text-violet-700",
  sky: "border-sky-200 bg-sky-50 text-sky-700",
  emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
  rose: "border-rose-200 bg-rose-50 text-rose-700",
  teal: "border-teal-200 bg-teal-50 text-teal-700",
  fuchsia: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
};

function KpiCard({ icon: Icon, label, value, sub, theme }) {
  return (
    <Card className="rounded-2xl border border-slate-200 p-4 shadow-sm">
      <Box className={`flex h-9 w-9 items-center justify-center rounded-xl border ${KPI_THEMES[theme]}`}>
        <Icon className="h-5 w-5" />
      </Box>
      <Text as="span" className="mt-3 block text-2xl font-extrabold leading-none text-slate-800">{value}</Text>
      <Text as="span" className="mt-1 block text-xs font-semibold text-slate-600">{label}</Text>
      {sub && <Text as="span" className="mt-0.5 block text-[11px] text-slate-400">{sub}</Text>}
    </Card>
  );
}

/* ── Filter select ──
   Base UI's <Select.Value> renders the raw value unless the Root is given an
   `items` map (value → label); we build that from the options so the trigger
   shows readable labels ("All buckets", "Last 12 months") instead of "all". */
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

/* ── Skeleton ── */
function DashboardSkeleton() {
  return (
    <Box className="space-y-6">
      <Skeleton className="h-16 rounded-2xl" />
      <Box className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </Box>
      <Box className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}
      </Box>
    </Box>
  );
}

/* ──────────────────────────────────────────────────────────
   Main
   ────────────────────────────────────────────────────────── */
export function AnalyticsDashboard() {
  const { token } = useAuth();

  const [range, setRange] = useState("12m");
  const [mode, setMode] = useState(ALL);
  const [bucket, setBucket] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [trainer, setTrainer] = useState(ALL);
  const [location, setLocation] = useState(ALL);
  const [duration, setDuration] = useState(ALL);
  const [sponsorship, setSponsorship] = useState(ALL);
  const [jobTitle, setJobTitle] = useState(ALL);
  const [department, setDepartment] = useState(ALL);

  const [data, setData] = useState(null);
  const [trainerOptions, setTrainerOptions] = useState([]);
  const [locationOptions, setLocationOptions] = useState([]);
  const [durationOptions, setDurationOptions] = useState([]);
  const [jobTitleOptions, setJobTitleOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const filters = useMemo(() => ({
    from: presetFrom(range),
    delivery_mode: mode === ALL ? "" : mode,
    bucket: bucket === ALL ? "" : bucket,
    status: status === ALL ? "" : status,
    trainer_id: trainer === ALL ? "" : trainer,
    location: location === ALL ? "" : location,
    duration: duration === ALL ? "" : duration,
    sponsorship: sponsorship === ALL ? "" : sponsorship,
    job_title: jobTitle === ALL ? "" : jobTitle,
    department: department === ALL ? "" : department,
  }), [range, mode, bucket, status, trainer, location, duration, sponsorship, jobTitle, department]);

  const load = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetchAdminAnalytics({ token, filters })
      .then((d) => {
        setData(d);
        setError(null);
        // These option sets are filter-independent — keep the first non-empty set.
        if (d.trainer_options?.length) setTrainerOptions(d.trainer_options);
        if (d.location_options?.length) setLocationOptions(d.location_options);
        if (d.duration_options?.length) setDurationOptions(d.duration_options);
        if (d.job_title_options?.length) setJobTitleOptions(d.job_title_options);
        if (d.department_options?.length) setDepartmentOptions(d.department_options);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, filters]);

  useEffect(() => { load(); }, [load]);

  const resetFilters = () => {
    setRange("12m"); setMode(ALL); setBucket(ALL); setStatus(ALL);
    setTrainer(ALL); setLocation(ALL); setDuration(ALL);
    setSponsorship(ALL); setJobTitle(ALL); setDepartment(ALL);
  };
  const hasActiveFilters =
    mode !== ALL || bucket !== ALL || status !== ALL || trainer !== ALL ||
    location !== ALL || duration !== ALL || sponsorship !== ALL ||
    jobTitle !== ALL || department !== ALL || range !== "12m";

  if (error) {
    return (
      <Box className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-5">
        <AlertCircle className="h-5 w-5 shrink-0 text-rose-500" />
        <Box>
          <Text as="p" className="text-sm font-semibold text-rose-700">Couldn&rsquo;t load analytics</Text>
          <Text as="span" className="text-xs text-rose-600">{error}</Text>
        </Box>
        <Button size="sm" variant="outline" onClick={load} className="ml-auto border-rose-200 text-rose-700 hover:bg-rose-100">Retry</Button>
      </Box>
    );
  }

  if (!data && loading) return <DashboardSkeleton />;
  if (!data) return null;

  const s = data.summary || {};
  const fillPct = Math.round((s.fill_rate || 0) * 100);
  const completionPct = Math.round((s.completion_rate || 0) * 100);
  const attendancePct = Math.round((s.attendance_rate || 0) * 100);

  const kpis = [
    { icon: BookOpen, label: "Trainings", value: s.trainings_total ?? 0, sub: `${s.trainings_ongoing ?? 0} ongoing`, theme: "indigo" },
    { icon: Presentation, label: "Sessions", value: s.sessions_total ?? 0, sub: "scheduled days", theme: "sky" },
    { icon: Users, label: "Participants", value: s.participants_total ?? 0, sub: "unique enrolled", theme: "violet" },
    { icon: ClipboardList, label: "Enrolments", value: s.enrolments_total ?? 0, sub: `${s.enrolments_completed ?? 0} completed`, theme: "emerald" },
    { icon: Gauge, label: "Seat Fill", value: `${fillPct}%`, sub: `${s.total_enrolled ?? 0}/${s.total_capacity ?? 0} seats`, theme: "rose" },
    { icon: CheckCircle2, label: "Completion", value: `${completionPct}%`, sub: "of enrolments", theme: "teal" },
    { icon: GraduationCap, label: "Trainers", value: s.trainers_active ?? 0, sub: `${s.trainers_assigned ?? 0} assigned`, theme: "fuchsia" },
    { icon: ClipboardCheck, label: "Attendance", value: s.attendance_marked ? `${attendancePct}%` : "—", sub: `${s.attendance_marked ?? 0} marked`, theme: "amber" },
  ];

  return (
    <Box className={`space-y-6 transition-opacity ${loading ? "opacity-60" : "opacity-100"}`}>

      {/* ── Filter bar ── */}
      <Card className="rounded-2xl border border-slate-200 p-4 shadow-sm">
        <Box className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Box className="flex shrink-0 items-center gap-2 whitespace-nowrap text-slate-500">
            <Filter className="h-4 w-4 shrink-0" />
            <Text as="span" className="text-xs font-semibold uppercase tracking-wide text-slate-500">Filters</Text>
            <Box className="ml-1 flex items-center gap-1.5 text-[11px] text-slate-400">
              <Box className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Updated {timeAgo(data.generated_at)}
            </Box>
          </Box>

          <Box className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:items-center lg:justify-end">
            <FilterSelect value={range} onChange={setRange} placeholder="Time range" options={RANGE_OPTIONS.filter((o) => o.value !== ALL)} allLabel="All time" />
            <FilterSelect value={mode} onChange={setMode} placeholder="Delivery mode" allLabel="All modes"
              options={Object.entries(MODE_LABEL).map(([value, label]) => ({ value, label }))} />
            <FilterSelect value={bucket} onChange={setBucket} placeholder="Bucket" allLabel="All buckets"
              options={Object.entries(BUCKET_LABEL).map(([value, label]) => ({ value, label }))} />
            <FilterSelect value={status} onChange={setStatus} placeholder="Status" allLabel="All statuses" options={STATUS_OPTIONS} />
            <FilterSelect value={location} onChange={setLocation} placeholder="Location" allLabel="All locations"
              options={locationOptions.map((l) => ({ value: l, label: l }))} />
            <FilterSelect value={duration} onChange={setDuration} placeholder="Duration" allLabel="All durations"
              options={durationOptions.map((h) => ({ value: String(h), label: `${h} hrs/day` }))} />
            <FilterSelect value={sponsorship} onChange={setSponsorship} placeholder="Sponsorship" allLabel="All sponsorship" options={SPONSORSHIP_OPTIONS} />
            <FilterSelect value={jobTitle} onChange={setJobTitle} placeholder="Job title" allLabel="All job titles"
              options={jobTitleOptions.map((j) => ({ value: j, label: j }))} />
            <FilterSelect value={department} onChange={setDepartment} placeholder="Department" allLabel="All departments"
              options={departmentOptions.map((dp) => ({ value: dp, label: dp }))} />
            <FilterSelect value={trainer} onChange={setTrainer} placeholder="Trainer" allLabel="All trainers"
              options={trainerOptions.map((t) => ({ value: t.id, label: t.name }))} />
            <Button
              size="sm" variant="ghost" onClick={resetFilters} disabled={!hasActiveFilters}
              className="h-9 gap-1.5 text-slate-500 hover:text-slate-800 disabled:opacity-40"
            >
              <X className="h-3.5 w-3.5" /> Reset
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── KPI row ── */}
      <Box className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-8">
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </Box>

      {/* ── Enrolment trend + status ── */}
      <Box className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Enrolments Over Time" subtitle="Monthly, by status" icon={TrendingUp} className="lg:col-span-2">
          <EnrolmentsOverTimeChart data={data.enrolments_over_time} />
        </ChartCard>
        <ChartCard title="Enrolment Status" subtitle="Distribution" icon={PieIcon} fitInFullscreen>
          <EnrolmentStatusChart data={data.enrolments_by_status} />
        </ChartCard>
      </Box>

      {/* ── Participant growth + training status ── */}
      <Box className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Participant Growth" subtitle="New & cumulative" icon={Activity} className="lg:col-span-2">
          <ParticipantGrowthChart data={data.participant_growth} />
        </ChartCard>
        <ChartCard title="Trainings by Status" subtitle="Lifecycle mix" icon={PieIcon} fitInFullscreen>
          <TrainingStatusChart data={data.trainings_by_status} />
        </ChartCard>
      </Box>

      {/* ── Mode / bucket / capacity ── */}
      <Box className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Delivery Mode" subtitle="How trainings run" icon={PieIcon} fitInFullscreen>
          <DeliveryModeChart data={data.trainings_by_delivery_mode} />
        </ChartCard>
        <ChartCard title="Trainings by Bucket" subtitle="Offering type" icon={Layers}>
          <BucketChart data={data.trainings_by_bucket} />
        </ChartCard>
        <ChartCard title="Capacity vs Enrolled" subtitle="Seats by bucket" icon={BarChart3}>
          <CapacityChart data={data.capacity_by_bucket} />
        </ChartCard>
      </Box>

      {/* ── Sessions + top trainers ── */}
      <Box className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Sessions Over Time" subtitle="Completed vs scheduled" icon={Presentation}>
          <SessionsOverTimeChart data={data.sessions_over_time} />
        </ChartCard>
        <ChartCard title="Top Trainers" subtitle="By trainings delivered" icon={GraduationCap} className="lg:col-span-2">
          <TopTrainersChart data={data.top_trainers} />
        </ChartCard>
      </Box>

      {/* ── Course demand + attendance ── */}
      <Box className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Most Requested Courses" subtitle="By enrolment requests" icon={Flame} className="lg:col-span-2">
          <CourseDemandChart data={data.course_demand} />
        </ChartCard>
        <ChartCard title="Attendance" subtitle="Completed trainings" icon={ClipboardCheck} fitInFullscreen>
          <AttendanceChart data={data.attendance} />
        </ChartCard>
      </Box>

      {/* ── Session duration + location (learner geography) ── */}
      <Box className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Enrolments by Session Duration" subtitle="Hours per day" icon={Clock}>
          <DurationChart data={data.enrolments_by_duration} />
        </ChartCard>
        <ChartCard title="Enrolments by Location" subtitle="By learner country · virtual & in-person" icon={Globe} className="lg:col-span-2">
          <LocationChart data={data.enrolments_by_location} />
        </ChartCard>
      </Box>

      {/* ── Learner profile section header ── */}
      <Box className="flex items-center gap-2 pt-1">
        <Briefcase className="h-4 w-4 text-slate-400" />
        <Text as="h2" className="text-sm font-semibold uppercase tracking-wide text-slate-500">Learner Profile</Text>
        <Box className="h-px flex-1 bg-slate-200" />
      </Box>

      {/* ── Sponsorship + job title ── */}
      <Box className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Sponsorship" subtitle="Self vs corporate" icon={Wallet} fitInFullscreen>
          <SponsorshipChart data={data.enrolments_by_sponsorship} />
        </ChartCard>
        <ChartCard title="Enrolments by Job Title" subtitle="Who's training" icon={Briefcase} className="lg:col-span-2">
          <JobTitleChart data={data.enrolments_by_job_title} />
        </ChartCard>
      </Box>

      {/* ── Department + experience + companies ── */}
      <Box className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Enrolments by Department" subtitle="Function" icon={Building2}>
          <DepartmentChart data={data.enrolments_by_department} />
        </ChartCard>
        <ChartCard title="Experience Level" subtitle="Years of experience" icon={Star}>
          <ExperienceChart data={data.enrolments_by_experience} />
        </ChartCard>
        <ChartCard title="Top Companies" subtitle="Corporate accounts" icon={Landmark}>
          <TopCompaniesChart data={data.top_companies} />
        </ChartCard>
      </Box>

      <Box className="flex justify-end">
        <Button size="sm" variant="ghost" onClick={load} disabled={loading} className="gap-1.5 text-slate-500 hover:text-slate-800">
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </Box>
    </Box>
  );
}
