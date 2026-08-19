"use client";

import { useMemo, useState } from "react";
import { Globe2, Clock, MapPin, ArrowRight } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";

/*
 * Session-time timezone converter for the trainer.
 *
 * Conversion is done with the browser-native `Intl` timezone engine (the IANA
 * tz database built into every browser) — no dependency, DST-aware, accurate.
 *
 * Session times are stored as the wall-clock time labelled UTC (see order
 * ingestion), so a stored timestamp's *UTC components* ARE the wall time in the
 * session's own timezone. We turn that back into a real instant using the
 * source zone's offset, then format it in the trainer's chosen zone.
 */

// CMS/schedule timezone abbreviations → IANA zone. Abbreviations are ambiguous,
// so we map the ones the catalogue actually uses; a value already containing a
// "/" is treated as an IANA zone as-is.
const SOURCE_ZONE = {
  IST: "Asia/Kolkata",
  GST: "Asia/Dubai",
  SGT: "Asia/Singapore",
  JST: "Asia/Tokyo",
  AEST: "Australia/Sydney",
  AEDT: "Australia/Sydney",
  GMT: "Europe/London",
  UTC: "UTC",
  BST: "Europe/London",
  CET: "Europe/Paris",
  CEST: "Europe/Paris",
  EST: "America/New_York",
  EDT: "America/New_York",
  CST: "America/Chicago",
  CDT: "America/Chicago",
  MST: "America/Denver",
  MDT: "America/Denver",
  PST: "America/Los_Angeles",
  PDT: "America/Los_Angeles",
};

// Country (or region for multi-zone countries) → representative IANA zone.
const COUNTRY_ZONES = [
  { label: "India", zone: "Asia/Kolkata" },
  { label: "United Arab Emirates", zone: "Asia/Dubai" },
  { label: "Singapore", zone: "Asia/Singapore" },
  { label: "United Kingdom", zone: "Europe/London" },
  { label: "Ireland", zone: "Europe/Dublin" },
  { label: "Germany", zone: "Europe/Berlin" },
  { label: "France", zone: "Europe/Paris" },
  { label: "Netherlands", zone: "Europe/Amsterdam" },
  { label: "Spain", zone: "Europe/Madrid" },
  { label: "South Africa", zone: "Africa/Johannesburg" },
  { label: "Nigeria", zone: "Africa/Lagos" },
  { label: "Saudi Arabia", zone: "Asia/Riyadh" },
  { label: "Qatar", zone: "Asia/Qatar" },
  { label: "Pakistan", zone: "Asia/Karachi" },
  { label: "Bangladesh", zone: "Asia/Dhaka" },
  { label: "Sri Lanka", zone: "Asia/Colombo" },
  { label: "Malaysia", zone: "Asia/Kuala_Lumpur" },
  { label: "Indonesia (Jakarta)", zone: "Asia/Jakarta" },
  { label: "Philippines", zone: "Asia/Manila" },
  { label: "China", zone: "Asia/Shanghai" },
  { label: "Hong Kong", zone: "Asia/Hong_Kong" },
  { label: "Japan", zone: "Asia/Tokyo" },
  { label: "South Korea", zone: "Asia/Seoul" },
  { label: "United States (Eastern)", zone: "America/New_York" },
  { label: "United States (Central)", zone: "America/Chicago" },
  { label: "United States (Mountain)", zone: "America/Denver" },
  { label: "United States (Pacific)", zone: "America/Los_Angeles" },
  { label: "Canada (Eastern)", zone: "America/Toronto" },
  { label: "Canada (Pacific)", zone: "America/Vancouver" },
  { label: "Brazil (São Paulo)", zone: "America/Sao_Paulo" },
  { label: "Mexico", zone: "America/Mexico_City" },
  { label: "Australia (Sydney)", zone: "Australia/Sydney" },
  { label: "Australia (Perth)", zone: "Australia/Perth" },
  { label: "New Zealand", zone: "Pacific/Auckland" },
];

function resolveSourceZone(code) {
  if (!code) return null;
  if (code.includes("/")) return code; // already IANA
  return SOURCE_ZONE[code.trim().toUpperCase()] || null;
}

// Offset (ms) of `zone` at a given instant, via Intl.
function zoneOffsetMs(instant, zone) {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: zone, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const p = Object.fromEntries(dtf.formatToParts(instant).map((x) => [x.type, x.value]));
  const asUTC = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUTC - instant.getTime();
}

