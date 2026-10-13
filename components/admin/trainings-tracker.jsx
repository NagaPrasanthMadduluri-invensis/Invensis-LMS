"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Search, X, Download, Pencil, Check, Loader2, Table2, ListFilter,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { wallFields, formatTime, toDateInput } from "@/lib/datetime";
import { sessionDatesOf } from "@/components/shared/session-dates";
import { buildConvertedRows } from "@/components/shared/timezone-converter";
import { fetchTrainingTracker, updateTrainingZoomId } from "@/services/api/admin/admin-api";

/* ── Derivations that mirror the sales Excel sheet ── */

const MODE_LABEL = { virtual: "LVC", in_person: "In-Person", hybrid: "Hybrid", one_to_one: "1:1" };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Finer region buckets than lib/region's EMEA/APAC/Americas — the sheet shows
// Europe / USA / APAC / Africa / Middle East, so the tracker derives those.
const MIDDLE_EAST_ZONES = new Set([
  "Asia/Dubai", "Asia/Muscat", "Asia/Qatar", "Asia/Bahrain", "Asia/Kuwait", "Asia/Riyadh",
  "Asia/Aden", "Asia/Baghdad", "Asia/Amman", "Asia/Beirut", "Asia/Damascus", "Asia/Gaza",
  "Asia/Hebron", "Asia/Jerusalem", "Asia/Tel_Aviv", "Asia/Nicosia", "Asia/Famagusta",
  "Asia/Istanbul", "Asia/Tehran", "Asia/Baku", "Asia/Tbilisi", "Asia/Yerevan",
]);

function salesRegion(tz) {
  const z = String(tz || "");
  if (!z) return { key: "other", label: "—" };
  if (MIDDLE_EAST_ZONES.has(z)) return { key: "middle_east", label: "Middle East" };
  if (z.startsWith("Europe/")) return { key: "europe", label: "Europe" };
  if (z.startsWith("Africa/")) return { key: "africa", label: "Africa" };
  if (z.startsWith("America/")) return { key: "usa", label: "USA" };
  if (z.startsWith("Australia/") || z.startsWith("Pacific/")) return { key: "apac", label: "APAC" };
  if (z.startsWith("Asia/") || z.startsWith("Indian/")) return { key: "apac", label: "APAC" };
  return { key: "other", label: z };
}

/* Excel-style cell fills — the whole cell is colored, matching the sheet.
   Classes are written as literals so Tailwind generates them (arbitrary values
   can't be built from runtime strings). Fixed hex, not design tokens, to
   reproduce the sheet exactly. */
const REGION_CELL = {
  europe: "bg-[#7030a0] text-white",
  usa: "bg-[#2e8b84] text-white",
  apac: "bg-[#2f6fd0] text-white",
  africa: "bg-[#806000] text-white",
  middle_east: "bg-[#1fa39a] text-white",
  other: "",
};
const WEEKDAY_CELL = {
  Weekday: "bg-[#70ad47] text-white",
  Weekend: "bg-[#8064a2] text-white",
};
const MODE_CELL = {
  LVC: "bg-[#2e75b6] text-white",
  "In-Person": "bg-[#5b9bd5] text-white",
  Hybrid: "bg-[#5b9bd5] text-white",
  "1:1": "bg-[#5b9bd5] text-white",
};

// Status → Excel-style label + fill. A future active training reads "Upcoming".
function statusDrop(t) {
  if (t.status === "active" && t.start_date && t.start_date > toDateInput()) {
    return { label: "Upcoming", cls: "bg-[#2f6fd0] text-white" };
  }
  const M = {
    active: { label: "Active", cls: "bg-[#2f6fd0] text-white" },
    ongoing: { label: "Ongoing", cls: "bg-[#1fa39a] text-white" },
    completed: { label: "Completed", cls: "bg-[#548235] text-white" },
    postponed: { label: "Postpone", cls: "bg-[#bf8f00] text-white" },
    cancelled: { label: "Cancelled", cls: "bg-[#c00000] text-white" },
    suspended: { label: "Suspended", cls: "bg-[#c55a11] text-white" },
    pending: { label: "Pending", cls: "bg-[#7f7f7f] text-white" },
  };
  return M[t.status] || { label: t.status, cls: "bg-[#7f7f7f] text-white" };
}

