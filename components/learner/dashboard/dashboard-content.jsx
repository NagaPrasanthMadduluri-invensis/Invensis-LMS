"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchLearnerDashboard, fetchTrainingDetail } from "@/services/api/learner/learner-api";
import { DashboardHeader } from "./dashboard-header";
import { UpNextBanner } from "./up-next-banner";
import { StatStrip } from "./stat-strip";
import { TrainingsPanel } from "./trainings-panel";
import { ThisWeekPanel } from "./this-week-panel";
import { CertificatesPanel } from "./certificates-panel";
import { RecentActivityPanel } from "./recent-activity-panel";
import { UpcomingCohortsPanel } from "./upcoming-cohorts-panel";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { activeCoursesOf, countdownTo, nextSessionOf, weekAheadOf } from "./dashboard-utils";

// The dashboard payload has no session-level data, so we top it up with the
// training detail endpoint. Capped — a learner with a dozen enrolments
// shouldn't fire a dozen requests to render one page.
const DETAIL_FETCH_LIMIT = 4;

/** One-line status under the greeting, e.g. "2 trainings in flight · next session starts in 12 min". */
function summaryLine({ stats, nextUp }) {
  const active = stats.in_progress ?? 0;
  const upcoming = stats.upcoming ?? 0;

  const head =
    active > 0
      ? `${active} training${active === 1 ? "" : "s"} in flight`
      : upcoming > 0
        ? `${upcoming} training${upcoming === 1 ? "" : "s"} lined up`
        : "No active trainings";

  const countdown = nextUp?.session ? countdownTo(nextUp.session.start_time) : null;
  const tail = countdown
    ? countdown === "in progress"
      ? "your session is live right now"
      : `next session ${countdown}`
    : null;

  return [head, tail].filter(Boolean).join(" · ") + ".";
}

export function DashboardContent() {
  const { token, user } = useAuth();
  const [data, setData] = useState(null);
  // Training detail keyed by training code — enriches the hero, the week ahead
  // and the join buttons. Missing entries just mean less detail, never an error.
  const [details, setDetails] = useState({});
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      const dashboard = await fetchLearnerDashboard({ token });
      setData(dashboard);
      setError(null);

      const active = activeCoursesOf(dashboard.my_courses).slice(0, DETAIL_FETCH_LIMIT);
      const loaded = await Promise.all(
        active.map((course) =>
          fetchTrainingDetail({ token, trainingRef: course.code })
            .then((detail) => [course.code, detail])
            .catch(() => null)
        )
      );
      setDetails(Object.fromEntries(loaded.filter(Boolean)));
    } catch (err) {
      setError(err.message);
    } finally {
      setRefreshing(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <Box className="flex items-center gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
        <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
        <Box className="min-w-0">
          <Text as="p" className="text-sm font-semibold text-destructive">
            Couldn&rsquo;t load your dashboard
          </Text>
          <Text as="span" className="text-xs text-destructive/80">
            {error}
          </Text>
        </Box>
        <Button variant="outline" size="lg" onClick={load} className="ml-auto h-9 shrink-0 rounded-xl">
          Retry
        </Button>
      </Box>
    );
  }

  if (!data) return <DashboardSkeleton />;

  const { learner = {}, stats = {}, my_courses = {}, certificates = [], journey = [] } = data;

  // The next session across every active training — earliest start wins.
  const nextUp = activeCoursesOf(my_courses)
    .map((course) => {
      const detail = details[course.code];
      const session = nextSessionOf(detail);
      return session ? { course, detail, session } : null;
    })
    .filter(Boolean)
    .sort((a, b) => new Date(a.session.start_time ?? 0) - new Date(b.session.start_time ?? 0))[0];

  const weekAhead = weekAheadOf({ courses: activeCoursesOf(my_courses), details });

  return (
    <Box className="w-full space-y-4">
      {/* Prefer the dashboard payload's name; fall back to the signed-in
          account when the learner profile hasn't got one. */}
      <DashboardHeader name={learner.name || user?.name} summary={summaryLine({ stats, nextUp })} />

      {nextUp && <UpNextBanner course={nextUp.course} detail={nextUp.detail} session={nextUp.session} />}

      <StatStrip stats={stats} myCourses={my_courses} journey={journey} />

      {/* The right rail holds fixed-width summary panels; the trainings list
          absorbs whatever width is left, so this scales to any viewport. */}
      <Box className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_460px]">
        <TrainingsPanel myCourses={my_courses} details={details} />

        <Box className="space-y-4">
          <ThisWeekPanel events={weekAhead} />
          <UpcomingCohortsPanel />
          <CertificatesPanel certificates={certificates} myCourses={my_courses} />
          <RecentActivityPanel journey={journey} />
        </Box>
      </Box>

      <Box className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={load}
          disabled={refreshing}
          className="gap-1.5 text-muted-foreground"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </Box>
    </Box>
  );
}