// A stored session timestamp is wall-time-labelled-UTC. Re-anchor it to a real
// instant in the source zone.
function wallInSourceToInstant(iso, sourceZone) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  // The stored value's UTC fields are the wall time; shift by the source offset.
  const off = zoneOffsetMs(d, sourceZone);
  return new Date(d.getTime() - off);
}

function fmtTime(instant, zone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: zone, hour: "numeric", minute: "2-digit", hour12: true,
  }).format(instant);
}

function fmtDay(instant, zone) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: zone, weekday: "short", day: "2-digit", month: "short",
  }).format(instant);
}

function zoneAbbr(instant, zone) {
  const part = new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "short" })
    .formatToParts(instant).find((x) => x.type === "timeZoneName");
  return part?.value || "";
}

export function SessionTimezoneConverter({ sessions = [], sourceZoneCode }) {
  const sourceZone = resolveSourceZone(sourceZoneCode);

  // Default to the trainer's own detected timezone when it's in our list.
  const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const initial = COUNTRY_ZONES.find((c) => c.zone === detected)?.zone || "Asia/Kolkata";
  const [targetZone, setTargetZone] = useState(initial);

  const rows = useMemo(() => {
    if (!sourceZone) return [];
    return sessions
      .filter((s) => s.start_time)
      .map((s) => {
        const startInstant = wallInSourceToInstant(s.start_time, sourceZone);
        const endInstant = s.end_time ? wallInSourceToInstant(s.end_time, sourceZone) : null;
        if (!startInstant) return null;
        return {
          day: s.day_number,
          date: fmtDay(startInstant, targetZone),
          start: fmtTime(startInstant, targetZone),
          end: endInstant ? fmtTime(endInstant, targetZone) : null,
          abbr: zoneAbbr(startInstant, targetZone),
        };
      })
      .filter(Boolean);
  }, [sessions, sourceZone, targetZone]);

  return (
    <Box className="rounded-2xl border border-violet-200 bg-violet-50/50 overflow-hidden">
      <Box className="flex items-center gap-2.5 px-5 py-3.5 border-b border-violet-100">
        <Box className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
          <Globe2 className="h-4 w-4 text-violet-600" />
        </Box>
        <Box className="min-w-0">
          <Text as="p" className="text-sm font-bold text-slate-800 leading-tight">Check your timezone to join the meeting</Text>
          <Text as="p" className="text-xs text-slate-500 mt-0.5">
            Sessions are scheduled in {sourceZoneCode || "the training timezone"}. Pick your country to see your local start time.
          </Text>
        </Box>
      </Box>

      <Box className="p-5 space-y-4">
        <Box className="flex items-center gap-2 max-w-sm">
          <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={targetZone}
            onChange={(e) => setTargetZone(e.target.value)}
            className="h-10 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-800 outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-200"
          >
            {COUNTRY_ZONES.map((c) => (
              <option key={c.label} value={c.zone}>{c.label}</option>
            ))}
          </select>
        </Box>

        {!sourceZone ? (
          <Box className="rounded-xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3">
            <Text as="p" className="text-xs text-amber-700">
              Couldn&apos;t match the session timezone ({sourceZoneCode || "unknown"}), so times can&apos;t be converted automatically.
            </Text>
          </Box>
        ) : rows.length === 0 ? (
          <Text as="p" className="text-xs text-slate-400">Session times haven&apos;t been set yet.</Text>
        ) : (
          <Box className="space-y-2">
            {rows.map((r) => (
              <Box key={r.day} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-white ring-1 ring-slate-200 px-4 py-2.5">
                <Box className="inline-flex items-center justify-center rounded-md bg-violet-100 text-violet-700 text-[11px] font-bold px-2 py-0.5 shrink-0">
                  Day {r.day}
                </Box>
                <Text as="span" className="text-xs text-slate-500 min-w-[92px]">{r.date}</Text>
                <Box className="flex items-center gap-1.5 ml-auto">
                  <Clock className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                  <Text as="span" className="text-sm font-semibold text-slate-800">
                    {r.start}{r.end ? ` – ${r.end}` : ""}
                  </Text>
                  <Text as="span" className="text-[11px] font-medium text-slate-400">{r.abbr}</Text>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}
