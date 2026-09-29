"use client";

/* Shared certificate rendering + PDF generation.
   Extracted verbatim from the learner certificates view so BOTH the learner
   download and the admin download render pixel-identical documents (TASTE.md
   forbids admin importing learner components). No behaviour change. */

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Box from "@/components/ui/box";
import jsPDF from "jspdf";
import QRCode from "qrcode";
import html2canvas from "html2canvas-pro";
import { verifyUrlFor } from "@/lib/verify-url";
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

export {
  documentSpec,
  generateCertificatePdf,
  certificatePdfName,
  ScaledCertificate,
  certificateDateText,
};
