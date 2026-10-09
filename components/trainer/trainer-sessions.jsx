"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  CalendarDays,
  Clock,
  Hash,
  Pencil,
  Check,
  X,
  BookText,
  Inbox,
  Hourglass,
  AlertCircle,
  Users,
  Briefcase,
  Video,
  Factory,
  Network,
  GraduationCap,
  Globe,
  ArrowLeft,
  ClipboardCheck,
} from "lucide-react";
import Link from "next/link";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { AttendanceGrid } from "@/components/trainer/trainer-attendance";
import { buildConvertedRows, ZONE_OPTIONS } from "@/components/shared/timezone-converter";
import { Combobox } from "@/components/ui/combobox";
import { SessionDates, sessionDatesOf } from "@/components/shared/session-dates";
import { useTrainingFilters, statusBadge } from "@/components/shared/training-filters";
import { formatDate as fmtDate, formatDateTime as fmtDateTime, formatTime as fmtTime, timezoneLabel } from "@/lib/datetime";
import {
  fetchMyTrainings,
  fetchTrainerTrainingSessions,
  updateSessionTopics,
} from "@/services/api/trainer/trainer-api";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-warning-subtle text-warning-subtle-foreground" },
  active: { label: "Active", color: "bg-success-subtle text-success-subtle-foreground" },
  ongoing: { label: "Ongoing", color: "bg-info-subtle text-info-subtle-foreground" },
  scheduled: { label: "Scheduled", color: "bg-info-subtle text-info-subtle-foreground" },
  completed: { label: "Completed", color: "bg-surface-muted text-foreground-muted" },
  cancelled: { label: "Cancelled", color: "bg-error-subtle text-error" },
  postponed: { label: "Postponed", color: "bg-warning-subtle text-warning-subtle-foreground" },
  suspended: { label: "Suspended", color: "bg-error-subtle text-error-subtle-foreground" },
};

const PLATFORM_LABEL = { zoom: "Zoom", teams: "Microsoft Teams", other: "Meeting" };

// Scheduled dates print exactly as sent. See `lib/datetime`.
const formatDate = (d) => fmtDate(d);
const formatTime = (t) => fmtTime(t);
// The session's own wall clock plus the zone it belongs to — identical text
// for a trainer in any country. The converter below turns it into their zone.
function formatDateTime(d, tz) {
  const when = fmtDateTime(d, { year: undefined });
  const zone = timezoneLabel(tz, d);
  return zone && when !== "—" ? `${when} ${zone}` : when;
}

// Roster cells: profile attributes are optional on the API, so render an em dash
// rather than "undefined" when the learner hasn't shared one.
function blank(v) {
  return v === null || v === undefined || v === "" ? "—" : v;
}
function formatExperience(years) {
  if (years === null || years === undefined || years === "") return "—";
  const n = Number(years);
  if (!Number.isFinite(n)) return String(years);
  if (n < 1) return "< 1 yr";
  return `${n} yr${n === 1 ? "" : "s"}`;
}

/* ── Empty / pending states ── */
function PendingState({ what }) {
  return (
    <Card className="flex flex-col items-center justify-center px-6 py-14 text-center rounded-2xl border border-slate-200/80 shadow-sm">
      <Box className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-subtle">
        <Hourglass className="h-7 w-7 text-primary" />
      </Box>
      <Text as="h2" className="mt-4 text-lg font-bold text-foreground">Coming online soon</Text>
      <Text as="p" className="mt-1.5 max-w-md text-sm text-foreground-muted">
        {what} will appear here as soon as the trainer endpoint is live. Once it&apos;s
        ready, your admin-assigned trainings load automatically — no further setup needed.
      </Text>
    </Card>
  );
}

