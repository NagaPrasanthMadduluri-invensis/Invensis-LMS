import Link from "next/link";
import { Card } from "@/components/ui/card";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { completedThisMonth, programmeProgress, targetHoursOf } from "./dashboard-utils";

const RADIUS = 42;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ProgressRing({ pct }) {
  return (
    <Box className="relative flex h-14 w-14 shrink-0 items-center justify-center">
      <svg className="h-14 w-14 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r={RADIUS} fill="none" strokeWidth="13" className="stroke-secondary" />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          strokeWidth="13"
          strokeLinecap="round"
          className="stroke-primary"
          strokeDasharray={`${(Math.min(pct, 100) / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
        />
      </svg>
      <Text as="span" className="absolute text-xs font-bold text-foreground">
        {pct}%
      </Text>
    </Box>
  );
}

/** One cell of the strip: label on top, big value, quiet footnote below. */
function Stat({ label, value, unit, footnote, footnoteClass = "text-muted-foreground" }) {
  return (
    <Box className="px-5 py-4">
      <Text as="p" className="text-xs font-medium text-muted-foreground">
        {label}
      </Text>
      <Text as="p" className="mt-1.5 text-3xl font-bold leading-none text-foreground">
        {value}
        {unit && <Text as="span" className="ml-0.5 text-base font-semibold text-foreground">{unit}</Text>}
      </Text>
      {footnote && (
        <Text as="span" className={`mt-2 block text-[11px] ${footnoteClass}`}>
          {footnote}
        </Text>
      )}
    </Box>
  );
}

/**
 * The at-a-glance row. One card divided into cells rather than five floating
 * cards — it reads as a single summary instead of five competing ones.
 */
export function StatStrip({ stats = {}, myCourses = {}, journey = [] }) {
  const progress = programmeProgress(myCourses);
  const upcoming = stats.upcoming ?? 0;
  const newlyCompleted = completedThisMonth(journey);
  const targetHours = targetHoursOf(myCourses);
  const certificates = stats.certificates_earned ?? 0;

  return (
    <Card className="gap-0 rounded-2xl p-0">
      <Box className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-[1.4fr_repeat(4,1fr)] lg:divide-x">
        {/* Programme progress */}
        <Box className="flex items-center gap-4 border-b border-border px-5 py-4 sm:border-b-0 sm:border-r">
          <ProgressRing pct={progress.pct} />
          <Box className="min-w-0">
            <Text as="p" className="break-normal text-sm font-bold text-foreground">
              Progress
            </Text>
            <Text as="span" className="mt-0.5 block break-normal text-[11px] text-muted-foreground">
              {progress.total === 0
                ? "No sessions scheduled yet"
                : progress.left === 0
                  ? "Every session complete"
                  : `${progress.left} session${progress.left === 1 ? "" : "s"} left to complete your plan`}
            </Text>
          </Box>
        </Box>

        <Stat
          label="Active"
          value={stats.in_progress ?? 0}
          footnote={upcoming > 0 ? `${upcoming} upcoming` : "In progress now"}
        />

        <Stat
          label="Completed"
          value={stats.completed ?? 0}
          footnote={newlyCompleted > 0 ? `+${newlyCompleted} this month` : "All time"}
          footnoteClass={newlyCompleted > 0 ? "font-semibold text-emerald-600" : "text-muted-foreground"}
        />

        <Stat
          label="Learning hours"
          value={stats.learning_hours ?? 0}
          unit="h"
          footnote={targetHours > 0 ? `of ${targetHours}h enrolled` : null}
        />

        <Box className="px-5 py-4">
          <Text as="p" className="text-xs font-medium text-muted-foreground">
            Certificates
          </Text>
          <Text as="p" className="mt-1.5 text-3xl font-bold leading-none text-foreground">
            {certificates}
          </Text>
          {certificates > 0 ? (
            <Link
              href="/certificates"
              className="mt-2 block text-[11px] font-semibold text-primary hover:underline"
            >
              View all
            </Link>
          ) : (
            <Text as="span" className="mt-2 block text-[11px] text-muted-foreground">
              Finish a training to earn one
            </Text>
          )}
        </Box>
      </Box>
    </Card>
  );
}
