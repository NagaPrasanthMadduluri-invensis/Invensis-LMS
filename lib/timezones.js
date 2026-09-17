/*
 * Timezone data — sourced from libraries, not hand-maintained lists.
 *
 * Two free, long-running, MIT-licensed sources, each used for what it is best at:
 *
 *   • moment-timezone — the IANA tz database itself (tzdata 2026d at time of
 *     writing, shipping since 2013). It is the only one of the common options
 *     that returns a real abbreviation that MOVES WITH DST: "GMT"→"BST" for
 *     London, "AEDT"→"AEST" for Sydney. Luxon and date-fns-tz both delegate to
 *     `Intl`, which answers "GMT+5:30" for Asia/Kolkata, so neither can do this.
 *
 *   • @vvo/tzdb — a curated zone catalogue (country, country code, main cities,
 *     a display abbreviation). Used for the zone LIST and as the abbreviation
 *     fallback, because recent tzdata releases replaced the letters for some
 *     zones with numeric forms ("+0545" for Kathmandu, "+06" for Dhaka) and a
 *     numeric form is exactly what we're trying to stop showing.
 *
 * The 10-year-range moment-timezone build is used deliberately: it carries the
 * same rules for ±10 years around the build date at roughly a third of the
 * size, and training schedules are always near-term.
 *
 * Nothing here is specific to this app — `zoneAbbreviation`, `listTimeZones`
 * and `zonesForCountry` are general helpers meant to be reused anywhere a
 * timezone needs naming or picking.
 */

import moment from "moment-timezone/builds/moment-timezone-with-data-10-year-range.js";
import { getTimeZones } from "@vvo/tzdb";

// A "+0530"/"-08"-style label rather than letters — what we're replacing.
const isNumericAbbr = (v) => !v || /^[+-]\d/.test(v);

// Built once; the catalogue is static for the life of the page.
let catalogue = null;

function zones() {
  catalogue ??= getTimeZones({ includeUtc: true });
  return catalogue;
}

let byName = null;

function zoneRecord(name) {
  if (!byName) {
    byName = new Map();
    for (const z of zones()) {
      byName.set(z.name, z);
      // Deprecated aliases ("Asia/Calcutta") resolve to their modern zone.
      for (const alias of z.group || []) if (!byName.has(alias)) byName.set(alias, z);
    }
  }
  return byName.get(name) || null;
}

/**
 * Abbreviation for an IANA zone at a moment in time.
 *
 *   zoneAbbreviation("Asia/Kolkata")                        → "IST"
 *   zoneAbbreviation("Europe/London", "2026-07-15T00:00:00Z") → "BST"
 *   zoneAbbreviation("Europe/London", "2026-01-15T00:00:00Z") → "GMT"
 *
 * `at` decides which side of a DST change we are on and defaults to now.
 * Returns "" for an unknown zone, and only ever falls back to a numeric offset
 * when neither source has letters for that zone.
 */
export function zoneAbbreviation(zone, at = new Date()) {
  if (!zone || typeof zone !== "string") return "";

  const when = at instanceof Date ? at : new Date(at);
  if (Number.isNaN(when.getTime())) return "";

  // 1. tzdata via moment-timezone — authoritative, and DST-aware.
  let abbr = "";
  try {
    if (moment.tz.zone(zone)) abbr = moment.tz(when, zone).format("z");
  } catch {
    abbr = "";
  }
  if (!isNumericAbbr(abbr)) return abbr;

  // 2. tzdata has no letters for this zone — use the curated catalogue.
  const record = zoneRecord(zone);
  if (record && !isNumericAbbr(record.abbreviation)) return record.abbreviation;

  // 3. Neither has letters. The numeric offset is unfriendly but true.
  return abbr || "";
}

/**
 * Every zone, ready for a picker: `{ zone, label, country, countryCode, cities,
 * offsetMinutes }`, ordered west-to-east then by country.
 *
 * `label` reads "India — Kolkata, Mumbai, Delhi", so a user can find their zone
 * by the city they know rather than by an IANA path.
 */
export function listTimeZones() {
  return zones()
    .map((z) => ({
      zone: z.name,
      country: z.countryName,
      countryCode: z.countryCode,
      cities: z.mainCities || [],
      offsetMinutes: z.rawOffsetInMinutes,
      label: z.mainCities?.length ? `${z.countryName} — ${z.mainCities.slice(0, 3).join(", ")}` : z.countryName,
    }))
    .sort((a, b) => a.offsetMinutes - b.offsetMinutes || a.country.localeCompare(b.country));
}

/**
 * Zones in an ISO 3166-1 alpha-2 country. Returns every match, so a caller can
 * tell "this country pins a zone" (one result) from "it doesn't" (several) —
 * India has one, Australia has seven.
 */
export function zonesForCountry(countryCode) {
  const cc = typeof countryCode === "string" ? countryCode.trim().toUpperCase() : "";
  if (!/^[A-Z]{2}$/.test(cc)) return [];
  return zones().filter((z) => z.countryCode === cc).map((z) => z.name);
}

/**
 * The one zone a country unambiguously identifies, or null when the country
 * spans several. Callers use this to decide whether a country code is enough to
 * resolve a schedule's timezone without guessing.
 */
export function soleZoneForCountry(countryCode) {
  const found = zonesForCountry(countryCode);
  return found.length === 1 ? found[0] : null;
}

/**
 * The catalogue's canonical name for a zone, so deprecated aliases line up with
 * the values `listTimeZones` returns: "Asia/Calcutta" → "Asia/Kolkata".
 *
 * Browsers still report aliases from `Intl.DateTimeFormat().resolvedOptions()`
 * — Chrome answers "Asia/Calcutta" in India — so anything matching a detected
 * zone against the picker has to go through this first.
 */
export function canonicalZone(zone) {
  if (!zone || typeof zone !== "string") return "";
  return zoneRecord(zone)?.name || (isKnownZone(zone) ? zone : "");
}

/** True when `zone` is a zone the tz database knows. */
export function isKnownZone(zone) {
  if (!zone || typeof zone !== "string") return false;
  try {
    return !!moment.tz.zone(zone);
  } catch {
    return false;
  }
}
