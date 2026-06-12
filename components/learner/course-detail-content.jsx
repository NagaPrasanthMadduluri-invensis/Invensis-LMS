"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Clock,
  PlayCircle,
  FileText,
  ExternalLink,
  HelpCircle,
  CheckCircle2,
  Circle,
  Loader2,
  ChevronRight,
  BookOpen,
  BarChart3,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchCourseDetail } from "@/services/api/learner/learner-api";
import { LearnerCourseResources } from "@/components/learner/course-resources";
import { PremiumCard } from "@/components/ui/wave-card";

const CONTENT_TYPE_ICON = {
  video: PlayCircle,
  pdf: FileText,
  external: ExternalLink,
  quiz: HelpCircle,
};

const CONTENT_TYPE_LABEL = {
  video: "Video",
  pdf: "PDF",
  external: "External",
  quiz: "Quiz",
};

const STATUS_ICON = {
  completed: CheckCircle2,
  in_progress: Loader2,
  not_started: Circle,
};

const STATUS_COLOR = {
  completed: "text-emerald-400",
  in_progress: "text-violet-400",
  not_started: "text-zinc-600",
};

const STATUS_LABEL = {
  completed: "Completed",
  in_progress: "In Progress",
  not_started: "Not Started",
};

const STATUS_BADGE = {
  completed:   { backgroundColor: "rgba(16,185,129,0.12)", color: "#10B981" },
  in_progress: { backgroundColor: "rgba(124,58,237,0.15)", color: "#A78BFA" },
  not_started: { backgroundColor: "#c8c8c8", color: "#555555" },
};

function DetailSkeleton() {
  return (
    <Box className="space-y-4">
      <Skeleton className="h-24 w-full rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
      <Skeleton className="h-12 w-full rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
      <Skeleton className="h-48 w-full rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
      <Skeleton className="h-48 w-full rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
    </Box>
  );
}

