"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle,
} from "@/components/ui/dialog";
import { Award, Download, Lock, Star, MessageSquare, CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { fetchCertificates, fetchLearnerSurveys, submitSurveyResponse } from "@/services/api/learner/learner-api";
import { ScaledCertificate, certificateDateText } from "@/components/shared/certificate-document";
import { useCertificateDownload } from "@/components/shared/certificate-download";

/* ── Star rating input ── */
function StarRating({ value, onChange }) {
  return (
    <Box className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button type="button" key={n} onClick={() => onChange(n)} className="p-0.5 transition-transform hover:scale-110" aria-label={`${n} star${n > 1 ? "s" : ""}`}>
          <Star className={cn("h-6 w-6", n <= value ? "fill-amber-400 text-amber-400" : "text-foreground-subtle")} />
        </button>
      ))}
    </Box>
  );
}

function SurveyRow({ label, hint, children }) {
  return (
    <Box className="flex items-center justify-between gap-4 py-3 border-b border-border last:border-0">
      <Box className="min-w-0">
        <Text as="p" className="text-sm font-semibold text-foreground">{label}</Text>
        {hint && <Text as="p" className="text-xs text-foreground-subtle mt-0.5">{hint}</Text>}
      </Box>
      <Box className="shrink-0">{children}</Box>
    </Box>
  );
}

/* ── Feedback survey dialog (gates the download) ──
   Submits the training's post-training survey (API §3.7.5). The answers map is
   keyed by the fixed question ids the survey was authored with; on success the
   backend stores the response against the training + participant and issues the
   certificate, which the caller picks up by refetching. */
