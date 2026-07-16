"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Award, Download, Lock, Star, MessageSquare, CheckCircle2, Loader2, AlertCircle, Calendar } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { fetchCertificates, fetchLearnerSurveys, submitSurveyResponse } from "@/services/api/learner/learner-api";

/* ── date / delivery formatting for the certificate line ── */
function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}
function parseDate(d) {
  return d ? new Date(`${d}T00:00:00`) : null;
}
function dayMonthYear(d) {
  const dt = parseDate(d);
  if (!dt) return "";
  return `${ordinal(dt.getDate())} ${dt.toLocaleString("en-US", { month: "long" })} ${dt.getFullYear()}`;
}
function certificateDateText(start, end) {
  const s = parseDate(start);
  const e = parseDate(end);
  if (!s) return "";
  if (!e || start === end) return `on ${dayMonthYear(start)}`;
  const sameMonth = s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear();
  if (sameMonth) {
    return `from ${ordinal(s.getDate())} to ${ordinal(e.getDate())} ${e.toLocaleString("en-US", { month: "long" })} ${e.getFullYear()}`;
  }
  return `from ${dayMonthYear(start)} to ${dayMonthYear(end)}`;
}
const DELIVERY_TEXT = {
  virtual: "online classroom",
  in_person: "in-person classroom",
  hybrid: "hybrid classroom",
  one_to_one: "one-to-one coaching session",
};

/* ═══════════════════════════════════════════════════════════════
   The certificate itself — a fixed 1000×707 "canvas" recreated with
   SVG/CSS (no external assets). Rendered scaled-to-fit for the on-page
   preview and at full size inside the hidden print root for download.
   ═══════════════════════════════════════════════════════════════ */
const CERT_W = 1000;
const CERT_H = 707;

function Seal() {
  return (
    <svg width="112" height="112" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <linearGradient id="certGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#efd691" />
          <stop offset="0.5" stopColor="#cba044" />
          <stop offset="1" stopColor="#a2762a" />
        </linearGradient>
        <path id="certSealTop" d="M18,60 a42,42 0 0 1 84,0" fill="none" />
        <path id="certSealBot" d="M22,60 a38,38 0 0 0 76,0" fill="none" />
      </defs>
      <circle cx="60" cy="60" r="58" fill="url(#certGold)" />
      <circle cx="60" cy="60" r="50" fill="#ffffff" />
      <circle cx="60" cy="60" r="46" fill="url(#certGold)" />
      <circle cx="60" cy="60" r="35" fill="#ffffff" />
      <text fontSize="9.5" fontWeight="700" letterSpacing="2.5" fill="#16224e">
        <textPath href="#certSealTop" startOffset="50%" textAnchor="middle">INVENSIS</textPath>
      </text>
      <text fontSize="9.5" fontWeight="700" letterSpacing="2.5" fill="#16224e">
        <textPath href="#certSealBot" startOffset="50%" textAnchor="middle">LEARNING</textPath>
      </text>
      <text x="60" y="56" textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#16224e" fontFamily="Georgia, serif">CERTIFIED</text>
      <text x="60" y="70" textAnchor="middle" fontSize="8" fill="#cba044">★ ★ ★</text>
    </svg>
  );
}

