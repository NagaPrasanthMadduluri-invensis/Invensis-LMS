import { CalendarDays } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { formatDate, datesBetween } from "@/lib/datetime";

/**
 * The individual days a training actually runs on.
 *
 * `session_dates` is the authoritative list — a reschedule can leave gaps, so
 * the start/end range on its own doesn't say which days run. When the API
 * hasn't sent the list, fall back to every day in the range.
 */
export function sessionDatesOf(training) {
  const dates = Array.isArray(training?.session_dates) ? training.session_dates.filter(Boolean) : [];
  if (dates.length) return dates;
  return datesBetween(training?.start_date, training?.end_date);
}

const ACCENT = {
  violet: "border border-violet-100 bg-violet-50 text-violet-600",
  teal: "border border-teal-100 bg-teal-50 text-teal-700",
  amber: "border border-amber-100 bg-amber-50 text-amber-700",
  slate: "border border-slate-200 bg-slate-50 text-slate-600",
};

/**
 * "Day 1 · 6 Jul 2026" chips — the session dates behind a training's date
 * range. Dates print exactly as the API sent them (see `lib/datetime`).
 *
 * `compact` drops the "Day n" prefix and the heading, for tight spots such as
 * a table cell.
 */
export function SessionDates({ dates, accent = "violet", compact = false, className = "" }) {
  const list = Array.isArray(dates) ? dates.filter(Boolean) : [];
  if (list.length === 0) return null;

  const chip = ACCENT[accent] || ACCENT.violet;

  if (compact) {
    return (
      <Box className={`flex flex-wrap gap-1 ${className}`}>
        {list.map((d) => (
          <Text as="span" key={d} className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${chip}`}>
            {formatDate(d, { year: undefined })}
          </Text>
        ))}
      </Box>
    );
  }

  return (
    <Box className={className}>
      <Box className="flex items-center gap-1.5 mb-2.5">
        <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
        <Text as="span" className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {list.length} Session{list.length !== 1 ? "s" : ""}
        </Text>
      </Box>
      <Box className="flex flex-wrap gap-2">
        {list.map((d, i) => (
          <Badge key={d} className={chip}>
            Day {i + 1} · {formatDate(d)}
          </Badge>
        ))}
      </Box>
    </Box>
  );
}
