/**
 * One place for turning API date/time values into text.
 *
 * The API sends two different kinds of value and they must not be formatted
 * the same way:
 *
 * 1. **Wall-clock values** — a training's `start_date`/`end_date` (Postgres
 *    `date` → "2026-09-15"), a schedule's `start_time`/`end_time` (`time` →
 *    "09:00:00"), and session timestamps, which the server builds as
 *    `new Date(`${day}T${startTime}Z`)` — the session's own wall-clock time
 *    deliberately *labelled* "Z". None of these are instants. Handing them to
 *    `new Date()` re-reads them as UTC and the browser then renders that
 *    instant in the viewer's zone, so a 9:00 AM session prints as 2:30 PM in
 *    India and the 15th slides back to the 14th in New York.
 *
 *    `parseWallClock` anchors the digits we were given in **UTC**, and every
 *    wall-clock formatter renders with `timeZone: "UTC"`. UTC has no offset
 *    and no DST, so the text that comes out is a pure function of the string
 *    the API sent plus the locale: the browser's timezone and the browser's
 *    clock never enter into it. What the backend sent is what shows — the same
 *    text on every portal, in every zone, on a machine with the wrong date,
 *    and identical between server render and hydration.
 *
 *    Because the anchor is UTC, read the components back with the `getUTC*`
 *    getters or, better, with `wallFields()`. A local getter such as
 *    `.getDate()` would re-introduce exactly the shift we removed.
 *
 * 2. **Instants** — `created_at`, `enrolled_at`, `submitted_at`, `issued_at`
 *    and friends come from Postgres `defaultNow()` and really are moments in
 *    time. Those keep the normal treatment: parse the instant, show it on the
 *    viewer's clock. Use the `*Instant*` helpers for them.
 *
 * Anything measured *against* "now" — a countdown, "is this session live", a
 * "this month" bucket — takes its reference from the API's own `generated_at`
 * via `apiNow`, never from the browser clock, which may be wrong or in the
 * wrong zone. `new Date()` here is only ever a last resort for the viewer's
 * own time of day (a "Good morning" greeting), never for training data.
 */

const LOCALE = "en-IN";
const DASH = "—";

// Wall-clock values are anchored here and formatted here. Not a timezone
// choice — a way of pinning the digits so nothing can shift them.
const ANCHOR = "UTC";

const DATE_OPTS = { day: "numeric", month: "short", year: "numeric" };
const TIME_OPTS = { hour: "numeric", minute: "2-digit", hour12: true };

// "2026-09-15", optionally with a time, optionally with a zone suffix ("Z",
// "+05:30") that we deliberately ignore — it labels a wall time, not an offset.
const WALL_RE = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{1,2}):(\d{2})(?::(\d{2}))?(?:\.(\d+))?)?/;
// A bare `time` column: "09:00" or "09:00:00".
const CLOCK_RE = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/;

const ok = (d) => (d && !Number.isNaN(d.getTime()) ? d : null);

/**
 * Pull `locale`/`fallback` out of a call's options, leaving the Intl options.
 * `anchored` forces `timeZone: "UTC"` last, so a caller can't accidentally
 * hand a wall-clock value back to the browser's zone.
 */
function opts(options, defaults, anchored = false) {
  const { locale = LOCALE, fallback = DASH, timeZone, ...rest } = options || {};
  const intl = { ...defaults, ...rest };
  return {
    locale,
    fallback,
    intl: anchored ? { ...intl, timeZone: ANCHOR } : { ...intl, ...(timeZone ? { timeZone } : {}) },
  };
}

/**
 * A wall-clock API value → a Date whose **UTC** fields are exactly the digits
 * we were sent. Returns null for anything unparseable.
 *
 * Read it back with `wallFields()` or the `getUTC*` getters, and format it
 * with the wall-clock formatters below (which pin `timeZone: "UTC"`).
 */
