"use client";

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, BookCheck, Target, Flame } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { PremiumCard } from "@/components/ui/wave-card";

const STAT_CONFIG = [
  { label: "Overall Completion", value: "64%",     icon: TrendingUp, accent: "#7C3AED" },
  { label: "Lessons Done",       value: "31/48",   icon: BookCheck,  accent: "#10B981" },
  { label: "Avg Score",          value: "78%",     icon: Target,     accent: "#F59E0B" },
  { label: "Learning Streak",    value: "12 days", icon: Flame,      accent: "#F43F5E" },
];

const COURSES = [
  { name: "PMP Certification Prep",  pct: 68, done: 22, total: 32, barColor: "#7C3AED" },
  { name: "ITIL 4 Foundation",       pct: 45, done: 11, total: 24, barColor: "#10B981" },
  { name: "Certified ScrumMaster",   pct: 12, done:  2, total: 16, barColor: "#F59E0B" },
];

const WEEK_DAYS  = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEK_MINS  = [45, 30, 60, 20, 75, 15, 0];
const TODAY_IDX  = 3; // Thursday
const MAX_MINS   = Math.max(...WEEK_MINS);

export function MyProgressContent() {
  return (
    <Box className="space-y-5">

      {/* ── Stat Cards ── */}
      <Box className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STAT_CONFIG.map(({ label, value, icon: Icon, accent }) => (
          <PremiumCard
            key={label}
            className="hover:scale-[1.02] transition-all duration-200 overflow-hidden cursor-pointer"
            style={{ borderTop: `2px solid ${accent}` }}
          >
            <CardContent className="p-4">
              <Box className="flex items-center justify-between mb-3">
                <Box
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${accent}20` }}
                >
                  <Icon style={{ width: "18px", height: "18px", color: accent }} />
                </Box>
              </Box>
              <Text as="h2" className="text-2xl font-[800] leading-none mb-1.5">
                {value}
              </Text>
              <Text as="span" className="text-xs font-[500] block leading-tight" style={{ color: "#444444" }}>
                {label}
              </Text>
            </CardContent>
          </PremiumCard>
        ))}
      </Box>

      {/* ── Course Progress + Weekly Activity ── */}
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Course Progress */}
        <PremiumCard>
          <CardHeader className="pb-0 pt-4 px-4">
            <Box className="flex items-center gap-2.5">
              <Box
                className="w-1 h-4 rounded-full shrink-0"
                style={{ background: "linear-gradient(180deg, #EFBD5F, #EC7D50)" }}
              />
              <CardTitle className="text-sm font-semibold" style={{ color: "#111111" }}>
                Course Progress
              </CardTitle>
            </Box>
          </CardHeader>
          <CardContent className="p-4 pt-3 space-y-4">
            {COURSES.map((c) => (
              <Box key={c.name}>
                <Box className="flex items-center justify-between mb-1">
                  <Text as="p" className="text-sm font-semibold leading-tight" style={{ color: "#111111" }}>
                    {c.name}
                  </Text>
                  <Box className="flex items-center gap-2 shrink-0 ml-2">
                    <Text as="span" className="text-[11px] font-bold" style={{ color: c.barColor }}>
                      {c.pct}%
                    </Text>
                    <Badge
                      className="text-[10px] font-semibold border-0"
                      style={{ backgroundColor: "rgba(16,185,129,0.12)", color: "#059669" }}
                    >
                      Active
                    </Badge>
                  </Box>
                </Box>
                <Box className="flex items-center gap-2">
                  <Box
                    className="flex-1 h-2 rounded-full overflow-hidden"
                    style={{ backgroundColor: "rgba(0,0,0,0.12)" }}
                  >
                    <Box
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${c.pct}%`, backgroundColor: c.barColor }}
                    />
                  </Box>
                </Box>
                <Text as="span" className="text-[11px]" style={{ color: "#555555" }}>
                  {c.done}/{c.total} lessons completed
                </Text>
              </Box>
            ))}
          </CardContent>
        </PremiumCard>

        {/* Weekly Activity */}
        <PremiumCard>
          <CardHeader className="pb-0 pt-4 px-4">
            <Box className="flex items-center gap-2.5">
              <Box
                className="w-1 h-4 rounded-full shrink-0"
                style={{ background: "linear-gradient(180deg, #EFBD5F, #EC7D50)" }}
              />
              <CardTitle className="text-sm font-semibold" style={{ color: "#111111" }}>
                This Week
              </CardTitle>
            </Box>
          </CardHeader>
          <CardContent className="p-4 pt-3">
            <Box className="flex items-end gap-2 h-28 mb-2">
              {WEEK_DAYS.map((day, idx) => {
                const mins       = WEEK_MINS[idx];
                const heightPct  = MAX_MINS > 0 ? (mins / MAX_MINS) * 100 : 0;
                const isToday    = idx === TODAY_IDX;
                const isEmpty    = mins === 0;

                return (
                  <Box key={day} className="flex-1 flex flex-col items-center gap-1">
                    {mins > 0 && (
                      <Text as="span" className="text-[9px] font-semibold" style={{ color: isToday ? "#EFBD5F" : "#555555" }}>
                        {mins}
                      </Text>
                    )}
                    <Box
                      className="w-full rounded-t-md transition-all duration-500"
                      style={{
                        height: isEmpty ? "4px" : `${heightPct}%`,
                        background: isToday
                          ? "linear-gradient(180deg, #EFBD5F, #EC7D50)"
                          : isEmpty
                            ? "rgba(0,0,0,0.08)"
                            : "rgba(0,0,0,0.2)",
                        borderRadius: "4px 4px 0 0",
                        minHeight: "4px",
                      }}
                    />
                  </Box>
                );
              })}
            </Box>
            <Box className="flex gap-2">
              {WEEK_DAYS.map((day, idx) => (
                <Box key={day} className="flex-1 text-center">
                  <Text
                    as="span"
                    className="text-[10px] font-medium"
                    style={{ color: idx === TODAY_IDX ? "#EFBD5F" : "#555555" }}
                  >
                    {day}
                  </Text>
                </Box>
              ))}
            </Box>
            <Text as="p" className="text-xs text-center mt-3" style={{ color: "#555555" }}>
              minutes learned
            </Text>
          </CardContent>
        </PremiumCard>
      </Box>
    </Box>
  );
}
