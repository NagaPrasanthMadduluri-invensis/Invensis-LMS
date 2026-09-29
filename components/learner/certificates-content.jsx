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
          <Star className={cn("h-6 w-6", n <= value ? "fill-amber-400 text-amber-400" : "text-slate-300")} />
        </button>
      ))}
    </Box>
  );
}

function SurveyRow({ label, hint, children }) {
  return (
    <Box className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
      <Box className="min-w-0">
        <Text as="p" className="text-sm font-semibold text-slate-700">{label}</Text>
        {hint && <Text as="p" className="text-xs text-slate-400 mt-0.5">{hint}</Text>}
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
        <Box className="bg-gradient-to-r from-violet-50 via-purple-50 to-violet-50 border-b border-violet-100 px-6 py-5">
          <Box className="flex items-center gap-3">
            <Box className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
              <MessageSquare className="w-4 h-4 text-white" />
            </Box>
            <Box>
              <DialogTitle className="text-base font-semibold text-slate-800">Share your feedback</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
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
                      ? "bg-violet-600 text-white border-violet-600"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  )}>
                  {o.l}
                </button>
              ))}
            </Box>
          </SurveyRow>
          <Box className="pt-3">
            <Text as="p" className="text-sm font-semibold text-slate-700 mb-1.5">Comments <Box as="span" className="text-slate-400 font-normal">(optional)</Box></Text>
            <textarea
              rows={3}
              value={form.comments}
              onChange={(e) => set("comments")(e.target.value)}
              placeholder="Anything you'd like to add about the sessions…"
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none resize-none focus:border-violet-400 focus:shadow-[0_0_0_3px_rgba(167,139,250,0.35)] transition-all"
            />
          </Box>
          {error && (
            <Box className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <Text as="p" className="text-xs text-red-700 font-medium">{error}</Text>
            </Box>
          )}
        </Box>
        <DialogFooter className="px-6 pt-4 pb-6 border-t border-slate-100 bg-slate-50/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="border-slate-200 text-slate-600 hover:bg-slate-100">Cancel</Button>
          <Button onClick={submit} disabled={submitting || !complete} className="bg-violet-600 hover:bg-violet-700 text-white border-0 shadow-sm">
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
    <Card className="p-0 overflow-hidden border border-slate-200/80 shadow-sm rounded-2xl bg-white flex flex-col">
      <Box className="relative bg-slate-50/70 border-b border-slate-100 p-4">
        <Box className={cn("rounded-lg overflow-hidden ring-1 ring-slate-200", !cert.issued && "blur-[1.5px]")}>
          <ScaledCertificate cert={cert} />
        </Box>
        {!cert.issued && (
          <Box className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/55 backdrop-blur-[1px]">
            <Box className="w-11 h-11 rounded-full bg-amber-500 flex items-center justify-center shadow">
              <Lock className="h-5 w-5 text-white" />
            </Box>
            <Text as="p" className="text-xs font-semibold text-slate-600 max-w-[220px] text-center">
              Complete a short feedback survey to unlock your certificate
            </Text>
          </Box>
        )}
      </Box>

      <Box className="p-5 flex flex-col gap-3 flex-1">
        <Box className="flex items-start justify-between gap-3">
          <Box className="min-w-0">
            <Text as="h3" className="text-sm font-bold text-slate-800 leading-tight">{cert.title}</Text>
            <Box className="flex items-center gap-1.5 mt-1">
              <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <Text as="p" className="text-xs text-slate-500">{certificateDateText(cert.start_date, cert.end_date) || "—"}</Text>
            </Box>
          </Box>
          {cert.issued ? (
            <Badge className="border-0 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80 text-[10px] font-semibold shrink-0">● Issued</Badge>
          ) : (
            <Badge className="border-0 bg-amber-50 text-amber-700 ring-1 ring-amber-200/80 text-[10px] font-semibold shrink-0">Feedback required</Badge>
          )}
        </Box>

        <Box className="flex items-center gap-4 text-xs">
          <Box>
            <Text as="p" className="text-[10px] uppercase tracking-wide text-slate-400">Training ID</Text>
            <Text as="p" className="font-mono font-semibold text-slate-700">{cert.training_id || "—"}</Text>
          </Box>
          <Box>
            <Text as="p" className="text-[10px] uppercase tracking-wide text-slate-400">Certificate ID</Text>
            <Text as="p" className="font-mono font-semibold text-slate-700">{cert.issued ? cert.certificate_id : "—"}</Text>
          </Box>
        </Box>

        <Box className="mt-auto pt-1">
          {cert.issued ? (
            <Button onClick={() => onDownload(cert)} className="w-full bg-amber-500 hover:bg-amber-600 text-white border-0 shadow-sm">
              <Download className="h-4 w-4 mr-2" /> Download certificate
            </Button>
          ) : canGiveFeedback ? (
            <Button onClick={() => onGiveFeedback(cert, survey)} className="w-full bg-violet-600 hover:bg-violet-700 text-white border-0 shadow-sm">
              <MessageSquare className="h-4 w-4 mr-2" /> Give feedback &amp; download
            </Button>
          ) : survey?.answered ? (
            <Box className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <Text as="p" className="text-xs font-medium text-emerald-700">Feedback submitted — your certificate will be ready shortly.</Text>
            </Box>
          ) : (
            <Box className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
              <AlertCircle className="h-4 w-4 text-slate-400 shrink-0" />
              <Text as="p" className="text-xs font-medium text-slate-500">Feedback survey isn&apos;t available yet.</Text>
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
      <Card className="p-6 border border-red-200/60 bg-red-50 rounded-xl">
        <Text as="p" className="text-red-600 text-sm">Failed to load certificates: {error}</Text>
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
      <Card className="p-12 border border-slate-200/80 rounded-2xl bg-white text-center">
        <Box className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <Award className="h-7 w-7 text-amber-500" />
        </Box>
        <Text as="h3" className="text-base font-bold text-slate-800">No certificates yet</Text>
        <Text as="p" className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
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
