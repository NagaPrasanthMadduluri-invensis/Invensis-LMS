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
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchMyTrainings,
  fetchTrainerTrainingSessions,
  updateSessionTopics,
} from "@/services/api/trainer/trainer-api";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700" },
  active: { label: "Active", color: "bg-emerald-100 text-emerald-700" },
  ongoing: { label: "Ongoing", color: "bg-blue-100 text-blue-700" },
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", color: "bg-slate-100 text-slate-600" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-600" },
};

const PARTICIPANT_STATUS_CONFIG = {
  confirmed: { label: "Confirmed", color: "bg-emerald-100 text-emerald-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-600" },
  transferred: { label: "Transferred", color: "bg-slate-100 text-slate-600" },
};

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function formatDateTime(d) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true,
  });
}

/* ── Empty / pending states ── */
function PendingState({ what }) {
  return (
    <Card className="flex flex-col items-center justify-center px-6 py-14 text-center rounded-2xl border border-slate-200/80 shadow-sm">
      <Box className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100">
        <Hourglass className="h-7 w-7 text-violet-600" />
      </Box>
      <Text as="h2" className="mt-4 text-lg font-bold text-slate-800">Coming online soon</Text>
      <Text as="p" className="mt-1.5 max-w-md text-sm text-slate-500">
        {what} will appear here as soon as the trainer endpoint is live. Once it&apos;s
        ready, your admin-assigned trainings load automatically — no further setup needed.
      </Text>
    </Card>
  );
}

/* ── One day's session, with inline topic editing ── */
function SessionItem({ session, token, onSaved }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(session.planned_topics || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const statusCfg = STATUS_CONFIG[session.status] || STATUS_CONFIG.scheduled;
  const hasTopics = !!session.planned_topics?.trim();

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
    <Box className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-4">
      <Box className="flex items-center gap-2.5">
        <Box className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50">
          <CalendarDays className="h-4 w-4 text-violet-600" />
        </Box>
        <Box className="min-w-0 flex-1">
          <Text as="p" className="text-sm font-semibold leading-tight text-slate-800">Day {session.day_number}</Text>
          {session.start_time && (
            <Text as="span" className="text-[11px] text-slate-400">{formatDateTime(session.start_time)}</Text>
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
          {error && <Text as="p" className="text-xs text-red-600">{error}</Text>}
          <Box className="flex items-center gap-2">
            <Button size="sm" onClick={save} disabled={saving}
              className="h-8 px-4 bg-violet-600 hover:bg-violet-700 text-white border-0 rounded-lg text-xs font-semibold">
              <Check className="h-3.5 w-3.5 mr-1" /> {saving ? "Saving..." : "Save"}
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)} disabled={saving}
              className="h-8 px-3 text-slate-500 hover:text-slate-700 rounded-lg text-xs">
              <X className="h-3.5 w-3.5 mr-1" /> Cancel
            </Button>
          </Box>
        </Box>
      ) : (
        <Box className="mt-3">
          {hasTopics ? (
            <Text as="p" className="text-sm whitespace-pre-wrap text-slate-600">{session.planned_topics}</Text>
          ) : (
            <Box className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-200 px-2.5 py-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-slate-300" />
              <Text as="p" className="text-xs text-slate-400">Topics not added yet</Text>
            </Box>
          )}
          <Button size="sm" variant="outline" onClick={startEdit}
            className="mt-2 h-8 px-3 border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-600 rounded-lg text-xs">
            <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
          </Button>
        </Box>
      )}
    </Box>
  );
}

