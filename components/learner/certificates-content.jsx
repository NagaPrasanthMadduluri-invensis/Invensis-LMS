"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
import jsPDF from "jspdf";
import QRCode from "qrcode";
/* Printed certificates are scanned long after issue, so the QR must point at a
   public portal, never at whatever host generated the PDF. */
import { verifyUrlFor } from "@/lib/verify-url";
import html2canvas from "html2canvas-pro";
import { formatDate, wallFields } from "@/lib/datetime";

/* ── date / delivery formatting for the certificate line ── */
function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}
// Training dates print exactly as the API sent them — see `lib/datetime`.
// `wallFields` reads the digits straight off the value, so the certificate
// text is the same wherever (and whenever) it is generated.
const monthName = (d) =>
  formatDate(d, { locale: "en-US", month: "long", day: undefined, year: undefined, fallback: "" });

function dayMonthYear(d) {
  const f = wallFields(d);
  if (!f) return "";
  return `${ordinal(f.day)} ${monthName(d)} ${f.year}`;
}
/** "5th, 6th, 12th and 13th" — Oxford-comma-free list, "and" before the last. */
function joinWithAnd(parts) {
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}

/**
 * The days the training actually ran:
 *   "on 5th, 6th, 12th and 13th September 2026"
 *
 * Listed rather than given as a range because a rescheduled cohort skips days —
 * "from 5th to 13th" would claim eight days of training that didn't happen.
 * Dates sharing a month collapse onto one month/year; a run that crosses a
 * month or year boundary spells each date out so neither is ambiguous.
 */
function sessionDatesText(sessionDates) {
  const days = (sessionDates ?? [])
    .map((d) => ({ raw: d, f: wallFields(d) }))
    .filter((x) => x.f)
    .sort((a, b) => a.raw.localeCompare(b.raw));
  if (days.length === 0) return "";

  const sameMonth = days.every(
    (d) => d.f.month === days[0].f.month && d.f.year === days[0].f.year
  );
  if (sameMonth) {
    return `on ${joinWithAnd(days.map((d) => ordinal(d.f.day)))} ${monthName(days[0].raw)} ${days[0].f.year}`;
  }
  return `on ${joinWithAnd(days.map((d) => dayMonthYear(d.raw)))}`;
}

/**
 * Session dates with consecutive runs collapsed, as the attendance letter reads:
 *   "3rd to 6th, 10th to 13th, 17th to 20th, and 24th to 27th September, 2026"
 *
 * Different from the certificate, which lists every day. A letter covering four
 * weeks would otherwise run to sixteen separate ordinals.
 */
function sessionDateRangesText(sessionDates) {
  const days = (sessionDates ?? [])
    .map((d) => ({ raw: d, f: wallFields(d) }))
    .filter((x) => x.f)
    .sort((a, b) => a.raw.localeCompare(b.raw));
  if (days.length === 0) return "";

  const sameMonth = days.every((d) => d.f.month === days[0].f.month && d.f.year === days[0].f.year);
  if (!sameMonth) {
    // Crossing a month: spell each date out rather than collapse across the
    // boundary, where "29th to 2nd" would be unreadable.
    return joinWithAnd(days.map((d) => dayMonthYear(d.raw)));
  }

  // Group consecutive calendar days into runs.
  const runs = [];
  for (const d of days) {
    const last = runs[runs.length - 1];
    if (last && d.f.day === last[last.length - 1].f.day + 1) last.push(d);
    else runs.push([d]);
  }
  const parts = runs.map((run) =>
    run.length === 1
      ? ordinal(run[0].f.day)
      : `${ordinal(run[0].f.day)} to ${ordinal(run[run.length - 1].f.day)}`
  );
  // Oxford comma before the final "and", matching the reference letter.
  const list = parts.length > 1
    ? `${parts.slice(0, -1).join(", ")}, and ${parts[parts.length - 1]}`
    : parts[0];
  return `${list} ${monthName(days[0].raw)}, ${days[0].f.year}`;
}

