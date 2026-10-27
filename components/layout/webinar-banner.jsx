"use client";

import Box from "@/components/ui/box";
import { Megaphone, ArrowRight } from "lucide-react";
import { useWebinarBanner } from "@/providers/webinar-banner-provider";

/* Scrolling webinar announcement shown below the top nav on the learner and
   sponsor shells. The current webinar comes from WebinarBannerProvider (admin-
   managed, auto-selected by date). The message is rendered twice inside the
   marquee track so the CSS slide (see .webinar-marquee in globals.css) loops
   seamlessly. The "Register Now" CTA stays fixed so it's always clickable. */

// Format the webinar's instants in its own timezone, e.g. "Nov 24, 2026" and
// "8:00 AM". A deliberate instant → zone conversion for display.
function describe(w) {
  const tz = w.timezone || undefined;
  const start = new Date(w.start_at);
  const end = new Date(w.end_at);
  if (Number.isNaN(start.getTime())) return null;

  const date = new Intl.DateTimeFormat("en-US", { timeZone: tz, month: "short", day: "numeric", year: "numeric" }).format(start);
  const time = (d) => new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true }).format(d);
  const zone =
    new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" })
      .formatToParts(start)
      .find((p) => p.type === "timeZoneName")?.value || "";
  const mins = Number.isNaN(end.getTime()) ? null : Math.round((end - start) / 60000);

  const parts = [
    "UPCOMING WEBINAR",
    w.title,
    `${date} · ${time(start)}${Number.isNaN(end.getTime()) ? "" : `–${time(end)}`} ${zone}`.trim(),
  ];
  if (mins != null) parts.push(`${mins} mins`);
  if (w.speaker) parts.push(`Speaker: ${w.speaker}`);
  return parts.join("  ·  ");
}

export function WebinarBanner() {
  const { webinar } = useWebinarBanner();
  if (!webinar) return null;

  const message = describe(webinar);
  if (!message) return null;

  return (
    <Box className="relative z-20 flex h-8 shrink-0 items-center gap-3 overflow-hidden border-b border-white/10 bg-gradient-to-r from-[#2a0a52] via-[#4b1d92] to-[#2a0a52] px-4 text-white">
      <Megaphone className="h-4 w-4 shrink-0 text-amber-300" />

      <Box className="relative flex-1 overflow-hidden">
        <Box className="webinar-marquee flex w-max items-center">
          <span className="whitespace-nowrap px-8 text-xs font-medium tracking-wide text-white/90">{message}</span>
          <span aria-hidden="true" className="whitespace-nowrap px-8 text-xs font-medium tracking-wide text-white/90">{message}</span>
        </Box>
      </Box>

      <a
        href={webinar.register_url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-400 px-3.5 py-1 text-xs font-semibold text-[#2a0a52] shadow-sm transition-colors hover:bg-amber-300"
      >
        Register Now <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </Box>
  );
}
