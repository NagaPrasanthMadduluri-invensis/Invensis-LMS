"use client";

import { CalendarDays, ClipboardCheck, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";

const stats = [
  {
    label: "Upcoming Sessions",
    value: "—",
    icon: CalendarDays,
    bg: "bg-teal-50",
    border: "border border-teal-100",
    iconBg: "bg-teal-100",
    iconCls: "text-teal-600",
    valueCls: "text-teal-900",
    labelCls: "text-teal-500",
  },
  {
    label: "Attendance Rate",
    value: "—",
    icon: ClipboardCheck,
    bg: "bg-emerald-50",
    border: "border border-emerald-100",
    iconBg: "bg-emerald-100",
    iconCls: "text-emerald-600",
    valueCls: "text-emerald-900",
    labelCls: "text-emerald-600",
  },
  {
    label: "Avg. Feedback Score",
    value: "—",
    icon: Star,
    bg: "bg-amber-50",
    border: "border border-amber-100",
    iconBg: "bg-amber-100",
    iconCls: "text-amber-600",
    valueCls: "text-amber-900",
    labelCls: "text-amber-600",
  },
];

export function TrainerDashboardStats() {
  return (
    <Box className="grid gap-4 grid-cols-1 sm:grid-cols-3">
      {stats.map((s) => (
        <Card key={s.label} className={`rounded-2xl ${s.border} shadow-sm ${s.bg} p-5`}>
          <Box className="flex items-start justify-between mb-3">
            <Box className={`w-10 h-10 ${s.iconBg} rounded-xl flex items-center justify-center`}>
              <s.icon className={`h-5 w-5 ${s.iconCls}`} />
            </Box>
            <Text as="p" className={`text-3xl font-bold ${s.valueCls} leading-none`}>{s.value}</Text>
          </Box>
          <Text as="p" className={`text-xs ${s.labelCls} font-medium`}>{s.label}</Text>
        </Card>
      ))}
    </Box>
  );
}