export function parseWallClock(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return ok(new Date(value));
  // A Date arriving here is already anchored — `apiNow`/`wallClockIn` build
  // them with `Date.UTC`, so its UTC fields are the wall clock. Pass through.
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  const raw = String(value).trim();

  // A bare `time` column carries no date. Anchor it on the epoch rather than
  // on today, so the browser's date — and any DST transition sitting on it —
  // can't move the clock reading. Only the time part is ever formatted.
  const clock = CLOCK_RE.exec(raw);
  if (clock) {
    return ok(new Date(Date.UTC(
      1970, 0, 1,
      Number(clock[1]), Number(clock[2]), Number(clock[3] ?? 0), 0,
    )));
  }

  const m = WALL_RE.exec(raw);
  if (m) {
    return ok(new Date(Date.UTC(
      Number(m[1]),
      Number(m[2]) - 1,
      Number(m[3]),
      Number(m[4] ?? 0),
      Number(m[5] ?? 0),
      Number(m[6] ?? 0),
      Number(String(m[7] ?? "").slice(0, 3).padEnd(3, "0")),
    )));
  }

  // An unrecognised shape — a CRM invoice date in some other format, say. We
  // have to let the engine parse it, but we do not let it shift: whatever
  // wall clock it read is re-anchored digit-for-digit in UTC, so the browser's
  // offset still can't move the answer.
  const parsed = ok(new Date(raw));
  if (!parsed) return null;
  return ok(new Date(Date.UTC(
    parsed.getFullYear(),
    parsed.getMonth(),
    parsed.getDate(),
    parsed.getHours(),
    parsed.getMinutes(),
    parsed.getSeconds(),
    parsed.getMilliseconds(),
  )));
}

/**
 * The digits of a wall-clock value, so callers never have to pick between
 * `getDate()` and `getUTCDate()` and get it wrong. `month` is 1-based;
 * `weekday` is 0 = Sunday. Null when the value is unparseable.
 */
export function wallFields(value) {
  const d = parseWallClock(value);
  if (!d) return null;
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
    second: d.getUTCSeconds(),
    weekday: d.getUTCDay(),
  };
}

/** An audit timestamp → the instant it names. Returns null when unparseable. */
export function parseInstant(value) {
  if (value === null || value === undefined || value === "") return null;
  return ok(value instanceof Date ? value : new Date(value));
}

/* ── Wall-clock formatters (scheduling values) ─────────────── */

/** "15 Sep 2026" */
export function formatDate(value, options) {
  const { locale, fallback, intl } = opts(options, DATE_OPTS, true);
  const d = parseWallClock(value);
  return d ? d.toLocaleDateString(locale, intl) : fallback;
}

/** "9:00 AM" — also accepts a bare "09:00:00" from a `time` column. */
export function formatTime(value, options) {
  const { locale, fallback, intl } = opts(options, TIME_OPTS, true);
  const d = parseWallClock(value);
  return d ? d.toLocaleTimeString(locale, intl) : fallback;
}

/** "15 Sep 2026, 9:00 AM" */
export function formatDateTime(value, options) {
  const { locale, fallback, intl } = opts(options, { ...DATE_OPTS, ...TIME_OPTS }, true);
  const d = parseWallClock(value);
  return d ? d.toLocaleString(locale, intl) : fallback;
}

/** "1–2 Jul 2026" — collapses a range inside one month, or a single day. */
export function formatDateRange(start, end, options) {
  const { locale, fallback, intl } = opts(options, DATE_OPTS, true);
  const a = wallFields(start);
  if (!a) return fallback;
  const b = wallFields(end);
  const sameDay = b && a.year === b.year && a.month === b.month && a.day === b.day;
  if (!b || sameDay) return formatDate(start, options);
  const bDate = parseWallClock(end);
  if (a.month === b.month && a.year === b.year) {
    return `${a.day}–${bDate.toLocaleDateString(locale, intl)}`;
  }
  const aDate = parseWallClock(start);
  return `${aDate.toLocaleDateString(locale, { ...intl, year: undefined })} – ${bDate.toLocaleDateString(locale, intl)}`;
}

/** Comparable milliseconds for sorting a wall-clock value. */
export function dateValue(value, fallback = 0) {
  return parseWallClock(value)?.getTime() ?? fallback;
}

/* ── Instant formatters (audit timestamps) ─────────────────── */

/** "15 Sep 2026" on the viewer's clock. */
export function formatInstantDate(value, options) {
  const { locale, fallback, intl } = opts(options, DATE_OPTS);
  const d = parseInstant(value);
  return d ? d.toLocaleDateString(locale, intl) : fallback;
}

