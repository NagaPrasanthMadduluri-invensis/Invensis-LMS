"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Info, ChevronDown, ChevronUp } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";

const DOS = [
  {
    group: "During the session",
    items: [
      ["Stable connection", "Test it beforehand and keep a backup option."],
      ["Join on time", "Log in at least 10 minutes early."],
      ["Camera on", "Helps engagement and interaction."],
      ["Mute when not speaking", "Reduces background noise."],
      ["Professional background", "Neutral or Invensis-branded backdrop."],
      ["Dress appropriately", "As you would for in-person training."],
      ["Participate actively", "Engage in discussions and group activities."],
      ["Use chat & Q&A", "Ask questions appropriately."],
      ["Follow the agenda", "Stay aligned with the trainer's instructions."],
      ["Take notes", "Reinforces learning for future reference."],
      ["Proper lighting & audio", "Use headphones for better sound quality."],
      ["Respect opinions", "Keep the environment positive."],
      ["Complete the training", "Attend fully, including breaks."],
      ["Provide feedback", "Fill out forms to help improve future sessions."],
      ["Report issues promptly", "Email operations@invensislearning.com for technical problems."],
    ],
  },
  {
    group: "Technical preparation",
    items: [
      ["Test audio & video", "Do a full check at least 30 minutes prior, not just internet."],
      ["Keep device charged", "Or plugged in for the full session."],
      ["Close unnecessary tabs", "Frees bandwidth and reduces distractions."],
      ["Install the platform early", "Zoom, Teams, etc. before session day."],
      ["Use your real name", "So the trainer and peers can identify you."],
    ],
  },
  {
    group: "Preparedness",
    items: [
      ["Review pre-session materials", "Go through pre-reads or assignments shared beforehand."],
      ["Sort personal needs first", "Water, restroom, etc. before joining."],
      ["Engage in breakout rooms", "Treat group activities as seriously as the main session."],
    ],
  },
];

const DONTS = [
  {
    group: "During the session",
    items: [
      ["Don't join late or leave early", "You will miss key concepts."],
      ["Avoid multitasking", "No emails, social media, or other tasks."],
      ["Don't leave mic on", "Mute when not speaking."],
      ["Avoid distractions", "Join from a quiet, professional space."],
      ["Don't turn off camera", "Unless truly necessary."],
      ["Don't interrupt", "Use the 'raise hand' feature and wait your turn."],
      ["Don't share confidential info", "Keep discussions relevant and professional."],
      ["Avoid speaking too fast/soft", "Keep your voice clear and audible."],
      ["Don't share meeting credentials", "Protect the session's integrity."],
      ["Avoid unprofessional behavior", "Maintain decorum."],
      ["Don't ignore instructions", "Follow setup guidelines for tools."],
      ["Avoid disengagement", "Don't browse unrelated content."],
      ["Don't skip feedback", "Your input improves future sessions."],
      ["Don't hesitate to ask", "Clarify doubts rather than staying silent."],
      ["Avoid full screen sharing", "Share only relevant documents."],
    ],
  },
  {
    group: "Technical",
    items: [
      ["Don't join from a vehicle", "Causes unstable, disruptive connectivity."],
      ["Don't rely on mobile data alone", "Have a stable backup connection."],
      ["Don't use phone as primary device", "A laptop/desktop works far better."],
    ],
  },
  {
    group: "Conduct & privacy",
    items: [
      ["Don't record without permission", "A privacy and IP violation."],
      ["Don't screenshot participants", "Without their consent."],
      ["Don't eat on camera", "Visually distracting and unprofessional."],
      ["Don't go off-topic in chat", "Keep messages relevant to the session."],
      ["Don't leave without notice", "Message the trainer before dropping off in an emergency."],
    ],
  },
];

// Flatten grouped sections into a single ordered list, tagging each row with
// its group so the column can print a group header only when it changes.
function flatten(sections) {
  return sections.flatMap((section) =>
    section.items.map(([lead, rest]) => ({ group: section.group, lead, rest }))
  );
}

const FLAT_DOS = flatten(DOS);
const FLAT_DONTS = flatten(DONTS);
const COLLAPSED_COUNT = 5;

const THEME = {
  dos: { label: "Do's", Icon: Check, iconColor: "text-teal-700" },
  donts: { label: "Don'ts", Icon: X, iconColor: "text-red-800" },
};

function GuidelineColumn({ theme, flat, expanded }) {
  const rows = expanded ? flat : flat.slice(0, COLLAPSED_COUNT);
  let lastGroup = null;

  return (
    <Box className="min-w-0">
      <Text as="h3" className="text-base font-semibold text-slate-800 px-5 pt-5 pb-3">
        {theme.label}
      </Text>
      <Box className="px-5 pb-5">
        {rows.map((row, i) => {
          const showGroup = row.group !== lastGroup;
          lastGroup = row.group;
          return (
            <Box key={i}>
              {showGroup && (
                <Text
                  as="p"
                  className={`text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5 ${
                    i > 0 ? "mt-5" : ""
                  }`}
                >
                  {row.group}
                </Text>
              )}
              <Box className="flex items-start gap-2.5 mb-4 last:mb-0">
                <theme.Icon className={`h-4 w-4 mt-0.5 shrink-0 ${theme.iconColor}`} strokeWidth={2.25} />
                <Text as="p" className="text-sm text-slate-500 leading-relaxed">
                  <Text as="span" className="font-semibold text-slate-900">{row.lead}</Text>: {row.rest}
                </Text>
              </Box>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export function TrainingGuidelines() {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box>
      <Box className="flex items-center gap-3 mb-3">
        <Box className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_2px_4px_rgba(0,0,0,0.2)] ring-1 ring-amber-500/40">
          <Info className="h-5 w-5 text-white drop-shadow-sm" strokeWidth={2.5} />
        </Box>
        <Text as="h2" className="text-xl font-bold text-slate-900 leading-tight">Instructions</Text>
      </Box>
      <Card className="p-0 overflow-hidden border border-slate-200 shadow-sm rounded-xl bg-white">
        <Box className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          <GuidelineColumn theme={THEME.dos} flat={FLAT_DOS} expanded={expanded} />
          <GuidelineColumn theme={THEME.donts} flat={FLAT_DONTS} expanded={expanded} />
        </Box>
        <Box className="flex justify-center border-t border-slate-200 py-2.5">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1 text-slate-600"
            onClick={() => setExpanded((v) => !v)}
          >
            {expanded ? "Show less" : "Show more"}
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </Box>
      </Card>
    </Box>
  );
}
