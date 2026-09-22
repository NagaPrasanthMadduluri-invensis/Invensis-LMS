"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  Calendar,
  CalendarDays,
  Globe,
  Hourglass,
  Video,
  MapPin,
  Layers,
  UserRound,
  ShieldAlert,
  Mail,
  LifeBuoy,
  BookText,
  AlertCircle,
  BadgeCheck,
  Ticket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchMyTrainings, fetchTrainingDetail } from "@/services/api/learner/learner-api";
import { TrainingGuidelines } from "@/components/learner/training-guidelines";
import { TrainingResources } from "@/components/learner/training-resources";
import { SessionDates, sessionDatesOf } from "@/components/shared/session-dates";
import { formatDate as fmtDate, formatDateTime, formatTime as fmtTime, timezoneLabel } from "@/lib/datetime";

// Admin/support inbox a learner can reach out to about enrolment.
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@invensis.com";

const MODE_CONFIG = {
  virtual: { label: "Live Virtual", icon: Video, color: "bg-blue-100 text-blue-600" },
  in_person: { label: "In Person", icon: MapPin, color: "bg-emerald-100 text-emerald-600" },
  hybrid: { label: "Hybrid", icon: Layers, color: "bg-violet-100 text-violet-600" },
  one_to_one: { label: "1-to-1 Coaching", icon: UserRound, color: "bg-amber-100 text-amber-600" },
};

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700" },
  active: { label: "Active", color: "bg-emerald-100 text-emerald-700" },
  ongoing: { label: "Ongoing", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", color: "bg-gray-100 text-gray-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
  postponed: { label: "Postponed", color: "bg-orange-100 text-orange-700" },
  suspended: { label: "Suspended", color: "bg-rose-100 text-rose-700" },
};

const BATCH_LABEL = {
  weekday: "Weekday batch",
  weekend: "Weekend batch",
  combined: "Combined batch",
};

const PLATFORM_LABEL = { zoom: "Zoom", teams: "Microsoft Teams", other: "Meeting" };

// "2026-09-15" → "15 Sep 2026", exactly as the API sent it.
const formatDate = (dateStr) => fmtDate(dateStr);

// "09:00:00" → "9:00 AM"
const formatTime = (timeStr) => fmtTime(timeStr);

function Fact({ icon: Icon, label, children }) {
  return (
    <Box className="flex items-start gap-3">
      <Box className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50">
        <Icon className="h-4 w-4 text-violet-500" />
      </Box>
      <Box className="min-w-0">
        <Text as="p" className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
          {label}
        </Text>
        <Text as="p" className="text-sm font-semibold text-slate-800 leading-tight mt-0.5">
          {children}
        </Text>
      </Box>
    </Box>
  );
}

function ScheduleSkeleton() {
  return (
    <Card className="p-0 overflow-hidden">
      <Skeleton className="h-28 w-full" />
      <Box className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Box key={i} className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Box className="space-y-1.5">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-3.5 w-24" />
            </Box>
          </Box>
        ))}
      </Box>
    </Card>
  );
}

