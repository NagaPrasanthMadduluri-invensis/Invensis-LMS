import { CalendarDays } from "lucide-react";
import { Card } from "@/components/ui/card";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { cn } from "@/lib/utils";
import { calendarChip } from "./dashboard-utils";

/**
 * The next seven days, built from real session timestamps where we have them
 * and training start dates where we don't. The first row is tinted — that's
 * the one the learner has to think about today.
 */
export function ThisWeekPanel({ events = [] }) {
  return (
    <Card className="gap-0 rounded-2xl p-0">
      <Box className="px-5 py-4">
        <Text as="h3" className="text-base font-bold text-foreground">
          This week
        </Text>
      </Box>

      {events.length === 0 ? (
        <Box className="flex flex-col items-center gap-2 px-5 pb-8 pt-2 text-center">
          <CalendarDays className="h-7 w-7 text-border" />
          <Text as="p" className="text-xs text-muted-foreground">
            Nothing scheduled in the next 7 days.
          </Text>
        </Box>
      ) : (
        <Box className="space-y-2 px-4 pb-4">
          {events.map((event, i) => {
            const chip = calendarChip(event.at);
            return (
              <Box
                key={event.key}
                className={cn(
                  "flex items-stretch gap-3.5 rounded-xl border px-3 py-3",
                  i === 0 ? "border-transparent bg-secondary" : "border-border bg-card"
                )}
              >
                <Box className="flex w-10 shrink-0 flex-col items-center justify-center">
                  <Text as="span" className="text-[10px] font-bold tracking-wide text-primary">
                    {chip.day}
                  </Text>
                  <Text as="span" className="text-lg font-bold leading-tight text-foreground">
                    {chip.date}
                  </Text>
                </Box>
                <Box className="w-px shrink-0 bg-border" />
                <Box className="min-w-0 flex-1 self-center">
                  <Text as="p" className="break-normal text-sm font-semibold text-foreground">
                    {event.title}
                  </Text>
                  {event.meta && (
                    <Text as="span" className="mt-0.5 block break-normal text-[11px] text-muted-foreground">
                      {event.meta}
                    </Text>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}
    </Card>
  );
}