const WEEKEND_DOW = new Set([0, 6]); // Sun, Sat
function weekdayType(t) {
  const dates = sessionDatesOf(t);
  if (!dates.length) return null;
  const allWeekend = dates.every((d) => {
    const f = wallFields(d);
    return f && WEEKEND_DOW.has(f.weekday);
  });
  return allWeekend ? "Weekend" : "Weekday";
}

function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}

// "5th to 7th" for runs of 3+ consecutive days; comma-listed otherwise.
function trainingDateLabel(dates) {
  const days = [...new Set(dates.map((d) => wallFields(d)?.day).filter(Boolean))].sort((a, b) => a - b);
  if (!days.length) return "—";
  const ranges = [];
  let start = days[0];
  let prev = days[0];
  for (let i = 1; i < days.length; i++) {
    if (days[i] === prev + 1) { prev = days[i]; continue; }
    ranges.push([start, prev]); start = days[i]; prev = days[i];
  }
  ranges.push([start, prev]);
  return ranges
    .map(([a, b]) => (b - a >= 2 ? `${ordinal(a)} to ${ordinal(b)}` : a === b ? ordinal(a) : `${ordinal(a)}, ${ordinal(b)}`))
    .join(", ");
}

// Daily start time re-expressed in IST (the sheet's "IST" column). The wall-clock
// start is anchored in the training's own zone, then read in Asia/Kolkata —
// the same deliberate conversion the timezone-converter does elsewhere.
function istTime(t) {
  const first = sessionDatesOf(t)[0] || t.start_date;
  if (!first || !t.start_time || !t.timezone) return "—";
  const { rows } = buildConvertedRows(
    [{ day_number: 1, start_time: `${first}T${t.start_time}Z` }],
    t.timezone,
    t.country_code,
    "Asia/Kolkata"
  );
  return rows[0]?.start || "—";
}

// `schedules.venue` is JSON ({ city, address, country }) for in-person trainings,
// null for virtual. The sheet shows "City, Country".
function locationLabel(venue) {
  if (!venue) return "—";
  if (typeof venue === "string") return venue || "—";
  const parts = [venue.city, venue.country].filter(Boolean);
  return parts.length ? parts.join(", ") : "—";
}

function monthKeyOf(t) {
  const f = wallFields(t.start_date);
  return f ? `${f.year}-${String(f.month).padStart(2, "0")}` : "0000-00";
}
function monthLabelOf(key) {
  if (key === "0000-00") return "No date set";
  const [y, m] = key.split("-");
  return `${MONTHS[Number(m) - 1]}-${y}`;
}

