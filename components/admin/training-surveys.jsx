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
  MessageSquare, Plus, Users, AlertCircle, Loader2, CheckCircle2, ClipboardList, Star, ThumbsUp, Quote,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { ParticipantLink } from "@/components/admin/entity-links";
import { cn } from "@/lib/utils";
import {
  createTrainingSurvey, fetchTrainingSurveys, fetchSurveyResponses,
} from "@/services/api/admin/admin-api";
import {
  POST_TRAINING_QUESTIONS, POST_TRAINING_SURVEY_TITLE, formatSurveyAnswer,
} from "@/lib/survey-questions";
import { formatInstantDateTime } from "@/lib/datetime";

// `submitted_at` is a real instant — shown on the reader's clock.
const formatDateTime = (iso) => formatInstantDateTime(iso);

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
        <Box className="bg-[#d7e3fc] border-b border-primary-border px-6 py-5">
          <Box className="flex items-center gap-3">
            <Box className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-primary-foreground" />
            </Box>
            <Box>
              <DialogTitle className="text-base font-semibold text-foreground">Create Feedback Survey</DialogTitle>
              <DialogDescription className="text-xs text-foreground-muted mt-0.5">
                Learners complete this post-training survey to unlock their certificate.
              </DialogDescription>
            </Box>
          </Box>
        </Box>
        <Box className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <Box className="space-y-1.5">
            <Text as="p" className="text-xs font-semibold text-foreground-muted">Survey title</Text>
            <Box className="group flex items-center gap-3 h-12 rounded-xl border border-border bg-surface px-3.5 shadow-sm hover:border-border-strong focus-within:border-primary-border focus-within:shadow-[0_0_0_3px_rgba(167,139,250,0.35)] transition-all duration-150">
              <ClipboardList className="h-4 w-4 text-foreground-subtle shrink-0 group-focus-within:text-primary transition-colors" />
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={POST_TRAINING_SURVEY_TITLE}
                className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-foreground-subtle"
              />
            </Box>
          </Box>

          <Box className="rounded-xl border border-border overflow-hidden">
            <Box className="flex items-center gap-2 px-4 py-2.5 bg-surface-hover border-b border-border">
              <Box className="w-1 h-4 rounded-full bg-violet-500" />
              <Text as="p" className="text-[10px] font-bold uppercase tracking-widest text-foreground-subtle">Questions</Text>
            </Box>
            <Box className="p-4 space-y-2">
              {POST_TRAINING_QUESTIONS.map((q, i) => (
                <Box key={q.id} className="flex items-center justify-between gap-3 py-1.5">
                  <Box className="flex items-center gap-2.5 min-w-0">
                    <Box className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-subtle text-[10px] font-bold text-primary shrink-0">{i + 1}</Box>
                    <Text as="p" className="text-sm text-foreground truncate">{q.label}</Text>
                  </Box>
                  <Badge className="border-0 bg-surface-muted text-foreground-muted text-[10px] capitalize shrink-0">
                    {q.type}{q.required ? "" : " · optional"}
                  </Badge>
                </Box>
              ))}
            </Box>
          </Box>

          {error && (
            <Box className="flex items-start gap-2.5 rounded-xl border border-error-border bg-error-subtle px-3.5 py-3">
              <AlertCircle className="h-4 w-4 text-error shrink-0 mt-0.5" />
              <Text as="p" className="text-xs text-error-subtle-foreground font-medium">{error}</Text>
            </Box>
          )}
        </Box>
        <DialogFooter className="px-6 pt-4 pb-6 border-t border-border bg-slate-50/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="border-border text-foreground-muted hover:bg-surface-muted">Cancel</Button>
          <Button onClick={submit} disabled={submitting} className="bg-primary hover:bg-primary-hover text-primary-foreground border-0 shadow-sm">
            {submitting ? (<><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Creating…</>) : (<><Plus className="h-3.5 w-3.5 mr-1.5" /> Create Survey</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Star row for an average rating ── */
function Stars({ value }) {
  const rounded = Math.round(value || 0);
  return (
    <Box className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={cn("h-4 w-4", n <= rounded ? "fill-amber-400 text-amber-400" : "text-slate-200")} />
      ))}
    </Box>
  );
}

