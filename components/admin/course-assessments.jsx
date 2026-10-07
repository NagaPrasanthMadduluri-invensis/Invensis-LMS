"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardList,
  Clock,
  Target,
  HelpCircle,
  TrendingUp,
  Zap,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchAssessments } from "@/services/api/admin/admin-api";

const LEVEL_CONFIG = {
  basic: {
    label:     "Basic",
    icon:      TrendingUp,
    badge:     "bg-success-subtle text-success-subtle-foreground",
    border:    "border-success-border",
    iconBg:    "bg-success-subtle text-success",
    headerBg:  "bg-success-subtle",
  },
  moderate: {
    label:     "Moderate",
    icon:      Target,
    badge:     "bg-warning-subtle text-warning-subtle-foreground",
    border:    "border-warning-border",
    iconBg:    "bg-warning-subtle text-warning",
    headerBg:  "bg-warning-subtle",
  },
  difficult: {
    label:     "Difficult",
    icon:      Zap,
    badge:     "bg-error-subtle text-error-subtle-foreground",
    border:    "border-error-border",
    iconBg:    "bg-error-subtle text-error",
    headerBg:  "bg-error-subtle",
  },
};

function AssessmentsSkeleton() {
  return (
    <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-52 rounded-xl" />
      ))}
    </Box>
  );
}

function AssessmentCard({ assessment }) {
  const cfg = LEVEL_CONFIG[assessment.level] || LEVEL_CONFIG.basic;
  const Icon = cfg.icon;

  return (
    <Card className={`overflow-hidden border ${cfg.border}`}>
      {/* Header */}
      <Box className={`px-4 py-3 flex items-center gap-3 ${cfg.headerBg}`}>
        <Box className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${cfg.iconBg}`}>
          <Icon className="h-4 w-4" />
        </Box>
        <Box className="flex-1 min-w-0">
          <Box className="flex items-center gap-2">
            <Text as="p" className="text-sm font-semibold truncate">
              {cfg.label} Level
            </Text>
            <Badge className={`text-[10px] border-0 shrink-0 ${cfg.badge}`}>
              {cfg.label}
            </Badge>
          </Box>
        </Box>
        <Badge
          variant="secondary"
          className={`text-[10px] shrink-0 ${assessment.is_active ? "bg-success-subtle text-success-subtle-foreground" : "bg-surface-muted text-foreground-muted"}`}
        >
          {assessment.is_active ? "Active" : "Inactive"}
        </Badge>
      </Box>

      {/* Body */}
      <CardContent className="px-4 py-4 space-y-3">
        <Text as="p" className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
          {assessment.description}
        </Text>

        <Box className="grid grid-cols-3 gap-2 pt-1">
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
      </CardContent>
    </Card>
  );
}

export function CourseAssessments({ courseId }) {
  const { token } = useAuth();
  const [assessments, setAssessments] = useState(null);
  const [error, setError]             = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchAssessments({ token, courseId });
      setAssessments(data.assessments || []);
    } catch (err) {
      setError(err.message);
    }
  }, [token, courseId]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <Card className="p-6">
        <Text as="p" className="text-error text-sm">Failed to load assessments: {error}</Text>
      </Card>
    );
  }

  if (!assessments) return <AssessmentsSkeleton />;

  if (assessments.length === 0) {
    return (
      <Card className="p-12 text-center">
        <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
        <Text as="h3" className="text-base">No assessments yet</Text>
        <Text as="p" className="text-sm text-muted-foreground mt-1">
          Assessments for this course have not been configured.
        </Text>
      </Card>
    );
  }

  return (
    <Box className="space-y-4">
      <Box className="flex items-center justify-between">
        <Text as="p" className="text-sm text-muted-foreground">
          {assessments.length} assessment{assessments.length !== 1 ? "s" : ""} across 3 difficulty levels
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