/** Fallback for a certificate with no session dates recorded. */
function certificateDateText(start, end) {
  const s = wallFields(start);
  const e = wallFields(end);
  if (!s) return "";
  if (!e || start === end) return `on ${dayMonthYear(start)}`;
  if (s.month === e.month && s.year === e.year) {
    return `from ${ordinal(s.day)} to ${ordinal(e.day)} ${monthName(end)} ${e.year}`;
  }
  return `from ${dayMonthYear(start)} to ${dayMonthYear(end)}`;
}
const DELIVERY_TEXT = {
  virtual: "online classroom",
  in_person: "in-person classroom",
  hybrid: "hybrid classroom",
  one_to_one: "one-to-one coaching session",
};

/* ── Certificate → PDF ──────────────────────────────────────────
   Rasterize the rendered certificate node with html2canvas-pro (which
   understands the oklch() colors Tailwind 4 emits, unlike classic
   html2canvas) and lay the image onto a single landscape page with jsPDF.
   Returns a PDF Blob the caller can preview and/or download. */
function waitForImages(node) {
  const imgs = Array.from(node.querySelectorAll("img"));
  return Promise.all(
    imgs.map((img) =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.addEventListener("load", resolve, { once: true });
            img.addEventListener("error", resolve, { once: true });
          })
    )
  );
}

async function generateCertificatePdf(node, { width, height, scale = 2 } = {}) {
  const w = width || node.offsetWidth;
  const h = height || node.offsetHeight;

  // Ensure webfonts + artwork are ready before snapshotting the node.
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try { await document.fonts.ready; } catch { /* non-fatal */ }
  }
  await waitForImages(node);

  const canvas = await html2canvas(node, {
    scale,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    width: w,
    height: h,
    windowWidth: w,
    windowHeight: h,
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF({
    orientation: w >= h ? "landscape" : "portrait",
    unit: "px",
    format: [w, h],
  });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  pdf.addImage(imgData, "PNG", 0, 0, pageW, pageH);
  return pdf.output("blob");
}

/**
 * Which document this credential is, and the canvas size it renders at.
 *
 * A Letter of Course Attendance is portrait A4; the Certificate of Training is
 * landscape. Both the preview scaler and the PDF capture read their dimensions
 * from here, so the two can never disagree about the page size.
 */
function documentSpec(cert) {
  const isLetter = cert?.credential_type === "attendance_letter";
  return isLetter
    ? { isLetter: true, Canvas: AttendanceLetterCanvas, width: LETTER_W, height: LETTER_H }
    : { isLetter: false, Canvas: CertificateCanvas, width: CERT_W, height: CERT_H };
}

function certificatePdfName(cert) {
  const base = (cert?.title || "certificate")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  const kind = cert?.credential_type === "attendance_letter" ? "letter-of-attendance" : "certificate";
  return `${base || "certificate"}-${kind}.pdf`;
}

/* ═══════════════════════════════════════════════════════════════
   The certificate itself — a fixed 1000×707 "canvas" recreated with
   SVG/CSS (no external assets). Rendered scaled-to-fit for the on-page
   preview and at full size inside the hidden print root for download.
   ═══════════════════════════════════════════════════════════════ */
/**
 * QR as a data-URL PNG.
 *
 * Rendered to an <img> rather than an SVG or <canvas> because html2canvas-pro
 * rasterises a loaded image reliably, and `waitForImages` already blocks the
 * PDF until every image has settled — an SVG QR can come out blank.
 * Error-correction level M so a scuffed print still scans.
 */
function useQrDataUrl(code) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!code) { setUrl(null); return; }
    let cancelled = false;
    QRCode.toDataURL(verifyUrlFor(code), {
      margin: 0,
      width: 300,
      errorCorrectionLevel: "M",
      color: { dark: "#16224e", light: "#ffffff" },
    })
      .then((u) => { if (!cancelled) setUrl(u); })
      .catch(() => { if (!cancelled) setUrl(null); });
    return () => { cancelled = true; };
  }, [code]);
  return url;
}

/* Printed-document palette.
   Sampled from the reference certificate PDF, which uses #12143d for the
   printed identifiers — the same navy as the Invensis mark — and a near-black
   (#070706) for the body copy. Pure #000 is used here for that copy, as
   specified; the two are visually indistinguishable in print.

   Declared once and shared by both documents so the Certificate of Training
   and the Letter of Course Attendance cannot drift apart. */
