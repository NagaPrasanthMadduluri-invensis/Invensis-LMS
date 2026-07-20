/**
 * Shared ticket presentation metadata — used by both the learner and admin
 * ticket UIs so labels/styling stay consistent. Keys mirror the backend enums
 * (see Server/src/modules/tickets/tickets.schema.js).
 */

export const TICKET_CATEGORIES = [
  { key: "reschedule_training", label: "Reschedule a training", needsTraining: true,  priority: "medium", hint: "Move your training to a different date or batch." },
  { key: "cancel_training",     label: "Cancel a training",     needsTraining: true,  priority: "high",   hint: "Request cancellation of a booked training." },
  { key: "certificate_issue",   label: "Certificate issue",     needsTraining: true,  priority: "medium", hint: "Certificate not issued, incorrect details, or download problem." },
  { key: "training_missed",     label: "Missed a training",     needsTraining: true,  priority: "high",   hint: "You couldn't attend a session and need help." },
  { key: "other",               label: "Something else",        needsTraining: false, priority: "low",    hint: "Any other query not covered above." },
];

export const CATEGORY_META = Object.fromEntries(
  TICKET_CATEGORIES.map((c) => [c.key, c])
);

export const STATUS_META = {
  open:        { label: "Open",        badge: "bg-red-50 text-red-600 ring-1 ring-red-200",         dot: "bg-red-500" },
  in_progress: { label: "In Progress", badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",   dot: "bg-amber-500" },
  resolved:    { label: "Resolved",    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", dot: "bg-emerald-500" },
  closed:      { label: "Closed",      badge: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",  dot: "bg-slate-400" },
};

export const PRIORITY_META = {
  low:    { label: "Low",    badge: "bg-slate-100 text-slate-500 ring-1 ring-slate-200" },
  medium: { label: "Medium", badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200" },
  high:   { label: "High",   badge: "bg-rose-50 text-rose-600 ring-1 ring-rose-200" },
  urgent: { label: "Urgent", badge: "bg-red-100 text-red-700 ring-1 ring-red-200" },
};

export function categoryLabel(key) {
  return CATEGORY_META[key]?.label || key;
}
