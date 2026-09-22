/*
 * Grouping a learner's trainings into "what's running", "what's coming" and
 * "what's done".
 *
 * Lives in lib/ rather than beside the component because it is pure data logic
 * with no React in it — which also means it can be reasoned about, and tested,
 * on its own.
 *
 * Dates are wall-clock "YYYY-MM-DD" strings throughout and are compared
 * lexicographically, never through a Date object: see TASTE §6.3 — reading them
 * as instants shifts the day for anyone not on UTC.
 */

/** A seat is finished if either side says so.
 *
 *  A learner can be marked complete on a training that is still running for the
 *  rest of the cohort (they left early, or sat an earlier assessment), and a
 *  training can be completed wholesale by the admin while an individual seat
 *  still reads "confirmed". Either is enough. */
export const isCompletedTraining = (t) =>
  t?.enrolment_status === "completed" || t?.status === "completed";

/** Running right now.
 *
 *  The explicit status wins when it is set. Otherwise the dates decide, so a
 *  training that began on Monday reads as in progress on Wednesday whether or
 *  not anybody moved its status — the admin flipping `ongoing` is a manual step
 *  and cannot be relied on.
 *
 *  Postponed is deliberately excluded: its dates are the OLD ones until the
 *  reschedule lands, so a stale range spanning today would otherwise announce a
 *  training that isn't happening. */
export function isOngoingTraining(t, today) {
  if (isCompletedTraining(t)) return false;
  if (t?.status === "ongoing") return true;
  if (t?.status === "postponed") return false;
  return Boolean(t?.start_date) && Boolean(t?.end_date)
    && t.start_date <= today && today <= t.end_date;
}

/* Undated trainings sort last among upcoming ones — "to be confirmed" belongs
   after everything with a real date, not before it, which is what an empty
   string would do in a plain string compare. */
const byStartDate = (dir) => (a, b) => {
  const x = a?.start_date ?? "", y = b?.start_date ?? "";
  if (!x && !y) return 0;
  if (!x) return 1;
  if (!y) return -1;
  return dir * x.localeCompare(y);
};

/**
 * Split a learner's trainings into the three groups the My Trainings page
 * shows. `today` is injectable so the boundaries can be tested.
 *
 * Nothing is filtered out here — the API already withholds cancelled and
 * suspended trainings and cancelled or transferred seats, so anything that
 * arrives is something the learner is entitled to see.
 *
 * A training whose dates have PASSED but which the admin has not marked
 * completed falls through to `upcoming`. That is deliberate and confirmed:
 * completion is the admin's call, and until they make it no certificate
 * exists, so filing it under "Completed" would claim something untrue. It
 * corrects itself the moment the training is completed.
 */
export function classifyTrainings(list, today = todayWallClock()) {
  const completed = [], ongoing = [], upcoming = [];
  for (const t of list ?? []) {
    if (isCompletedTraining(t)) completed.push(t);
    else if (isOngoingTraining(t, today)) ongoing.push(t);
    else upcoming.push(t);
  }
  // Soonest first for what lies ahead; most recent first for what's behind.
  ongoing.sort(byStartDate(1));
  upcoming.sort(byStartDate(1));
  completed.sort(byStartDate(-1));
  return { ongoing, upcoming, completed };
}

/** Today as a local "YYYY-MM-DD", to compare against wall-clock dates.
 *
 *  Built from the local parts rather than `toISOString().slice(0,10)`, which
 *  reports the UTC day — yesterday for anyone west of Greenwich (TASTE §6.3). */
export function todayWallClock(now = new Date()) {
  const p = (n) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`;
}

/**
 * Whole days from `today` to `date`, both wall-clock "YYYY-MM-DD" strings.
 * Negative when the date is past, null when either is missing or malformed.
 *
 * Both sides are anchored at UTC midnight purely to subtract them — UTC has no
 * DST, so the difference is an exact whole number of days and neither the
 * viewer's zone nor the season can shift it (TASTE §6.3).
 */
export function daysBetween(today, date) {
  const p = (v) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(v ?? ""));
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null;
  };
  const a = p(today), b = p(date);
  if (a == null || b == null) return null;
  return Math.round((b - a) / 86400000);
}

/**
 * "Starts tomorrow", "Ends in 3 days", "Starts in 2 weeks" — the one line that
 * answers "how soon?" without the reader doing date arithmetic.
 *
 * Returns "" when there is nothing useful to say, so the caller can render it
 * unconditionally.
 */
export function relativeScheduleLabel(t, today = todayWallClock()) {
  if (isCompletedTraining(t)) return "";

  if (isOngoingTraining(t, today)) {
    const left = daysBetween(today, t.end_date);
    if (left == null) return "Running now";
    if (left <= 0) return "Last day";
    return left === 1 ? "Ends tomorrow" : `Ends in ${left} days`;
  }

  const until = daysBetween(today, t.start_date);
  if (until == null) return t.status === "postponed" ? "Being rescheduled" : "";
  if (until < 0) return "Awaiting completion";
  if (until === 0) return "Starts today";
  if (until === 1) return "Starts tomorrow";
  if (until < 14) return `Starts in ${until} days`;
  const weeks = Math.round(until / 7);
  return weeks < 8 ? `Starts in ${weeks} weeks` : `Starts in ${Math.round(until / 30)} months`;
}