/* Certificate typography — the three families the reference PDF embeds
   (confirmed with `pdffonts`: Montserrat Regular/SemiBold/Bold, MongolianBaiti,
   Mulish-Regular).

   Montserrat and Mulish are self-hosted by next/font (see app/layout.js), so
   they are guaranteed present when html2canvas-pro rasterises the page.

   The TITLE keeps the serif it always had. Mongolian Baiti was tried and
   dropped: it is a Microsoft system font, absent from Google Fonts and not
   redistributable, so it could only be named — it would render on Windows and
   fall back to something else everywhere else, and the certificate is
   rasterised in the LEARNER's browser, not ours. Georgia is present on every
   mainstream platform, so every learner gets the same title. */
/* Printed at the very bottom of every document. Fixed wording — it explains
   why there is no signature, which the QR replaced. */
const DIGITAL_NOTICE =
  "This certificate is digitally generated and does not require a signature. Scan the QR code to verify its authenticity";

/* Attribution for a trademarked scheme, on the Letter of Course Attendance.
   Only the mark itself is admin-entered; this sentence is fixed. */
const trademarkLine = (mark) =>
  `${mark} is a trademark of the PeopleCert group.\nUsed under PeopleCert. All rights reserved.`;

const FONT_TITLE = "Georgia, 'Times New Roman', serif";
const FONT_NAME = "var(--font-mulish), 'Mulish', 'Segoe UI', sans-serif";
const FONT_BODY = "var(--font-montserrat), 'Montserrat', 'Segoe UI', Arial, sans-serif";

const INK_BLACK = "text-[#000000]";   // labels + prose
/* #1b4689, sampled from the glyph cores of the reference certificate's own
   identifier row (pdftoppm at 200dpi, dominant ink colour). Earlier attempts
   used the mark's navy #12143d, which measures L*=8.7 and reads as plain black
   against white — the reference is L*=30.4 and is unmistakably blue, which is
   the whole point of colouring these fields. */
const INK_NAVY = "text-[#1b4689]";    // printed identifiers
/* The document title. Sampled from the reference the same way: "CERTIFICATE"
   is #10143d and "OF TRAINING" #12133d — the same navy either side of
   antialiasing, NOT the gold this used to render the subtitle in. Only the
   rules flanking the subtitle are gold there. Shared by the word and the
   subtitle so they stay identical. */
const INK_TITLE = "text-[#10143d]";   // document title

const CERT_W = 1000;
const CERT_H = 707;

/* Corner artwork.
   Sized by WIDTH, not height. Scaling these to the full canvas height made them
   ~302px wide — roughly double the reference and visually dominant. Measured off
   the reference certificate (1066x752), the corner art occupies 15.8% of the
   width on the left and 11.6% on the right, so the widths are taken from those
   percentages and each height follows the PNG's own ratio (538x1259, 401x920).
   Nothing is stretched, and they read as corner accents rather than full-bleed
   bands. */
const CORNER_TL_W = Math.round(0.158 * CERT_W);                    // 158
const CORNER_TL_H = Math.round((1259 / 538) * CORNER_TL_W);        // 370
/* The bottom-right art is kept narrow deliberately: its coloured band begins
   ~28% in, i.e. at x≈916, which clears the QR code's right edge at x=904. */
const CORNER_BR_W = Math.round(0.116 * CERT_W);                    // 116
const CORNER_BR_H = Math.round((920 / 401) * CORNER_BR_W);         // 266


/* ── Centre-block geometry ──
   The centre block is absolutely placed and grows *downward*, while the QR and
   the PMI mark are pinned to the footer. A cohort that ran on a dozen separate
   days makes the "which took place …" line wrap to three or four lines, and it
   used to run straight across the QR — an overprinted QR won't scan, so the
   certificate loses the verification it exists to carry.

   `CENTER_BOTTOM` is the floor the block has to stay above. The QR box starts
   at y≈510 and the PMI mark at y≈527, so this leaves a clear band between the
   text and both of them. */
const CENTER_TOP = 150;
const CENTER_BOTTOM = 496;
const DATES_FONT = 15;

/*
 * Fit the centre block above the footer.
 *
 * One knob, `t` (0 = the design as drawn, 1 = as tight as it goes), driving the
 * three things that can give: the vertical rhythm between the lines, the size
 * of the dates line (the only part whose length varies), and how far up the
 * whole block sits. Stepping them together means a certificate that is barely
 * too tall is nudged rather than visibly squashed — at t≈0.1 nothing reads as
 * different, and only a genuinely enormous session list reaches the end.
 *
 * Deliberately layout (margins / font-size / top) rather than a
 * `transform: scale()`: the PDF is a html2canvas-pro raster of this same node,
 * and plain layout rasterises predictably where a nested transform does not.
 * Written straight to the DOM in a layout effect rather than through state, so
 * there's no second render pass and nothing to flash before the capture runs.
 */