function ScheduleCard({ training, enrolmentId }) {
  const mode = MODE_CONFIG[training.delivery_mode] || MODE_CONFIG.virtual;
  const statusCfg = STATUS_CONFIG[training.status] || STATUS_CONFIG.active;
  const ModeIcon = mode.icon;
  const sessionDates = sessionDatesOf(training);
  // Add-ons on this learner's own order. Older detail responses predate the
  // field, so default to [] rather than letting `.length` throw.
  const addons = training.addons ?? [];

  return (
    <Card className="p-0 overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm">
      {/* Header band */}
      <Box className="bg-gradient-to-r from-violet-50 via-purple-50 to-violet-50 border-b border-violet-100 px-6 py-5">
        <Box className="flex flex-wrap items-start justify-between gap-3">
          <Box className="min-w-0">
            <Box className="flex flex-wrap items-center gap-1.5">
              <Text as="span" className="text-[11px] font-mono font-bold text-violet-500 bg-violet-100 ring-1 ring-violet-200 px-2.5 py-1 rounded-lg tracking-wide">
                {training.training_id}
              </Text>
              {enrolmentId && (
                <Text as="span" className="text-[11px] font-mono font-bold text-slate-500 bg-white ring-1 ring-slate-200 px-2.5 py-1 rounded-lg tracking-wide">
                  Enrolment ID: {enrolmentId}
                </Text>
              )}
            </Box>
            <Text as="h2" className="text-xl font-bold text-slate-900 leading-tight mt-2.5">
              {training.title}
            </Text>
          </Box>
          <Box className="flex shrink-0 gap-1.5 flex-wrap">
            <Badge className={`border-0 text-[11px] font-semibold ${statusCfg.color}`}>{statusCfg.label}</Badge>
            <Badge className={`border-0 text-[11px] font-semibold ${mode.color}`}>
              <ModeIcon className="h-3 w-3 mr-1" />
              {mode.label}
            </Badge>
          </Box>
        </Box>
      </Box>

      {/* Facts grid */}
      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-6">
        <Fact icon={Calendar} label="Training Dates">
          {formatDate(training.start_date)} – {formatDate(training.end_date)}
        </Fact>
        <Fact icon={Clock} label="Daily Timing">
          {formatTime(training.start_time)} – {formatTime(training.end_time)}
          {timezoneLabel(training.timezone, training.start_date)
            ? ` ${timezoneLabel(training.timezone, training.start_date)}`
            : ""}
        </Fact>
        <Fact icon={Globe} label="Timezone">
          {training.timezone || "—"}
        </Fact>
        <Fact icon={Hourglass} label="Duration">
          {training.duration_hours != null ? `${training.duration_hours} hours` : "—"}
        </Fact>
        <Fact icon={Clock} label="Hours / Day">
          {training.hours_per_day ? `${training.hours_per_day} hours` : "—"}
        </Fact>
        <Fact icon={Video} label="Delivery Mode">
          {mode.label}
        </Fact>
        {training.batch_type && (
          <Fact icon={CalendarDays} label="Batch">
            {BATCH_LABEL[training.batch_type] || training.batch_type}
          </Fact>
        )}
        {training.trainer?.name && (
          <Fact icon={UserRound} label="Trainer">
            {training.trainer.name}
          </Fact>
        )}
      </Box>

      {/* Session dates */}
      {sessionDates.length > 0 && (
        <Box className="border-t px-6 py-4">
          <SessionDates dates={sessionDates} />
        </Box>
      )}

      {/* Live meeting link — shown under the sessions, not in the heading */}
      {training.meeting?.url && (
        <Box className="border-t px-6 py-4">
          <Box className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/70 ring-1 ring-violet-200 px-4 py-3">
            <Box className="flex items-center gap-2.5 min-w-0">
              <Box className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
                <Video className="h-4 w-4 text-emerald-600" />
              </Box>
              <Box className="min-w-0">
                <Text as="p" className="text-sm font-semibold text-slate-800 leading-tight">Meeting link is live</Text>
                <Text as="span" className="text-[11px] text-slate-500">{PLATFORM_LABEL[training.meeting.platform] || "Meeting"}</Text>
              </Box>
            </Box>
            <Button
              render={<a href={training.meeting.url} target="_blank" rel="noopener noreferrer" />}
              size="sm"
              className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white border-0 rounded-lg text-sm font-semibold shrink-0"
            >
              Join Meeting
            </Button>
          </Box>
        </Box>
      )}

      {/* Meeting-link status — shown under the sessions, not at the top */}
      {!training.meeting?.url && training.delivery_mode !== "in_person" && (
        <Box className="border-t px-6 py-4">
          <Box className="flex items-center gap-2.5 rounded-xl border border-dashed border-violet-200 bg-white/50 px-4 py-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-violet-300" />
            <Text as="p" className="text-xs text-slate-500">
              Meeting link hasn&apos;t been released yet — check back closer to the training date.
            </Text>
          </Box>
        </Box>
      )}

      {/* Add-ons bought with this seat (exam voucher, membership, …), read from
          the learner's own order. When present these ARE the answer to "is the
          exam covered?", so they replace the generic "not included" prompt
          below rather than sitting alongside it. */}
      {addons.length > 0 && (
        <Box className="border-t px-6 py-4">
          <Box className="flex items-start gap-3 rounded-xl bg-emerald-50 ring-1 ring-emerald-200 px-4 py-3">
            <Box className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
              <BadgeCheck className="h-4 w-4 text-emerald-600" />
            </Box>
            <Box className="min-w-0">
              <Text as="p" className="text-sm font-semibold text-emerald-800 leading-tight">
                {addons.length === 1 ? "Add-on included" : "Add-ons included"} with your purchase
              </Text>
              <Box className="mt-1.5 flex flex-wrap gap-1.5">
                {addons.map((a, i) => (
                  <Text
                    key={`${a.name}-${i}`}
                    as="span"
                    className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"
                  >
                    <BadgeCheck className="h-3 w-3 shrink-0" />
                    {a.name}
                    {a.quantity > 1 ? ` ×${a.quantity}` : ""}
                  </Text>
                ))}
              </Box>
            </Box>
          </Box>
        </Box>
      )}

      {/* Exam certification — driven by the CMS `certification_included` flag.
          true → included (good news); false → offer a voucher request; null → nothing. */}
      {training.certification_included === true && (
        <Box className="border-t px-6 py-4">
          <Box className="flex items-start gap-3 rounded-xl bg-emerald-50 ring-1 ring-emerald-200 px-4 py-3">
            <Box className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100">
              <BadgeCheck className="h-4 w-4 text-emerald-600" />
            </Box>
            <Box className="min-w-0">
              <Text as="p" className="text-sm font-semibold text-emerald-800 leading-tight">
                🎉 Exam certification is included!
              </Text>
              <Text as="p" className="text-xs text-emerald-700 mt-0.5">
                The exam certification cost is already covered in your training fee — nothing extra to pay.
              </Text>
            </Box>
          </Box>
        </Box>
      )}

      {training.certification_included === false && addons.length === 0 && (
        <Box className="border-t px-6 py-4">
          <Box className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 ring-1 ring-amber-200 px-4 py-3">
            <Box className="flex items-start gap-3 min-w-0">
              <Box className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                <Ticket className="h-4 w-4 text-amber-600" />
              </Box>
              <Box className="min-w-0">
                <Text as="p" className="text-sm font-semibold text-amber-900 leading-tight">
                  Exam certification isn&apos;t included
                </Text>
                <Text as="p" className="text-xs text-amber-700 mt-0.5">
                  You can request an exam voucher — an additional cost applies depending on the course.
                </Text>
              </Box>
            </Box>
            <Button
              render={<a href="/tickets/new" />}
              size="sm"
              className="h-9 px-4 bg-amber-600 hover:bg-amber-700 text-white border-0 rounded-lg text-sm font-semibold shrink-0"
            >
              Request Exam Voucher
            </Button>
          </Box>
        </Box>
      )}
    </Card>
  );
}

