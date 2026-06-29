"use client";

import { CalendarDays, ClipboardCheck, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";

const stats = [
  {
    label: "Upcoming Sessions",
    value: "—",
    icon: CalendarDays,
    color: "text-violet-500",
    bg: "bg-violet-500/10",
  },
  {
    label: "Attendance Rate",
    value: "—",
    icon: ClipboardCheck,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    label: "Avg. Feedback Score",
    value: "—",
    icon: Star,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
];

export function TrainerDashboardStats() {
  return (
    <Box className="grid gap-4 grid-cols-1 sm:grid-cols-3">
      {stats.map((s) => (
        <Card key={s.label}>
          <CardContent className="flex items-center gap-4 p-5">
            <Box className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </Box>
            <Box>
              <Text as="p" className="text-2xl font-bold leading-none">{s.value}</Text>
              <Text as="p" className="text-xs text-muted-foreground mt-1">{s.label}</Text>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
}