function useFitCenterBlock(centerRef, datesRef, deps) {
  useLayoutEffect(() => {
    const box = centerRef.current;
    if (!box) return;

    const apply = (t) => {
      // `--fit` scales every mt-[calc(…)] gap inside the block at once.
      box.style.setProperty("--fit", String(1 - 0.45 * t));
      box.style.top = `${CENTER_TOP - 38 * t}px`;
      if (datesRef.current) datesRef.current.style.fontSize = `${DATES_FONT - 4.5 * t}px`;
    };

    for (let t = 0; t <= 1.0001; t += 0.05) {
      apply(t);
      // offsetHeight/offsetTop, not a client rect: the on-page preview scales
      // the whole certificate with a transform, and these stay in layout px.
      if (box.offsetTop + box.offsetHeight <= CENTER_BOTTOM) break;
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps
}

/* A4 portrait at the same 2x scale the landscape certificate uses. */
const LETTER_W = 707;
const LETTER_H = 1000;

/* Letter corner artwork. One asset (102x172) used at both corners — the
   bottom-right copy is the same image rotated 180°, which is what the old SVG
   wedges did by mirroring their points. Width matches the wedge it replaces
   (118px, ~17% of the page); the height follows the PNG's own ratio so it is
   never stretched. */
const LETTER_CORNER_W = 118;
const LETTER_CORNER_H = Math.round((172 / 102) * LETTER_CORNER_W);   // 199

/**
 * Letter of Course Attendance.
 *
 * A different document from the Certificate of Training, not a variant of it:
 * portrait, prose rather than display type, and it states plainly that no
 * qualification is being certified. Issued when the awarding body examines the
 * learner (see `credential_type`), so Invensis can only attest attendance.
 */
function AttendanceLetterCanvas({ cert }) {
  const mode = cert.mode_of_training || DELIVERY_TEXT[cert.delivery_mode] || "classroom";
  const dates = sessionDateRangesText(cert.session_dates)
    || certificateDateText(cert.start_date, cert.end_date).replace(/^(on|from) /, "");
  const qrUrl = useQrDataUrl(cert.certificate_id);

  return (
    <Box
      className="certificate-canvas relative bg-white overflow-hidden shadow-xl"
      style={{ width: LETTER_W, height: LETTER_H, fontFamily: FONT_BODY }}
    >
      {/* Blue corner ribbons, top-left and bottom-right */}
      {/* Corner artwork — the supplied PNG, replacing the hand-drawn SVG wedges.
          PNG rather than SVG for the same reason as the certificate: html2canvas-pro
          rasterises a loaded raster reliably. Decorative only, so aria-hidden, and
          first in the DOM so the letter's text paints over it. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/letter-corner.png"
        alt=""
        aria-hidden="true"
        width={LETTER_CORNER_W}
        height={LETTER_CORNER_H}
        className="pointer-events-none absolute left-0 top-0 select-none"
      />
      {/* Same asset rotated 180°, exactly as the old wedges mirrored their points. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/letter-corner.png"
        alt=""
        aria-hidden="true"
        width={LETTER_CORNER_W}
        height={LETTER_CORNER_H}
        className="pointer-events-none absolute right-0 bottom-0 rotate-180 select-none"
      />

      {/* Title + logo */}
      <Box className="absolute inset-x-0 top-[110px] flex flex-col items-center">
        <Box as="p" className={`text-[15px] tracking-[0.18em] ${INK_TITLE}`}>LETTER OF COURSE ATTENDANCE</Box>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {/* PNG, not the SVG, deliberately. html2canvas-pro rasterises a loaded
            raster image reliably; handing it an SVG makes the output depend on
            that rasteriser honouring the viewBox, and when it doesn't the mark
            renders as a solid block of its own fill colour. The PNG is a 10x
            render of the same SVG, so it is identical artwork at 1528x372 —
            far more than the ~500px this box needs at capture scale 2. */}
        <img src="/invensis-learning-logo.png" alt="Invensis Learning" width={250} height={61} className="mt-9 block" />
      </Box>

      {/* Body */}
      <Box className="absolute left-[80px] right-[80px] top-[350px]">
        <Box as="p" className={`text-[14.5px] leading-[1.75] text-justify ${INK_BLACK}`}>
          This letter is to verify that{" "}
          <Box as="span" className="font-bold">{cert.participant_name || "—"}</Box>{" "}
          has attended the{" "}
          <Box as="span" className="font-bold">{cert.title}</Box>{" "}
          (Training ID:{" "}
          <Box as="span" className={`font-bold ${INK_NAVY}`}>{cert.training_id || "—"}</Box>
          ), which took place {dates ? `from ${dates}` : ""} via {mode}.
        </Box>

        {/* The disclaimer is the point of the document — bold, in quotes, as issued. */}
        <Box as="p" className={`mt-9 text-[14.5px] leading-[1.75] font-bold text-justify ${INK_BLACK}`}>
          &lsquo;This is a letter confirming course attendance only and is not a document demonstrating or
          certifying the achievement of any qualification in the subject matter of the training course&rsquo;.
        </Box>

        <Box as="p" className={`mt-[70px] text-[14.5px] ${INK_BLACK}`}>On behalf of Invensis Learning.</Box>

        {/* QR in place of the signature, as on the certificate */}
        <Box className="mt-7">
          {qrUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={qrUrl} alt={`Scan to verify ${cert.certificate_id}`} width={104} height={104} className="block" />
          ) : (
            <Box className="h-[104px] w-[104px] bg-slate-100" />
          )}
          <Box as="p" className="mt-2 text-[12px] font-bold text-[#1a2b45]">Scan to verify</Box>
        </Box>
      </Box>

      {/* Foot of the page, centred. The trademark attribution appears only when
          an admin has entered a mark — a half-written attribution would be
          worse than none. The digital-generation notice always prints. */}
      <Box className="absolute inset-x-[80px] bottom-[42px] text-center">
        {cert.trademark_name && (
          <Box as="p" className={`whitespace-pre-line text-[11.5px] leading-[1.6] ${INK_BLACK}`}>
            {trademarkLine(cert.trademark_name)}
          </Box>
        )}
        <Box as="p" className={`text-[8px] leading-[1.4] text-slate-400 ${cert.trademark_name ? "mt-5" : ""}`}>
          {DIGITAL_NOTICE}
        </Box>
      </Box>
    </Box>
  );
}

function CertificateCanvas({ cert }) {
  // Wording is admin-selected on the training; the local map is only a fallback
  // for a certificate issued before that field existed.
  const delivery = cert.mode_of_training || DELIVERY_TEXT[cert.delivery_mode] || "classroom";
  // Prefer the real session days; fall back to the range only when a schedule
  // never recorded them.
  const dateText =
    sessionDatesText(cert.session_dates) || certificateDateText(cert.start_date, cert.end_date);
  const pdus = cert.pdus ?? null;
  const qrUrl = useQrDataUrl(cert.certificate_id);
  const centerRef = useRef(null);
  const datesRef = useRef(null);
  useFitCenterBlock(centerRef, datesRef, [dateText, delivery, cert.title, cert.participant_name]);
  return (
    <Box
      className="certificate-canvas relative bg-white overflow-hidden shadow-xl"
      style={{ width: CERT_W, height: CERT_H, fontFamily: FONT_BODY }}
    >
      {/* Full-bleed background. The asset is 3511x2482 (aspect 1.415) against a
          1000x707 canvas (1.414), so it maps edge to edge with no distortion
          and no cropping. First in the DOM, so the corner artwork and every
          piece of text paint over it. The canvas keeps `bg-white` underneath,
          which is what the PDF capture falls back to if the image ever fails
          to load — a certificate must never render on a transparent page.

          This is the Certificate of Training only. The Letter of Course
          Attendance is portrait (707x1000) and stays plain white; stretching a
          landscape background onto it would visibly distort the pattern. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/certificate-background.png"
        alt=""
        aria-hidden="true"
        width={CERT_W}
        height={CERT_H}
        className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
      />

      {/* Corner artwork — supplied PNGs, replacing the SVG ribbons that were
          drawn by hand. Both assets carry ink across their whole height, so
          each is anchored to its corner and sized from the reference's own
          proportions (see the CORNER_* constants).
          PNG rather than SVG on purpose: html2canvas-pro rasterises a loaded
          raster reliably, whereas an SVG's output depends on the rasteriser
          honouring its viewBox.

          They sit first in the DOM so every piece of text paints over them. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/certificate-corner-tl.png"
        alt=""
        aria-hidden="true"
        width={CORNER_TL_W}
        height={CORNER_TL_H}
        className="pointer-events-none absolute left-0 top-0 select-none"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/certificate-corner-br.png"
        alt=""
        aria-hidden="true"
        width={CORNER_BR_W}
        height={CORNER_BR_H}
        className="pointer-events-none absolute right-0 bottom-0 select-none"
      />

      {/* Logo (top center) */}
      <Box className="absolute top-[44px] left-1/2 -translate-x-1/2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/invensis-learning-logo.png" alt="Invensis Learning" width={210} height={51} className="block" />
      </Box>

      {/* Certified badge (top right), with the PDU count beneath it */}
      <Box className="absolute top-[36px] right-[60px] flex flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/certified-badge.png" alt="Invensis Learning Certified" width={118} height={118} className="block" />
        {pdus != null && (
          /* Gold "35 PDUs" pill, matched to the certified seal above it.
             Built from stacked gradient layers rather than one background with
             an inset shadow: html2canvas-pro rasterises linear-gradients
             faithfully but drops inset box-shadows, so the sheen has to be a
             real element or it vanishes from the downloaded PDF. */
          <Box className="relative mt-1 overflow-hidden rounded-full ring-1 ring-[#8f5f14]/60">
            {/* Base metal, graded LEFT TO RIGHT. Previously this ran top-to-
                bottom with a bright stop at 50%, which painted a light stripe
                straight across the middle of the pill — the banding has to run
                the same way as the glaze or the two cross and produce that
                stripe. */}
            <Box
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg,#8f5f14 0%,#c7942f 12%,#e8c45a 30%,#f7e694 46%,#e0b34e 62%,#c7942f 80%,#8f5f14 100%)",
              }}
            />
            {/* Glaze: a soft sheen travelling left to right, peaking just past
                the middle where the base is brightest, so the highlight lands
                on the metal's own light band instead of fighting it. */}
            <Box
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,255,255,0.30) 30%,rgba(255,255,255,0.55) 46%,rgba(255,255,255,0.18) 66%,rgba(255,255,255,0) 100%)",
              }}
            />
            <Box
              as="span"
              className="relative block px-4 py-[3px] text-[13px] font-bold text-[#4a3105]"
              style={{ fontFamily: FONT_BODY }}
            >
              {pdus} PDUs
            </Box>
          </Box>
        )}
      </Box>

      {/* Center content — `top` is owned by useFitCenterBlock (see above). */}
      <Box
        ref={centerRef}
        className="absolute inset-x-0 flex flex-col items-center text-center px-[130px]"
        style={{ top: CENTER_TOP }}
      >
        <Box as="h2" className={`text-[58px] leading-none tracking-[0.16em] font-normal ${INK_TITLE}`} style={{ fontFamily: FONT_TITLE }}>CERTIFICATE</Box>
        <Box className="flex items-center gap-3 mt-[calc(12px*var(--fit,1))]">
          <Box className="h-px w-16 bg-[#cba044]" />
          <Box as="span" className={`text-[15px] tracking-[0.4em] font-normal ${INK_TITLE}`} style={{ fontFamily: FONT_TITLE }}>OF TRAINING</Box>
          <Box className="h-px w-16 bg-[#cba044]" />
        </Box>

        <Box as="p" className={`mt-[calc(20px*var(--fit,1))] text-[12px] tracking-[0.18em] uppercase ${INK_BLACK}`} style={{ fontFamily: FONT_BODY }}>
          This certificate is presented to
        </Box>
        <Box as="p" className="mt-[calc(16px*var(--fit,1))] text-[44px] leading-tight text-[#2f8fd0] font-normal" style={{ fontFamily: FONT_NAME }}>
          {cert.participant_name || "—"}
        </Box>

        <Box as="p" className={`mt-[calc(20px*var(--fit,1))] text-[12px] tracking-[0.18em] uppercase ${INK_BLACK}`} style={{ fontFamily: FONT_BODY }}>
          For the successful completion of
        </Box>
        <Box as="p" className="mt-[calc(12px*var(--fit,1))] text-[27px] text-[#1f2d5c] font-normal">{cert.title}</Box>
        {/* Pulled a little wider than the block's padding: a long session list
            wraps to fewer lines, which is what keeps it clear of the QR. Font
            size is owned by useFitCenterBlock. */}
        <Box
          as="p"
          ref={datesRef}
          className={`mt-[calc(12px*var(--fit,1))] -mx-[34px] leading-[1.5] ${INK_BLACK}`}
          style={{ fontFamily: FONT_BODY, fontSize: DATES_FONT }}
        >
          which took place {dateText}, via {delivery}.
        </Box>
      </Box>

      {/* PMI registered mark — certification courses only */}
      {cert.is_certification && (
        <Box className="absolute left-[92px] bottom-[128px] flex items-center gap-3" style={{ fontFamily: FONT_BODY }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/pmi-logo.png"
            alt=""
            width={52}
            height={52}
            className="block rounded-full object-contain"
            // The mark is optional artwork: if the asset is absent the wording
            // still prints rather than leaving a broken image on a certificate.
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <Box>
            <Box as="p" className="text-[12px] text-slate-600 leading-snug">
              PMP<sup>®</sup> is registered mark of
            </Box>
            <Box as="p" className="text-[12px] text-slate-600 leading-snug">
              Project Management Institute. inc
            </Box>
          </Box>
        </Box>
      )}

      {/* Footer — printed identifiers (left) */}
      <Box className="absolute left-[92px] bottom-[56px] flex gap-[46px]" style={{ fontFamily: FONT_BODY }}>
        <Box>
          <Box as="p" className={`text-[17px] font-bold tracking-wide ${INK_NAVY}`}>{cert.training_id || "—"}</Box>
          <Box as="p" className={`text-[12.5px] mt-1 ${INK_BLACK}`}>Training ID</Box>
        </Box>
        <Box>
          <Box as="p" className={`text-[17px] font-bold tracking-wide ${INK_NAVY}`}>{cert.certificate_id || "—"}</Box>
          <Box as="p" className={`text-[12.5px] mt-1 ${INK_BLACK}`}>Certificate ID</Box>
        </Box>
        <Box>
          <Box as="p" className={`text-[17px] font-bold tracking-wide ${INK_NAVY}`}>{cert.course_identifier || "—"}</Box>
          <Box as="p" className={`text-[12.5px] mt-1 ${INK_BLACK}`}>Course Identifier</Box>
        </Box>
        {cert.pdu_claim_code && (
          <Box>
            <Box as="p" className={`text-[17px] font-bold tracking-wide ${INK_NAVY}`}>{cert.pdu_claim_code}</Box>
            <Box as="p" className={`text-[12.5px] mt-1 ${INK_BLACK}`}>PDU Claim Code</Box>
          </Box>
        )}
      </Box>

      {/* Footer — verification QR (right), in place of the signature block.
          Encodes the public verify URL for this certificate's ID. */}
      <Box className="absolute right-[96px] bottom-[54px] text-center" style={{ fontFamily: FONT_BODY }}>
        {qrUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={qrUrl} alt={`Scan to verify certificate ${cert.certificate_id}`} width={104} height={104} className="mx-auto block" />
        ) : (
          <Box className="mx-auto h-[104px] w-[104px] bg-slate-100" />
        )}
        <Box as="p" className="text-[11px] font-semibold text-[#16224e] mt-2">Scan to verify</Box>
      </Box>

      {/* Foot of the page, centred — the same notice the Letter of Course
          Attendance carries, so both documents explain the missing signature
          the same way. No trademark line here: that attribution belongs to the
          attendance letter. */}
      <Box className="absolute inset-x-[92px] bottom-[20px] text-center">
        <Box as="p" className="text-[8px] leading-[1.4] text-slate-400">{DIGITAL_NOTICE}</Box>
      </Box>
    </Box>
  );
}

