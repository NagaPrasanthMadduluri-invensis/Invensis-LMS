import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, XCircle, Info } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";

const DOS = [
  {
    group: "During the session",
    items: [
      ["Stable internet connection", "test it beforehand and keep a backup option."],
      ["Join on time", "log in at least 10 minutes early."],
      ["Keep your camera on", "helps engagement and interaction."],
      ["Mute when not speaking", "reduces background noise."],
      ["Professional background", "neutral or Invensis-branded backdrop."],
      ["Dress appropriately", "as you would for in-person training."],
      ["Actively participate", "engage in discussions and group activities."],
      ["Use chat & Q&A features", "ask questions appropriately."],
      ["Follow the agenda", "stay aligned with the trainer's instructions."],
      ["Take notes", "reinforces learning for future reference."],
      ["Proper lighting & audio", "use headphones for better sound quality."],
      ["Respect others' opinions", "keep the environment positive."],
      ["Complete the entire training", "attend fully, including breaks."],
      ["Provide feedback", "fill out forms to help improve future sessions."],
      ["Report issues promptly", "email operations@invensislearning.com for technical problems."],
    ],
  },
  {
    group: "Technical preparation",
    items: [
      ["Test audio & video", "do a full check at least 30 minutes prior, not just internet."],
      ["Keep your device charged", "or plugged in for the full session."],
      ["Close unnecessary tabs/apps", "frees bandwidth and reduces distractions."],
      ["Install the platform in advance", "Zoom, Teams, etc. before session day."],
      ["Use your real display name", "so the trainer and peers can identify you."],
    ],
  },
  {
    group: "Preparedness",
    items: [
      ["Review pre-session materials", "go through pre-reads or assignments shared beforehand."],
      ["Sort personal needs first", "water, restroom, etc. before joining."],
      ["Engage in breakout rooms", "treat group activities as seriously as the main session."],
    ],
  },
];

const DONTS = [
  {
    group: "During the session",
    items: [
      ["Don't join late or leave early", "you'll miss key concepts."],
      ["Avoid multitasking", "no emails, social media, or other tasks."],
      ["Don't keep your mic on unnecessarily", "mute when not speaking."],
      ["Avoid background distractions", "join from a quiet, professional space."],
      ["Don't turn off your camera", "unless truly necessary."],
      ["Don't interrupt", "use the 'raise hand' feature and wait your turn."],
      ["Don't share personal/confidential info", "keep discussions relevant and professional."],
      ["Avoid speaking too fast or too softly", "keep your voice clear and audible."],
      ["Don't share meeting links or credentials", "protect the session's integrity."],
      ["Avoid unprofessional language or behavior", "maintain decorum."],
      ["Don't ignore technical instructions", "follow setup guidelines for tools."],
      ["Avoid disengagement", "don't browse unrelated content."],
      ["Don't skip feedback submission", "your input improves future sessions."],
      ["Don't hesitate to ask questions", "clarify doubts rather than staying silent."],
      ["Avoid sharing your entire screen", "share only relevant documents."],
    ],
  },
  {
    group: "Technical",
    items: [
      ["Don't join from a moving vehicle", "causes unstable, disruptive connectivity."],
      ["Don't rely solely on mobile data", "have a stable backup connection."],
      ["Don't use a phone as your primary device", "a laptop/desktop works far better."],
    ],
  },
  {
    group: "Conduct & privacy",
    items: [
      ["Don't record without explicit permission", "a privacy and IP violation."],
      ["Don't screenshot other participants", "without their consent."],
      ["Don't eat on camera", "visually distracting and unprofessional."],
      ["Don't use chat for off-topic chatter", "keep messages relevant to the session."],
      ["Don't leave without informing the trainer", "message before dropping off in an emergency."],
    ],
  },
];

function GuidelineColumn({ label, Icon, iconClass, headerClass, sections }) {
  return (
    <Box className="flex-1 min-w-0">
      <Box className={`flex items-center gap-2 px-4 py-2.5 ${headerClass}`}>
        <Icon className={`h-4 w-4 ${iconClass}`} />
        <Text as="span" className="text-sm font-bold">{label}</Text>
      </Box>
      <ScrollArea className="h-80">
        <Box className="space-y-3 px-4 py-3">
          {sections.map((section) => (
            <Box key={section.group}>
              <Text as="p" className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-1.5">
                {section.group}
              </Text>
              <Box className="space-y-1.5">
                {section.items.map(([lead, rest]) => (
                  <Box key={lead} className="flex items-start gap-2">
                    <Icon className={`h-3.5 w-3.5 mt-0.5 shrink-0 ${iconClass}`} />
                    <Text as="p" className="text-xs text-slate-600 leading-snug">
                      <Text as="span" className="font-semibold text-slate-800">{lead}</Text> — {rest}
                    </Text>
                  </Box>
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      </ScrollArea>
    </Box>
  );
}

export function TrainingGuidelines() {
  return (
    <Card className="p-0 overflow-hidden">
      <CardHeader className="py-4 px-4 flex-row items-center gap-3 space-y-0">
        <Box className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-b from-amber-300 via-yellow-400 to-amber-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),0_2px_4px_rgba(0,0,0,0.2)] ring-1 ring-amber-500/40">
          <Info className="h-5 w-5 text-white drop-shadow-sm" strokeWidth={2.5} />
        </Box>
        <CardTitle className="text-xl font-bold text-slate-900 leading-tight">Instructions</CardTitle>
      </CardHeader>
      <CardContent className="px-0 pb-0 pt-0">
        <Box className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x border-t">
          <GuidelineColumn
            label="Dos"
            Icon={CheckCircle2}
            iconClass="text-emerald-600"
            headerClass="bg-emerald-50"
            sections={DOS}
          />
          <GuidelineColumn
            label="Don'ts"
            Icon={XCircle}
            iconClass="text-red-600"
            headerClass="bg-red-50"
            sections={DONTS}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