export function CourseDetailContent({ courseId }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !user) return;
    fetchCourseDetail({ token, courseId, userId: user.id })
      .then(setData)
      .catch((err) => setError(err.message));
  }, [token, user, courseId]);

  if (error) {
    return (
      <PremiumCard className="p-6" style={{ borderColor: "rgba(244,63,94,0.3)" }}>
        <Text as="p" className="text-rose-400 text-sm">Failed to load course: {error}</Text>
      </PremiumCard>
    );
  }

  if (!data) return <DetailSkeleton />;

  const { course, enrollment, modules = [] } = data;

  const totalLessons     = modules.reduce((sum, m) => sum + m.total_count, 0);
  const completedLessons = modules.reduce((sum, m) => sum + m.completed_count, 0);
  const progress         = enrollment?.progress_percentage ?? 0;

  return (
    <Box className="space-y-5">
      {/* ── Course Header Card ── */}
      <PremiumCard className="border overflow-hidden">
        <CardContent className="py-5">
          <Box className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <Box className="flex-1">
              <Text as="h2" className="text-xl font-bold">{course.name}</Text>
              {course.description && (
                <Text as="p" className="text-sm mt-1" style={{ color: "#555555" }}>
                  {course.description}
                </Text>
              )}
              <Box className="flex items-center gap-4 mt-3 flex-wrap">
                {course.duration_hours && (
                  <Box className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" style={{ color: "#666666" }} />
                    <Text as="span" className="text-xs" style={{ color: "#444444" }}>
                      {course.duration_hours} hours
                    </Text>
                  </Box>
                )}
                <Box className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4" style={{ color: "#666666" }} />
                  <Text as="span" className="text-xs" style={{ color: "#444444" }}>
                    {modules.length} module{modules.length !== 1 ? "s" : ""} · {totalLessons} lesson{totalLessons !== 1 ? "s" : ""}
                  </Text>
                </Box>
                {enrollment && (
                  <Badge
                    className="text-[10px] border-0 font-semibold"
                    style={enrollment.status === "active"
                      ? { backgroundColor: "rgba(16,185,129,0.12)", color: "#10B981" }
                      : { backgroundColor: "#c8c8c8", color: "#555555" }}
                  >
                    {enrollment.status}
                  </Badge>
                )}
              </Box>
            </Box>

            {enrollment && (
              <Box className="flex items-center gap-4 shrink-0">
                <Box className="text-center">
                  <Text as="h2" className="text-3xl font-black" style={{ background: "linear-gradient(135deg, #EFBD5F, #EC7D50)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                    {Math.round(progress)}%
                  </Text>
                  <Text as="span" className="text-[11px]" style={{ color: "#444444" }}>
                    {completedLessons}/{totalLessons} lessons
                  </Text>
                </Box>
              </Box>
            )}
          </Box>

          {enrollment && (
            <Box className="mt-4">
              <Box className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(0,0,0,0.12)" }}>
                <Box
                  className="h-full rounded-full transition-all duration-500"
                  role="progressbar"
                  aria-valuenow={progress}
                  style={{ width: `${progress}%`, background: "linear-gradient(90deg, #7C3AED, #EFBD5F)" }}
                />
              </Box>
            </Box>
          )}
        </CardContent>
      </PremiumCard>

      {/* ── Stats Row ── */}
      <Box className="grid grid-cols-3 gap-3">
        <PremiumCard className="p-4">
          <Box className="flex items-center gap-3">
            <Box className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(16,185,129,0.12)" }}>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </Box>
            <Box>
              <Text as="h3" className="text-lg leading-none font-bold">{completedLessons}</Text>
              <Text as="span" className="text-[11px]" style={{ color: "#444444" }}>Completed</Text>
            </Box>
          </Box>
        </PremiumCard>
        <PremiumCard className="p-4">
          <Box className="flex items-center gap-3">
            <Box className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(124,58,237,0.15)" }}>
              <Loader2 className="h-4 w-4 text-violet-400" />
            </Box>
            <Box>
              <Text as="h3" className="text-lg leading-none font-bold">
                {modules.reduce((sum, m) => sum + m.lessons.filter((l) => l.progress_status === "in_progress").length, 0)}
              </Text>
              <Text as="span" className="text-[11px]" style={{ color: "#444444" }}>In Progress</Text>
            </Box>
          </Box>
        </PremiumCard>
        <PremiumCard className="p-4">
          <Box className="flex items-center gap-3">
            <Box className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(0,0,0,0.06)" }}>
              <BarChart3 className="h-4 w-4" style={{ color: "#666666" }} />
            </Box>
            <Box>
              <Text as="h3" className="text-lg leading-none font-bold">{totalLessons - completedLessons}</Text>
              <Text as="span" className="text-[11px]" style={{ color: "#444444" }}>Remaining</Text>
            </Box>
          </Box>
        </PremiumCard>
      </Box>

      {/* ── Resources ── */}
      <LearnerCourseResources courseId={courseId} />

      {/* ── Modules Accordion ── */}
      <PremiumCard className="border overflow-hidden">
        <CardHeader className="py-3 px-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
          <Box className="flex items-center gap-2.5">
            <Box className="w-1 h-4 rounded-full" style={{ background: "linear-gradient(180deg, #EFBD5F, #EC7D50)" }} />
            <CardTitle className="text-sm font-semibold">Course Content</CardTitle>
          </Box>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {modules.length === 0 ? (
            <Text as="p" className="text-sm py-4 text-center" style={{ color: "#444444" }}>
              No modules available yet.
            </Text>
          ) : (
            <Accordion type="multiple" defaultValue={modules.map((m) => `module-${m.id}`)}>
              {modules.map((mod) => {
                const modProgress = mod.total_count > 0
                  ? Math.round((mod.completed_count / mod.total_count) * 100)
                  : 0;

                return (
                  <AccordionItem key={mod.id} value={`module-${mod.id}`} style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                    <AccordionTrigger className="hover:no-underline py-3">
                      <Box className="flex items-center gap-3 flex-1 text-left">
                        <Box className="flex-1 min-w-0">
                          <Text as="p" className="text-sm font-semibold">
                            {mod.title}
                          </Text>
                          <Text as="span" className="text-[11px]" style={{ color: "#444444" }}>
                            {mod.completed_count}/{mod.total_count} lessons · {modProgress}% complete
                          </Text>
                        </Box>
                        <Box className="w-16 h-1.5 rounded-full overflow-hidden shrink-0 mr-2" style={{ backgroundColor: "rgba(0,0,0,0.12)" }}>
                          <Box
                            className="h-full rounded-full"
                            style={{ width: `${modProgress}%`, background: "linear-gradient(90deg, #7C3AED, #10B981)" }}
                          />
                        </Box>
                      </Box>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Box className="space-y-1 ml-1">
                        {mod.lessons.map((lesson) => {
                          const StatusIcon  = STATUS_ICON[lesson.progress_status] || Circle;
                          const statusColor = STATUS_COLOR[lesson.progress_status] || STATUS_COLOR.not_started;
                          const ContentIcon = CONTENT_TYPE_ICON[lesson.content_type] || FileText;
                          const contentLabel = CONTENT_TYPE_LABEL[lesson.content_type] || lesson.content_type;
                          const badgeStyle  = STATUS_BADGE[lesson.progress_status] || STATUS_BADGE.not_started;

                          return (
                            <Box
                              key={lesson.id}
                              className="flex items-center gap-3 py-2.5 px-3 rounded-lg cursor-pointer transition-all"
                              style={{ backgroundColor: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}
                              onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.06)"}
                              onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
                              onClick={() => router.push(`/my-courses/${courseId}/lessons/${lesson.id}`)}
                            >
                              <StatusIcon className={`h-4 w-4 shrink-0 ${statusColor}`} />
                              <ContentIcon className="h-4 w-4 shrink-0" style={{ color: "#666666" }} />
                              <Box className="flex-1 min-w-0">
                                <Text as="p" className="text-sm truncate">
                                  {lesson.title}
                                </Text>
                                <Box className="flex items-center gap-2">
                                  <Text as="span" className="text-[10px]" style={{ color: "#444444" }}>
                                    {contentLabel}
                                  </Text>
                                  {lesson.duration_minutes && (
                                    <Text as="span" className="text-[10px]" style={{ color: "#444444" }}>
                                      · {lesson.duration_minutes} min
                                    </Text>
                                  )}
                                  {lesson.is_preview && (
                                    <Badge className="text-[9px] h-4 px-1 border-0" style={{ backgroundColor: "rgba(239,189,95,0.1)", color: "#EFBD5F" }}>
                                      Preview
                                    </Badge>
                                  )}
                                </Box>
                              </Box>
                              <Badge
                                className="text-[9px] shrink-0 border-0 font-semibold"
                                style={badgeStyle}
                              >
                                {STATUS_LABEL[lesson.progress_status]}
                              </Badge>
                              <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "#888888" }} />
                            </Box>
                          );
                        })}
                      </Box>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}
        </CardContent>
      </PremiumCard>
    </Box>
  );
}
