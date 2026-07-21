/**
 * Client-side "unread ticket replies" tracking.
 *
 * The backend has no read/seen state, but each ticket in the list carries a
 * reply count (`message_count`). We persist, per user, the reply count each
 * ticket had the last time the user opened it ("seen count") in localStorage.
 * A ticket is "unread" when its current reply count exceeds the seen count.
 *
 * Opening a ticket loads its thread; we then store seen = messages.length,
 * which also covers the user's OWN replies (the thread reloads after replying),
 * so a badge never lingers for a reply the user just sent.
 *
 * Not for secrets — auth tokens live in cookies (TASTE §4.4). This is a
 * non-sensitive per-device UI marker, so localStorage is appropriate.
 */

export const TICKETS_SEEN_EVENT = "tickets:seen-updated";

function keyFor(userId) {
  return `lms_tickets_seen_${userId || "anon"}`;
}

export function getSeenMap(userId) {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(window.localStorage.getItem(keyFor(userId)) || "{}");
  } catch {
    return {};
  }
}

/** Number of replies on a ticket, tolerant of either field spelling. */
export function replyCountOf(ticket) {
  return Number(ticket?.message_count ?? ticket?.messages_count ?? 0) || 0;
}

/** Count tickets with replies the user hasn't seen yet. */
export function unreadTicketCount(tickets, userId) {
  const seen = getSeenMap(userId);
  return (tickets || []).reduce((n, t) => {
    const replies = replyCountOf(t);
    const seenCount = Number(seen[t.id] || 0);
    return n + (replies > seenCount ? 1 : 0);
  }, 0);
}

/** Mark a ticket as seen up to `count` replies (monotonic). Notifies listeners. */
export function markTicketSeen(userId, ticketId, count) {
  if (typeof window === "undefined" || !ticketId) return;
  const map = getSeenMap(userId);
  const next = Math.max(Number(count) || 0, Number(map[ticketId] || 0));
  if (map[ticketId] === next) return; // nothing changed
  map[ticketId] = next;
  try {
    window.localStorage.setItem(keyFor(userId), JSON.stringify(map));
  } catch {
    /* storage full / unavailable — ignore */
  }
  window.dispatchEvent(new Event(TICKETS_SEEN_EVENT));
}