/* Scale-to-fit wrapper for the on-page preview. */
function ScaledCertificate({ cert }) {
  const ref = useRef(null);
  const [scale, setScale] = useState(0);
  const { Canvas, width, height } = documentSpec(cert);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setScale(w / width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  return (
    <Box ref={ref} className="relative w-full" style={{ aspectRatio: `${width} / ${height}` }}>
      <Box className="absolute top-0 left-0 origin-top-left" style={{ transform: `scale(${scale})` }}>
        <Canvas cert={cert} />
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
  // Certificate currently being turned into a PDF (rendered off-screen for capture).
  const [captureCert, setCaptureCert] = useState(null);
  // Generated PDF ready to preview/download: { url, name }.
  const [pdf, setPdf] = useState(null);
  const [pdfError, setPdfError] = useState(null);
  const captureRef = useRef(null);

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

  // Generate the PDF: once the off-screen certificate for `captureCert` has
  // rendered, rasterize it and build a downloadable PDF blob. The viewer
  // dialog opens immediately (showing a spinner) and swaps to the PDF here.
  useEffect(() => {
    if (!captureCert) return;
    let cancelled = false;
    setPdf(null);
    setPdfError(null);
    (async () => {
      // Let the off-screen canvas paint before we snapshot it.
      await new Promise((r) => requestAnimationFrame(() => r()));
      const node = captureRef.current?.querySelector(".certificate-canvas");
      if (!node) {
        if (!cancelled) setPdfError("Certificate could not be rendered.");
        return;
      }
      try {
        const { width, height } = documentSpec(captureCert);
        const blob = await generateCertificatePdf(node, { width, height });
        if (cancelled) return;
        const url = URL.createObjectURL(blob);
        setPdf({ url, name: certificatePdfName(captureCert) });
      } catch (e) {
        if (!cancelled) setPdfError(e?.message || "Could not generate the certificate PDF.");
      }
    })();
    return () => { cancelled = true; };
  }, [captureCert]);

  // Close the viewer and release the blob URL.
  const closeViewer = useCallback(() => {
    setPdf((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
    setPdfError(null);
    setCaptureCert(null);
  }, []);

  async function handleFeedbackSubmitted(cert) {
    // Refetch certificates + surveys; once the backend has issued the
    // certificate off the submitted survey, auto-download it.
    const fresh = await load();
    const updated = fresh?.certificates.find((c) => c.training_id === cert.training_id);
    if (updated?.issued) setCaptureCert(updated);
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
            onDownload={setCaptureCert}
            onGiveFeedback={(cert, survey) => setFeedbackTarget({ cert, survey })}
          />
        ))}
      </Box>

      <SurveyDialog target={feedbackTarget} onOpenChange={(v) => !v && setFeedbackTarget(null)} token={token} onSubmitted={handleFeedbackSubmitted} />

      {/* PDF viewer + download dialog. */}
      <CertificatePdfDialog
        open={!!captureCert}
        pdf={pdf}
        error={pdfError}
        title={captureCert?.title}
        onClose={closeViewer}
      />

      {/* Off-screen capture root — parked off-canvas (see globals.css) so the
          certificate is laid out for html2canvas but never visible on screen. */}
      <Box ref={captureRef} className="certificate-print-root" aria-hidden="true">
        {captureCert && (() => {
          const { Canvas } = documentSpec(captureCert);
          return <Canvas cert={captureCert} />;
        })()}
      </Box>
    </>
  );
}

/* ── PDF viewer dialog ──
   Shows a spinner while the PDF is generated, then embeds it in the browser's
   native PDF viewer and offers a direct download. */
function CertificatePdfDialog({ open, pdf, error, title, onClose }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[1400px] w-[95vw]">
        <DialogHeader>
          <DialogTitle>Your certificate{title ? ` — ${title}` : ""}</DialogTitle>
          <DialogDescription>
            {error
              ? "We couldn't prepare your certificate."
              : pdf
                ? "Preview your certificate below, then download it as a PDF."
                : "Preparing your certificate…"}
          </DialogDescription>
        </DialogHeader>

        <Box className="mt-2">
          {error ? (
            <Box className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </Box>
          ) : pdf ? (
            <iframe
              src={pdf.url}
              title="Certificate PDF"
              className="w-full h-[78vh] rounded-lg border border-slate-200 bg-slate-50"
            />
          ) : (
            <Box className="flex h-[78vh] flex-col items-center justify-center gap-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
              <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
              <Text as="p" className="text-sm">Generating your certificate PDF…</Text>
            </Box>
          )}
        </Box>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
          {pdf && (
            <Button
              render={<a href={pdf.url} download={pdf.name} />}
              className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white border-0"
            >
              <Download className="h-4 w-4 shrink-0" />
              <Text as="span" className="text-sm font-medium text-white">Download PDF</Text>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
