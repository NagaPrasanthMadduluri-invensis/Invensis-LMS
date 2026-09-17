"use client";

import { useMemo, useState } from "react";
import { Globe2, Clock, MapPin } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { Combobox } from "@/components/ui/combobox";
import {
  zoneAbbreviation,
  listTimeZones,
  soleZoneForCountry,
  canonicalZone,
} from "@/lib/timezones";

/*
 * Session-time timezone converter for the trainer.
 *
 * Offsets are computed with the browser-native `Intl` engine; zone names, the
 * country→zone lookup and the displayed abbreviations all come from the tz
 * database via `lib/timezones` (moment-timezone + @vvo/tzdb), so nothing about
 * the world's timezones is hand-maintained in this file. What IS kept here is
 * the one thing no library can know: which meaning of an ambiguous abbreviation
 * this particular CMS feed intends (see SOURCE_ZONE below).
 *
 * Session times are stored as the wall-clock time labelled UTC (see order
 * ingestion), so a stored timestamp's *UTC components* ARE the wall time in the
 * session's own timezone. We turn that back into a real instant using the
 * source zone's offset, then format it in the trainer's chosen zone.
 *
 * Resolving WHICH zone a session is in is the delicate part. The schedule feed
 * gives us a timezone abbreviation, and abbreviations are not unique: "CST" is
 * China (UTC+8), Taiwan (UTC+8) *and* Mexico/US-Central (UTC-6). Guessing wrong
 * puts a trainer on a call 14 hours out, with nothing on screen to suggest the
 * time is wrong. So resolution is layered, most trustworthy first:
 *
 *   1. `timezone` already an IANA name ("Asia/Manila")  → use it.
 *   2. ISO 3166-1 alpha-2 country code ("PH")           → unambiguous, use it.
 *   3. Abbreviation, and only if it maps to ONE zone    → use it.
 *   4. Otherwise                                        → refuse, and say so.
 *
 * Step 4 matters as much as the rest: showing a warning is recoverable, showing
 * a confident wrong time is not.
 */

// Countries where the tz database lists several zones but this feed means one
// of them. Everything else resolves from the database automatically, so only
// genuine judgment calls appear here — a country with a single zone never needs
// an entry, and this list does not have to be kept in step with the world's
// timezones, only with what the CMS intends.
const COUNTRY_ZONE_OVERRIDE = {
  CN: "Asia/Shanghai", // Xinjiang keeps Asia/Urumqi informally; official scheduling is Beijing time nationwide.
  ES: "Europe/Madrid", // Mainland. Canary/Ceuta are separate zones and don't appear in this feed.
  PT: "Europe/Lisbon", // Mainland. Azores and Madeira are separate.
  CL: "America/Santiago", // Easter Island and Punta Arenas are separate.
  NZ: "Pacific/Auckland", // Chatham is a separate zone with a few hundred residents.
  // MX is deliberately ABSENT. Tijuana and Mexico City are two hours apart and
  // both are major, so the country alone genuinely doesn't pin a zone — better
  // to refuse and show the warning than to put a trainer on a call two hours out.
};

// Timezone abbreviation → IANA zone. Last-resort fallback, used only when there
// is no IANA name and no country code.
//
// `null` marks an abbreviation that genuinely maps to more than one zone. Those
// resolve to nothing rather than to a plausible-looking wrong answer — the whole
// point of the country-code path above. Kept as explicit entries (not omissions)
// so the ambiguity is documented where the next person will look.
const SOURCE_ZONE = {
  // — unambiguous —
  UTC: "UTC",
  GMT: "Europe/London",
  BST: "Europe/London", // British Summer Time in this feed
  WET: "Europe/Lisbon",
  WEST: "Europe/Lisbon",
  CET: "Europe/Paris",
  CEST: "Europe/Paris",
  EET: "Europe/Helsinki",
  EEST: "Europe/Helsinki",
  MSK: "Europe/Moscow",
  SAST: "Africa/Johannesburg",
  WAT: "Africa/Lagos",
  EAT: "Africa/Nairobi",
  CAT: "Africa/Harare",
  GST: "Asia/Dubai",
  PKT: "Asia/Karachi",
  BDT: "Asia/Dhaka",
  NPT: "Asia/Kathmandu",
  SGT: "Asia/Singapore",
  MYT: "Asia/Kuala_Lumpur",
  PHT: "Asia/Manila",
  PHST: "Asia/Manila",
  ICT: "Asia/Bangkok",
  WIB: "Asia/Jakarta",
  WITA: "Asia/Makassar",
  WIT: "Asia/Jayapura",
  HKT: "Asia/Hong_Kong",
  JST: "Asia/Tokyo",
  KST: "Asia/Seoul",
  AEST: "Australia/Sydney",
  AEDT: "Australia/Sydney",
  ACST: "Australia/Adelaide",
  ACDT: "Australia/Adelaide",
  AWST: "Australia/Perth",
  NZST: "Pacific/Auckland",
  NZDT: "Pacific/Auckland",
  EDT: "America/New_York",
  CDT: "America/Chicago",
  MDT: "America/Denver",
  PDT: "America/Los_Angeles",
  BRT: "America/Sao_Paulo",
  BRST: "America/Sao_Paulo",
  ART: "America/Argentina/Buenos_Aires",
  CLT: "America/Santiago",
  COT: "America/Bogota",
  PET: "America/Lima",

  // — collide in principle, but this feed only ever uses one meaning —
  // Verified against the CMS schedule-listing endpoint: EST is returned for
  // `us` and `ca` (both America/New_York rules), AST only for the Gulf states
  // (all UTC+3, no DST). Keeping these mapped preserves conversion for the
  // busiest markets; a country code, when present, overrides anyway.
  EST: "America/New_York",
  MST: "America/Denver",
  PST: "America/Los_Angeles",
  AST: "Asia/Riyadh",

  // — dominant meaning, but a genuine collision exists —
  // The feed returns IST for both `in` (UTC+5:30) and `il` (UTC+2). India is
  // the overwhelming majority of volume, so it stays the default rather than
  // dropping every Indian training to "can't convert"; an `il` schedule is
  // corrected the moment its country code is populated.
  IST: "Asia/Kolkata",

  // — genuinely undecidable: no default is defensible —
  // `mx`, `cn` and `tw` all return CST, and China/Mexico are 14 hours apart.
  // Guessing here is how a trainer misses a session, so we refuse instead.
  CST: null,
};