/* ── The one editable cell: Zoom ID ── */
function ZoomCell({ training, token, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(training.zoom_id || "");
  const [saving, setSaving] = useState(false);

  async function save() {
    const next = value.trim();
    if (next === (training.zoom_id || "")) { setEditing(false); return; }
    setSaving(true);
    try {
      const res = await updateTrainingZoomId({ token, trainingRef: training.id, zoomId: next || null });
      onSaved(training.id, res?.training?.zoom_id ?? (next || null));
      setEditing(false);
    } catch {
      setValue(training.zoom_id || ""); // revert on failure
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <Box className="flex items-center gap-1">
        <Input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setValue(training.zoom_id || ""); setEditing(false); } }}
          onBlur={save}
          disabled={saving}
          className="h-7 w-24 px-2 text-xs"
          placeholder="e.g. Ops 1"
        />
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground-subtle" /> : <Check className="h-3.5 w-3.5 text-foreground-subtle" />}
      </Box>
    );
  }

  return (
    <button
      type="button"
      onClick={() => { setValue(training.zoom_id || ""); setEditing(true); }}
      className="group inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs text-foreground hover:bg-surface-hover"
      title="Click to edit Zoom ID"
    >
      <Text as="span" className={training.zoom_id ? "text-foreground" : "text-foreground-subtle italic"}>
        {training.zoom_id || "Add"}
      </Text>
      <Pencil className="h-3 w-3 text-foreground-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

/* ── CSV export of the filtered view ── */
const CSV_HEADERS = [
  "Sl No", "Training Date", "Weekday/Weekend", "Training ID", "Course", "Local Time", "IST",
  "No of Days", "Duration (Per Day)", "Mode", "Location", "Region", "No. of Pax", "Status", "Trainer Name", "Zoom ID",
];
function csvCell(v) {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function exportCsv(groups) {
  const lines = [CSV_HEADERS.map(csvCell).join(",")];
  for (const g of groups) {
    lines.push(csvCell(monthLabelOf(g.key))); // month band row
    g.rows.forEach((t, i) => {
      const dates = sessionDatesOf(t);
      lines.push([
        i + 1,
        trainingDateLabel(dates),
        weekdayType(t) || "",
        t.event_code || t.code || "",
        t.title || "",
        formatTime(t.start_time, { fallback: "" }),
        istTime(t),
        dates.length || "",
        t.hours_per_day ?? "",
        MODE_LABEL[t.delivery_mode] || t.delivery_mode || "",
        locationLabel(t.venue) === "—" ? "" : locationLabel(t.venue),
        salesRegion(t.timezone).label,
        t.enrolled_count ?? "",
        statusDrop(t).label,
        t.trainer_name || "",
        t.zoom_id || "",
      ].map(csvCell).join(","));
    });
  }
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `trainings-tracker-${toDateInput()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/* ── Columns: label + fixed Excel-like width + a value accessor used by the
   per-column (Google-Sheets style) filters. `filter: false` = no funnel. ── */
const COLS = [
  { key: "sl", label: "Sl No", w: "w-[44px]", filter: false },
  { key: "date", label: "Training Date", w: "w-[122px]", value: (t) => trainingDateLabel(sessionDatesOf(t)) },
  { key: "weekday", label: "Weekday/weekend", w: "w-[94px]", value: (t) => weekdayType(t) || "" },
  { key: "trainingId", label: "Training ID", w: "w-[84px]", value: (t) => t.event_code || t.code || "" },
  { key: "course", label: "Course", w: "w-[220px]", value: (t) => t.title || "" },
  { key: "localTime", label: "Local Time", w: "w-[76px]", value: (t) => formatTime(t.start_time, { fallback: "" }) },
  { key: "ist", label: "IST", w: "w-[76px]", value: (t) => istTime(t) },
  { key: "days", label: "No of Days", w: "w-[54px]", value: (t) => String(sessionDatesOf(t).length || "") },
  { key: "duration", label: "Duration (Per Day)", w: "w-[70px]", value: (t) => (t.hours_per_day != null ? String(t.hours_per_day) : "") },
  { key: "mode", label: "Mode", w: "w-[74px]", value: (t) => MODE_LABEL[t.delivery_mode] || t.delivery_mode || "" },
  { key: "location", label: "Location", w: "w-[190px]", value: (t) => (locationLabel(t.venue) === "—" ? "" : locationLabel(t.venue)) },
  { key: "region", label: "Region", w: "w-[100px]", value: (t) => salesRegion(t.timezone).label },
  { key: "pax", label: "No. of Pax", w: "w-[56px]", value: (t) => String(t.enrolled_count ?? 0) },
  { key: "status", label: "Status", w: "w-[100px]", value: (t) => statusDrop(t).label },
  { key: "trainer", label: "Trainer Name", w: "w-[150px]", value: (t) => t.trainer_name || "" },
  { key: "zoom", label: "Zoom ID", w: "w-[84px]", value: (t) => t.zoom_id || "" },
];

// Sort values for a filter list: numeric when both look numeric, blanks last.
function cmpValues(a, b) {
  if (a === b) return 0;
  if (a === "") return 1;
  if (b === "") return -1;
  const na = Number(a);
  const nb = Number(b);
  if (!Number.isNaN(na) && !Number.isNaN(nb) && a.trim() !== "" && b.trim() !== "") return na - nb;
  return a.localeCompare(b);
}

/* ── Google-Sheets style per-column filter popover ── */
function ColumnFilter({ options, selected, onApply }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [draft, setDraft] = useState(() => new Set(options.map((o) => o.value)));

  useEffect(() => {
    if (open) {
      setQ("");
      setDraft(new Set(selected ?? options.map((o) => o.value)));
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const active = selected != null;
  const shown = options.filter((o) => o.label.toLowerCase().includes(q.trim().toLowerCase()));
  const allShownChecked = shown.length > 0 && shown.every((o) => draft.has(o.value));

  const toggle = (v) => setDraft((prev) => { const n = new Set(prev); n.has(v) ? n.delete(v) : n.add(v); return n; });
  const toggleAllShown = () => setDraft((prev) => {
    const n = new Set(prev);
    if (allShownChecked) shown.forEach((o) => n.delete(o.value));
    else shown.forEach((o) => n.add(o.value));
    return n;
  });
  const apply = () => { onApply(draft.size === options.length ? null : [...draft]); setOpen(false); };
  const clear = () => { onApply(null); setOpen(false); };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={`inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm ${active ? "bg-amber-400/90 text-[#1f3a5f]" : "text-white/80 hover:bg-white/20"}`}
        aria-label="Filter column"
      >
        <ListFilter className="h-2.5 w-2.5" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-60 p-2 text-foreground">
        <Box className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-subtle" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search values"
            className="w-full h-8 pl-7 pr-2 rounded-md border border-border bg-surface-hover text-xs focus:outline-none focus:ring-2 focus:ring-focus" />
        </Box>
        <button type="button" onClick={toggleAllShown}
          className="mt-1.5 flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-xs font-semibold hover:bg-surface-hover">
          <CheckBox on={allShownChecked} />
          {allShownChecked ? "Clear all" : "Select all"}
        </button>
        <Box className="mt-1 max-h-56 overflow-y-auto border-t border-border pt-1">
          {shown.length === 0 ? (
            <Text as="p" className="px-1.5 py-2 text-xs text-foreground-subtle">No values</Text>
          ) : shown.map((o) => (
            <button key={o.value || "(blank)"} type="button" onClick={() => toggle(o.value)}
              className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-xs hover:bg-surface-hover">
              <CheckBox on={draft.has(o.value)} />
              <Text as="span" className="truncate">{o.label}</Text>
            </button>
          ))}
        </Box>
        <Box className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-2">
          <button type="button" onClick={clear}
            className="rounded-md px-2.5 py-1 text-xs font-medium text-foreground-muted hover:bg-surface-hover">Clear</button>
          <button type="button" onClick={apply}
            className="rounded-md bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:bg-primary-hover">OK</button>
        </Box>
      </PopoverContent>
    </Popover>
  );
}

function CheckBox({ on }) {
  return (
    <Box className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${on ? "bg-primary border-primary text-primary-foreground" : "border-border bg-surface"}`}>
      {on && <Check className="h-3 w-3" />}
    </Box>
  );
}

