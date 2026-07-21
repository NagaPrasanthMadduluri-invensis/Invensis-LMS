"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCheck, Download, AlertCircle, Inbox, Loader2 } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { fetchTrainingAttendance, downloadTrainingAttendanceCsv } from "@/services/api/admin/admin-api";

/* Per-session cell states. `null` = unmarked. */
const CELL = {
  present: { short: "P", cls: "bg-emerald-100 text-emerald-700 ring-emerald-200" },
  absent: { short: "A", cls: "bg-rose-100 text-rose-700 ring-rose-200" },
  late: { short: "L", cls: "bg-amber-100 text-amber-700 ring-amber-200" },
  excused: { short: "E", cls: "bg-sky-100 text-sky-700 ring-sky-200" },
};
const UNMARKED = "bg-slate-50 text-slate-300 ring-slate-200";

/* Rolled-up overall status per participant. */
const OVERALL = {
  present: "bg-emerald-100 text-emerald-700",
  partial: "bg-amber-100 text-amber-700",
  absent: "bg-rose-100 text-rose-600",
};

function fmtDate(d) {
  if (!d) return "—";
  const x = new Date(d);
  return Number.isNaN(x.getTime()) ? "—" : x.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function TrainingAttendance({ trainingRef }) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [dlError, setDlError] = useState(null);

  const load = useCallback(async () => {
    if (!token || !trainingRef) return;
    setData(null);
    setError(null);
    try {
      const res = await fetchTrainingAttendance({ token, trainingRef });
      setData(res);
    } catch (e) {
      setError(e?.message || "Could not load attendance.");
    }
  }, [token, trainingRef]);

  useEffect(() => { load(); }, [load]);

  async function handleDownload() {
    setDownloading(true);
    setDlError(null);
    try {
      const res = await downloadTrainingAttendanceCsv({ token, trainingRef });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attendance-${data?.training_id || trainingRef}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setDlError(e?.message || "Could not download the CSV.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <Card className="p-0 overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm">
      <Box className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <Box className="flex items-center gap-2">
          <ClipboardCheck className="h-4 w-4 text-slate-400" />
          <Text as="h3" className="text-sm font-semibold text-slate-800">Attendance</Text>
        </Box>
        <Box className="flex items-center gap-2">
          {dlError && <Text as="span" className="text-xs text-rose-600">{dlError}</Text>}
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            disabled={downloading || !data || (data.participants?.length ?? 0) === 0}
            className="gap-1.5 border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            Download CSV
          </Button>
        </Box>
      </Box>

      <Box className="p-5">
        {error ? (
          <Box className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <Text as="p" className="text-sm">{error}</Text>
            <Button size="sm" variant="outline" className="ml-auto" onClick={load}>Retry</Button>
          </Box>
        ) : !data ? (
          <Box className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-11 w-full rounded-lg" />)}
          </Box>
        ) : (data.participants?.length ?? 0) === 0 || (data.sessions?.length ?? 0) === 0 ? (
          <Box className="flex flex-col items-center justify-center gap-2 py-10 text-center">
            <Inbox className="h-8 w-8 text-slate-300" />
            <Text as="p" className="text-sm text-slate-500">
              {(data.participants?.length ?? 0) === 0 ? "No participants enrolled." : "No sessions scheduled yet."}
            </Text>
          </Box>
        ) : (
          <>
            {/* Legend */}
            <Box className="mb-3 flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
              {Object.entries(CELL).map(([k, v]) => (
                <span key={k} className="inline-flex items-center gap-1">
                  <span className={cn("flex h-4 w-4 items-center justify-center rounded text-[9px] font-bold ring-1", v.cls)}>{v.short}</span>
                  <span className="capitalize">{k}</span>
                </span>
              ))}
            </Box>

            <Box className="overflow-x-auto">
              <Box as="table" className="w-full border-collapse text-sm">
                <Box as="thead">
                  <Box as="tr" className="border-b border-slate-100">
                    <Box as="th" className="sticky left-0 z-10 bg-white px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">Participant</Box>
                    {data.sessions.map((s) => (
                      <Box as="th" key={s.id} className="px-2 py-3 text-center">
                        <Text as="span" className="block text-[11px] font-semibold text-slate-700">Day {s.day_number}</Text>
                        <Text as="span" className="block text-[10px] text-slate-400">{fmtDate(s.start_time)}</Text>
                      </Box>
                    ))}
                    <Box as="th" className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">Overall</Box>
                    <Box as="th" className="px-3 py-3 text-center text-[11px] font-semibold uppercase tracking-wide text-slate-500">Attended</Box>
                  </Box>
                </Box>
                <Box as="tbody">
                  {data.participants.map((p, i) => (
                    <Box as="tr" key={p.participant_id} className={cn("border-b border-slate-50", i % 2 ? "bg-slate-50/40" : "bg-white")}>
                      <Box as="td" className="sticky left-0 z-10 bg-inherit px-4 py-2.5">
                        <Text as="p" className="text-sm font-medium text-slate-800">{p.name}</Text>
                        {p.email && <Text as="span" className="text-[11px] text-slate-400">{p.email}</Text>}
                      </Box>
                      {data.sessions.map((s) => {
                        const st = p.attendance?.[s.id] ?? null;
                        const cfg = st ? CELL[st] : null;
                        return (
                          <Box as="td" key={s.id} className="px-2 py-2.5 text-center">
                            <span
                              className={cn("mx-auto flex h-8 w-9 items-center justify-center rounded-lg text-xs font-bold ring-1", cfg ? cfg.cls : UNMARKED)}
                              title={st || "Unmarked"}
                            >
                              {cfg ? cfg.short : "–"}
                            </span>
                          </Box>
                        );
                      })}
                      <Box as="td" className="px-3 py-2.5 text-center">
                        <Badge className={cn("border-0 text-[10px] font-semibold capitalize", OVERALL[p.overall_status] || "bg-slate-100 text-slate-600")}>
                          {p.overall_status || "—"}
                        </Badge>
                      </Box>
                      <Box as="td" className="px-3 py-2.5 text-center">
                        <Text as="span" className="text-xs font-semibold text-slate-600">{p.attended ?? 0}/{p.total_sessions ?? data.sessions.length}</Text>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </>
        )}
      </Box>
    </Card>
  );
}
