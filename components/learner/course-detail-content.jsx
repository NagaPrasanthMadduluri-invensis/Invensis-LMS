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
  completed: "text-emerald-500",
  in_progress: "text-indigo-500",
  not_started: "text-muted-foreground/40",
};

const STATUS_LABEL = {
  completed: "Completed",
  in_progress: "In Progress",
  not_started: "Not Started",
};

function DetailSkeleton() {
  return (
    <Box className="space-y-4">
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
      <Skeleton className="h-48 w-full rounded-lg" />
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
      <Card className="p-6">
        <Text as="p" className="text-red-600">Failed to load course: {error}</Text>
      </Card>
    );
  }

  if (!data) return <DetailSkeleton />;

  const { course, enrollment, modules = [] } = data;

  const totalLessons = modules.reduce((sum, m) => sum + m.total_count, 0);
  const completedLessons = modules.reduce((sum, m) => sum + m.completed_count, 0);
  const progress = enrollment?.progress_percentage ?? 0;

  return (
    <Box className="space-y-5">
      {/* ── Course Header Card ── */}
      <Card>
        <CardContent className="py-5">
          <Box className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <Box className="flex-1">
              <Text as="h2" className="text-xl">{course.name}</Text>
              {course.description && (
                <Text as="p" className="text-sm text-muted-foreground mt-1">
                  {course.description}
                </Text>
              )}
              <Box className="flex items-center gap-4 mt-3 flex-wrap">
                {course.duration_hours && (
                  <Box className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <Text as="span" className="text-xs text-muted-foreground">
                      {course.duration_hours} hours
                    </Text>
                  </Box>
                )}
                <Box className="flex items-center gap-1.5">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <Text as="span" className="text-xs text-muted-foreground">
                    {modules.length} module{modules.length !== 1 ? "s" : ""} · {totalLessons} lesson{totalLessons !== 1 ? "s" : ""}
                  </Text>
                </Box>
                {enrollment && (
                  <Badge
                    className={`text-[10px] border-0 ${enrollment.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}
                  >
                    {enrollment.status}
                  </Badge>
                )}
              </Box>
            </Box>

            {/* Progress circle */}
            {enrollment && (
              <Box className="flex items-center gap-4 shrink-0">
                <Box className="text-center">
                  <Text as="h2" className="text-3xl text-indigo-600">
                    {Math.round(progress)}%
                  </Text>
                  <Text as="span" className="text-[11px] text-muted-foreground">
                    {completedLessons}/{totalLessons} lessons
                  </Text>
                </Box>
              </Box>
            )}
          </Box>

          {/* Overall progress bar */}
          {enrollment && (
            <Box className="mt-4">
              <Box className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <Box
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                  role="progressbar"
                  aria-valuenow={progress}
                  style={{ width: `${progress}%` }}
                />
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── Stats Row ── */}
      <Box className="grid grid-cols-3 gap-3">
        <Card className="p-4">
          <Box className="flex items-center gap-3">
            <Box className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </Box>
            <Box>
              <Text as="h3" className="text-lg leading-none">{completedLessons}</Text>
              <Text as="span" className="text-[11px] text-muted-foreground">Completed</Text>
            </Box>
          </Box>
        </Card>
        <Card className="p-4">
          <Box className="flex items-center gap-3">
            <Box className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
              <Loader2 className="h-4 w-4 text-indigo-600" />
            </Box>
            <Box>
              <Text as="h3" className="text-lg leading-none">
                {modules.reduce((sum, m) => sum + m.lessons.filter((l) => l.progress_status === "in_progress").length, 0)}
              </Text>
              <Text as="span" className="text-[11px] text-muted-foreground">In Progress</Text>
            </Box>
          </Box>
        </Card>
        <Card className="p-4">
          <Box className="flex items-center gap-3">
            <Box className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <BarChart3 className="h-4 w-4 text-gray-500" />
            </Box>
            <Box>
              <Text as="h3" className="text-lg leading-none">{totalLessons - completedLessons}</Text>
              <Text as="span" className="text-[11px] text-muted-foreground">Remaining</Text>
            </Box>
          </Box>
        </Card>
      </Box>

      {/* ── Resources ── */}
      <LearnerCourseResources courseId={courseId} />

      {/* ── Modules Accordion ── */}
      <Card>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-semibold">Course Content</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {modules.length === 0 ? (
            <Text as="p" className="text-sm text-muted-foreground py-4 text-center">
              No modules available yet.
            </Text>
          ) : (
            <Accordion type="multiple" defaultValue={modules.map((m) => `module-${m.id}`)}>
              {modules.map((mod) => {
                const modProgress = mod.total_count > 0
                  ? Math.round((mod.completed_count / mod.total_count) * 100)
                  : 0;

                return (
                  <AccordionItem key={mod.id} value={`module-${mod.id}`}>
                    <AccordionTrigger className="hover:no-underline py-3">
                      <Box className="flex items-center gap-3 flex-1 text-left">
                        <Box className="flex-1 min-w-0">
                          <Text as="p" className="text-sm font-semibold">
                            {mod.title}
                          </Text>
                          <Text as="span" className="text-[11px] text-muted-foreground">
                            {mod.completed_count}/{mod.total_count} lessons · {modProgress}% complete
                          </Text>
                        </Box>
                        {/* Module mini progress */}
                        <Box className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden shrink-0 mr-2">
                          <Box
                            className="h-full rounded-full bg-emerald-500"
                            style={{ width: `${modProgress}%` }}
                          />
                        </Box>
                      </Box>
                    </AccordionTrigger>
                    <AccordionContent>
                      <Box className="divide-y ml-1">
                        {mod.lessons.map((lesson) => {
                          const StatusIcon = STATUS_ICON[lesson.progress_status] || Circle;
                          const statusColor = STATUS_COLOR[lesson.progress_status] || STATUS_COLOR.not_started;
                          const ContentIcon = CONTENT_TYPE_ICON[lesson.content_type] || FileText;
                          const contentLabel = CONTENT_TYPE_LABEL[lesson.content_type] || lesson.content_type;

                          return (
                            <Box
                              key={lesson.id}
                              className="flex items-center gap-3 py-2.5 px-2 rounded-md hover:bg-muted/50 cursor-pointer transition-colors group"
                              onClick={() =>
                                router.push(`/my-courses/${courseId}/lessons/${lesson.id}`)
                              }
                            >
                              <StatusIcon className={`h-4 w-4 shrink-0 ${statusColor}`} />
                              <ContentIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
                              <Box className="flex-1 min-w-0">
                                <Text as="p" className="text-sm truncate">
                                  {lesson.title}
                                </Text>
                                <Box className="flex items-center gap-2">
                                  <Text as="span" className="text-[10px] text-muted-foreground">
                                    {contentLabel}
                                  </Text>
                                  {lesson.duration_minutes && (
                                    <Text as="span" className="text-[10px] text-muted-foreground">
                                      · {lesson.duration_minutes} min
                                    </Text>
                                  )}
                                  {lesson.is_preview && (
                                    <Badge variant="secondary" className="text-[9px] h-4 px-1">
                                      Preview
                                    </Badge>
                                  )}
                                </Box>
                              </Box>
                              <Badge
                                variant="secondary"
                                className={`text-[9px] shrink-0 ${
                                  lesson.progress_status === "completed"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : lesson.progress_status === "in_progress"
                                    ? "bg-indigo-100 text-indigo-700"
                                    : "bg-gray-100 text-gray-500"
                                }`}
                              >
                                {STATUS_LABEL[lesson.progress_status]}
                              </Badge>
                              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
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
      </Card>
    </Box>
  );
}
