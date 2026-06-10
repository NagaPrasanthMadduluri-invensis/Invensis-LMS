"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
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

const LEVEL_CONFIG = {
  basic: {
    label:    "Basic",
    icon:     TrendingUp,
    badge:    "bg-emerald-100 text-emerald-700",
    border:   "border-emerald-200",
    iconBg:   "bg-emerald-100 text-emerald-600",
    headerBg: "bg-emerald-50",
    btnClass: "bg-emerald-600 hover:bg-emerald-700 text-white",
    desc:     "Start here to test your foundational knowledge.",
  },
  moderate: {
    label:    "Moderate",
    icon:     Target,
    badge:    "bg-amber-100 text-amber-700",
    border:   "border-amber-200",
    iconBg:   "bg-amber-100 text-amber-600",
    headerBg: "bg-amber-50",
    btnClass: "bg-amber-500 hover:bg-amber-600 text-white",
    desc:     "Challenge yourself with intermediate-level questions.",
  },
  difficult: {
    label:    "Difficult",
    icon:     Zap,
    badge:    "bg-red-100 text-red-700",
    border:   "border-red-200",
    iconBg:   "bg-red-100 text-red-600",
    headerBg: "bg-red-50",
    btnClass: "bg-red-600 hover:bg-red-700 text-white",
    desc:     "Advanced questions to prepare for the real exam.",
  },
};

function AssessmentsSkeleton() {
  return (
    <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-64 rounded-xl" />
      ))}
    </Box>
  );
}

function AssessmentCard({ assessment }) {
  const cfg  = LEVEL_CONFIG[assessment.level] || LEVEL_CONFIG.basic;
  const Icon = cfg.icon;

  return (
    <Card className={`overflow-hidden border ${cfg.border} flex flex-col`}>
      {/* Header */}
      <Box className={`px-4 py-3 flex items-center gap-3 ${cfg.headerBg}`}>
        <Box className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
          <Icon className="h-4 w-4" />
        </Box>
        <Box className="flex-1 min-w-0">
          <Box className="flex items-center gap-2">
            <Text as="p" className="text-sm font-semibold truncate">
              {cfg.label} Assessment
            </Text>
            <Badge className={`text-[10px] border-0 shrink-0 ${cfg.badge}`}>
              {cfg.label}
            </Badge>
          </Box>
        </Box>
      </Box>

      {/* Body */}
      <CardContent className="px-4 py-4 flex flex-col flex-1 gap-3">
        <Text as="p" className="text-xs text-muted-foreground leading-relaxed">
          {assessment.description || cfg.desc}
        </Text>

        {/* Stats */}
        <Box className="grid grid-cols-3 gap-2">
          <Box className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50">
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground" />
            <Text as="span" className="text-base font-bold leading-none">
              {assessment.total_questions}
            </Text>
            <Text as="span" className="text-[10px] text-muted-foreground text-center">
              Questions
            </Text>
          </Box>
          <Box className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <Text as="span" className="text-base font-bold leading-none">
              {assessment.duration_minutes}
            </Text>
            <Text as="span" className="text-[10px] text-muted-foreground text-center">
              Minutes
            </Text>
          </Box>
          <Box className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50">
            <Target className="h-3.5 w-3.5 text-muted-foreground" />
            <Text as="span" className="text-base font-bold leading-none">
              {assessment.passing_score}%
            </Text>
            <Text as="span" className="text-[10px] text-muted-foreground text-center">
              Pass Score
            </Text>
          </Box>
        </Box>

        {/* CTA */}
        <Box className="mt-auto pt-1">
          <Button
            className={`w-full h-8 text-xs font-medium ${cfg.btnClass}`}
            disabled
          >
            <Lock className="h-3 w-3 mr-1.5" />
            Coming Soon
          </Button>
        </Box>
      </CardContent>
    </Card>
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
      <Card className="p-6">
        <Text as="p" className="text-red-600 text-sm">Failed to load assessments: {error}</Text>
      </Card>
    );
  }

  if (!assessments) return <AssessmentsSkeleton />;

  if (assessments.length === 0) {
    return (
      <Card className="p-12 text-center">
        <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
        <Text as="h3" className="text-base">No assessments available</Text>
        <Text as="p" className="text-sm text-muted-foreground mt-1">
          Assessments for this course have not been set up yet.
        </Text>
      </Card>
    );
  }

  return (
    <Box className="space-y-4">
      <Box className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-muted-foreground" />
        <Text as="p" className="text-sm text-muted-foreground">
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