/* ── Aggregate summary for the whole training (below the responses table) ── */
function ResponsesSummary({ responses, questions }) {
  const n = responses.length;
  const ratingQs = questions.filter((q) => q.type === "rating");
  const boolQ = questions.find((q) => q.type === "boolean");
  const textQ = questions.find((q) => q.type === "text");

  const avgFor = (qid) => {
    const vals = responses.map((r) => Number(r.answers?.[qid])).filter((v) => !Number.isNaN(v) && v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  };

  const overallQ = ratingQs[0];
  const overallAvg = overallQ ? avgFor(overallQ.id) : null;

  const recommendYes = boolQ
    ? responses.filter((r) => r.answers?.[boolQ.id] === true || r.answers?.[boolQ.id] === "true").length
    : 0;
  const recommendPct = boolQ && n ? Math.round((recommendYes / n) * 100) : null;

  const comments = textQ
    ? responses.map((r) => ({ name: r.name, text: r.answers?.[textQ.id] })).filter((c) => c.text && String(c.text).trim())
    : [];

  return (
    <Box className="rounded-xl border border-border bg-slate-50/40 p-5">
      <Box className="mb-4 flex items-center gap-2">
        <Box className="h-4 w-1 rounded-full bg-violet-500" />
        <Text as="p" className="text-[11px] font-bold uppercase tracking-widest text-foreground-subtle">
          Overall experience & rating · whole training
        </Text>
      </Box>

      <Box className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Headline overall rating */}
        <Box className="rounded-xl border border-primary-border bg-surface p-4">
          <Text as="p" className="text-[11px] font-semibold uppercase tracking-wide text-foreground-subtle">Overall rating</Text>
          <Box className="mt-1 flex items-end gap-2">
            <Text as="p" className="text-3xl font-extrabold leading-none text-foreground">{overallAvg != null ? overallAvg.toFixed(1) : "—"}</Text>
            <Text as="span" className="mb-0.5 text-xs text-foreground-subtle">/ 5</Text>
          </Box>
          <Box className="mt-1.5"><Stars value={overallAvg} /></Box>
          <Text as="p" className="mt-1 text-[11px] text-foreground-subtle">{n} response{n !== 1 ? "s" : ""}</Text>
        </Box>

        {/* Other rating categories */}
        {ratingQs.slice(1).map((q) => {
          const a = avgFor(q.id);
          return (
            <Box key={q.id} className="rounded-xl border border-border bg-surface p-4">
              <Text as="p" className="text-[11px] font-semibold uppercase tracking-wide text-foreground-subtle">{q.label}</Text>
              <Box className="mt-1 flex items-end gap-2">
                <Text as="p" className="text-2xl font-bold leading-none text-foreground">{a != null ? a.toFixed(1) : "—"}</Text>
                <Text as="span" className="mb-0.5 text-xs text-foreground-subtle">/ 5</Text>
              </Box>
              <Box className="mt-1.5"><Stars value={a} /></Box>
            </Box>
          );
        })}

        {/* Would recommend */}
        {boolQ && (
          <Box className="rounded-xl border border-border bg-surface p-4">
            <Text as="p" className="text-[11px] font-semibold uppercase tracking-wide text-foreground-subtle">{boolQ.label}</Text>
            <Box className="mt-1 flex items-center gap-2">
              <ThumbsUp className="h-5 w-5 text-success" />
              <Text as="p" className="text-2xl font-bold leading-none text-foreground">{recommendPct != null ? `${recommendPct}%` : "—"}</Text>
            </Box>
            <Text as="p" className="mt-1.5 text-[11px] text-foreground-subtle">{recommendYes} of {n} said yes</Text>
          </Box>
        )}
      </Box>

      {/* Written feedback */}
      {textQ && (
        <Box className="mt-5">
          <Text as="p" className="mb-2 text-xs font-semibold text-foreground-muted">Feedback</Text>
          {comments.length === 0 ? (
            <Text as="p" className="text-xs text-foreground-subtle">No written feedback.</Text>
          ) : (
            <Box className="space-y-2">
              {comments.map((c, i) => (
                <Box key={i} className="flex gap-2.5 rounded-xl border border-border bg-surface p-3">
                  <Quote className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                  <Box className="min-w-0">
                    <Text as="p" className="text-sm text-foreground">{c.text}</Text>
                    <Text as="p" className="mt-0.5 text-[11px] font-medium text-foreground-subtle">— {c.name || "Anonymous"}</Text>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Box>
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
      <DialogContent className="overflow-hidden" style={{ padding: 0, gap: 0, width: "96vw", maxWidth: "1400px" }}>
        <Box className="bg-[#d7e3fc] border-b border-primary-border px-6 py-5">
          <Box className="flex items-center gap-3">
            <Box className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
              <ClipboardList className="w-4 h-4 text-primary-foreground" />
            </Box>
            <Box>
              <DialogTitle className="text-base font-semibold text-foreground">{survey?.title || "Survey Responses"}</DialogTitle>
              <DialogDescription className="text-xs text-foreground-muted mt-0.5">
                {responses.length} response{responses.length !== 1 ? "s" : ""} · stored against each participant.
              </DialogDescription>
            </Box>
          </Box>
        </Box>
        <Box className="px-6 py-5 min-h-[440px] max-h-[82vh] overflow-y-auto">
          {error ? (
            <Box className="flex items-start gap-2.5 rounded-xl border border-error-border bg-error-subtle px-3.5 py-3">
              <AlertCircle className="h-4 w-4 text-error shrink-0 mt-0.5" />
              <Text as="p" className="text-xs text-error-subtle-foreground font-medium">{error}</Text>
            </Box>
          ) : !data ? (
            <Box className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
            </Box>
          ) : responses.length === 0 ? (
            <Box className="py-12 text-center">
              <Box className="w-10 h-10 rounded-xl bg-surface-muted flex items-center justify-center mx-auto mb-3">
                <Users className="h-5 w-5 text-foreground-subtle" />
              </Box>
              <Text as="p" className="text-sm text-foreground-subtle">No responses submitted yet.</Text>
            </Box>
          ) : (
            <Box className="space-y-6">
              <Box className="overflow-x-auto rounded-xl border border-border">
                <Table className="min-w-[960px]">
                  <TableHeader>
                    <TableRow className="bg-surface-hover hover:bg-surface-hover border-b border-border">
                      <TableHead className="sticky left-0 z-10 bg-surface-hover min-w-[260px] border-r border-border text-[11px] font-semibold text-foreground-muted uppercase tracking-wide py-3">Participant</TableHead>
                      {questions.map((q) => (
                        <TableHead key={q.id} className="min-w-[150px] border-r border-border text-[11px] font-semibold text-foreground-muted uppercase tracking-wide py-3">{q.label}</TableHead>
                      ))}
                      <TableHead className="min-w-[150px] text-[11px] font-semibold text-foreground-muted uppercase tracking-wide py-3">Submitted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.map((r, i) => (
                      <TableRow key={r.id} className={cn("transition-colors border-b border-border last:border-0 align-top", i % 2 ? "bg-slate-50/40" : "bg-surface", "hover:bg-violet-50/40")}>
                        <TableCell className="sticky left-0 z-10 bg-inherit border-r border-border py-3.5">
                          <Box className="flex items-center gap-2.5">
                            <Box className="w-9 h-9 rounded-full bg-primary-subtle flex items-center justify-center shrink-0">
                              <Text as="span" className="text-xs font-bold text-primary">
                                {(r.name || "?").trim().charAt(0).toUpperCase()}
                              </Text>
                            </Box>
                            <Box className="min-w-0">
                              <ParticipantLink id={r.participant_id} className="block text-sm font-semibold text-foreground">{r.name || "—"}</ParticipantLink>
                              <ParticipantLink id={r.participant_id} className="text-xs text-foreground-muted break-all">{r.email || "—"}</ParticipantLink>
                            </Box>
                          </Box>
                        </TableCell>
                        {questions.map((q) => (
                          <TableCell key={q.id} className="py-3.5 text-sm text-foreground-muted align-top border-r border-border">
                            {formatSurveyAnswer(q, r.answers?.[q.id])}
                          </TableCell>
                        ))}
                        <TableCell className="py-3.5 text-xs text-foreground-muted whitespace-nowrap align-top">{formatDateTime(r.submitted_at)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>

              <ResponsesSummary responses={responses} questions={questions} />
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
    <Card className="p-0 overflow-hidden border border-slate-200/80 shadow-sm rounded-xl bg-surface">
      <Box className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
        <Box className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-foreground-subtle" />
          <Text as="h3" className="text-sm font-semibold text-foreground">Post-Training Feedback Survey</Text>
        </Box>
        {surveys && !postSurvey && (
          <Button size="sm" onClick={() => setCreateOpen(true)} className="h-8 px-3 bg-primary hover:bg-primary-hover text-primary-foreground border-0">
            <Plus className="h-3.5 w-3.5 mr-1.5" /> Create Survey
          </Button>
        )}
      </Box>

      <Box className="p-5">
        {error ? (
          <Box className="flex items-start gap-2.5 rounded-xl border border-error-border bg-error-subtle px-3.5 py-3">
            <AlertCircle className="h-4 w-4 text-error shrink-0 mt-0.5" />
            <Text as="p" className="text-xs text-error-subtle-foreground font-medium">{error}</Text>
          </Box>
        ) : !surveys ? (
          <Skeleton className="h-16 w-full rounded-xl" />
        ) : postSurvey ? (
          <Box className="flex items-center gap-3 rounded-xl bg-primary-subtle border border-violet-200/60 px-4 py-4">
            <Box className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm">
              <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
            </Box>
            <Box className="min-w-0 flex-1">
              <Text as="p" className="text-sm font-bold text-foreground truncate">{postSurvey.title}</Text>
              <Text as="p" className="text-xs text-foreground-muted mt-0.5">
                {postSurvey.response_count ?? 0} response{(postSurvey.response_count ?? 0) !== 1 ? "s" : ""}
                {" · "}{(postSurvey.questions || []).length} question{(postSurvey.questions || []).length !== 1 ? "s" : ""}
              </Text>
            </Box>
            <Button size="sm" variant="outline" onClick={() => setResponsesSurvey(postSurvey)} className="h-8 px-3 border-border text-foreground hover:bg-surface-hover shrink-0">
              <ClipboardList className="h-3.5 w-3.5 mr-1.5" /> View responses
            </Button>
          </Box>
        ) : (
          <Box className="flex items-center gap-3 rounded-xl bg-surface-hover border border-dashed border-border-strong px-4 py-4">
            <Box className="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center shrink-0">
              <MessageSquare className="h-5 w-5 text-foreground-subtle" />
            </Box>
            <Box>
              <Text as="p" className="text-sm font-bold text-foreground-muted">No feedback survey yet</Text>
              <Text as="p" className="text-xs text-foreground-subtle mt-0.5">Create one so learners can unlock their certificate.</Text>
            </Box>
          </Box>
        )}
      </Box>

      <CreateSurveyDialog open={createOpen} onOpenChange={setCreateOpen} token={token} trainingRef={trainingRef} onCreated={load} />
      <ResponsesDialog survey={responsesSurvey} onOpenChange={() => setResponsesSurvey(null)} token={token} />
    </Card>
  );
}