// Session timestamp → "15 Sep, 9:00 AM GST". The stored wall clock already
// reads in the training's own timezone, so it is printed as-is and the zone
// is named alongside it — the same text for a learner anywhere in the world.
function formatSessionTime(iso, tz) {
  const when = formatDateTime(iso, { year: undefined, fallback: null });
  if (!when) return null;
  const zone = timezoneLabel(tz, iso);
  return zone ? `${when} ${zone}` : when;
}

/**
 * Day-by-day topics the assigned trainer has set for this training. Reads
 * `sessions[]` (day_number, planned_topics) straight from the learner training
 * detail — updates the moment the trainer saves.
 */
function SessionTopics({ sessions, timezone }) {
  const list = Array.isArray(sessions) ? sessions : [];
  // Only show this section once the trainer has published at least one topic.
  const anyTopics = list.some((s) => s.planned_topics?.trim());
  if (list.length === 0 || !anyTopics) return null;

  return (
    <Card className="p-0 overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm">
      <Box className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
        <Box className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
          <BookText className="h-4 w-4 text-violet-500" />
        </Box>
        <Text as="h3" className="text-sm font-bold text-slate-800">Day-wise Topics Covered</Text>
        <Badge className="border-0 bg-violet-50 text-violet-600 text-[11px] font-semibold">
          {list.length} day{list.length !== 1 ? "s" : ""}
        </Badge>
      </Box>
      <Box className="p-5">
        <Box className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          {list.map((s) => {
            const when = formatSessionTime(s.start_time, timezone);
            const hasTopics = !!s.planned_topics?.trim();
            return (
              <Box key={s.day_number} className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-4">
                <Box className="flex items-center gap-2.5">
                  <Box className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50">
                    <Calendar className="h-4 w-4 text-violet-600" />
                  </Box>
                  <Box className="min-w-0">
                    <Text as="p" className="text-sm font-semibold leading-tight text-slate-800">Day {s.day_number}</Text>
                    {when && <Text as="span" className="text-[11px] text-slate-400">{when}</Text>}
                  </Box>
                </Box>
                {hasTopics ? (
                  <Text as="p" className="mt-3 text-sm whitespace-pre-wrap text-slate-600">{s.planned_topics}</Text>
                ) : (
                  <Box className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-slate-200 px-2.5 py-2">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                    <Text as="p" className="text-xs text-slate-400">Topics not published yet</Text>
                  </Box>
                )}
              </Box>
            );
          })}
        </Box>
      </Box>
    </Card>
  );
}

