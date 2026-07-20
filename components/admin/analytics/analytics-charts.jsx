"use client";

/*
 * Chart building blocks for the admin analytics dashboard.
 * Every chart is a small, presentational client component that takes already
 * fetched data and renders a recharts figure inside the shared ChartContainer
 * (responsive + themed tooltips). Colours come from a CVD-validated categorical
 * palette; identity is always carried by a legend/label, never colour alone.
 */

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  LabelList,
  Line,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import { useState } from "react";
import { Maximize2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import Box from "@/components/ui/box";
import Text from "@/components/ui/text";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

/* ── CVD-validated categorical palette (dataviz reference instance) ── */
export const PALETTE = [
  "#2a78d6", // blue
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
  "#e87ba4", // magenta
  "#eb6834", // orange
];

export const TRAINING_STATUS_COLOR = {
  pending: "#eda100",
  active: "#2a78d6",
  ongoing: "#4a3aa7",
  completed: "#008300",
  cancelled: "#e34948",
};

export const ENROLMENT_STATUS_COLOR = {
  confirmed: "#2a78d6",
  completed: "#008300",
  transferred: "#4a3aa7",
  cancelled: "#e34948",
  failed: "#eb6834",
};

export const SESSION_STATUS_COLOR = {
  scheduled: "#2a78d6",
  ongoing: "#eda100",
  completed: "#008300",
  cancelled: "#e34948",
};

export const MODE_LABEL = {
  virtual: "Virtual",
  in_person: "In-person",
  hybrid: "Hybrid",
  one_to_one: "One-to-one",
};

export const BUCKET_LABEL = {
  direct_online: "Direct Online",
  corporate: "Corporate",
  one_to_one_coaching: "1:1 Coaching",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function formatMonth(ym) {
  if (!ym) return "";
  const [y, m] = ym.split("-");
  return `${MONTHS[Number(m) - 1]} '${y.slice(2)}`;
}

const cap = (s = "") => s.charAt(0).toUpperCase() + s.slice(1);

export function fmtMoney(n) {
  if (n == null) return "$0";
  const abs = Math.abs(n);
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(abs >= 1e7 ? 0 : 1)}M`;
  if (abs >= 1e3) return `$${Math.round(n / 1e3)}k`;
  return `$${Math.round(n)}`;
}

export const TIER_COLOR = {
  Standard: "#2a78d6",
  Silver: "#94a3b8",
  Gold: "#eda100",
  Platinum: "#4a3aa7",
  Unspecified: "#cbd5e1",
};

/* ──────────────────────────────────────────────────────────
   Card shell for a chart (title + optional subtitle + body)
   ────────────────────────────────────────────────────────── */
export function ChartCard({ title, subtitle, icon: Icon, action, children, className = "", fitInFullscreen = false }) {
  const [expanded, setExpanded] = useState(false);

  const Head = (
    <Box className="flex items-center gap-2">
      {Icon && (
        <Box className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <Icon className="h-4 w-4" />
        </Box>
      )}
      <Box>
        <Text as="h3" className="text-sm font-semibold text-slate-800">{title}</Text>
        {subtitle && <Text as="span" className="text-[11px] text-slate-400">{subtitle}</Text>}
      </Box>
    </Box>
  );

  return (
    <>
      <Card className={`flex flex-col overflow-hidden rounded-2xl border border-slate-200 shadow-sm ${className}`}>
        <Box className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          {Head}
          <Box className="flex items-center gap-1 shrink-0">
            {action}
            <button
              type="button"
              onClick={() => setExpanded(true)}
              aria-label="Expand chart to full screen"
              title="Expand to full screen"
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </Box>
        </Box>
        <Box className="flex-1 p-4">{children}</Box>
      </Card>

      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="!max-w-[96vw] w-[96vw] p-0 gap-0 overflow-hidden">
          <DialogHeader className="flex flex-row items-center gap-2 border-b border-slate-100 px-6 py-4">
            {Icon && (
              <Box className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 shrink-0">
                <Icon className="h-4 w-4" />
              </Box>
            )}
            <Box className="min-w-0">
              <DialogTitle className="text-base font-semibold text-slate-800">{title}</DialogTitle>
              {subtitle
                ? <DialogDescription className="text-xs text-slate-400">{subtitle}</DialogDescription>
                : <DialogDescription className="sr-only">Full screen view of {title}</DialogDescription>}
            </Box>
          </DialogHeader>
          {/* Cartesian charts fill the tall viewport; circular (donut) charts are
              centered and height-capped so the chart + its legend fit without scroll. */}
          {fitInFullscreen ? (
            <Box className="flex h-[82vh] w-full items-center justify-center overflow-auto p-6">
              <Box className="w-full max-w-2xl [&_[data-slot=chart]]:!h-[58vh] [&_[data-slot=chart]]:!w-auto">
                {expanded && children}
              </Box>
            </Box>
          ) : (
            <Box className="h-[82vh] w-full overflow-auto p-6 [&_[data-slot=chart]]:!h-full">
              {expanded && children}
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/* Empty-state used when a dataset has no rows for the active filters. */
function NoData({ label = "No data for the selected filters" }) {
  return (
    <Box className="flex h-full min-h-[220px] flex-col items-center justify-center gap-1 text-center">
      <Text as="span" className="text-sm text-slate-400">{label}</Text>
    </Box>
  );
}

/* Compact colour-dot legend/value row rendered below donut charts (the
   secondary encoding the palette's contrast WARN requires). */
function DonutLegend({ items }) {
  const total = items.reduce((s, it) => s + it.value, 0);
  return (
    <Box className="mt-1 grid grid-cols-1 gap-1.5">
      {items.map((it) => (
        <Box key={it.label} className="flex items-center justify-between gap-2">
          <Box className="flex min-w-0 items-center gap-2">
            <Box className="h-2.5 w-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: it.color }} />
            <Text as="span" className="truncate text-xs text-slate-600">{it.label}</Text>
          </Box>
          <Text as="span" className="shrink-0 text-xs font-semibold text-slate-800 tabular-nums">
            {it.value}
            <Text as="span" className="ml-1 text-[10px] font-normal text-slate-400">
              {total > 0 ? `${Math.round((it.value / total) * 100)}%` : "0%"}
            </Text>
          </Text>
        </Box>
      ))}
    </Box>
  );
}

/* ──────────────────────────────────────────────────────────
   Enrolments over time — stacked area (by status)
   ────────────────────────────────────────────────────────── */
export function EnrolmentsOverTimeChart({ data = [] }) {
  if (!data.length) return <NoData />;
  const rows = data.map((r) => ({ ...r, label: formatMonth(r.month) }));
  const config = {
    confirmed: { label: "Confirmed", color: ENROLMENT_STATUS_COLOR.confirmed },
    completed: { label: "Completed", color: ENROLMENT_STATUS_COLOR.completed },
    transferred: { label: "Transferred", color: ENROLMENT_STATUS_COLOR.transferred },
    cancelled: { label: "Cancelled", color: ENROLMENT_STATUS_COLOR.cancelled },
  };
  const keys = ["confirmed", "completed", "transferred", "cancelled"];
  return (
    <ChartContainer config={config} className="block h-[280px] w-full">
      <AreaChart data={rows} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
        <defs>
          {keys.map((k) => (
            <linearGradient key={k} id={`fill-${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={config[k].color} stopOpacity={0.35} />
              <stop offset="95%" stopColor={config[k].color} stopOpacity={0.04} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} stroke="#e1e0d9" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} minTickGap={16} />
        <YAxis tickLine={false} axisLine={false} width={40} fontSize={11} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        {keys.map((k) => (
          <Area
            key={k}
            type="monotone"
            dataKey={k}
            stackId="1"
            stroke={config[k].color}
            strokeWidth={2}
            fill={`url(#fill-${k})`}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ChartContainer>
  );
}

/* ──────────────────────────────────────────────────────────
   Participant growth — cumulative area + new-per-month line
   ────────────────────────────────────────────────────────── */
export function ParticipantGrowthChart({ data = [] }) {
  if (!data.length) return <NoData />;
  const rows = data.map((r) => ({ ...r, label: formatMonth(r.month) }));
  const config = {
    cumulative: { label: "Total participants", color: PALETTE[0] },
    new: { label: "New this month", color: PALETTE[1] },
  };
  return (
    <ChartContainer config={config} className="block h-[280px] w-full">
      <ComposedChart data={rows} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="fill-cumulative" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={PALETTE[0]} stopOpacity={0.35} />
            <stop offset="95%" stopColor={PALETTE[0]} stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#e1e0d9" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} minTickGap={16} />
        <YAxis tickLine={false} axisLine={false} width={40} fontSize={11} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <Area type="monotone" dataKey="cumulative" stroke={PALETTE[0]} strokeWidth={2} fill="url(#fill-cumulative)" isAnimationActive={false} />
        <Line type="monotone" dataKey="new" stroke={PALETTE[1]} strokeWidth={2} dot={false} isAnimationActive={false} />
      </ComposedChart>
    </ChartContainer>
  );
}

/* ──────────────────────────────────────────────────────────
   Generic donut — status/category distribution
   ────────────────────────────────────────────────────────── */
function DonutChart({ data, colorFor, labelFor, centerLabel, centerValue, emptyLabel }) {
  const rows = data.filter((d) => d.value > 0);
  const total = rows.reduce((s, r) => s + r.value, 0);
  if (!total) return <NoData label={emptyLabel || "No data for the selected filters"} />;
  const config = Object.fromEntries(rows.map((r) => [r.key, { label: labelFor(r.key), color: colorFor(r.key) }]));
  return (
    <Box className="flex flex-col">
      <Box className="relative">
        <ChartContainer config={config} className="mx-auto aspect-square h-[190px]">
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey="key" hideLabel />} />
            <Pie data={rows} dataKey="value" nameKey="key" innerRadius="61%" outerRadius="86%" paddingAngle={2} strokeWidth={2} stroke="#ffffff" isAnimationActive={false}>
              {rows.map((r) => (
                <Cell key={r.key} fill={colorFor(r.key)} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        <Box className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <Text as="span" className="text-2xl font-extrabold text-slate-800 leading-none">{centerValue ?? total}</Text>
          <Text as="span" className="text-[10px] uppercase tracking-wide text-slate-400">{centerLabel}</Text>
        </Box>
      </Box>
      <DonutLegend items={rows.map((r) => ({ label: labelFor(r.key), value: r.value, color: colorFor(r.key) }))} />
    </Box>
  );
}

export function TrainingStatusChart({ data = [] }) {
  return (
    <DonutChart
      data={data.map((d) => ({ key: d.status, value: d.count }))}
      colorFor={(k) => TRAINING_STATUS_COLOR[k] ?? "#94a3b8"}
      labelFor={cap}
      centerLabel="Trainings"
    />
  );
}

export function EnrolmentStatusChart({ data = [] }) {
  return (
    <DonutChart
      data={data.map((d) => ({ key: d.status, value: d.count }))}
      colorFor={(k) => ENROLMENT_STATUS_COLOR[k] ?? "#94a3b8"}
      labelFor={cap}
      centerLabel="Enrolments"
    />
  );
}

export function DeliveryModeChart({ data = [] }) {
  return (
    <DonutChart
      data={data.map((d) => ({ key: d.mode, value: d.count }))}
      colorFor={(k) => ({ virtual: PALETTE[0], in_person: PALETTE[2], hybrid: PALETTE[4], one_to_one: PALETTE[1] }[k] ?? "#94a3b8")}
      labelFor={(k) => MODE_LABEL[k] ?? k}
      centerLabel="Trainings"
    />
  );
}

/* ──────────────────────────────────────────────────────────
   Trainings by bucket — horizontal bar
   ────────────────────────────────────────────────────────── */
export function BucketChart({ data = [] }) {
  const rows = data.map((d) => ({ ...d, label: BUCKET_LABEL[d.bucket] ?? d.bucket }));
  if (!rows.length) return <NoData />;
  const config = { count: { label: "Trainings", color: PALETTE[4] } };
  return (
    <ChartContainer config={config} className="block h-[220px] w-full">
      <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 28, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="#e1e0d9" />
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} width={92} fontSize={12} />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="count" fill={PALETTE[4]} radius={[0, 4, 4, 0]} barSize={26} isAnimationActive={false}>
          <LabelList dataKey="count" position="right" fontSize={11} fill="#52514e" />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

/* ──────────────────────────────────────────────────────────
   Capacity vs enrolled by bucket — grouped bar
   ────────────────────────────────────────────────────────── */
export function CapacityChart({ data = [] }) {
  const rows = data.map((d) => ({ ...d, label: BUCKET_LABEL[d.bucket] ?? d.bucket }));
  if (!rows.length) return <NoData />;
  const config = {
    capacity: { label: "Capacity", color: "#cbd5e1" },
    enrolled: { label: "Enrolled", color: PALETTE[0] },
  };
  return (
    <ChartContainer config={config} className="block h-[240px] w-full">
      <BarChart data={rows} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e1e0d9" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} width={44} fontSize={11} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        <Bar dataKey="capacity" fill="#cbd5e1" radius={[4, 4, 0, 0]} isAnimationActive={false} />
        <Bar dataKey="enrolled" fill={PALETTE[0]} radius={[4, 4, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  );
}

/* ──────────────────────────────────────────────────────────
   Sessions over time — stacked bar (completed vs scheduled)
   ────────────────────────────────────────────────────────── */
export function SessionsOverTimeChart({ data = [] }) {
  if (!data.length) return <NoData />;
  const rows = data.map((r) => ({ ...r, label: formatMonth(r.month) }));
  const config = {
    completed: { label: "Completed", color: SESSION_STATUS_COLOR.completed },
    scheduled: { label: "Scheduled", color: SESSION_STATUS_COLOR.scheduled },
  };
  return (
    <ChartContainer config={config} className="block h-[240px] w-full">
      <BarChart data={rows} margin={{ left: -18, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e1e0d9" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} minTickGap={16} />
        <YAxis tickLine={false} axisLine={false} width={40} fontSize={11} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        <Bar dataKey="completed" stackId="s" fill={SESSION_STATUS_COLOR.completed} radius={[0, 0, 0, 0]} barSize={22} isAnimationActive={false} />
        <Bar dataKey="scheduled" stackId="s" fill={SESSION_STATUS_COLOR.scheduled} radius={[4, 4, 0, 0]} barSize={22} isAnimationActive={false} />
      </BarChart>
    </ChartContainer>
  );
}

/* ──────────────────────────────────────────────────────────
   Top trainers — horizontal bar of participants trained,
   with the trainings-run count shown as a direct label
   (one measure per axis — never dual scale).
   ────────────────────────────────────────────────────────── */
export function TopTrainersChart({ data = [] }) {
  const rows = [...data].filter((t) => t.trainings > 0).sort((a, b) => b.trainings - a.trainings);
  if (!rows.length) return <NoData label="No trainer activity yet" />;
  const config = { trainings: { label: "Trainings delivered", color: PALETTE[1] } };
  const height = Math.max(200, rows.length * 42);
  return (
    <ChartContainer config={config} className="block w-full" style={{ height }}>
      <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 56, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="#e1e0d9" />
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={110} fontSize={12} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, name, item) => (
                <Box className="flex flex-col gap-0.5">
                  <Text as="span" className="text-xs font-semibold text-slate-700">{item.payload.name}</Text>
                  <Text as="span" className="text-[11px] text-slate-500">{value} training{value === 1 ? "" : "s"} delivered</Text>
                </Box>
              )}
            />
          }
        />
        <Bar dataKey="trainings" fill={PALETTE[1]} radius={[0, 4, 4, 0]} barSize={22} isAnimationActive={false}>
          <LabelList
            dataKey="trainings"
            position="right"
            fontSize={11}
            fill="#52514e"
            formatter={(v) => `${v} training${v === 1 ? "" : "s"}`}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

/* ──────────────────────────────────────────────────────────
   Course demand — most-requested courses (horizontal bar of
   enrolment requests, trainings-run count as a direct label)
   ────────────────────────────────────────────────────────── */
export function CourseDemandChart({ data = [] }) {
  const rows = data.filter((c) => c.requests > 0);
  if (!rows.length) return <NoData label="No course requests yet" />;
  const config = { requests: { label: "Requests", color: PALETTE[0] } };
  const height = Math.max(200, rows.length * 40);
  return (
    <ChartContainer config={config} className="block w-full" style={{ height }}>
      <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 48, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="#e1e0d9" />
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis type="category" dataKey="title" tickLine={false} axisLine={false} width={150} fontSize={11}
          tickFormatter={(t) => (t.length > 24 ? `${t.slice(0, 23)}…` : t)} />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="requests" fill={PALETTE[0]} radius={[0, 4, 4, 0]} barSize={20} isAnimationActive={false}>
          <LabelList dataKey="requests" position="right" fontSize={11} fill="#52514e" />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

/* ──────────────────────────────────────────────────────────
   Attendance — completed-training attendance mix + rate
   ────────────────────────────────────────────────────────── */
const ATTENDANCE_COLOR = { present: "#008300", partial: "#eda100", absent: "#e34948" };
const ATTENDANCE_LABEL = { present: "Present", partial: "Partial", absent: "Absent" };

export function AttendanceChart({ data }) {
  const marked = data?.marked ?? 0;
  const ratePct = Math.round((data?.attendance_rate ?? 0) * 100);
  return (
    <DonutChart
      data={[
        { key: "present", value: data?.present ?? 0 },
        { key: "partial", value: data?.partial ?? 0 },
        { key: "absent", value: data?.absent ?? 0 },
      ]}
      colorFor={(k) => ATTENDANCE_COLOR[k]}
      labelFor={(k) => ATTENDANCE_LABEL[k]}
      centerValue={marked ? `${ratePct}%` : undefined}
      centerLabel={marked ? "Attended" : ""}
      emptyLabel="No completed trainings in range"
    />
  );
}

/* ──────────────────────────────────────────────────────────
   Enrolments by session duration (hours/day) — vertical bar
   ────────────────────────────────────────────────────────── */
export function DurationChart({ data = [] }) {
  const rows = data.filter((d) => d.trainings > 0);
  if (!rows.length) return <NoData />;
  const config = { enrolments: { label: "Enrolments", color: PALETTE[4] } };
  return (
    <ChartContainer config={config} className="block h-[240px] w-full">
      <BarChart data={rows} margin={{ left: -12, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e1e0d9" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} width={40} fontSize={11} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        <Bar dataKey="enrolments" fill={PALETTE[4]} radius={[4, 4, 0, 0]} barSize={44} isAnimationActive={false}>
          <LabelList dataKey="enrolments" position="top" fontSize={11} fill="#52514e" />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

/* ──────────────────────────────────────────────────────────
   Enrolments by location — horizontal bar (venue city / online)
   ────────────────────────────────────────────────────────── */
export function LocationChart({ data = [] }) {
  const rows = data.filter((d) => d.enrolments > 0 || d.trainings > 0);
  if (!rows.length) return <NoData />;
  const config = { enrolments: { label: "Enrolments", color: PALETTE[1] } };
  const height = Math.max(200, rows.length * 34);
  return (
    <ChartContainer config={config} className="block w-full" style={{ height }}>
      <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 48, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="#e1e0d9" />
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis type="category" dataKey="location" tickLine={false} axisLine={false} width={140} fontSize={11}
          tickFormatter={(t) => (t.length > 20 ? `${t.slice(0, 19)}…` : t)} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, name, item) => (
                <Box className="flex flex-col gap-0.5">
                  <Text as="span" className="text-xs font-semibold text-slate-700">{item.payload.location}</Text>
                  <Text as="span" className="text-[11px] text-slate-500">{value} enrolments · {fmtMoney(item.payload.revenue)}</Text>
                </Box>
              )}
            />
          }
        />
        <Bar dataKey="enrolments" fill={PALETTE[1]} radius={[0, 4, 4, 0]} barSize={18} isAnimationActive={false}>
          <LabelList dataKey="enrolments" position="right" fontSize={11} fill="#52514e" />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

/* ──────────────────────────────────────────────────────────
   Revenue over time — monthly paid revenue (area)
   ────────────────────────────────────────────────────────── */
export function RevenueOverTimeChart({ data = [] }) {
  const rows = data.map((r) => ({ ...r, label: formatMonth(r.month) }));
  if (!rows.length || rows.every((r) => !r.revenue)) return <NoData label="No revenue in range" />;
  const config = { revenue: { label: "Revenue", color: PALETTE[3] } };
  return (
    <ChartContainer config={config} className="block h-[280px] w-full">
      <AreaChart data={rows} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="fill-revenue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={PALETTE[3]} stopOpacity={0.35} />
            <stop offset="95%" stopColor={PALETTE[3]} stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#e1e0d9" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} minTickGap={16} />
        <YAxis tickLine={false} axisLine={false} width={52} fontSize={11} tickFormatter={fmtMoney} />
        <ChartTooltip
          content={
            <ChartTooltipContent
              formatter={(value) => (
                <Box className="flex w-full items-center justify-between gap-4">
                  <Text as="span" className="text-xs text-slate-500">Revenue</Text>
                  <Text as="span" className="font-mono text-xs font-semibold text-slate-800">{fmtMoney(value)}</Text>
                </Box>
              )}
            />
          }
        />
        <Area type="monotone" dataKey="revenue" stroke={PALETTE[3]} strokeWidth={2} fill="url(#fill-revenue)" isAnimationActive={false} />
      </AreaChart>
    </ChartContainer>
  );
}

/* ──────────────────────────────────────────────────────────
   Revenue by course — horizontal bar (top courses by revenue)
   ────────────────────────────────────────────────────────── */
export function RevenueByCourseChart({ data = [] }) {
  const rows = data.filter((c) => c.revenue > 0);
  if (!rows.length) return <NoData label="No revenue in range" />;
  const config = { revenue: { label: "Revenue", color: PALETTE[3] } };
  const height = Math.max(200, rows.length * 40);
  return (
    <ChartContainer config={config} className="block w-full" style={{ height }}>
      <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 56, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="#e1e0d9" />
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="title" tickLine={false} axisLine={false} width={150} fontSize={11}
          tickFormatter={(t) => (t.length > 24 ? `${t.slice(0, 23)}…` : t)} />
        <ChartTooltip content={<ChartTooltipContent hideLabel formatter={(v) => (
          <Text as="span" className="font-mono text-xs font-semibold text-slate-800">{fmtMoney(v)}</Text>
        )} />} />
        <Bar dataKey="revenue" fill={PALETTE[3]} radius={[0, 4, 4, 0]} barSize={20} isAnimationActive={false}>
          <LabelList dataKey="revenue" position="right" fontSize={11} fill="#52514e" formatter={fmtMoney} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

/* ──────────────────────────────────────────────────────────
   Learner-profile analytics
   ────────────────────────────────────────────────────────── */

/* Reusable horizontal bar of enrolment counts by a category. */
function HBar({ rows, catKey, color, labelWidth = 130, empty }) {
  if (!rows.length) return <NoData label={empty} />;
  const config = { enrolments: { label: "Enrolments", color } };
  const height = Math.max(180, rows.length * 34);
  return (
    <ChartContainer config={config} className="block w-full" style={{ height }}>
      <BarChart data={rows} layout="vertical" margin={{ left: 8, right: 44, top: 4, bottom: 4 }}>
        <CartesianGrid horizontal={false} stroke="#e1e0d9" />
        <XAxis type="number" hide allowDecimals={false} />
        <YAxis type="category" dataKey={catKey} tickLine={false} axisLine={false} width={labelWidth} fontSize={11}
          tickFormatter={(t) => (String(t).length > 22 ? `${String(t).slice(0, 21)}…` : t)} />
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="enrolments" fill={color} radius={[0, 4, 4, 0]} barSize={18} isAnimationActive={false}>
          <LabelList dataKey="enrolments" position="right" fontSize={11} fill="#52514e" />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

const SPONSORSHIP_COLOR = { self: "#2a78d6", corporate: "#4a3aa7", unspecified: "#cbd5e1" };
const SPONSORSHIP_LABEL = { self: "Self-sponsored", corporate: "Corporate", unspecified: "Unspecified" };

export function SponsorshipChart({ data = [] }) {
  return (
    <DonutChart
      data={data.map((d) => ({ key: d.sponsorship, value: d.enrolments }))}
      colorFor={(k) => SPONSORSHIP_COLOR[k] ?? "#cbd5e1"}
      labelFor={(k) => SPONSORSHIP_LABEL[k] ?? k}
      centerLabel="Enrolments"
      emptyLabel="No enrolments in range"
    />
  );
}

export function JobTitleChart({ data = [] }) {
  return <HBar rows={data.filter((d) => d.enrolments > 0)} catKey="job_title" color={PALETTE[0]} labelWidth={124} empty="No enrolments in range" />;
}

export function DepartmentChart({ data = [] }) {
  return <HBar rows={data.filter((d) => d.enrolments > 0)} catKey="department" color={PALETTE[4]} labelWidth={140} empty="No enrolments in range" />;
}

export function TopCompaniesChart({ data = [] }) {
  return <HBar rows={data.filter((d) => d.enrolments > 0)} catKey="company" color={PALETTE[1]} labelWidth={130} empty="No enrolments in range" />;
}

export function ExperienceChart({ data = [] }) {
  const rows = data.filter((d) => d.enrolments > 0);
  if (!rows.length) return <NoData />;
  const config = { enrolments: { label: "Enrolments", color: PALETTE[2] } };
  return (
    <ChartContainer config={config} className="block h-[240px] w-full">
      <BarChart data={rows} margin={{ left: -12, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#e1e0d9" />
        <XAxis dataKey="bracket" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
        <YAxis tickLine={false} axisLine={false} width={40} fontSize={11} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        <Bar dataKey="enrolments" fill={PALETTE[2]} radius={[4, 4, 0, 0]} barSize={44} isAnimationActive={false}>
          <LabelList dataKey="enrolments" position="top" fontSize={11} fill="#52514e" />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

/* ──────────────────────────────────────────────────────────
   Pricing tier mix — donut of enrolments by package tier
   ────────────────────────────────────────────────────────── */
export function TierChart({ data = [] }) {
  return (
    <DonutChart
      data={data.map((d) => ({ key: d.tier, value: d.enrolments }))}
      colorFor={(k) => TIER_COLOR[k] ?? "#cbd5e1"}
      labelFor={(k) => k}
      centerLabel="Enrolments"
      emptyLabel="No enrolments in range"
    />
  );
}