// Every zone in the tz database, as picker options. Built once at module load.
const ZONE_OPTIONS = listTimeZones().map((z) => ({
  value: z.zone,
  label: z.label,
  // Searchable by any of the zone's cities and by the IANA name, not just the
  // handful of cities that fit in the label.
  keywords: [z.zone, z.country, ...z.cities].join(" "),
}));

// Abbreviations we know are ambiguous — used to explain *why* we couldn't
// resolve, rather than claiming the code is simply unrecognised.
const AMBIGUOUS = new Set(
  Object.keys(SOURCE_ZONE).filter((k) => SOURCE_ZONE[k] === null)
);

/**
 * Resolve the IANA zone a schedule's times are expressed in.
 * @param {string|null} code         `timezone` from the schedule (IANA name or abbreviation)
 * @param {string|null} countryCode  ISO 3166-1 alpha-2 of the schedule's country
 * @returns {{ zone: string|null, reason: "iana"|"country"|"abbr"|"ambiguous"|"unknown" }}
 */
function resolveSourceZone(code, countryCode) {
  const raw = typeof code === "string" ? code.trim() : "";

  // 1. Already an IANA zone.
  if (raw.includes("/")) return { zone: raw, reason: "iana" };

  // 2. Country code. The tz database settles this on its own wherever a country
  // has exactly one zone — "IN" pins Asia/Kolkata, "AU" (seven zones) pins
  // nothing and falls through to the abbreviation, which for those feeds is the
  // specific one (AEDT vs AWST). Only the judgment calls below need stating.
  const cc = typeof countryCode === "string" ? countryCode.trim().toUpperCase() : "";
  if (COUNTRY_ZONE_OVERRIDE[cc]) return { zone: COUNTRY_ZONE_OVERRIDE[cc], reason: "country" };
  const sole = soleZoneForCountry(cc);
  if (sole) return { zone: sole, reason: "country" };

  // 3. Abbreviation, but only where it maps to exactly one zone.
  const abbr = raw.toUpperCase();
  if (SOURCE_ZONE[abbr]) return { zone: SOURCE_ZONE[abbr], reason: "abbr" };

  // 4. Refuse rather than guess.
  return { zone: null, reason: AMBIGUOUS.has(abbr) ? "ambiguous" : "unknown" };
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

// `Intl`'s short zone name is only a real abbreviation for the locale's own
// region — en-US answers "GMT+5:30" for Asia/Kolkata. `zoneAbbreviation` keeps
// the letters ("IST", "BST", "AEDT") and only falls back to an offset for zones
// that genuinely have no lettered form.
const zoneAbbr = (instant, zone) => zoneAbbreviation(zone, instant);

export function SessionTimezoneConverter({ sessions = [], sourceZoneCode, sourceCountryCode }) {
  const { zone: sourceZone, reason } = resolveSourceZone(sourceZoneCode, sourceCountryCode);

  // Default to the trainer's own detected zone. Every IANA zone is offered, so
  // this only falls back when the browser reports something unrecognisable.
  // Canonicalised first: browsers still hand back deprecated aliases (Chrome
  // says "Asia/Calcutta" in India), which would match no option in the picker.
  const detected = canonicalZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const initial = detected || "Asia/Kolkata";
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
          <Box className="flex-1">
            <Combobox
              value={targetZone}
              onChange={(z) => z && setTargetZone(z)}
              options={ZONE_OPTIONS}
              placeholder="Select your timezone"
              searchPlaceholder="Search country or city..."
              emptyText="No timezone found."
            />
          </Box>
        </Box>

        {!sourceZone ? (
          <Box className="rounded-xl border border-dashed border-amber-200 bg-amber-50 px-4 py-3">
            <Text as="p" className="text-xs text-amber-700">
              {reason === "ambiguous" ? (
                <>
                  &ldquo;{sourceZoneCode}&rdquo; is used by more than one country, so we can&apos;t
                  tell which timezone this session is in. Please confirm the start time with
                  the admin rather than relying on a converted time.
                </>
              ) : (
                <>
                  Couldn&apos;t match the session timezone ({sourceZoneCode || "unknown"}), so
                  times can&apos;t be converted automatically.
                </>
              )}
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
