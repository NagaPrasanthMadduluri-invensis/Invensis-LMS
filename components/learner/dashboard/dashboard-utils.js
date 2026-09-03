/**
 * Pure formatting + derivation helpers for the learner dashboard.
 *
 * Everything here reads only from the shapes the API already returns:
 *   GET /learner/dashboard        → { learner, stats, my_courses, certificates, journey }
 *   GET /learner/training/:ref    → { sessions[], trainer, timezone, meeting, ... }
 *
 * No invented fields — anything the API can't tell us is returned as null so
 * the UI can hide that piece instead of showing a placeholder.
 *
 * Dates and times come off the API as wall-clock values, so they go through
 * `lib/datetime` and are shown exactly as sent — see the note there.
 */

import {
  apiNow,
  dateValue,
  formatDate as fmtDate,
  formatDateRange as fmtDateRange,
  formatTime,
  timezoneLabel as zoneLabel,
  wallFields,
} from "@/lib/datetime";

/* ── Dates & times ───────────────────────────────────────── */

/** "1 Jul 2026" */
export function formatDate(iso) {
  return fmtDate(iso);
}

/** "1–2 Jul 2026" — collapses a same-month/same-year range. */
export function formatDateRange(start, end) {
  return fmtDateRange(start, end);
}

/**
 * Short timezone label for an IANA zone: "Asia/Kolkata" → "IST", resolved on
 * the date being labelled so DST-shifting abbreviations come out right.
 */
export const timezoneLabel = zoneLabel;

/**
 * Session timestamp → "10:30".
 *
 * The stored timestamp already *is* the wall clock in the training's own
 * timezone (the server labels it "Z" without moving it), so `tz` is only used
 * for the label alongside it — converting would shift the time a second time.
 */
export function formatClock(iso) {
  return formatTime(iso, { hour: "2-digit", minute: "2-digit", hour12: false, fallback: null });
}

/** "10:30 – 12:00 IST" (drops whichever half is missing). */
export function formatSessionWindow(startIso, endIso, tz) {
  const from = formatClock(startIso);
  const to = formatClock(endIso);
  if (!from) return null;
  const zone = timezoneLabel(tz, startIso);
  return `${from}${to ? ` – ${to}` : ""}${zone ? ` ${zone}` : ""}`;
}

/** { day: "MON", date: "27" } for the calendar chips in "This week". */
export function calendarChip(iso) {
  const f = wallFields(iso);
  if (!f) return { day: "—", date: "—" };
  return {
    day: fmtDate(iso, { weekday: "short", day: undefined, month: undefined, year: undefined }).toUpperCase(),
    date: String(f.day),
  };
}

/**
 * Human countdown to a session.
 *
 * `now` must come from `apiNow(generated_at, timezone)` — the server's own
 * clock read in the training's timezone — so the countdown never depends on
 * the browser's time or where the learner happens to be sitting. Returns null
 * when either the target or the API's reference time is missing, so the label
 * is hidden rather than guessed.
 */
export function countdownTo(iso, now) {
  const target = dateValue(iso, null);
  if (target === null || !now) return null;
  const mins = Math.round((target - now.getTime()) / 60000);
  if (mins <= 0) return "in progress";
  if (mins < 60) return `starts in ${mins} min`;
  if (mins < 60 * 24) {
    const hrs = Math.floor(mins / 60);
    return `starts in ${hrs} hour${hrs === 1 ? "" : "s"}`;
  }
  const days = Math.round(mins / (60 * 24));
  return days === 1 ? "starts tomorrow" : `starts in ${days} days`;
}

/**
 * "Good morning" / "Good afternoon" — the one thing on this page that is
 * genuinely about the *viewer's* own time of day, so it reads the browser
 * clock rather than the API's.
 */
