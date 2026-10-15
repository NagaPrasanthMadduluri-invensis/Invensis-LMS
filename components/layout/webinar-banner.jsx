"use client";

import Box from "@/components/ui/box";
import Text from "@/components/ui/text";
import { Megaphone, ArrowRight } from "lucide-react";

/* Scrolling webinar announcement shown below the top nav on the learner and
   sponsor shells. The message is rendered twice inside the marquee track so the
   CSS slide (see .webinar-marquee in globals.css) loops seamlessly. The
   "Register Now" CTA stays fixed (not in the scroll) so it's always clickable. */

const WEBINAR_URL =
  "https://www.invensislearning.com/webinar/new-pmp-exam-what-has-changed-how-should-you-prepare/";

const MESSAGE =
  "UPCOMING WEBINAR  ·  The New PMP Exam: What Has Changed and How Should You Prepare?  ·  Oct 22, 2026 · 1:00–2:00 PM EST  ·  60 mins  ·  Speaker: Youssef Belaid";

export function WebinarBanner() {
  return (
    <Box className="relative z-20 flex h-8 shrink-0 items-center gap-3 overflow-hidden border-b border-white/10 bg-gradient-to-r from-[#2a0a52] via-[#4b1d92] to-[#2a0a52] px-4 text-white">
      <Megaphone className="h-4 w-4 shrink-0 text-amber-300" />

      <Box className="relative flex-1 overflow-hidden">
        <Box className="webinar-marquee flex w-max items-center">
          <Text as="span" className="whitespace-nowrap px-8 text-xs font-medium tracking-wide text-white/90">
            {MESSAGE}
          </Text>
          <Text as="span" aria-hidden="true" className="whitespace-nowrap px-8 text-xs font-medium tracking-wide text-white/90">
            {MESSAGE}
          </Text>
        </Box>
      </Box>

      <a
        href={WEBINAR_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-400 px-3.5 py-1 text-xs font-semibold text-[#2a0a52] shadow-sm transition-colors hover:bg-amber-300"
      >
        Register Now <ArrowRight className="h-3.5 w-3.5" />
      </a>
    </Box>
  );
}
