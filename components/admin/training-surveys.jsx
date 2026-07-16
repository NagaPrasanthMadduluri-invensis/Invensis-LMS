"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  MessageSquare, Plus, Users, AlertCircle, Loader2, CheckCircle2, ClipboardList, User,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import {
  createTrainingSurvey, fetchTrainingSurveys, fetchSurveyResponses,
} from "@/services/api/admin/admin-api";
import {
  POST_TRAINING_QUESTIONS, POST_TRAINING_SURVEY_TITLE, formatSurveyAnswer,
} from "@/lib/survey-questions";

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
}

/* ── Create post-training survey dialog ── */
function CreateSurveyDialog({ open, onOpenChange, token, trainingRef, onCreated }) {
  const [title, setTitle] = useState(POST_TRAINING_SURVEY_TITLE);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) { setTitle(POST_TRAINING_SURVEY_TITLE); setError(null); }
  }, [open]);

  async function submit() {
    if (!title.trim()) { setError("A title is required."); return; }
    setSubmitting(true); setError(null);
    try {
      await createTrainingSurvey({
        token,
        trainingRef,
        type: "post_training",
        title: title.trim(),
        questions: POST_TRAINING_QUESTIONS,
      });
      onCreated();
      onOpenChange(false);
    } catch (e) { setError(e.message); } finally { setSubmitting(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="sm:max-w-[560px] overflow-hidden" style={{ padding: 0, gap: 0 }}>
        <Box className="bg-gradient-to-r from-indigo-50 via-purple-50 to-violet-50 border-b border-indigo-100 px-6 py-5">
          <Box className="flex items-center gap-3">
            <Box className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-white" />
            </Box>
            <Box>
              <DialogTitle className="text-base font-semibold text-slate-800">Create Feedback Survey</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Learners complete this post-training survey to unlock their certificate.
              </DialogDescription>
            </Box>
          </Box>
        </Box>
        <Box className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <Box className="space-y-1.5">
            <Text as="p" className="text-xs font-semibold text-slate-600">Survey title</Text>
            <Box className="group flex items-center gap-3 h-12 rounded-xl border border-slate-200 bg-white px-3.5 shadow-sm hover:border-slate-300 focus-within:border-indigo-400 focus-within:shadow-[0_0_0_3px_rgba(165,180,252,0.35)] transition-all duration-150">
              <ClipboardList className="h-4 w-4 text-slate-400 shrink-0 group-focus-within:text-indigo-500 transition-colors" />
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={POST_TRAINING_SURVEY_TITLE}
                className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400"
              />
            </Box>
          </Box>

          <Box className="rounded-xl border border-slate-200 overflow-hidden">
            <Box className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
              <Box className="w-1 h-4 rounded-full bg-indigo-500" />
              <Text as="p" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Questions</Text>
            </Box>
            <Box className="p-4 space-y-2">
              {POST_TRAINING_QUESTIONS.map((q, i) => (
                <Box key={q.id} className="flex items-center justify-between gap-3 py-1.5">
                  <Box className="flex items-center gap-2.5 min-w-0">
                    <Box className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-600 shrink-0">{i + 1}</Box>
                    <Text as="p" className="text-sm text-slate-700 truncate">{q.label}</Text>
                  </Box>
                  <Badge className="border-0 bg-slate-100 text-slate-500 text-[10px] capitalize shrink-0">
                    {q.type}{q.required ? "" : " · optional"}
                  </Badge>
                </Box>
              ))}
            </Box>
          </Box>

          {error && (
            <Box className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <Text as="p" className="text-xs text-red-700 font-medium">{error}</Text>
            </Box>
          )}
        </Box>
        <DialogFooter className="px-6 pt-4 pb-6 border-t border-slate-100 bg-slate-50/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="border-slate-200 text-slate-600 hover:bg-slate-100">Cancel</Button>
          <Button onClick={submit} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-sm">
            {submitting ? (<><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Creating…</>) : (<><Plus className="h-3.5 w-3.5 mr-1.5" /> Create Survey</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── View responses dialog ── */
function ResponsesDialog({ survey, onOpenChange, token }) {
  const open = !!survey;
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!survey || !token) return;
    setData(null); setError(null);
    fetchSurveyResponses({ token, surveyId: survey.id })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [survey, token]);

  const questions = data?.survey?.questions || survey?.questions || [];
  const responses = data?.responses || [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent className="sm:max-w-[820px] overflow-hidden" style={{ padding: 0, gap: 0 }}>
        <Box className="bg-gradient-to-r from-indigo-50 via-purple-50 to-violet-50 border-b border-indigo-100 px-6 py-5">
          <Box className="flex items-center gap-3">
            <Box className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <ClipboardList className="w-4 h-4 text-white" />
            </Box>
            <Box>
              <DialogTitle className="text-base font-semibold text-slate-800">{survey?.title || "Survey Responses"}</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                {responses.length} response{responses.length !== 1 ? "s" : ""} · stored against each participant.
              </DialogDescription>
            </Box>
          </Box>
        </Box>
        <Box className="px-6 py-5 max-h-[65vh] overflow-y-auto">
          {error ? (
            <Box className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <Text as="p" className="text-xs text-red-700 font-medium">{error}</Text>
            </Box>
          ) : !data ? (
            <Box className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
            </Box>
          ) : responses.length === 0 ? (
            <Box className="py-12 text-center">
              <Box className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Users className="h-5 w-5 text-slate-400" />
              </Box>
              <Text as="p" className="text-sm text-slate-400">No responses submitted yet.</Text>
            </Box>
          ) : (
            <Box className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200/60">
                    <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide py-3">Participant</TableHead>
                    {questions.map((q) => (
                      <TableHead key={q.id} className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide py-3">{q.label}</TableHead>
                    ))}
                    <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide py-3">Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.map((r) => (
                    <TableRow key={r.id} className="hover:bg-slate-50/70 transition-colors border-b border-slate-100/80 last:border-0 align-top">
                      <TableCell className="py-3.5">
                        <Box className="flex items-center gap-2.5">
                          <Box className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                            <User className="h-4 w-4 text-indigo-500" />
                          </Box>
                          <Box className="min-w-0">
                            <Text as="p" className="text-sm font-semibold text-slate-800">{r.name || "—"}</Text>
                            <Text as="p" className="text-xs text-slate-500 truncate">{r.email}</Text>
                          </Box>
                        </Box>
                      </TableCell>
                      {questions.map((q) => (
                        <TableCell key={q.id} className="py-3.5 text-sm text-slate-600 max-w-[220px]">
                          {formatSurveyAnswer(q, r.answers?.[q.id])}
                        </TableCell>
                      ))}
                      <TableCell className="py-3.5 text-xs text-slate-500 whitespace-nowrap">{formatDateTime(r.submitted_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════════════════════════
   Post-training feedback survey card for a training. Admins author
   the survey here; learners answer it to unlock their certificate.
   ══════════════════════════════════════════════════════════════ */
export function TrainingSurveys({ trainingRef, token }) {
  const [surveys, setSurveys] = useState(null);
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [responsesSurvey, setResponsesSurvey] = useState(null);

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    fetchTrainingSurveys({ token, trainingRef })
      .then((d) => setSurveys(d.surveys || []))
      .catch((e) => setError(e.message));
  }, [token, trainingRef]);

  useEffect(() => { load(); }, [load]);

  const postSurvey = (surveys || []).find((s) => s.type === "post_training");

  return (
    <Card className="p-0 overflow-hidden border border-slate-200/80 shadow-sm rounded-xl bg-white">
      <Box className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
        <Box className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-slate-400" />
          <Text as="h3" className="text-sm font-semibold text-slate-700">Post-Training Feedback Survey</Text>
        </Box>
        {surveys && !postSurvey && (
          <Button size="sm" onClick={() => setCreateOpen(true)} className="h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white border-0">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Create Survey
          </Button>
        )}
      </Box>

      <Box className="p-5">
        {error ? (
          <Box className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <Text as="p" className="text-xs text-red-700 font-medium">{error}</Text>
          </Box>
        ) : !surveys ? (
          <Skeleton className="h-16 w-full rounded-xl" />
        ) : postSurvey ? (
          <Box className="flex items-center gap-3 rounded-xl bg-indigo-50 border border-indigo-200/60 px-4 py-4">
            <Box className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </Box>
            <Box className="min-w-0 flex-1">
              <Text as="p" className="text-sm font-bold text-slate-800 truncate">{postSurvey.title}</Text>
              <Text as="p" className="text-xs text-slate-500 mt-0.5">
                {postSurvey.response_count ?? 0} response{(postSurvey.response_count ?? 0) !== 1 ? "s" : ""}
                {" · "}{(postSurvey.questions || []).length} question{(postSurvey.questions || []).length !== 1 ? "s" : ""}
              </Text>
            </Box>
            <Button size="sm" variant="outline" onClick={() => setResponsesSurvey(postSurvey)} className="h-8 px-3 border-slate-200 text-slate-700 hover:bg-slate-50 shrink-0">
              <ClipboardList className="h-3.5 w-3.5 mr-1.5" /> View responses
            </Button>
          </Box>
        ) : (
          <Box className="flex items-center gap-3 rounded-xl bg-slate-50 border border-dashed border-slate-300 px-4 py-4">
            <Box className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
              <MessageSquare className="h-5 w-5 text-slate-400" />
            </Box>
            <Box>
              <Text as="p" className="text-sm font-bold text-slate-500">No feedback survey yet</Text>
              <Text as="p" className="text-xs text-slate-400 mt-0.5">Create one so learners can unlock their certificate.</Text>
            </Box>
          </Box>
        )}
      </Box>

      <CreateSurveyDialog open={createOpen} onOpenChange={setCreateOpen} token={token} trainingRef={trainingRef} onCreated={load} />
      <ResponsesDialog survey={responsesSurvey} onOpenChange={() => setResponsesSurvey(null)} token={token} />
    </Card>
  );
}
