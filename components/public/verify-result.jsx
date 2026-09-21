"use client";

/*
 * Certificate verification result.
 *
 * Mirrors the four states in the reference design:
 *   1. Verified certificate, PMI course with PDUs   → PDU seal + accreditation
 *   2. Verified certificate, no PDUs                → same card, seal omitted
 *   3. Letter of Course Attendance                  → not issued by this system
 *   4. Not found                                    → the empty state
 *
 * Nothing here is behind auth, so it shows only what is already printed on the
 * certificate face — never an email, participant id, or anything about the
 * order that paid for it.
 */

import { CheckCircle2, XCircle, ShieldCheck, Share2, Link2 } from "lucide-react";
import { useState } from "react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { formatDate, formatInstantDate, wallFields } from "@/lib/datetime";

/* Ordinal day list: "5th, 6th, 12th and 13th September 2026". Same wording as
   the certificate itself, so the two can be read side by side. */
function ordinal(n) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}
function joinWithAnd(parts) {
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
}
function trainingDatesText(sessionDates, start, end) {
  const days = (sessionDates ?? [])
    .map((d) => ({ raw: d, f: wallFields(d) }))
    .filter((x) => x.f)
    .sort((a, b) => a.raw.localeCompare(b.raw));
  if (days.length === 0) {
    return start ? `${formatDate(start)} – ${formatDate(end)}` : "—";
  }
  const sameMonth = days.every((d) => d.f.month === days[0].f.month && d.f.year === days[0].f.year);
  const monthYear = formatDate(days[0].raw, {
    locale: "en-US", month: "long", day: undefined, year: undefined, fallback: "",
  });
  if (sameMonth) {
    return `${joinWithAnd(days.map((d) => ordinal(d.f.day)))} ${monthYear} ${days[0].f.year}`;
  }
  return joinWithAnd(days.map((d) => formatDate(d.raw)));
}

function initialsOf(name) {
  return String(name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "?";
}

function Detail({ label, value, mono = false, full = false }) {
  return (
    <Box className={full ? "sm:col-span-2" : ""}>
      <Text as="p" className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</Text>
      <Text as="p" className={`text-sm text-slate-800 mt-0.5 ${mono ? "font-mono" : ""}`}>{value || "—"}</Text>
    </Box>
  );
}

/* ── State 4 — nothing matched ── */
export function VerifyNotFound({ query }) {
  return (
    <Box className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
      <Box className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
        <XCircle className="h-7 w-7 text-red-600" />
      </Box>
      <Text as="h3" className="mt-4 text-lg font-bold text-slate-900">No certificate found</Text>
      <Text as="p" className="mx-auto mt-2 max-w-xl text-sm text-slate-600">
        We couldn&apos;t locate a credential matching{" "}
        <Text as="strong" className="font-semibold text-slate-800">{query || "that ID"}</Text>. Please
        double-check the ID printed on your certificate — a valid Certificate ID begins with{" "}
        <Text as="strong" className="font-semibold text-slate-800">INVLJA</Text>, and a Training ID begins with{" "}
        <Text as="strong" className="font-semibold text-slate-800">TRN</Text>.
      </Text>
      <Text as="p" className="mt-4 text-xs text-slate-500">
        Still can&apos;t verify? Email{" "}
        <Text as="a" href="mailto:support@invensislearning.com" className="font-medium text-[#1553a3] hover:underline">
          support@invensislearning.com
        </Text>
      </Text>
    </Box>
  );
}

/* ── States 1 & 2 — verified ── */
export function VerifiedCertificate({ certificate: c }) {
  const [copied, setCopied] = useState(false);
  const dates = trainingDatesText(c.session_dates, c.start_date, c.end_date);

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked (insecure origin / denied) — the URL is on screen anyway */
    }
  }

  return (
    <Box className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Banner */}
      <Box className="flex flex-wrap items-start justify-between gap-4 bg-[#0b2e5c] px-6 py-5">
        <Box className="min-w-0">
          <Box className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
            <CheckCircle2 className="h-3 w-3" /> Verified · Certificate of Training
          </Box>
          <Text as="h2" className="mt-2 text-xl font-bold text-white">{c.course_title}</Text>
          <Text as="p" className="mt-0.5 text-xs text-slate-300">
            Certificate ID · <Text as="span" className="font-mono">{c.certificate_id}</Text>
            {"  ·  "}Training ID · <Text as="span" className="font-mono">{c.training_id}</Text>
          </Text>
        </Box>
        {/* PDU seal — state 1 only; a non-PDU course simply omits it. */}
        {c.pdus != null && (
          <Box className="flex h-[74px] w-[74px] shrink-0 flex-col items-center justify-center rounded-full text-[#4a3105] ring-2 ring-[#8f5f14]/50"
               style={{ background: "linear-gradient(90deg,#8f5f14 0%,#c7942f 12%,#e8c45a 30%,#f7e694 46%,#e0b34e 62%,#c7942f 80%,#8f5f14 100%)" }}>
            <Text as="span" className="text-xl font-extrabold leading-none">{c.pdus}</Text>
            <Text as="span" className="text-[10px] font-bold tracking-wide">PDUs</Text>
          </Box>
        )}
      </Box>

      {/* Holder */}
      <Box className="flex items-center gap-4 border-b border-slate-100 px-6 py-5">
        <Box className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#1553a3] text-sm font-bold text-white">
          {initialsOf(c.holder_name)}
        </Box>
        <Box className="min-w-0">
          <Text as="p" className="text-lg font-bold text-slate-900">{c.holder_name}</Text>
          <Text as="p" className="text-sm text-slate-600">
            Successfully completed <Text as="strong" className="font-semibold text-slate-800">{c.course_title}</Text>
          </Text>
        </Box>
      </Box>

      {/* Details */}
      <Box className="grid grid-cols-1 gap-x-8 gap-y-4 px-6 py-5 sm:grid-cols-2">
        <Detail label="Certificate ID" value={c.certificate_id} mono />
        <Detail label="Training ID" value={c.training_id} mono />
        <Detail label="Course Identifier" value={c.course_identifier} mono />
        {c.pdu_claim_code && <Detail label="PDU Claim Code" value={c.pdu_claim_code} mono />}
        <Detail label="Training Mode" value={c.training_mode} />
        <Detail label="Date of Issue" value={formatInstantDate(c.issued_at)} />
        <Detail label="Training Dates" value={dates} full />
        {(c.is_certification || c.pdus != null) && (
          <Box className="sm:col-span-2">
            <Text as="p" className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Accreditation</Text>
            <Box className="mt-1 flex flex-wrap gap-1.5">
              {c.is_certification && (
                <Text as="span" className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">PMI®</Text>
              )}
              {c.pdus != null && (
                <Text as="span" className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">{c.pdus} PDUs</Text>
              )}
            </Box>
          </Box>
        )}
      </Box>

      {/* Footer */}
      <Box className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
        <Box className="flex items-center gap-2.5">
          <Box className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100">
            <ShieldCheck className="h-4 w-4 text-emerald-700" />
          </Box>
          <Box>
            <Text as="p" className="text-sm font-semibold text-slate-800">Status: Active</Text>
            <Text as="p" className="text-xs text-slate-500">Verified on {formatInstantDate(c.verified_at)}</Text>
          </Box>
        </Box>
        <button
          type="button"
          onClick={share}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          {copied ? <Link2 className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
          {copied ? "Link copied" : "Share verification"}
        </button>
      </Box>
    </Box>
  );
}
