/*
 * Presentation for `last_login_at`.
 *
 * Shared so the dashboard, the user list and the user detail can't describe the
 * same value three different ways.
 *
 * The value is an INSTANT (a timestamptz recorded server-side), not a wall-clock
 * date, so it goes through `formatInstantDate` and is shown on the reader's own
 * clock — see TASTE §6.3.
 *
 * Null is meaningful, not missing data: the account exists but has never been
 * signed into. Paired with "Setup pending" that is what tells an admin whether
 * an invitation was ever acted on, so it reads "Never" rather than an em dash.
 */

import { formatInstantDate, formatInstantDateTime } from "@/lib/datetime";

export const NEVER_LOGGED_IN = "Never";

/** "23 Sep 2026", or "Never" when the account has never been signed into. */
export function lastLoginLabel(iso) {
  return iso ? formatInstantDate(iso, { day: "2-digit" }) : NEVER_LOGGED_IN;
}

/** Full date and time, for a tooltip on the short label. */
export function lastLoginTitle(iso) {
  return iso ? `Last signed in ${formatInstantDateTime(iso)}` : "This account has never been signed into";
}

/** True when the label should be styled as an absence rather than a value. */
export const hasNeverLoggedIn = (iso) => !iso;
