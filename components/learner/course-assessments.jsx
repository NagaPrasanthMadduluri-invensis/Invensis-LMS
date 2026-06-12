"use client";

import { useEffect, useState, useCallback } from "react";
import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList,
  Clock,
  Target,
  HelpCircle,
  TrendingUp,
  Zap,
  Lock,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchCourseAssessments } from "@/services/api/learner/learner-api";
import { PremiumCard } from "@/components/ui/wave-card";

const LEVEL_CONFIG = {
  basic: {
    label:      "Basic",
    icon:       TrendingUp,
    badgeStyle: { backgroundColor: "rgba(16,185,129,0.12)", color: "#10B981" },
    borderTop:  "2px solid #10B981",
    iconBg:     { backgroundColor: "rgba(16,185,129,0.08)" },
    iconColor:  "text-emerald-400",
    headerBg:   { backgroundColor: "rgba(16,185,129,0.12)", borderBottom: "1px solid rgba(16,185,129,0.2)" },
    desc:       "Start here to test your foundational knowledge.",
  },
  moderate: {
    label:      "Moderate",
    icon:       Target,
    badgeStyle: { backgroundColor: "rgba(239,189,95,0.12)", color: "#EFBD5F" },
    borderTop:  "2px solid #F59E0B",
    iconBg:     { backgroundColor: "rgba(245,158,11,0.08)" },
    iconColor:  "text-amber-400",
    headerBg:   { backgroundColor: "rgba(245,158,11,0.12)", borderBottom: "1px solid rgba(245,158,11,0.2)" },
    desc:       "Challenge yourself with intermediate-level questions.",
  },
  difficult: {
    label:      "Difficult",
    icon:       Zap,
    badgeStyle: { backgroundColor: "rgba(244,63,94,0.12)", color: "#F87171" },
    borderTop:  "2px solid #F43F5E",
    iconBg:     { backgroundColor: "rgba(244,63,94,0.08)" },
    iconColor:  "text-rose-400",
    headerBg:   { backgroundColor: "rgba(244,63,94,0.12)", borderBottom: "1px solid rgba(244,63,94,0.2)" },
    desc:       "Advanced questions to prepare for the real exam.",
  },
};

function AssessmentsSkeleton() {
  return (
    <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-64 rounded-xl" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
      ))}
    </Box>
  );
}

function AssessmentCard({ assessment }) {
  const cfg  = LEVEL_CONFIG[assessment.level] || LEVEL_CONFIG.basic;
  const Icon = cfg.icon;

  return (
    <PremiumCard
      className="overflow-hidden flex flex-col"
      style={{ borderTop: cfg.borderTop }}
    >
      {/* Header */}
      <Box className="px-4 py-3 flex items-center gap-3" style={cfg.headerBg}>
        <Box className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={cfg.iconBg}>
          <Icon className={`h-4 w-4 ${cfg.iconColor}`} />
        </Box>
        <Box className="flex-1 min-w-0">
          <Box className="flex items-center gap-2">
            <Text as="p" className="text-sm font-semibold truncate">
              {cfg.label} Assessment
            </Text>
            <Badge className="text-[10px] border-0 shrink-0 font-semibold" style={cfg.badgeStyle}>
              {cfg.label}
            </Badge>
          </Box>
        </Box>
      </Box>

      {/* Body */}
      <CardContent className="px-4 py-4 flex flex-col flex-1 gap-3">
        <Text as="p" className="text-xs leading-relaxed" style={{ color: "#555555" }}>
          {assessment.description || cfg.desc}
        </Text>

        {/* Stats */}
        <Box className="grid grid-cols-3 gap-2">
          <Box className="flex flex-col items-center gap-1 p-2 rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.05)" }}>
            <HelpCircle className="h-3.5 w-3.5" style={{ color: "#666666" }} />
            <Text as="span" className="text-base font-bold leading-none">
              {assessment.total_questions}
            </Text>
            <Text as="span" className="text-[10px] text-center" style={{ color: "#444444" }}>
              Questions
            </Text>
          </Box>
          <Box className="flex flex-col items-center gap-1 p-2 rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.05)" }}>
            <Clock className="h-3.5 w-3.5" style={{ color: "#666666" }} />
            <Text as="span" className="text-base font-bold leading-none">
              {assessment.duration_minutes}
            </Text>
            <Text as="span" className="text-[10px] text-center" style={{ color: "#444444" }}>
              Minutes
            </Text>
          </Box>
          <Box className="flex flex-col items-center gap-1 p-2 rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.05)" }}>
            <Target className="h-3.5 w-3.5" style={{ color: "#666666" }} />
            <Text as="span" className="text-base font-bold leading-none">
              {assessment.passing_score}%
            </Text>
            <Text as="span" className="text-[10px] text-center" style={{ color: "#444444" }}>
              Pass Score
            </Text>
          </Box>
        </Box>

        {/* CTA */}
        <Box className="mt-auto pt-1">
          <Button
            className="w-full h-8 text-xs font-semibold opacity-60 cursor-not-allowed"
            style={{ backgroundColor: "rgba(0,0,0,0.04)", color: "#444444", border: "1px solid rgba(0,0,0,0.08)" }}
            disabled
          >
            <Lock className="h-3 w-3 mr-1.5" />
            Coming Soon
          </Button>
        </Box>
      </CardContent>
    </PremiumCard>
  );
}

export function LearnerCourseAssessments({ courseId }) {
  const { token } = useAuth();
  const [assessments, setAssessments] = useState(null);
  const [error, setError]             = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchCourseAssessments({ token, courseId });
      setAssessments(data.assessments || []);
    } catch (err) {
      setError(err.message);
    }
  }, [token, courseId]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <PremiumCard className="p-6" style={{ borderColor: "rgba(244,63,94,0.3)" }}>
        <Text as="p" className="text-rose-400 text-sm">Failed to load assessments: {error}</Text>
      </PremiumCard>
    );
  }

  if (!assessments) return <AssessmentsSkeleton />;

  if (assessments.length === 0) {
    return (
      <PremiumCard className="p-12 text-center">
        <ClipboardList className="h-10 w-10 mx-auto mb-3" style={{ color: "rgba(0,0,0,0.2)" }} />
        <Text as="h3" className="text-base">No assessments available</Text>
        <Text as="p" className="text-sm mt-1" style={{ color: "#444444" }}>
          Assessments for this course have not been set up yet.
        </Text>
      </PremiumCard>
    );
  }

  return (
    <Box className="space-y-4">
      <Box className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4" style={{ color: "#666666" }} />
        <Text as="p" className="text-sm" style={{ color: "#444444" }}>
          {assessments.length} assessment{assessments.length !== 1 ? "s" : ""} · Choose your difficulty level
        </Text>
      </Box>
      <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {assessments.map((a) => (
          <AssessmentCard key={a.id} assessment={a} />
        ))}
      </Box>
    </Box>
  );
}