export function TrainingsTracker() {
  const { token } = useAuth();
  const { setOpen, open } = useSidebar();
  const [trainings, setTrainings] = useState(null);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  // Per-column filters: { [colKey]: string[] } — presence of a key means active.
  const [colFilters, setColFilters] = useState({});

  // Collapse the sidebar on entering the tracker (the grid is very wide), and
  // restore the previous state on leaving so other pages aren't affected.
  useEffect(() => {
    const prev = open;
    setOpen(false);
    return () => setOpen(prev);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!token) return;
    fetchTrainingTracker({ token })
      .then((d) => setTrainings(d.trainings || []))
      .catch((e) => setError(e.message));
  }, [token]);

  const onZoomSaved = useCallback((id, zoom_id) => {
    setTrainings((prev) => (prev || []).map((t) => (t.id === id ? { ...t, zoom_id } : t)));
  }, []);

  const list = trainings || [];

  // Distinct values per filterable column, for the header filter popovers.
  const distinctByCol = useMemo(() => {
    const m = {};
    for (const c of COLS) {
      if (c.filter === false) continue;
      const set = new Set();
      for (const t of list) set.add(c.value(t));
      m[c.key] = [...set].sort(cmpValues).map((v) => ({ value: v, label: v === "" ? "(Blanks)" : v }));
    }
    return m;
  }, [list]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const activeKeys = Object.keys(colFilters);
    return list.filter((t) => {
      if (q) {
        const hay = `${t.title ?? ""} ${t.code ?? ""} ${t.event_code ?? ""} ${t.trainer_name ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      for (const key of activeKeys) {
        const allowed = colFilters[key];
        const col = COLS.find((c) => c.key === key);
        if (!allowed || !col) continue;
        if (!allowed.includes(col.value(t))) return false;
      }
      return true;
    });
  }, [list, search, colFilters]);

  // Group filtered rows by month, newest month first.
  const groups = useMemo(() => {
    const byMonth = new Map();
    for (const t of filtered) {
      const key = monthKeyOf(t);
      if (!byMonth.has(key)) byMonth.set(key, []);
      byMonth.get(key).push(t);
    }
    return [...byMonth.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : a[0] > b[0] ? -1 : 0)) // newest first; "0000-00" sinks to the end
      .map(([key, rows]) => ({ key, rows }));
  }, [filtered]);

  const hasFilters = !!search || Object.keys(colFilters).length > 0;
  const clearFilters = () => { setSearch(""); setColFilters({}); };
  const setColFilter = (key, vals) => setColFilters((prev) => {
    const n = { ...prev };
    if (vals == null) delete n[key]; else n[key] = vals;
    return n;
  });

  if (error) {
    return (
      <Card className="p-6 border-error-border bg-error-subtle">
        <Text as="p" className="text-sm text-error">Failed to load the tracker: {error}</Text>
      </Card>
    );
  }

  if (!trainings) {
    return (
      <Box className="space-y-3">
        <Skeleton className="h-14 w-full rounded-2xl" />
        <Skeleton className="h-[480px] w-full rounded-2xl" />
      </Box>
    );
  }

  return (
    <Box className="space-y-4">
      {/* Toolbar */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm p-3.5">
        <Box className="flex flex-wrap items-center gap-2.5">
          <Box className="relative flex-1 min-w-[220px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle" />
            <Input
              placeholder="Search by course, Training ID or trainer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoComplete="off"
              className="pl-9 pr-9 h-9 text-sm bg-surface-hover border-border rounded-xl"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Clear search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-subtle hover:text-foreground-muted">
                <X className="h-4 w-4" />
              </button>
            )}
          </Box>

          {hasFilters && (
            <button type="button" onClick={clearFilters}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-foreground-muted hover:bg-surface-hover">
              <X className="h-3.5 w-3.5" /> Clear all filters
            </button>
          )}

          <Text as="span" className="text-xs text-foreground-subtle tabular-nums ml-auto">
            {filtered.length} of {list.length}
          </Text>
          <button type="button" onClick={() => exportCsv(groups)} disabled={!filtered.length}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
        </Box>
      </Card>

      {/* Grid */}
      {filtered.length === 0 ? (
        <Card className="p-14 text-center rounded-2xl border border-slate-200/80 shadow-sm">
          <Box className="w-14 h-14 rounded-2xl bg-surface-muted flex items-center justify-center mx-auto mb-4">
            <Table2 className="h-7 w-7 text-foreground-subtle" />
          </Box>
          <Text as="p" className="text-sm font-semibold text-foreground-muted">
            {list.length === 0 ? "No trainings yet" : "No trainings match your filters"}
          </Text>
        </Card>
      ) : (
        <Card className="rounded-lg border border-[#9db2c8] shadow-sm overflow-hidden p-0">
          <Box className="overflow-auto max-h-[74vh]">
            <table className="w-full min-w-[1594px] table-fixed border-collapse text-[11.5px]">
              <colgroup>
                {COLS.map((c) => <col key={c.label} className={c.w} />)}
              </colgroup>
              <thead className="sticky top-0 z-20">
                <tr>
                  {COLS.map((c) => (
                    <th key={c.key} title={c.label} className="h-4 py-2 align-middle leading-[1.15] font-bold text-white bg-[#2e75b6] border border-[#1f5a8a] overflow-hidden">
                      <Box className="flex items-center justify-center gap-0.5 overflow-hidden">
                        <span className="min-w-0 truncate text-white">{c.label}</span>
                        {c.filter !== false && (
                          <ColumnFilter
                            options={distinctByCol[c.key] || []}
                            selected={colFilters[c.key] ?? null}
                            onApply={(vals) => setColFilter(c.key, vals)}
                          />
                        )}
                      </Box>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {groups.map((g) => (
                  <GroupRows key={g.key} group={g} token={token} onZoomSaved={onZoomSaved} />
                ))}
              </tbody>
            </table>
          </Box>
        </Card>
      )}
    </Box>
  );
}

// Base cell: gridlines, tight Excel-like height, centered, single line + ellipsis.
const TD = "border border-[#c7cdd4] h-[14px] align-middle text-center overflow-hidden text-ellipsis whitespace-nowrap leading-[1.15]";

function GroupRows({ group, token, onZoomSaved }) {
  return (
    <>
      <tr>
        <td colSpan={COLS.length} className="bg-[#f8cbad] text-center h-4 text-[12px] font-bold text-[#843c0c] border border-[#e0a878]">
          {monthLabelOf(group.key)}
        </td>
      </tr>
      {group.rows.map((t, i) => {
        const dates = sessionDatesOf(t);
        const wk = weekdayType(t);
        const region = salesRegion(t.timezone);
        const st = statusDrop(t);
        const mode = MODE_LABEL[t.delivery_mode] || t.delivery_mode;
        const location = locationLabel(t.venue);
        return (
          <tr key={t.id} className="bg-white hover:bg-[#eef4fb]">
            <td className={`${TD} text-[#555] tabular-nums`}>{i + 1}</td>
            <td className={TD} title={trainingDateLabel(dates)}>{trainingDateLabel(dates)}</td>
            <td className={`${TD} font-semibold ${wk ? WEEKDAY_CELL[wk] : ""}`}>{wk || ""}</td>
            <td className={`${TD} font-semibold text-[#1f4e79]`}>{t.event_code || t.code || "—"}</td>
            <td className={TD} title={t.title}>{t.title}</td>
            <td className={TD}>{formatTime(t.start_time, { fallback: "—" })}</td>
            <td className={TD}>{istTime(t)}</td>
            <td className={`${TD} tabular-nums`}>{dates.length || "—"}</td>
            <td className={`${TD} tabular-nums`}>{t.hours_per_day ?? "—"}</td>
            <td className={`${TD} font-semibold ${MODE_CELL[mode] || "bg-[#5b9bd5] text-white"}`}>{mode}</td>
            <td className={TD} title={location}>{location}</td>
            <td className={`${TD} font-semibold ${REGION_CELL[region.key]}`}>{region.label}</td>
            <td className={`${TD} tabular-nums`}>{t.enrolled_count ?? 0}</td>
            <td className={`${TD} font-semibold ${st.cls}`}>{st.label}</td>
            <td className={TD} title={t.trainer_name || ""}>{t.trainer_name || "—"}</td>
            <td className={`${TD} p-0`}>
              <ZoomCell training={t} token={token} onSaved={onZoomSaved} />
            </td>
          </tr>
        );
      })}
    </>
  );
}