/**
 * Shown when the training detail API returns 403 — the learner has no confirmed
 * enrolment in this training, so there is nothing to display yet. Enrolment is
 * managed by an admin, so the call-to-action is to reach out to them.
 */
function NotEnrolledState({ user, message }) {
  const subject = encodeURIComponent("Enrolment request — My Trainings");
  const body = encodeURIComponent(
    `Hi,\n\nI don't see any training under My Trainings` +
      (user?.name ? ` for ${user.name}` : "") +
      (user?.email ? ` (${user.email})` : "") +
      `. Could you please check my enrolment and add me to my training?\n\nThanks.`
  );

  return (
    <Card className="flex flex-col items-center justify-center px-2 py-14 text-center">
      <Box className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
        <ShieldAlert className="h-7 w-7 text-amber-600" />
      </Box>
      <Text as="h2" className="mt-4 text-lg font-semibold">
        You&apos;re not enrolled in a training yet
      </Text>
      <Text as="p" className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
        We couldn&apos;t find a confirmed enrolment for your account, so there&apos;s
        nothing to show here yet. Enrolments are set up by our team — please reach
        out and we&apos;ll get you added.
      </Text>

      {message && (
        <Box className="mt-4 rounded-lg bg-muted px-3 py-2">
          <Text as="span" className="text-xs text-muted-foreground">
            Details: {message}
          </Text>
        </Box>
      )}

      <Box className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
        <Button asChild className="bg-gradient-to-r from-violet-500 to-purple-600 text-white hover:from-violet-600 hover:to-purple-700">
          <a href={`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`} className="flex items-center justify-center gap-1.5">
            <Mail className="mr-1.5 h-4 w-4" />
            Contact Admin
          </a>
        </Button>
        <Button asChild variant="outline">
          <a href="/dashboard" className="flex items-center justify-center gap-1.5">
            <LifeBuoy className="mr-1.5 h-4 w-4" />
            Back to Dashboard
          </a>
        </Button>
      </Box>

      <Text as="p" className="mt-4 text-[11px] text-muted-foreground">
        Already paid or registered? Enrolment can take a little while to appear after purchase.
      </Text>
    </Card>
  );
}

/*
 * Which training to open when no specific one was asked for.
 *
 * /my-courses now lists every training, so this only runs on a direct hit to
 * the detail view without a reference — a bookmark of the old single-training
 * URL, for instance. It prefers, in order:
 *
 *   1. in progress  — a training running right now
 *   2. upcoming     — the SOONEST one still ahead (not the oldest)
 *   3. finished     — the MOST RECENT one, when nothing is left to attend
 *
 * `enrolment_status` is checked as well as the training's own status: a learner
 * can be marked complete on a training that is still running for everyone else.
 */
