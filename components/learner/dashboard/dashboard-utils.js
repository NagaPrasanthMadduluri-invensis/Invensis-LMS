/**
 * Pure formatting + derivation helpers for the learner dashboard.
 *
 * Everything here reads only from the shapes the API already returns:
 *   GET /learner/dashboard        → { learner, stats, my_courses, certificates, journey }
 *   GET /learner/training/:ref    → { sessions[], trainer, timezone, meeting, ... }
 *
 * No invented fields — anything the API can't tell us is returned as null so
 * the UI can hide that piece instead of showing a placeholder.
 */

const LOCALE = "en-IN";

/* ── Dates & times ───────────────────────────────────────── */

export function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(LOCALE, { day: "numeric", month: "short", year: "numeric" });
}

/** "1–2 Jul 2026" — collapses a same-month/same-year range. */
export function formatDateRange(start, end) {
  if (!start) return "—";
  const a = new Date(start);
  const b = end ? new Date(end) : null;
  if (Number.isNaN(a.getTime())) return "—";
  if (!b || Number.isNaN(b.getTime()) || a.toDateString() === b.toDateString()) {
    return formatDate(start);
  }
  const sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  if (sameMonth) {
    return `${a.getDate()}–${b.toLocaleDateString(LOCALE, { day: "numeric", month: "short", year: "numeric" })}`;
  }
  return `${a.toLocaleDateString(LOCALE, { day: "numeric", month: "short" })} – ${formatDate(end)}`;
}

/** Short timezone label for a IANA zone: "Asia/Kolkata" → "IST". */
export function timezoneLabel(tz) {
  if (!tz) return "";
  try {
    const part = new Intl.DateTimeFormat(LOCALE, { timeZone: tz, timeZoneName: "short" })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName");
    return part?.value ?? "";
  } catch {
    return "";
  }
}

/** ISO timestamp → "10:30" in the training's timezone. */
export function formatClock(iso, tz) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  try {
    return d.toLocaleTimeString(LOCALE, {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      ...(tz ? { timeZone: tz } : {}),
    });
  } catch {
    return d.toLocaleTimeString(LOCALE, { hour: "2-digit", minute: "2-digit", hour12: false });
  }
}

/** "10:30 – 12:00 IST" (drops whichever half is missing). */
export function formatSessionWindow(startIso, endIso, tz) {
  const from = formatClock(startIso, tz);
  const to = formatClock(endIso, tz);
  if (!from) return null;
  const zone = timezoneLabel(tz);
  return `${from}${to ? ` – ${to}` : ""}${zone ? ` ${zone}` : ""}`;
}

/** { day: "MON", date: "27" } for the calendar chips in "This week". */
export function calendarChip(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { day: "—", date: "—" };
  return {
    day: d.toLocaleDateString(LOCALE, { weekday: "short" }).toUpperCase(),
    date: String(d.getDate()),
  };
}

/**
 * Human countdown to a timestamp, relative to `now`.
 * Returns null when the timestamp is missing/unparseable.
 */
export function countdownTo(iso, now = new Date()) {
  if (!iso) return null;
  const target = new Date(iso);
  if (Number.isNaN(target.getTime())) return null;
  const mins = Math.round((target.getTime() - now.getTime()) / 60000);
  if (mins <= 0) return "in progress";
  if (mins < 60) return `starts in ${mins} min`;
  if (mins < 60 * 24) {
    const hrs = Math.floor(mins / 60);
    return `starts in ${hrs} hour${hrs === 1 ? "" : "s"}`;
  }
  const days = Math.round(mins / (60 * 24));
  return days === 1 ? "starts tomorrow" : `starts in ${days} days`;
}

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

const byStartDate = (a, b) => new Date(a.start_date ?? 0) - new Date(b.start_date ?? 0);

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

/** True while `now` sits inside the session window. */
export function isSessionLive(session, now = new Date()) {
  if (!session?.start_time) return false;
  if (session.status === "ongoing") return true;
  const start = new Date(session.start_time).getTime();
  const end = session.end_time ? new Date(session.end_time).getTime() : start + 3600_000;
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

/** Trainings completed inside the current calendar month, from the journey feed. */
export function completedThisMonth(journey = [], now = new Date()) {
  return journey.filter((j) => {
    if (j.type !== "completed" || !j.date) return false;
    const d = new Date(j.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
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
 */
export function weekAheadOf({ courses = [], details = {}, now = new Date(), days = 7 }) {
  const horizon = now.getTime() + days * 24 * 3600_000;
  const events = [];

  for (const course of courses) {
    const detail = details[course.code];
    const sessions = Array.isArray(detail?.sessions) ? detail.sessions : null;

    if (sessions) {
      for (const s of sessions) {
        if (!s.start_time || s.status === "cancelled") continue;
        const t = new Date(s.start_time).getTime();
        if (Number.isNaN(t) || t > horizon) continue;
        // Keep a session that is running right now, drop ones already finished.
        const end = s.end_time ? new Date(s.end_time).getTime() : t + 3600_000;
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
    const t = new Date(course.start_date).getTime();
    if (Number.isNaN(t) || t > horizon || t < now.getTime() - 24 * 3600_000) continue;
    events.push({
      key: `${course.code}-start`,
      at: course.start_date,
      title: `${course.title} begins`,
      meta: [deliveryLabel(course.delivery_mode), countdownTo(course.start_date, now)]
        .filter(Boolean)
        .join(" · "),
    });
  }

  return events.sort((a, b) => new Date(a.at) - new Date(b.at));
}
