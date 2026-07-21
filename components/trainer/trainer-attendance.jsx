"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CalendarDays, Users, Inbox, AlertCircle, Check, Loader2, CheckCircle2, ChevronDown,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchMyTrainings,
  fetchTrainerTrainingSessions,
  fetchSessionAttendance,
  markSessionAttendance,
} from "@/services/api/trainer/trainer-api";

/* Per-session attendance states (API §3.8). `null` = unmarked. */
const ATT = {
  present: { label: "Present", short: "P", cell: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
  absent: { label: "Absent", short: "A", cell: "bg-rose-100 text-rose-700 ring-rose-200" },
  late: { label: "Late", short: "L", cell: "bg-amber-100 text-amber-700 ring-amber-200" },
  excused: { label: "Excused", short: "E", cell: "bg-sky-100 text-sky-700 ring-sky-200" },
};
const ATT_OPTIONS = ["present", "absent", "late", "excused"];
const UNMARKED_CELL = "bg-slate-50 text-slate-300 ring-slate-200";

const TRAINING_STATUS = {
  active: "bg-emerald-100 text-emerald-700",
  ongoing: "bg-violet-100 text-violet-700",
  scheduled: "bg-violet-100 text-violet-700",
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-slate-100 text-slate-600",
  cancelled: "bg-rose-100 text-rose-600",
};

function fmtDate(d) {
  if (!d) return "—";
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? "—" : x.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/* ── Training picker card ── */
function TrainingCard({ training, active, onClick }) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "cursor-pointer p-4 transition-all",
        active ? "ring-2 ring-violet-400 border-violet-300" : "hover:border-violet-200"
      )}
    >
      <Box className="flex items-center justify-between gap-2">
        <Text as="span" className="font-mono text-[11px] font-bold text-violet-600">{training.code}</Text>
        <Badge className={cn("border-0 text-[10px] font-semibold", TRAINING_STATUS[training.status] || "bg-slate-100 text-slate-600")}>
          {training.status}
        </Badge>
      </Box>
      <Text as="p" className="mt-1.5 line-clamp-2 text-sm font-semibold text-slate-800">{training.title}</Text>
      <Box className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
        <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {fmtDate(training.start_date)}</span>
        <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {training.enrolled_count ?? 0}</span>
      </Box>
    </Card>
  );
}

