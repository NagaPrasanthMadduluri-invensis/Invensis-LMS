"use client";

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClipboardList, TrendingUp, Trophy, Lock, Clock, HelpCircle } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { PremiumCard } from "@/components/ui/wave-card";

const STAT_CONFIG = [
  { label: "Attempted", value: 5,     icon: ClipboardList, accent: "#7C3AED" },
  { label: "Avg Score",  value: "78%", icon: TrendingUp,    accent: "#10B981" },
  { label: "Best Score", value: "92%", icon: Trophy,        accent: "#F59E0B" },
];

const QUIZZES = [
  { id: 1, name: "PMP Mock Test 1",          course: "PMP Prep", questions: 50, time: "90 min", score: "82%", status: "Completed"  },
  { id: 2, name: "PMP Mock Test 2",          course: "PMP Prep", questions: 50, time: "90 min", score: "78%", status: "Completed"  },
  { id: 3, name: "PMP Mock Test 3",          course: "PMP Prep", questions: 50, time: "90 min", score: null,  status: "Available"  },
  { id: 4, name: "ITIL Foundation Practice", course: "ITIL 4",   questions: 40, time: "60 min", score: "92%", status: "Completed"  },
  { id: 5, name: "ITIL Mock Exam",           course: "ITIL 4",   questions: 40, time: "60 min", score: null,  status: "Available"  },
  { id: 6, name: "Scrum Fundamentals Quiz",  course: "CSM",      questions: 25, time: "30 min", score: null,  status: "Locked"     },
];

const STATUS_CONFIG = {
  Completed: { bg: "rgba(16,185,129,0.12)",  color: "#059669" },
  Available: { bg: "rgba(239,189,95,0.15)",  color: "#B45309" },
  Locked:    { bg: "rgba(0,0,0,0.08)",       color: "#777777" },
};

export function QuizzesContent() {
  return (
    <Box className="space-y-5">

      {/* ── Stat Cards ── */}
      <Box className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
              <Text as="h2" className="text-3xl font-[800] leading-none mb-1.5">
                {value}
              </Text>
              <Text as="span" className="text-xs font-[500] block leading-tight" style={{ color: "#444444" }}>
                {label}
              </Text>
            </CardContent>
          </PremiumCard>
        ))}
      </Box>

      {/* ── Quizzes List ── */}
      <PremiumCard>
        <CardHeader className="pb-0 pt-4 px-4">
          <Box className="flex items-center gap-2.5">
            <Box
              className="w-1 h-4 rounded-full shrink-0"
              style={{ background: "linear-gradient(180deg, #EFBD5F, #EC7D50)" }}
            />
            <CardTitle className="text-sm font-semibold" style={{ color: "#111111" }}>
              Available Quizzes
            </CardTitle>
            <Badge
              className="ml-1 text-[10px] font-semibold border-0"
              style={{ background: "rgba(0,0,0,0.08)", color: "#444444" }}
            >
              {QUIZZES.length}
            </Badge>
          </Box>
        </CardHeader>

        <CardContent className="p-3 space-y-2 mt-2">
          {QUIZZES.map((quiz) => {
            const statusCfg  = STATUS_CONFIG[quiz.status] || STATUS_CONFIG.Locked;
            const isLocked    = quiz.status === "Locked";
            const isCompleted = quiz.status === "Completed";
            const isAvailable = quiz.status === "Available";

            return (
              <Box
                key={quiz.id}
                className="flex items-center gap-3 rounded-xl p-3 flex-wrap"
                style={{
                  backgroundColor: "rgba(0,0,0,0.04)",
                  border: "1px solid rgba(0,0,0,0.08)",
                  opacity: isLocked ? 0.7 : 1,
                }}
              >
                {/* Icon */}
                <Box
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: isLocked ? "rgba(0,0,0,0.06)" : "rgba(124,58,237,0.12)" }}
                >
                  {isLocked ? (
                    <Lock style={{ width: "16px", height: "16px", color: "#999999" }} />
                  ) : (
                    <ClipboardList style={{ width: "16px", height: "16px", color: "#7C3AED" }} />
                  )}
                </Box>

                {/* Quiz info */}
                <Box className="flex-1 min-w-0">
                  <Text
                    as="p"
                    className="text-sm font-semibold leading-tight"
                    style={{ color: isLocked ? "#999999" : "#111111" }}
                  >
                    {quiz.name}
                  </Text>
                  <Box className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <Text as="span" className="text-[11px]" style={{ color: "#555555" }}>
                      {quiz.course}
                    </Text>
                    <Box className="flex items-center gap-1">
                      <HelpCircle style={{ width: "11px", height: "11px", color: "#777777" }} />
                      <Text as="span" className="text-[11px]" style={{ color: "#555555" }}>
                        {quiz.questions} Qs
                      </Text>
                    </Box>
                    <Box className="flex items-center gap-1">
                      <Clock style={{ width: "11px", height: "11px", color: "#777777" }} />
                      <Text as="span" className="text-[11px]" style={{ color: "#555555" }}>
                        {quiz.time}
                      </Text>
                    </Box>
                  </Box>
                </Box>

                {/* Score */}
                <Text
                  as="span"
                  className="text-sm font-bold shrink-0 hidden sm:block"
                  style={{ color: quiz.score ? "#111111" : "#999999" }}
                >
                  {quiz.score ?? "—"}
                </Text>

                {/* Status badge */}
                <Badge
                  className="text-[10px] font-semibold border-0 shrink-0"
                  style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
                >
                  {quiz.status}
                </Badge>

                {/* Action button */}
                {isCompleted && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="shrink-0 text-xs h-7 px-3 font-semibold"
                    style={{ borderColor: "rgba(0,0,0,0.2)", color: "#333333" }}
                  >
                    Review
                  </Button>
                )}
                {isAvailable && (
                  <Button
                    size="sm"
                    className="shrink-0 text-xs h-7 px-3 font-semibold border-0 text-[#1a0a00]"
                    style={{ background: "linear-gradient(135deg, #EFBD5F, #EC7D50)" }}
                  >
                    Take Quiz
                  </Button>
                )}
                {isLocked && (
                  <Button
                    size="sm"
                    disabled
                    className="shrink-0 text-xs h-7 px-3 font-semibold border-0 cursor-not-allowed"
                    style={{ background: "rgba(0,0,0,0.08)", color: "#999999" }}
                  >
                    <Lock style={{ width: "12px", height: "12px" }} />
                  </Button>
                )}
              </Box>
            );
          })}
        </CardContent>
      </PremiumCard>
    </Box>
  );
}