function pickDefaultTraining(list) {
  if (!Array.isArray(list) || list.length === 0) return null;

  const isDone = (t) => t.enrolment_status === "completed" || t.status === "completed";
  const live = list.filter((t) => !isDone(t));

  const ongoing = live.find((t) => t.status === "ongoing");
  if (ongoing) return ongoing;

  // Soonest still ahead. Dates are wall-clock "YYYY-MM-DD", so they compare
  // lexicographically without going near a Date object (see lib/datetime).
  const today = new Date().toISOString().slice(0, 10);
  const ahead = live
    .filter((t) => t.start_date && t.start_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  if (ahead.length) return ahead[0];

  // Nothing ahead — fall back to whatever is left, most recent first, so a
  // learner with only past trainings still lands on the latest one.
  const byRecency = [...list].sort((a, b) =>
    String(b.start_date ?? "").localeCompare(String(a.start_date ?? ""))
  );
  return live[0] ?? byRecency[0];
}

/*
 * Match a list entry to the reference in the URL. The detail endpoint accepts
 * a uuid or a training code, so the URL carries the readable code
 * ("TRN-2026-0019") — but the ENROLMENT id only exists on the list row, which
 * is why the list is fetched even when the training is named outright.
 */
function findTraining(list, ref) {
  if (!ref) return null;
  const needle = String(ref).toLowerCase();
  return (list ?? []).find(
    (t) => String(t.code ?? "").toLowerCase() === needle || String(t.id ?? "").toLowerCase() === needle
  ) ?? null;
}

/**
 * The full detail for one training.
 *
 * `trainingRef` is the code or uuid from the URL. Without one — a bookmark of
 * the old single-training page — it falls back to picking the most relevant
 * training, so that link keeps working rather than 404ing.
 */
export function MyCoursesContent({ trainingRef: requestedRef = null }) {
  const { user, token } = useAuth();
  const [training, setTraining] = useState(null);
  const [enrolmentId, setEnrolmentId] = useState(null);
  const [trainingRef, setTrainingRef] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !user) return;

    setError(null);
    /* The list is fetched even when the URL names a training, for two reasons:
       it carries the enrolment id (which the detail response does not), and
       matching against it means a learner can only ever open a training they
       actually hold a seat on — the guard is the learner's own enrolments, not
       a value pasted into the address bar. */
    fetchMyTrainings({ token })
      .then((res) => {
        const list = res?.trainings || res || [];
        const match = requestedRef ? findTraining(list, requestedRef) : pickDefaultTraining(list);
        if (!match) {
          const e = new Error(
            requestedRef
              ? "That training isn't one of your enrolments"
              : "You are not enrolled in any training yet"
          );
          e.status = 403;
          throw e;
        }
        // The enrolment id lives on the list item, not on the training detail —
        // `match.id` is the training. Tolerate either spelling from the API.
        setEnrolmentId(match.enrolment_id ?? match.enrollment_id ?? null);
        setTrainingRef(match.id);
        return fetchTrainingDetail({ token, trainingRef: match.id });
      })
      .then((data) => setTraining(data))
      .catch((err) => setError(err));
  }, [token, user, requestedRef]);

  // 403 → not enrolled (or not a learner). Show the contact-admin state, not a
  // scary error — there is simply nothing the learner can see yet.
  if (error?.status === 403) {
    return <NotEnrolledState user={user} message={error.message} />;
  }

  if (error) {
    return (
      <Card className="p-6">
        <Text as="p" className="text-red-600">
          Failed to load training schedule: {error.message || String(error)}
        </Text>
      </Card>
    );
  }

  if (!training) {
    return <ScheduleSkeleton />;
  }

  return (
    <Box className="space-y-4">
      <ScheduleCard training={training} enrolmentId={enrolmentId} />
      <SessionTopics sessions={training.sessions} timezone={training.timezone} />
      {/* Course + session materials the admin/trainer has shared. */}
      <TrainingResources trainingRef={trainingRef} />
      {/* Instructions — only shown when the learner has a current enrolment. */}
      <TrainingGuidelines />
    </Box>
  );
}