function CertificateCanvas({ cert }) {
  const delivery = DELIVERY_TEXT[cert.delivery_mode] || "classroom";
  const dateText = certificateDateText(cert.start_date, cert.end_date);
  return (
    <Box
      className="certificate-canvas relative bg-white overflow-hidden shadow-xl"
      style={{ width: CERT_W, height: CERT_H, fontFamily: "Georgia, 'Times New Roman', serif" }}
    >
      {/* Decorative ribbons + faint guilloche arcs */}
      <svg className="absolute inset-0" width={CERT_W} height={CERT_H} viewBox={`0 0 ${CERT_W} ${CERT_H}`} aria-hidden="true">
        <g opacity="0.05" stroke="#16224e" fill="none">
          <circle cx="720" cy="360" r="140" />
          <circle cx="720" cy="360" r="185" />
          <circle cx="720" cy="360" r="230" />
          <circle cx="720" cy="360" r="275" />
        </g>
        {/* top-left */}
        <polygon points="0,0 255,0 0,255" fill="#16224e" />
        <polygon points="0,0 150,0 0,150" fill="#2f6fd0" />
        <polygon points="0,0 70,0 0,70" fill="#e23b3b" />
        <polyline points="262,0 0,262" stroke="#cba044" strokeWidth="3" fill="none" />
        {/* bottom-right */}
        <polygon points="1000,707 745,707 1000,452" fill="#16224e" />
        <polygon points="1000,707 855,707 1000,557" fill="#2f6fd0" />
        <polyline points="738,707 1000,445" stroke="#cba044" strokeWidth="3" fill="none" />
      </svg>

      {/* Logo (top center) */}
      <Box className="absolute top-[42px] left-1/2 -translate-x-1/2 text-center">
        <Box as="span" className="text-[30px] font-extrabold tracking-tight text-[#16224e] lowercase" style={{ fontFamily: "Arial, sans-serif" }}>
          inv<Box as="span" className="text-[#e23b3b]">e</Box>nsis
          <Box as="span" className="align-super text-[11px] text-[#16224e]">®</Box>
        </Box>
        <Box as="p" className="text-[9px] tracking-[0.35em] uppercase text-slate-400 mt-0.5" style={{ fontFamily: "Arial, sans-serif" }}>
          Global Learning Services
        </Box>
      </Box>

      {/* Seal (top right) */}
      <Box className="absolute top-[40px] right-[64px]">
        <Seal />
      </Box>

      {/* Center content */}
      <Box className="absolute inset-x-0 top-[150px] flex flex-col items-center text-center px-[130px]">
        <Box as="h2" className="text-[58px] leading-none tracking-[0.16em] font-semibold text-[#1f2d5c]">CERTIFICATE</Box>
        <Box className="flex items-center gap-3 mt-3">
          <Box className="h-px w-16 bg-[#cba044]" />
          <Box as="span" className="text-[15px] tracking-[0.4em] text-[#b98a34] font-semibold">OF TRAINING</Box>
          <Box className="h-px w-16 bg-[#cba044]" />
        </Box>

        <Box as="p" className="mt-9 text-[12px] tracking-[0.3em] uppercase text-slate-400" style={{ fontFamily: "Arial, sans-serif" }}>
          This certificate is presented to
        </Box>
        <Box as="p" className="mt-4 text-[52px] leading-tight text-[#2f8fd0] font-normal" style={{ fontFamily: "'Segoe Script', 'Bradley Hand', 'Brush Script MT', Georgia, cursive" }}>
          {cert.participant_name || "—"}
        </Box>

        <Box as="p" className="mt-5 text-[12px] tracking-[0.3em] uppercase text-slate-400" style={{ fontFamily: "Arial, sans-serif" }}>
          For the successful completion of
        </Box>
        <Box as="p" className="mt-3 text-[27px] text-[#1f2d5c] font-semibold">{cert.title}</Box>
        <Box as="p" className="mt-3 text-[15px] text-slate-500" style={{ fontFamily: "Arial, sans-serif" }}>
          which took place {dateText}, via {delivery}.
        </Box>
      </Box>

      {/* Footer — IDs (left) */}
      <Box className="absolute left-[92px] bottom-[62px] flex gap-[64px]" style={{ fontFamily: "Arial, sans-serif" }}>
        <Box>
          <Box as="p" className="text-[17px] font-bold text-[#16224e] tracking-wide">{cert.activity_id || "—"}</Box>
          <Box as="p" className="text-[11px] text-slate-400 mt-1">Activity ID</Box>
        </Box>
        <Box>
          <Box as="p" className="text-[17px] font-bold text-[#16224e] tracking-wide">{cert.certificate_id || "—"}</Box>
          <Box as="p" className="text-[11px] text-slate-400 mt-1">Certificate ID</Box>
        </Box>
      </Box>

      {/* Footer — signature (right) */}
      <Box className="absolute right-[96px] bottom-[54px] text-center" style={{ fontFamily: "Arial, sans-serif" }}>
        <svg width="168" height="50" viewBox="0 0 168 50" className="mx-auto" aria-hidden="true">
          <path d="M6,38 C24,6 34,46 52,24 S82,-2 98,30 122,44 140,14 160,32 166,28"
            stroke="#16224e" strokeWidth="2.4" fill="none" strokeLinecap="round" />
        </svg>
        <Box className="h-px w-[190px] bg-slate-300 mx-auto mt-1" />
        <Box as="p" className="text-[15px] font-bold text-[#16224e] mt-2">Arvind Rongala</Box>
        <Box as="p" className="text-[11px] text-slate-500">Director, Invensis Inc</Box>
        <Box as="p" className="text-[11px] text-slate-400">www.invensislearning.com</Box>
      </Box>
    </Box>
  );
}