export function greetingFor(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function firstNameOf(name = "") {
  return String(name).trim().split(/\s+/)[0] || "there";
}

/* ── Domain labels ───────────────────────────────────────── */

export const DELIVERY_LABEL = {
  virtual: "Virtual",
  in_person: "In-person",
  hybrid: "Hybrid",
  one_to_one: "1-to-1",
};

export function deliveryLabel(mode) {
  return DELIVERY_LABEL[mode] || mode || "—";
}

/* ── Derivations ─────────────────────────────────────────── */

const byStartDate = (a, b) => dateValue(a.start_date) - dateValue(b.start_date);

/** Flattened, lifecycle-tagged course list for the "My trainings" panel. */
export function allCoursesOf(myCourses = {}) {
  const tag = (list, lifecycle) => (list || []).map((c) => ({ ...c, lifecycle }));
  return [
    ...tag(myCourses.in_progress, "in_progress").sort(byStartDate),
    ...tag(myCourses.upcoming, "upcoming").sort(byStartDate),
    ...tag(myCourses.completed, "completed").sort((a, b) => byStartDate(b, a)),
  ];
}

/** Trainings still to be delivered — the ones worth fetching session detail for. */
export function activeCoursesOf(myCourses = {}) {
  return [...(myCourses.in_progress || []), ...(myCourses.upcoming || [])].sort(byStartDate);
}

/**
 * The next session a learner actually has to show up for, out of one training
 * detail payload. Prefers an ongoing session, then the earliest scheduled one.
 */
export function nextSessionOf(detail) {
  const sessions = Array.isArray(detail?.sessions) ? detail.sessions : [];
  const pending = sessions
    .filter((s) => s.status !== "completed" && s.status !== "cancelled")
    .sort((a, b) => (a.day_number ?? 0) - (b.day_number ?? 0));
  return pending.find((s) => s.status === "ongoing") || pending[0] || null;
}

/**
 * True while the API's reference `now` sits inside the session window.
 * `now` comes from `apiNow(generated_at, timezone)`; without it we can't tell,
 * so the session is not claimed to be live.
 */
export function isSessionLive(session, now) {
  if (!session?.start_time || !now) return session?.status === "ongoing";
  if (session.status === "ongoing") return true;
  const start = dateValue(session.start_time);
  const end = session.end_time ? dateValue(session.end_time) : start + 3600_000;
  const t = now.getTime();
  return t >= start && t <= end;
}

/**
 * Session-level programme progress across every enrolment — the number behind
 * the dashboard's progress ring. Completed trainings count as fully done even
 * when their session rows were never individually closed out.
 */
export function programmeProgress(myCourses = {}) {
  const courses = allCoursesOf(myCourses);
  let total = 0;
  let done = 0;
  for (const c of courses) {
    const t = c.total_sessions ?? 0;
    total += t;
    done += c.lifecycle === "completed" ? t : Math.min(c.completed_sessions ?? 0, t);
  }
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  return { total, done, left: Math.max(total - done, 0), pct };
}

/**
 * Trainings completed inside the current calendar month, from the journey feed.
 * "This month" is the server's month (`apiNow`), not the browser's.
 */
export function completedThisMonth(journey = [], now) {
  if (!now) return 0;
  return journey.filter((j) => {
    if (j.type !== "completed" || !j.date) return false;
    // Journey dates are a mix of enrolment timestamps and scheduled end dates;
    // both are read as the calendar day the API named.
    const d = wallFields(j.date);
    const ref = wallFields(now);
    return !!d && !!ref && d.month === ref.month && d.year === ref.year;
  }).length;
}

/** Total scheduled hours across every enrolment — the denominator for learning hours. */
export function targetHoursOf(myCourses = {}) {
  return allCoursesOf(myCourses).reduce((sum, c) => sum + (c.duration_hours ?? 0), 0);
}

/**
 * Everything happening in the next 7 days, newest first: individual sessions
 * from the trainings we have detail for, plus start dates of trainings we
 * don't (detail is only fetched for the first few active trainings).
 *
 * `generatedAt` is the dashboard payload's server timestamp. Each training is
 * measured against that instant read in *its own* timezone, so a cohort in
 * Sydney and one in London are each judged on their own clock.
 */
export function weekAheadOf({ courses = [], details = {}, generatedAt, days = 7 }) {
  const events = [];

  for (const course of courses) {
    const detail = details[course.code];
    const now = apiNow(generatedAt, detail?.timezone || course.timezone);
    if (!now) continue;
    const horizon = now.getTime() + days * 24 * 3600_000;
    const sessions = Array.isArray(detail?.sessions) ? detail.sessions : null;

    if (sessions) {
      for (const s of sessions) {
        if (!s.start_time || s.status === "cancelled") continue;
        const t = dateValue(s.start_time, null);
        if (t === null || t > horizon) continue;
        // Keep a session that is running right now, drop ones already finished.
        const end = s.end_time ? dateValue(s.end_time) : t + 3600_000;
        if (end < now.getTime()) continue;
        events.push({
          key: `${course.code}-s${s.day_number}`,
          at: s.start_time,
          title: `Session ${s.day_number} · ${course.title}`,
          meta: [formatSessionWindow(s.start_time, s.end_time, detail.timezone), countdownTo(s.start_time, now)]
            .filter(Boolean)
            .join(" · "),
        });
      }
      continue;
    }

    if (!course.start_date) continue;
    const t = dateValue(course.start_date, null);
    if (t === null || t > horizon || t < now.getTime() - 24 * 3600_000) continue;
    events.push({
      key: `${course.code}-start`,
      at: course.start_date,
      title: `${course.title} begins`,
      meta: [deliveryLabel(course.delivery_mode), countdownTo(course.start_date, now)]
        .filter(Boolean)
        .join(" · "),
    });
  }

  return events.sort((a, b) => dateValue(a.at) - dateValue(b.at));
}