function SurveyDialog({ target, onOpenChange, token, onSubmitted }) {
  const open = !!target;
  const cert = target?.cert;
  const survey = target?.survey;
  const [form, setForm] = useState({ overall_rating: 0, trainer_rating: 0, content_rating: 0, would_recommend: null, comments: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (target) {
      setForm({ overall_rating: 0, trainer_rating: 0, content_rating: 0, would_recommend: null, comments: "" });
      setError(null);
    }
  }, [target]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const complete = form.overall_rating > 0 && form.trainer_rating > 0 && form.content_rating > 0 && form.would_recommend !== null;

  async function submit() {
    if (!complete) { setError("Please rate all three areas and tell us if you'd recommend it."); return; }
    if (!survey?.id) { setError("This training's feedback survey isn't available yet."); return; }
    setSubmitting(true); setError(null);
    try {
      const answers = {
        overall_rating: form.overall_rating,
        trainer_rating: form.trainer_rating,
        content_rating: form.content_rating,
        would_recommend: form.would_recommend,
      };
      if (form.comments.trim()) answers.comments = form.comments.trim();
      await submitSurveyResponse({ token, surveyId: survey.id, answers });
      onOpenChange(false);
      onSubmitted(cert);
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
              <DialogTitle className="text-base font-semibold text-foreground">Share your feedback</DialogTitle>
              <DialogDescription className="text-xs text-foreground-muted mt-0.5">
                A quick survey about {cert?.title}. Submitting it unlocks your certificate download.
              </DialogDescription>
            </Box>
          </Box>
        </Box>
        <Box className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          <SurveyRow label="Overall experience" hint="How was the training overall?">
            <StarRating value={form.overall_rating} onChange={set("overall_rating")} />
          </SurveyRow>
          <SurveyRow label="Trainer" hint="Knowledge, clarity, engagement">
            <StarRating value={form.trainer_rating} onChange={set("trainer_rating")} />
          </SurveyRow>
          <SurveyRow label="Course content" hint="Material, pace, relevance">
            <StarRating value={form.content_rating} onChange={set("content_rating")} />
          </SurveyRow>
          <SurveyRow label="Would you recommend it?">
            <Box className="flex gap-2">
              {[{ v: true, l: "Yes" }, { v: false, l: "No" }].map((o) => (
                <button type="button" key={o.l} onClick={() => set("would_recommend")(o.v)}
                  className={cn(
                    "h-9 px-4 rounded-xl text-sm font-semibold border transition-colors",
                    form.would_recommend === o.v
                      ? "bg-primary text-primary-foreground border-primary-border"
                      : "bg-surface text-foreground-muted border-border hover:bg-surface-hover"
                  )}>
                  {o.l}
                </button>
              ))}
            </Box>
          </SurveyRow>
          <Box className="pt-3">
            <Text as="p" className="text-sm font-semibold text-foreground mb-1.5">Comments <Box as="span" className="text-foreground-subtle font-normal">(optional)</Box></Text>
            <textarea
              rows={3}
              value={form.comments}
              onChange={(e) => set("comments")(e.target.value)}
              placeholder="Anything you'd like to add about the sessions…"
              className="w-full rounded-xl border border-border bg-surface px-3.5 py-3 text-sm text-foreground placeholder:text-foreground-subtle outline-none resize-none focus:border-primary-border focus:shadow-[0_0_0_3px_rgba(167,139,250,0.35)] transition-all"
            />
          </Box>
          {error && (
            <Box className="mt-3 flex items-start gap-2.5 rounded-xl border border-error-border bg-error-subtle px-3.5 py-3">
              <AlertCircle className="h-4 w-4 text-error shrink-0 mt-0.5" />
              <Text as="p" className="text-xs text-error-subtle-foreground font-medium">{error}</Text>
            </Box>
          )}
        </Box>
        <DialogFooter className="px-6 pt-4 pb-6 border-t border-border bg-slate-50/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="border-border text-foreground-muted hover:bg-surface-muted">Cancel</Button>
          <Button onClick={submit} disabled={submitting || !complete} className="bg-primary hover:bg-primary-hover text-primary-foreground border-0 shadow-sm">
            {submitting
              ? (<><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> Submitting…</>)
              : (<><CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Submit &amp; download</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── One certificate card ── */
function CertificateCard({ cert, survey, onDownload, onGiveFeedback }) {
  const canGiveFeedback = survey && !survey.answered;
  return (
    <Card className="p-0 overflow-hidden border border-slate-200/80 shadow-sm rounded-2xl bg-surface flex flex-col">
      <Box className="relative bg-slate-50/70 border-b border-border p-4">
        <Box className={cn("rounded-lg overflow-hidden ring-1 ring-border", !cert.issued && "blur-[1.5px]")}>
          <ScaledCertificate cert={cert} />
        </Box>
        {!cert.issued && (
          <Box className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/55 backdrop-blur-[1px]">
            <Box className="w-11 h-11 rounded-full bg-warning flex items-center justify-center shadow">
              <Lock className="h-5 w-5 text-warning-foreground" />
            </Box>
            <Text as="p" className="text-xs font-semibold text-foreground-muted max-w-[220px] text-center">
              Complete a short feedback survey to unlock your certificate
            </Text>
          </Box>
        )}
      </Box>

      <Box className="p-5 flex flex-col gap-3 flex-1">
        <Box className="flex items-start justify-between gap-3">
          <Box className="min-w-0">
            <Text as="h3" className="text-sm font-bold text-foreground leading-tight">{cert.title}</Text>
            <Box className="flex items-center gap-1.5 mt-1">
              <Calendar className="h-3.5 w-3.5 text-foreground-subtle shrink-0" />
              <Text as="p" className="text-xs text-foreground-muted">{certificateDateText(cert.start_date, cert.end_date) || "—"}</Text>
            </Box>
          </Box>
          {cert.issued ? (
            <Badge className="border-0 bg-success-subtle text-success-subtle-foreground ring-1 ring-emerald-200/80 text-[10px] font-semibold shrink-0">● Issued</Badge>
          ) : (
            <Badge className="border-0 bg-warning-subtle text-warning-subtle-foreground ring-1 ring-amber-200/80 text-[10px] font-semibold shrink-0">Feedback required</Badge>
          )}
        </Box>

        <Box className="flex items-center gap-4 text-xs">
          <Box>
            <Text as="p" className="text-[10px] uppercase tracking-wide text-foreground-subtle">Training ID</Text>
            <Text as="p" className="font-mono font-semibold text-foreground">{cert.training_id || "—"}</Text>
          </Box>
          <Box>
            <Text as="p" className="text-[10px] uppercase tracking-wide text-foreground-subtle">Certificate ID</Text>
            <Text as="p" className="font-mono font-semibold text-foreground">{cert.issued ? cert.certificate_id : "—"}</Text>
          </Box>
        </Box>

        <Box className="mt-auto pt-1">
          {cert.issued ? (
            <Button onClick={() => onDownload(cert)} className="w-full bg-warning hover:bg-warning text-warning-foreground border-0 shadow-sm">
              <Download className="h-4 w-4 mr-2" /> Download certificate
            </Button>
          ) : canGiveFeedback ? (
            <Button onClick={() => onGiveFeedback(cert, survey)} className="w-full bg-primary hover:bg-primary-hover text-primary-foreground border-0 shadow-sm">
              <MessageSquare className="h-4 w-4 mr-2" /> Give feedback &amp; download
            </Button>
          ) : survey?.answered ? (
            <Box className="flex items-center justify-center gap-2 rounded-xl border border-success-border bg-success-subtle px-3.5 py-2.5">
              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
              <Text as="p" className="text-xs font-medium text-success-subtle-foreground">Feedback submitted — your certificate will be ready shortly.</Text>
            </Box>
          ) : (
            <Box className="flex items-center justify-center gap-2 rounded-xl border border-border bg-surface-hover px-3.5 py-2.5">
              <AlertCircle className="h-4 w-4 text-foreground-subtle shrink-0" />
              <Text as="p" className="text-xs font-medium text-foreground-muted">Feedback survey isn&apos;t available yet.</Text>
            </Box>
          )}
        </Box>
      </Box>
    </Card>
  );
}

/* ═══════════════════════════════════════════════ Main ══ */
export function CertificatesContent() {
  const { token } = useAuth();
  const [certs, setCerts] = useState(null);
  const [surveys, setSurveys] = useState([]);
  const [error, setError] = useState(null);
  const [feedbackTarget, setFeedbackTarget] = useState(null);
  // Off-screen render → PDF flow, shared with the admin certificate list.
  const { requestDownload, captureNode } = useCertificateDownload();

  // Load certificates + the caller's surveys together. The post-training survey
  // (API §3.7.4) is what now gates the download, so we match it to each
  // certificate by training code. Returns the fresh data so callers can act on
  // it immediately after a submit.
  const load = useCallback(async () => {
    if (!token) return null;
    try {
      const [certData, surveyData] = await Promise.all([
        fetchCertificates({ token }),
        fetchLearnerSurveys({ token }).catch(() => ({ surveys: [] })),
      ]);
      const nextCerts = certData.certificates || [];
      const nextSurveys = surveyData.surveys || [];
      setCerts(nextCerts);
      setSurveys(nextSurveys);
      return { certificates: nextCerts, surveys: nextSurveys };
    } catch (e) {
      setError(e.message);
      return null;
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  // The post-training survey for a certificate's training (if one is assigned).
  const surveyForCert = useCallback(
    (cert) => surveys.find((s) => s.type === "post_training" && s.training_code === cert.training_code),
    [surveys]
  );

  async function handleFeedbackSubmitted(cert) {
    // Refetch certificates + surveys; once the backend has issued the
    // certificate off the submitted survey, auto-download it.
    const fresh = await load();
    const updated = fresh?.certificates.find((c) => c.training_id === cert.training_id);
    if (updated?.issued) requestDownload(updated);
  }

  if (error) {
    return (
      <Card className="p-6 border border-red-200/60 bg-error-subtle rounded-xl">
        <Text as="p" className="text-error text-sm">Failed to load certificates: {error}</Text>
      </Card>
    );
  }

  if (!certs) {
    return (
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-2xl" />)}
      </Box>
    );
  }

  if (certs.length === 0) {
    return (
      <Card className="p-12 border border-slate-200/80 rounded-2xl bg-surface text-center">
        <Box className="w-14 h-14 rounded-2xl bg-warning-subtle flex items-center justify-center mx-auto mb-4">
          <Award className="h-7 w-7 text-warning" />
        </Box>
        <Text as="h3" className="text-base font-bold text-foreground">No certificates yet</Text>
        <Text as="p" className="text-sm text-foreground-muted mt-1 max-w-md mx-auto">
          Once you complete a training and it&apos;s marked completed, your certificate will appear here to download.
        </Text>
      </Card>
    );
  }

  return (
    <>
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {certs.map((c) => (
          <CertificateCard
            key={c.training_id}
            cert={c}
            survey={surveyForCert(c)}
            onDownload={requestDownload}
            onGiveFeedback={(cert, survey) => setFeedbackTarget({ cert, survey })}
          />
        ))}
      </Box>

      <SurveyDialog target={feedbackTarget} onOpenChange={(v) => !v && setFeedbackTarget(null)} token={token} onSubmitted={handleFeedbackSubmitted} />

      {captureNode}
    </>
  );
}