/* ── Sessions panel for the selected training ── */
function SessionsPanel({ trainingRef, token }) {
  const [data, setData] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

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
      <Card className="p-5 border-red-100 bg-red-50">
        <Text as="p" className="text-sm text-red-600">Failed to load sessions: {error}</Text>
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

  return (
    <Box className="space-y-5">
      <Card className="p-0 overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm">
        <Box className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
          <Box className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
            <BookText className="h-4 w-4 text-violet-500" />
          </Box>
          <Text as="h3" className="text-sm font-bold text-slate-800">Day-wise Topics</Text>
          <Badge className="border-0 bg-violet-50 text-violet-600 text-[11px] font-semibold">
            {sessions.length} day{sessions.length !== 1 ? "s" : ""}
          </Badge>
        </Box>
        <Box className="p-5">
          {sessions.length === 0 ? (
            <Box className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
              <Box className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <BookText className="h-5 w-5 text-slate-400" />
              </Box>
              <Text as="p" className="text-sm font-medium text-slate-500">This training has no sessions.</Text>
            </Box>
          ) : (
            <Box className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 items-start">
              {sessions.map((s) => (
                <SessionItem key={s.id ?? s.day_number} session={s} token={token} onSaved={onSaved} />
              ))}
            </Box>
          )}
        </Box>
      </Card>

      <Card className="p-0 overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm">
        <Box className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
          <Box className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
            <Users className="h-4 w-4 text-violet-500" />
          </Box>
          <Text as="h3" className="text-sm font-bold text-slate-800">Participants</Text>
          <Badge className="border-0 bg-violet-50 text-violet-600 text-[11px] font-semibold">
            {participants.length} enrolled
          </Badge>
        </Box>
        <Box className="p-5">
          {participants.length === 0 ? (
            <Box className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
              <Box className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Users className="h-5 w-5 text-slate-400" />
              </Box>
              <Text as="p" className="text-sm font-medium text-slate-500">No participants enrolled yet.</Text>
            </Box>
          ) : (
            <Box className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-100">
                    <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide py-3">Name</TableHead>
                    <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide py-3">
                      <Box className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> Job Title</Box>
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide py-3">Status</TableHead>
                    <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide py-3">Enrolled</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {participants.map((p) => {
                    const cfg = PARTICIPANT_STATUS_CONFIG[p.status] || PARTICIPANT_STATUS_CONFIG.confirmed;
                    return (
                      <TableRow key={p.enrolment_id} className="hover:bg-slate-50/70 transition-colors border-b border-slate-100/80 last:border-0">
                        <TableCell className="py-3.5 font-semibold text-slate-800 text-sm">{p.name}</TableCell>
                        <TableCell className="py-3.5 text-slate-500 text-sm">{p.job_title || "—"}</TableCell>
                        <TableCell className="py-3.5">
                          <Badge className={`border-0 text-[10px] font-medium ${cfg.color}`}>{cfg.label}</Badge>
                        </TableCell>
                        <TableCell className="py-3.5 text-slate-500 text-sm">{formatDate(p.enrolled_at)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  );
}

/* ── Training picker card ── */
function TrainingCard({ training, active, onClick }) {
  const statusCfg = STATUS_CONFIG[training.status] || STATUS_CONFIG.active;
  return (
    <Card
      onClick={onClick}
      className={`p-0 overflow-hidden cursor-pointer rounded-2xl border shadow-sm transition-all ${active ? "border-slate-300 shadow-md" : "border-slate-200/80 hover:shadow-md hover:border-slate-300"}`}
    >
      <Box className="flex items-center justify-between bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 border-b border-violet-100 px-4 py-2.5">
        <Box className="flex items-center gap-1.5">
          <Hash className="h-3.5 w-3.5 text-violet-400" />
          <Text as="span" className="text-xs font-semibold tracking-wide text-violet-700">{training.code}</Text>
        </Box>
        <Badge className={`text-[10px] border-0 ${statusCfg.color}`}>{statusCfg.label}</Badge>
      </Box>
      <Box className="p-4 space-y-2.5">
        <Text as="h3" className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{training.title}</Text>
        <Box className="flex items-center gap-3 text-[11px] text-slate-500">
          <Box className="flex items-center gap-1.5">
            <CalendarDays className="h-3 w-3 text-slate-400" />
            {formatDate(training.start_date)}
          </Box>
          {training.enrolled_count != null && (
            <Box className="flex items-center gap-1.5">
              <Clock className="h-3 w-3 text-slate-400" />
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
  const [selected, setSelected] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !user) return;
    fetchMyTrainings({ token })
      .then((d) => {
        const list = d.trainings || [];
        setTrainings(list);
        if (list.length) setSelected(list[0].id ?? list[0].code);
      })
      .catch((e) => (e?.pending ? setPending(true) : setError(e.message)));
  }, [token, user]);

  if (pending) return <PendingState what="The trainings your admin assigns to you" />;

  if (error) {
    return (
      <Card className="p-6 border-red-100 bg-red-50">
        <Text as="p" className="text-sm text-red-600">Failed to load your trainings: {error}</Text>
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
        <Box className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
          <Inbox className="h-7 w-7 text-slate-500" />
        </Box>
        <Text as="h2" className="mt-4 text-lg font-bold text-slate-800">No assigned trainings</Text>
        <Text as="p" className="mt-1.5 max-w-md text-sm text-slate-500">
          When an admin assigns you to a training, it will show up here and you can set its day-wise topics.
        </Text>
      </Card>
    );
  }

  return (
    <Box className="space-y-5">
      <Box>
        <Text as="h3" className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-3">
          Assigned Trainings
        </Text>
        <Box className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {trainings.map((t) => {
            const ref = t.id ?? t.code;
            return (
              <TrainingCard key={ref} training={t} active={selected === ref} onClick={() => setSelected(ref)} />
            );
          })}
        </Box>
      </Box>

      {selected && <SessionsPanel trainingRef={selected} token={token} />}
    </Box>
  );
}