/* Scale-to-fit wrapper for the on-page preview. */
function ScaledCertificate({ cert }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setScale(w / CERT_W);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <Box ref={ref} className="relative w-full" style={{ aspectRatio: `${CERT_W} / ${CERT_H}` }}>
      <Box className="absolute top-0 left-0 origin-top-left" style={{ transform: `scale(${scale})` }}>
        <CertificateCanvas cert={cert} />
      </Box>
    </Box>
  );
}

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
        <Box className="bg-gradient-to-r from-indigo-50 via-purple-50 to-violet-50 border-b border-indigo-100 px-6 py-5">
          <Box className="flex items-center gap-3">
            <Box className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
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
                      ? "bg-indigo-600 text-white border-indigo-600"
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
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 placeholder:text-slate-400 outline-none resize-none focus:border-indigo-400 focus:shadow-[0_0_0_3px_rgba(165,180,252,0.35)] transition-all"
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
          <Button onClick={submit} disabled={submitting || !complete} className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-sm">
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
            <Text as="p" className="text-[10px] uppercase tracking-wide text-slate-400">Activity ID</Text>
            <Text as="p" className="font-mono font-semibold text-slate-700">{cert.activity_id || "—"}</Text>
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
            <Button onClick={() => onGiveFeedback(cert, survey)} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-sm">
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
  const [printCert, setPrintCert] = useState(null);

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

  // Print-to-PDF: reveal the off-screen certificate print root and open the
  // browser print dialog; clean up when printing finishes.
  useEffect(() => {
    if (!printCert) return;
    const body = document.body;
    body.classList.add("printing-certificate");
    const done = () => {
      body.classList.remove("printing-certificate");
      window.removeEventListener("afterprint", done);
      setPrintCert(null);
    };
    window.addEventListener("afterprint", done);
    const t = setTimeout(() => window.print(), 120);
    return () => {
      clearTimeout(t);
      window.removeEventListener("afterprint", done);
      body.classList.remove("printing-certificate");
    };
  }, [printCert]);

  async function handleFeedbackSubmitted(cert) {
    // Refetch certificates + surveys; once the backend has issued the
    // certificate off the submitted survey, auto-download it.
    const fresh = await load();
    const updated = fresh?.certificates.find((c) => c.training_id === cert.training_id);
    if (updated?.issued) setPrintCert(updated);
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
            onDownload={setPrintCert}
            onGiveFeedback={(cert, survey) => setFeedbackTarget({ cert, survey })}
          />
        ))}
      </Box>

      <SurveyDialog target={feedbackTarget} onOpenChange={(v) => !v && setFeedbackTarget(null)} token={token} onSubmitted={handleFeedbackSubmitted} />

      {/* Hidden print root — only visible to the printer (see globals.css). */}
      <Box className="certificate-print-root">
        {printCert && <CertificateCanvas cert={printCert} />}
      </Box>
    </>
  );
}