/* ── One attendance cell (dropdown picker) ── */
function AttendanceCell({ status, onSet }) {
  const cfg = status ? ATT[status] : null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "mx-auto flex h-8 w-9 items-center justify-center rounded-lg text-xs font-bold ring-1 outline-none transition-colors hover:brightness-95",
          cfg ? cfg.cell : UNMARKED_CELL
        )}
        title={cfg ? cfg.label : "Unmarked"}
      >
        {cfg ? cfg.short : "–"}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="min-w-[9rem]">
        {ATT_OPTIONS.map((opt) => (
          <DropdownMenuItem key={opt} onClick={() => onSet(opt)}>
            <span className={cn("mr-2 flex h-4 w-4 items-center justify-center rounded text-[10px] font-bold", ATT[opt].cell)}>
              {ATT[opt].short}
            </span>
            {ATT[opt].label}
            {status === opt && <Check className="ml-auto h-3.5 w-3.5 text-violet-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ── Attendance grid for the selected training ── */
function AttendanceGrid({ token, trainingRef }) {
  const [data, setData] = useState(null); // { sessions, participants }
  const [marks, setMarks] = useState({}); // { [sessionId]: { [participantId]: status } }
  const [dirty, setDirty] = useState(() => new Set());
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setData(null);
    setError(null);
    try {
      const detail = await fetchTrainerTrainingSessions({ token, trainingRef });
      const sessions = detail.sessions || [];
      // Pull each session's roster in parallel to seed the grid.
      const results = await Promise.all(
        sessions.map((s) =>
          fetchSessionAttendance({ token, sessionId: s.id })
            .then((r) => ({ sid: s.id, participants: r?.participants || [] }))
            .catch(() => ({ sid: s.id, participants: [] }))
        )
      );
      const seeded = {};
      for (const { sid, participants } of results) {
        seeded[sid] = {};
        participants.forEach((p) => { if (p.status) seeded[sid][p.participant_id] = p.status; });
      }
      setMarks(seeded);
      setDirty(new Set());
      setData({ sessions, participants: detail.participants || [] });
    } catch (e) {
      setError(e?.message || "Could not load attendance.");
    }
  }, [token, trainingRef]);

  useEffect(() => { load(); }, [load]);

  function setCell(sessionId, pid, status) {
    setMarks((m) => ({ ...m, [sessionId]: { ...(m[sessionId] || {}), [pid]: status } }));
    setDirty((d) => new Set(d).add(sessionId));
    setSaved(false);
  }

  function markAllPresent(sessionId) {
    setMarks((m) => {
      const next = { ...(m[sessionId] || {}) };
      (data?.participants || []).forEach((p) => { next[p.participant_id] = "present"; });
      return { ...m, [sessionId]: next };
    });
    setDirty((d) => new Set(d).add(sessionId));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const sessionsToSave = [...dirty];
      await Promise.all(
        sessionsToSave.map((sid) => {
          const records = Object.entries(marks[sid] || {})
            .filter(([, status]) => !!status)
            .map(([participant_id, status]) => ({ participant_id, status }));
          if (records.length === 0) return Promise.resolve();
          return markSessionAttendance({ token, sessionId: sid, records });
        })
      );
      setDirty(new Set());
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setError(e?.message || "Could not save attendance.");
    } finally {
      setSaving(false);
    }
  }

  if (error && !data) {
    return (
      <Card className="p-6">
        <Box className="flex items-center gap-2 text-rose-600">
          <AlertCircle className="h-4 w-4" />
          <Text as="p" className="text-sm">{error}</Text>
        </Box>
        <Button size="sm" variant="outline" className="mt-3" onClick={load}>Try again</Button>
      </Card>
    );
  }

  if (!data) {
    return (
      <Box className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-11 w-full rounded-lg" />)}
      </Box>
    );
  }

  const { sessions, participants } = data;

  if (participants.length === 0 || sessions.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <Inbox className="h-8 w-8 text-slate-300" />
        <Text as="p" className="text-sm text-slate-500">
          {participants.length === 0 ? "No participants enrolled yet." : "This training has no sessions yet."}
        </Text>
      </Card>
    );
  }

  const presentCount = (pid) =>
    sessions.reduce((n, s) => n + (marks[s.id]?.[pid] === "present" || marks[s.id]?.[pid] === "late" ? 1 : 0), 0);

  return (
    <Card className="p-0 overflow-hidden">
      {/* Toolbar */}
      <Box className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-3">
        <Box className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
          <Text as="span" className="font-semibold uppercase tracking-wide">Legend</Text>
          {ATT_OPTIONS.map((o) => (
            <span key={o} className="inline-flex items-center gap-1">
              <span className={cn("flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold", ATT[o].cell)}>{ATT[o].short}</span>
              {ATT[o].label}
            </span>
          ))}
        </Box>
        <Box className="flex items-center gap-2">
          {saved && (
            <Text as="span" className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
              <CheckCircle2 className="h-3.5 w-3.5" /> Saved
            </Text>
          )}
          {error && <Text as="span" className="text-xs text-rose-600">{error}</Text>}
          <Button
            size="sm"
            onClick={save}
            disabled={saving || dirty.size === 0}
            className="gap-1.5 bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {saving ? "Saving…" : `Save${dirty.size ? ` (${dirty.size})` : ""}`}
          </Button>
        </Box>
      </Box>

      {/* Matrix */}
      <Box className="overflow-x-auto">
        <Box as="table" className="w-full border-collapse text-sm">
          <Box as="thead">
            <Box as="tr" className="border-b border-slate-100">
              <Box as="th" className="sticky left-0 z-10 bg-white px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Participant
              </Box>
              {sessions.map((s) => (
                <Box as="th" key={s.id} className="px-2 py-3 text-center align-bottom">
                  <Text as="span" className="block text-[11px] font-semibold text-slate-700">Day {s.day_number}</Text>
                  <Text as="span" className="block text-[10px] text-slate-400">{fmtDate(s.start_time)}</Text>
                  <button
                    type="button"
                    onClick={() => markAllPresent(s.id)}
                    className="mt-1 inline-flex items-center gap-0.5 rounded px-1 text-[10px] font-medium text-violet-600 hover:underline"
                    title="Mark everyone present for this day"
                  >
                    all present
                  </button>
                </Box>
              ))}
              <Box as="th" className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Attended
              </Box>
            </Box>
          </Box>
          <Box as="tbody">
            {participants.map((p, i) => (
              <Box as="tr" key={p.participant_id} className={cn("border-b border-slate-50", i % 2 ? "bg-slate-50/40" : "bg-white")}>
                <Box as="td" className="sticky left-0 z-10 bg-inherit px-5 py-2.5">
                  <Text as="p" className="text-sm font-medium text-slate-800">{p.name}</Text>
                  {p.job_title && <Text as="span" className="text-[11px] text-slate-400">{p.job_title}</Text>}
                </Box>
                {sessions.map((s) => (
                  <Box as="td" key={s.id} className="px-2 py-2.5 text-center">
                    <AttendanceCell status={marks[s.id]?.[p.participant_id] ?? null} onSet={(st) => setCell(s.id, p.participant_id, st)} />
                  </Box>
                ))}
                <Box as="td" className="px-3 py-2.5 text-center">
                  <Text as="span" className="text-xs font-semibold text-slate-600">{presentCount(p.participant_id)}/{sessions.length}</Text>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Card>
  );
}

/* ═══════════════════════════════ Main ═══ */
export function TrainerAttendance() {
  const { token, user } = useAuth();
  const [trainings, setTrainings] = useState(null);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !user) return;
    fetchMyTrainings({ token })
      .then((d) => {
        const list = d.trainings || [];
        setTrainings(list);
        if (list.length) setSelected(list[0].id ?? list[0].code);
      })
      .catch((e) => setError(e?.message || "Could not load your trainings."));
  }, [token, user]);

  if (error) {
    return (
      <Card className="p-6">
        <Text as="p" className="text-sm text-rose-600">{error}</Text>
      </Card>
    );
  }

  if (!trainings) {
    return (
      <Box className="space-y-4">
        <Box className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </Box>
        <Skeleton className="h-64 w-full rounded-xl" />
      </Box>
    );
  }

  if (trainings.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <Inbox className="h-8 w-8 text-slate-300" />
        <Text as="p" className="text-sm text-slate-500">You have no assigned trainings yet.</Text>
      </Card>
    );
  }

  return (
    <Box className="space-y-4">
      <Box className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {trainings.map((t) => (
          <TrainingCard
            key={t.id ?? t.code}
            training={t}
            active={selected === (t.id ?? t.code)}
            onClick={() => setSelected(t.id ?? t.code)}
          />
        ))}
      </Box>
      {selected && <AttendanceGrid token={token} trainingRef={selected} />}
    </Box>
  );
}
