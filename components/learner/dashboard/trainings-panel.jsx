"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, MapPin, Users, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { cn } from "@/lib/utils";
import {
  allCoursesOf,
  deliveryLabel,
  formatDateRange,
  nextSessionOf,
} from "./dashboard-utils";

const LIFECYCLE = {
  in_progress: {
    label: "In progress",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    tile: "bg-secondary text-primary",
  },
  upcoming: {
    label: "Upcoming",
    badge: "border-sky-200 bg-sky-50 text-sky-700",
    tile: "bg-sky-50 text-sky-600",
  },
  completed: {
    label: "Completed",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    tile: "bg-emerald-50 text-emerald-600",
  },
};

const MODE_ICON = { virtual: Video, hybrid: Video, in_person: MapPin, one_to_one: Users };

function TrainingRow({ course, detail }) {
  const cfg = LIFECYCLE[course.lifecycle];
  const done = course.completed_sessions ?? 0;
  const total = course.total_sessions ?? 0;
  const pct = course.lifecycle === "completed" ? 100 : Math.round(course.progress_pct ?? 0);
  const finished = course.lifecycle === "completed";
  const Icon = finished ? Check : MODE_ICON[course.delivery_mode] || Video;

  const nextSession = finished ? null : nextSessionOf(detail);
  const meetingUrl = detail?.meeting?.url ?? null;

  return (
    <Box className="px-5 py-4">
      <Box className="flex items-start gap-3.5">
        <Box className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", cfg.tile)}>
          <Icon className="h-4.5 w-4.5" />
        </Box>

        <Box className="min-w-0 flex-1">
          <Box className="flex flex-wrap items-start justify-between gap-2">
            <Box className="min-w-0">
              <Text as="p" className="break-normal text-sm font-bold text-foreground">
                {course.title}
              </Text>
              <Text as="span" className="mt-0.5 block font-mono text-[11px] text-muted-foreground">
                {[course.code, deliveryLabel(course.delivery_mode), formatDateRange(course.start_date, course.end_date)]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </Box>
            <Text
              as="span"
              className={cn(
                "shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                cfg.badge
              )}
            >
              {cfg.label}
            </Text>
          </Box>

          {total > 0 && (
            <Box className="mt-3 flex items-center gap-3">
              <Box className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-secondary">
                <Box
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </Box>
              <Text as="span" className="shrink-0 text-[11px] font-medium text-muted-foreground">
                {finished ? total : done} / {total} sessions
              </Text>
            </Box>
          )}

          <Box className="mt-3.5 flex flex-wrap items-center gap-2">
            {finished ? (
              <>
                <Button
                  render={<Link href="/certificates" />}
                  variant="outline"
                  size="lg"
                  className="h-8 rounded-lg px-3 text-xs font-semibold"
                >
                  Download certificate
                </Button>
                <Button
                  render={<Link href="/certificates" />}
                  variant="outline"
                  size="lg"
                  className="h-8 rounded-lg px-3 text-xs font-semibold"
                >
                  Give feedback
                </Button>
              </>
            ) : (
              <>
                {meetingUrl ? (
                  <Button
                    render={<a href={meetingUrl} target="_blank" rel="noopener noreferrer" />}
                    size="lg"
                    className="h-8 rounded-lg px-3 text-xs font-semibold"
                  >
                    {nextSession ? `Join session ${nextSession.day_number}` : "Join session"}
                  </Button>
                ) : (
                  <Button
                    render={<Link href="/my-courses" />}
                    variant="outline"
                    size="lg"
                    className="h-8 rounded-lg px-3 text-xs font-semibold"
                  >
                    View schedule
                  </Button>
                )}
                <Button
                  render={<Link href="/my-courses" />}
                  variant="outline"
                  size="lg"
                  className="h-8 rounded-lg px-3 text-xs font-semibold"
                >
                  Materials
                </Button>
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function FilterChip({ active, label, count, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
        active
          ? "bg-brand-hero text-white"
          : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
      )}
    >
      {label} · {count}
    </button>
  );
}

/**
 * The learner's enrolments, filterable by lifecycle. Session-level detail
 * (join links, next session number) comes from `details`, keyed by training
 * code — rows render fine without it.
 */
export function TrainingsPanel({ myCourses = {}, details = {} }) {
  const [filter, setFilter] = useState("all");
  const courses = useMemo(() => allCoursesOf(myCourses), [myCourses]);

  const counts = {
    all: courses.length,
    in_progress: courses.filter((c) => c.lifecycle === "in_progress").length,
    completed: courses.filter((c) => c.lifecycle === "completed").length,
    upcoming: courses.filter((c) => c.lifecycle === "upcoming").length,
  };

  const visible = filter === "all" ? courses : courses.filter((c) => c.lifecycle === filter);

  return (
    <Card className="gap-0 rounded-2xl p-0">
      <Box className="px-5 pt-4">
        <Box className="flex items-center justify-between gap-3">
          <Text as="h3" className="text-base font-bold text-foreground">
            My trainings
          </Text>
          <Link
            href="/my-courses"
            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </Box>

        <Box className="mt-3.5 flex flex-wrap gap-2 pb-4">
          <FilterChip active={filter === "all"} label="All" count={counts.all} onClick={() => setFilter("all")} />
          <FilterChip
            active={filter === "in_progress"}
            label="In progress"
            count={counts.in_progress}
            onClick={() => setFilter("in_progress")}
          />
          <FilterChip
            active={filter === "completed"}
            label="Completed"
            count={counts.completed}
            onClick={() => setFilter("completed")}
          />
          <FilterChip
            active={filter === "upcoming"}
            label="Upcoming"
            count={counts.upcoming}
            onClick={() => setFilter("upcoming")}
          />
        </Box>
      </Box>

      {visible.length === 0 ? (
        <Box className="flex flex-col items-center gap-2 border-t border-border px-5 py-12 text-center">
          <BookOpen className="h-8 w-8 text-border" />
          <Text as="p" className="text-sm text-muted-foreground">
            {counts.all === 0
              ? "You're not enrolled in any trainings yet."
              : "Nothing in this bucket right now."}
          </Text>
          {counts.all === 0 && (
            <Button
              render={<Link href="/enrollments" />}
              size="lg"
              className="mt-2 h-9 rounded-xl px-4 text-sm font-semibold"
            >
              Browse catalogue
            </Button>
          )}
        </Box>
      ) : (
        <Box className="divide-y divide-border border-t border-border">
          {visible.map((course) => (
            <TrainingRow key={`${course.id}-${course.lifecycle}`} course={course} detail={details[course.code]} />
          ))}
        </Box>
      )}
    </Card>
  );
}