/** "15 Sep 2026, 9:00 AM" on the viewer's clock. */
export function formatInstantDateTime(value, options) {
  const { locale, fallback, intl } = opts(options, { ...DATE_OPTS, ...TIME_OPTS });
  const d = parseInstant(value);
  return d ? d.toLocaleString(locale, intl) : fallback;
}

/** Comparable milliseconds for sorting an instant. */
export function instantValue(value, fallback = 0) {
  return parseInstant(value)?.getTime() ?? fallback;
}

/* ── "Now", anchored on the API ─────────────────────────────── */

/**
 * The wall clock an instant reads as in `timeZone`, returned as a Date whose
 * *local* fields hold that reading — so it compares directly against a
 * `parseWallClock` value. Returns null for a zone the runtime doesn't know.
 */
export function wallClockIn(value, timeZone) {
  const at = parseInstant(value);
  if (!at) return null;
  try {
    const p = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", {
        timeZone,
        hourCycle: "h23",
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit",
      })
        .formatToParts(at)
        .map((part) => [part.type, part.value]),
    );
    return ok(new Date(Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)));
  } catch {
    return null; // unknown IANA zone
  }
}

/**
 * Reference "now" for anything compared against a wall-clock API value.
 *
 * Takes the server's own `generated_at` and reads it in `timeZone` — the
 * training's zone — so "now" and the session's wall clock are quoted in the
 * same frame. This is what makes a countdown honest: the browser clock is
 * never consulted, so a laptop set to the wrong time (or sitting in another
 * country) can't move it.
 *
 * Returns null when the API sent no timestamp — callers hide the countdown
 * rather than guess. With no `timeZone` the server time is read as UTC, which
 * matches how sessions are stored when their zone is unknown.
 */
export function apiNow(generatedAt, timeZone) {
  if (!parseInstant(generatedAt)) return null;
  return (timeZone && wallClockIn(generatedAt, timeZone)) || wallClockIn(generatedAt, "UTC");
}

/* ── Misc ──────────────────────────────────────────────────── */

/**
 * Date → "YYYY-MM-DD" in the local zone — what `<input type="date">` and the
 * API's date filters speak. `toISOString().slice(0, 10)` is wrong here: it
 * reports the UTC day, which is yesterday for anyone west of Greenwich.
 */
export function toDateInput(value = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  // A Date argument is the caller asking for *their* calendar day — the admin
  // report filters use this for "today" and "N months back".
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "";
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  const f = wallFields(value);
  return f ? `${f.year}-${pad(f.month)}-${pad(f.day)}` : "";
}

/**
 * "2026-09-15" → a Date at *local* midnight on that calendar day.
 *
 * The one place a local Date is the right answer: `react-day-picker` and the
 * native date input both work in local time and compare calendar days, so a
 * UTC-anchored value would highlight the wrong cell west of Greenwich. Pairs
 * with `toDateInput` for the trip back.
 */
export function toPickerDate(value) {
  const f = wallFields(value);
  return f ? new Date(f.year, f.month - 1, f.day) : undefined;
}

/**
 * Every calendar day from `start` to `end` inclusive, as "YYYY-MM-DD".
 * Walked in UTC, so the browser's zone and its DST jumps can't drop or
 * duplicate a day. Returns [] if the range is empty or unparseable.
 */
export function datesBetween(start, end) {
  const a = wallFields(start);
  const b = wallFields(end);
  if (!a || !b) return [];
  const cursor = new Date(Date.UTC(a.year, a.month - 1, a.day));
  const last = Date.UTC(b.year, b.month - 1, b.day);
  const out = [];
  while (cursor.getTime() <= last && out.length < 3660) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

/**
 * Short zone label for an IANA zone: "Asia/Kolkata" → "IST".
 *
 * The abbreviation moves with DST ("BST" vs "GMT"), so it is resolved against
 * `at` — the wall-clock value being labelled — rather than against the
 * browser's idea of now. Without `at` there is no date to resolve against, so
 * this returns "" rather than guessing off the browser clock.
 */
export function timezoneLabel(tz, at, locale = LOCALE) {
  const on = parseWallClock(at);
  if (!tz || !on) return "";
  try {
    return new Intl.DateTimeFormat(locale, { timeZone: tz, timeZoneName: "short" })
      .formatToParts(on)
      .find((p) => p.type === "timeZoneName")?.value ?? "";
  } catch {
    return "";
  }
}