/* ── One day's session, with inline topic editing ── */
function SessionItem({ session, token, onSaved, timezone, when }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(session.planned_topics || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const statusCfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.scheduled;
  const hasTopics = !!session.planned_topics?.trim();
  // `when` is the converted date/time when a target timezone is selected on the
  // panel; otherwise fall back to the session's own wall clock plus its zone.
  const whenLabel = when ?? (session.start_time ? formatDateTime(session.start_time, timezone) : null);

  function startEdit() {
    setValue(session.planned_topics || "");
    setError(null);
    setEditing(true);
  }

  async function save() {
    if (!value.trim()) { setError("Topics can't be empty."); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await updateSessionTopics({ token, sessionId: session.id, plannedTopics: value.trim() });
      setEditing(false);
      onSaved(session.id, res?.session?.planned_topics ?? value.trim());
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Box className="flex h-full flex-col rounded-xl border border-slate-200/70 bg-slate-50/60 p-4">
      <Box className="flex items-center gap-2.5">
        <Box className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-subtle">
          <CalendarDays className="h-4 w-4 text-primary" />
        </Box>
        <Box className="min-w-0 flex-1">
          <Text as="p" className="text-sm font-semibold leading-tight text-foreground">Day {session.day_number}</Text>
          {whenLabel && (
            <Text as="span" className="text-[11px] text-foreground-subtle">{whenLabel}</Text>
          )}
        </Box>
        <Badge className={`border-0 text-[10px] shrink-0 ${statusCfg.color}`}>{statusCfg.label}</Badge>
      </Box>

      {editing ? (
        <Box className="mt-3 space-y-2">
          <Textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            rows={3}
            placeholder="e.g. Intro to PMP, framework, process groups"
            className="text-sm"
          />
          {error && <Text as="p" className="text-xs text-error">{error}</Text>}
          <Box className="flex items-center gap-2">
            <Button size="sm" onClick={save} disabled={saving}
              className="h-8 px-4 bg-primary hover:bg-primary-hover text-primary-foreground border-0 rounded-lg text-xs font-semibold">
              <Check className="h-3.5 w-3.5 mr-1" /> {saving ? "Saving..." : "Save"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}
              className="h-8 px-3 text-foreground-muted hover:text-foreground rounded-lg text-xs">
              <X className="h-3.5 w-3.5 mr-1" /> Cancel
            </Button>
          </Box>
        </Box>
      ) : (
        <Box className="mt-3 flex flex-1 flex-col justify-between gap-2">
          {hasTopics ? (
            <Text as="p" className="text-sm whitespace-pre-wrap text-foreground-muted">{session.planned_topics}</Text>
          ) : (
            <Box className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-2.5 py-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-foreground-subtle" />
              <Text as="p" className="text-xs text-foreground-subtle">Topics not added yet</Text>
            </Box>
          )}
          <Button size="sm" variant="outline" onClick={startEdit}
            className="self-start h-8 px-3 border-border text-foreground-muted hover:border-primary-border hover:text-primary rounded-lg text-xs">
            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
        </Box>
      )}
    </Box>
  );
}

/* ── Full single-page view for one training (details + topics + attendance) ── */
export function SessionsPanel({ trainingRef, token }) {
  const [data, setData] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);
  // Chosen display timezone — empty means "the training's own zone" (no conversion).
  const [viewTz, setViewTz] = useState("");

  const load = useCallback(() => {
    setData(null); setPending(false); setError(null);
    fetchTrainerTrainingSessions({ token, trainingRef })
      .then(setData)
      .catch((e) => (e?.pending ? setPending(true) : setError(e.message)));
  }, [token, trainingRef]);

  useEffect(() => { load(); }, [load]);

  function onSaved(sessionId, planned_topics) {
    setData((d) => ({
      ...d,
      sessions: (d.sessions || []).map((s) => (s.id === sessionId ? { ...s, planned_topics } : s)),
    }));
  }

  if (pending) return <PendingState what="The sessions for your assigned trainings" />;
  if (error) {
    return (
      <Card className="p-5 border-error-border bg-error-subtle">
        <Text as="p" className="text-sm text-error">Failed to load sessions: {error}</Text>
      </Card>
    );
  }
  if (!data) {
    return (
      <Box className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
      </Box>
    );
  }

  const sessions = data.sessions || [];
  const participants = data.participants || [];
  const sessionDays = sessionDatesOf(data);

  // Page-wide timezone conversion — re-anchor each session's wall clock into the
  // chosen zone. Empty/same zone leaves every date & time exactly as stored.
  const sourceTz = data.timezone || "";
  const tzConv = buildConvertedRows(sessions, sourceTz, data.country_code, viewTz || sourceTz);
  const converting = !!viewTz && !!sourceTz && viewTz !== sourceTz && tzConv.rows.length > 0;
  const tzRowByDay = converting ? Object.fromEntries(tzConv.rows.map((r) => [r.day, r])) : {};
  const tzAbbr = converting ? (tzConv.rows[0]?.abbr || "") : "";
  const convertedDates = converting ? tzConv.rows.map((r) => r.date) : [];

  const statusCfg = STATUS_CONFIG[data.status] || STATUS_CONFIG.active;
  const modeLabel = { virtual: "Live Virtual", in_person: "In Person", hybrid: "Hybrid", one_to_one: "One-to-One" }[data.delivery_mode] || data.delivery_mode;

  return (
    <Box className="space-y-5">
      {/* View session dates & times in any timezone (defaults to the training's own). */}
      <Box className="flex items-center justify-end gap-2">
        <Globe className="h-4 w-4 text-foreground-subtle" />
        <Text as="span" className="text-xs text-foreground-muted">Show session dates &amp; times in</Text>
        <Box className="w-[280px]">
          <Combobox
            value={viewTz}
            onChange={(z) => z && setViewTz(z)}
            options={ZONE_OPTIONS}
            placeholder="Select a timezone"
            searchPlaceholder="Search country or city..."
            emptyText="No timezone found."
          />
        </Box>
      </Box>

      {/* Training header */}
      <Card className="p-0 overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm">
        <Box className="bg-[#d7e3fc] border-b border-primary-border px-6 py-5">
          <Box className="flex flex-wrap items-center gap-2 mb-2">
            <Hash className="h-4 w-4 text-primary" />
            <Text as="span" className="text-sm font-mono font-semibold tracking-wide text-primary">{data.training_id}</Text>
            <Badge className={`border-0 text-[10px] font-semibold ${statusCfg.color}`}>{statusCfg.label}</Badge>
            {modeLabel && <Badge className="border-0 bg-white/70 text-foreground-muted text-[10px] font-medium ring-1 ring-border">{modeLabel}</Badge>}
          </Box>
          <Text as="h2" className="text-xl font-bold text-foreground leading-tight">{data.title}</Text>
        </Box>
      </Card>

      {/* Schedule — the training's date range plus the exact days it runs on */}
      <Card className="p-0 overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm">
        <Box className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 border-b border-border">
          <Box className="flex items-center gap-2.5">
            <Box className="w-8 h-8 rounded-lg bg-primary-subtle flex items-center justify-center">
              <CalendarDays className="h-4 w-4 text-primary" />
            </Box>
            <Box>
              <Text as="p" className="text-[10px] uppercase tracking-wider text-foreground-subtle font-semibold">Dates</Text>
              <Text as="p" className="text-sm font-semibold text-foreground leading-tight mt-0.5">
                {converting && convertedDates.length
                  ? `${convertedDates[0]} – ${convertedDates[convertedDates.length - 1]}`
                  : `${formatDate(data.start_date)} – ${formatDate(data.end_date)}`}
              </Text>
            </Box>
          </Box>
          {(data.start_time || data.end_time || converting) && (
            <Box className="flex items-center gap-2.5">
              <Box className="w-8 h-8 rounded-lg bg-primary-subtle flex items-center justify-center">
                <Clock className="h-4 w-4 text-primary" />
              </Box>
              <Box>
                <Text as="p" className="text-[10px] uppercase tracking-wider text-foreground-subtle font-semibold">Daily Timing</Text>
                <Text as="p" className="text-sm font-semibold text-foreground leading-tight mt-0.5">
                  {converting
                    ? `${tzConv.rows[0].start} – ${tzConv.rows[0].end || ""} ${tzAbbr}`
                    : `${formatTime(data.start_time)} – ${formatTime(data.end_time)}${
                        timezoneLabel(data.timezone, data.start_date) ? ` ${timezoneLabel(data.timezone, data.start_date)}` : ""
                      }`}
                </Text>
              </Box>
            </Box>
          )}
          {data.timezone && (
            <Box className="flex items-center gap-2.5">
              <Box className="w-8 h-8 rounded-lg bg-primary-subtle flex items-center justify-center">
                <Globe className="h-4 w-4 text-primary" />
              </Box>
              <Box>
                <Text as="p" className="text-[10px] uppercase tracking-wider text-foreground-subtle font-semibold">Timezone</Text>
                <Text as="p" className="text-sm font-semibold text-foreground leading-tight mt-0.5">{data.timezone}</Text>
              </Box>
            </Box>
          )}
        </Box>
        {sessionDays.length > 0 && (
          <Box className="px-5 py-4">
            {converting ? (
              <Box>
                <Box className="flex items-center gap-1.5 mb-2.5">
                  <CalendarDays className="h-3.5 w-3.5 text-foreground-subtle" />
                  <Text as="span" className="text-[11px] uppercase tracking-wide text-foreground-subtle">
                    {tzConv.rows.length} Session{tzConv.rows.length !== 1 ? "s" : ""} · {viewTz}
                  </Text>
                </Box>
                <Box className="flex flex-wrap gap-2">
                  {tzConv.rows.map((r) => (
                    <Text as="span" key={r.day} className="rounded-lg border border-primary-border bg-primary-subtle text-primary px-2.5 py-1 text-xs font-medium">
                      Day {r.day} · {r.date} · {r.start}{r.end ? `–${r.end}` : ""}
                    </Text>
                  ))}
                </Box>
              </Box>
            ) : (
              <SessionDates dates={sessionDays} />
            )}
          </Box>
        )}
      </Card>

      {/* Meeting link — visible to the assigned trainer once the admin releases it,
          the same link enrolled learners see. */}
      {data.meeting?.url ? (
        <Card className="p-0 overflow-hidden rounded-2xl border border-success-border shadow-sm">
          <Box className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <Box className="flex items-center gap-2.5 min-w-0">
              <Box className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success-subtle">
                <Video className="h-4 w-4 text-success" />
              </Box>
              <Box className="min-w-0">
                <Text as="p" className="text-sm font-semibold text-foreground leading-tight">Meeting link is live</Text>
                <Text as="span" className="text-[11px] text-foreground-muted">{PLATFORM_LABEL[data.meeting.platform] || "Meeting"}</Text>
              </Box>
            </Box>
            <Button
              render={<a href={data.meeting.url} target="_blank" rel="noopener noreferrer" />}
              size="sm"
              className="h-9 px-4 bg-success hover:bg-success text-success-foreground border-0 rounded-lg text-sm font-semibold shrink-0"
            >
              Join Meeting
            </Button>
          </Box>
        </Card>
      ) : data.delivery_mode !== "in_person" ? (
        <Card className="p-0 overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm">
          <Box className="flex items-center gap-2.5 px-5 py-4">
            <AlertCircle className="h-4 w-4 shrink-0 text-primary" />
            <Text as="p" className="text-xs text-foreground-muted">
              Meeting link hasn&apos;t been released by the admin yet — check back closer to the training date.
            </Text>
          </Box>
        </Card>
      ) : null}

      <Card className="p-0 overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm">
        <Box className="px-5 py-4 border-b border-border flex items-center gap-2.5">
          <Box className="w-8 h-8 rounded-lg bg-primary-subtle flex items-center justify-center">
            <BookText className="h-4 w-4 text-primary" />
          </Box>
          <Text as="h3" className="text-sm font-bold text-foreground">Day-wise Topics</Text>
          <Badge className="border-0 bg-primary-subtle text-primary text-[11px] font-semibold">
            {sessions.length} day{sessions.length !== 1 ? "s" : ""}
          </Badge>
        </Box>
        <Box className="p-5">
          {sessions.length === 0 ? (
            <Box className="rounded-xl border border-dashed border-border py-10 text-center">
              <Box className="w-10 h-10 rounded-xl bg-surface-muted flex items-center justify-center mx-auto mb-3">
                <BookText className="h-5 w-5 text-foreground-subtle" />
              </Box>
              <Text as="p" className="text-sm font-medium text-foreground-muted">This training has no sessions.</Text>
            </Box>
          ) : (
            <Box className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {sessions.map((s) => {
                const conv = converting ? tzRowByDay[s.day_number] : null;
                const when = conv
                  ? `${conv.date} · ${conv.start}${conv.end ? ` – ${conv.end}` : ""} ${conv.abbr}`
                  : null;
                return (
                  <SessionItem key={s.id ?? s.day_number} session={s} token={token} onSaved={onSaved} timezone={data.timezone} when={when} />
                );
              })}
            </Box>
          )}
        </Box>
      </Card>

      <Card className="p-0 overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm">
        <Box className="px-5 py-4 border-b border-border flex items-center gap-2.5">
          <Box className="w-8 h-8 rounded-lg bg-primary-subtle flex items-center justify-center">
            <Users className="h-4 w-4 text-primary" />
          </Box>
          <Text as="h3" className="text-sm font-bold text-foreground">Participants</Text>
          <Badge className="border-0 bg-primary-subtle text-primary text-[11px] font-semibold">
            {participants.length} enrolled
          </Badge>
        </Box>
        <Box className="p-5">
          {participants.length === 0 ? (
            <Box className="rounded-xl border border-dashed border-border py-10 text-center">
              <Box className="w-10 h-10 rounded-xl bg-surface-muted flex items-center justify-center mx-auto mb-3">
                <Users className="h-5 w-5 text-foreground-subtle" />
              </Box>
              <Text as="p" className="text-sm font-medium text-foreground-muted">No participants enrolled yet.</Text>
            </Box>
          ) : (
            <Box className="overflow-x-auto">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-border">
                    <TableHead className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wide py-3">Learner</TableHead>
                    <TableHead className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wide py-3">
                      <Box className="flex items-center gap-1"><Factory className="h-3 w-3" /> Industry</Box>
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wide py-3">
                      <Box className="flex items-center gap-1"><Network className="h-3 w-3" /> Department</Box>
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wide py-3">
                      <Box className="flex items-center gap-1"><GraduationCap className="h-3 w-3" /> Experience</Box>
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-foreground-muted uppercase tracking-wide py-3">
                      <Box className="flex items-center gap-1"><Globe className="h-3 w-3" /> Country</Box>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((p) => (
                    <TableRow key={p.enrolment_id} className="hover:bg-slate-50/70 transition-colors border-b border-slate-100/80 last:border-0">
                      <TableCell className="py-3.5 align-top">
                        <Text as="p" className="font-semibold text-foreground text-sm leading-tight">{p.name}</Text>
                        <Box className="flex items-center gap-1 mt-0.5">
                          <Briefcase className="h-3 w-3 shrink-0 text-foreground-subtle" />
                          <Text as="span" className="text-[11px] text-foreground-subtle">{p.job_title || "Job title not shared"}</Text>
                        </Box>
                      </TableCell>
                      <TableCell className="py-3.5 align-top text-foreground-muted text-sm">{blank(p.industry)}</TableCell>
                      <TableCell className="py-3.5 align-top text-foreground-muted text-sm">{blank(p.department)}</TableCell>
                      <TableCell className="py-3.5 align-top text-foreground-muted text-sm">{formatExperience(p.experience_years)}</TableCell>
                      <TableCell className="py-3.5 align-top text-foreground-muted text-sm">{blank(p.country)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Box>
      </Card>

      {/* Attendance — mark participants per session, saved on this page (no separate tab) */}
      <Box className="space-y-2.5">
        <Box className="flex items-center gap-2.5">
          <Box className="w-8 h-8 rounded-lg bg-primary-subtle flex items-center justify-center">
            <ClipboardCheck className="h-4 w-4 text-primary" />
          </Box>
          <Text as="h3" className="text-sm font-bold text-foreground">Attendance</Text>
        </Box>
        <AttendanceGrid token={token} trainingRef={trainingRef} />
      </Box>
    </Box>
  );
}

/* ── Training picker card ── */
function TrainingCard({ training, active, onClick }) {
  const statusCfg = statusBadge(training);
  return (
    <Card
      onClick={onClick}
      className={`p-0 overflow-hidden cursor-pointer rounded-2xl border shadow-sm transition-all ${active ? "border-border-strong shadow-md" : "border-slate-200/80 hover:shadow-md hover:border-border-strong"}`}
    >
      <Box className="flex items-center justify-between bg-[#d7e3fc] border-b border-primary-border px-4 py-2.5">
        <Box className="flex items-center gap-1.5">
          <Hash className="h-3.5 w-3.5 text-primary" />
          <Text as="span" className="text-xs font-semibold tracking-wide text-primary">{training.code}</Text>
        </Box>
        <Badge className={`text-[10px] border-0 ${statusCfg.badge}`}>{statusCfg.label}</Badge>
      </Box>
      <Box className="p-4 space-y-2.5">
        <Text as="h3" className="text-sm font-bold text-foreground leading-snug line-clamp-2">{training.title}</Text>
        <Box className="flex items-center gap-3 text-[11px] text-foreground-muted">
          <Box className="flex items-center gap-1.5">
            <CalendarDays className="h-3 w-3 text-foreground-subtle" />
            {formatDate(training.start_date)}
          </Box>
          {training.enrolled_count != null && (
            <Box className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-foreground-subtle" />
              {training.enrolled_count} enrolled
            </Box>
          )}
        </Box>
      </Box>
    </Card>
  );
}

export function TrainerSessions() {
  const { token, user } = useAuth();
  const [trainings, setTrainings] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !user) return;
    fetchMyTrainings({ token })
      .then((d) => setTrainings(d.trainings || []))
      .catch((e) => (e?.pending ? setPending(true) : setError(e.message)));
  }, [token, user]);

  // Called unconditionally (before any early return) to satisfy the Rules of Hooks.
  const { filtered, bar } = useTrainingFilters(trainings || [], {
    initialStatus: "all",
    searchPlaceholder: "Search by training ID, event code or title...",
    // "Due for update" prompts an admin-only status change — a trainer can't act
    // on it, so the chip is hidden here.
    showDue: false,
  });

  if (pending) return <PendingState what="The trainings your admin assigns to you" />;

  if (error) {
    return (
      <Card className="p-6 border-error-border bg-error-subtle">
        <Text as="p" className="text-sm text-error">Failed to load your trainings: {error}</Text>
      </Card>
    );
  }

  if (!trainings) {
    return (
      <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
      </Box>
    );
  }

  if (trainings.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center px-6 py-14 text-center rounded-2xl border border-slate-200/80 shadow-sm">
        <Box className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-muted">
          <Inbox className="h-7 w-7 text-foreground-muted" />
        </Box>
        <Text as="h2" className="mt-4 text-lg font-bold text-foreground">No assigned trainings</Text>
        <Text as="p" className="mt-1.5 max-w-md text-sm text-foreground-muted">
          When an admin assigns you to a training, it will show up here and you can set its day-wise topics.
        </Text>
      </Card>
    );
  }

  return (
    <Box className="space-y-5">
      {bar}
      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center justify-center px-6 py-14 text-center rounded-2xl border border-slate-200/80 shadow-sm">
          <Box className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-muted">
            <Inbox className="h-7 w-7 text-foreground-muted" />
          </Box>
          <Text as="p" className="mt-4 text-sm font-semibold text-foreground-muted">No trainings match your filters</Text>
        </Card>
      ) : (
        <Box className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((t) => {
            const ref = t.id ?? t.code;
            return (
              <Link key={ref} href={`/trainer/sessions/${ref}`} className="block">
                <TrainingCard training={t} />
              </Link>
            );
          })}
        </Box>
      )}
    </Box>
  );
}

/* ── Single training view (opened from the Sessions list) ── */
export function TrainerTrainingView({ trainingRef }) {
  const { token } = useAuth();

  return (
    <Box className="space-y-5">
      <Link
        href="/trainer/sessions"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back to trainings
      </Link>
      {token ? (
        <SessionsPanel trainingRef={trainingRef} token={token} />
      ) : (
        <Box className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)}
        </Box>
      )}
    </Box>
  );
}
