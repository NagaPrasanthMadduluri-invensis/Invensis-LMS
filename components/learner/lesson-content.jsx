"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  PlayCircle,
  FileText,
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchLessonContent, markLessonComplete } from "@/services/api/learner/learner-api";
import { PremiumCard } from "@/components/ui/wave-card";

const CONTENT_TYPE_ICON = {
  video: PlayCircle,
  pdf: FileText,
  external: ExternalLink,
  quiz: HelpCircle,
};

function LessonSkeleton() {
  return (
    <Box className="space-y-4">
      <Skeleton className="h-10 w-64" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
      <Skeleton className="aspect-video w-full rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
      <Skeleton className="h-20 w-full rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
    </Box>
  );
}

function VideoPlayer({ url }) {
  if (!url) return null;
  return (
    <Box className="aspect-video w-full rounded-xl overflow-hidden" style={{ backgroundColor: "#000" }}>
      <iframe
        src={url}
        className="w-full h-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        title="Lesson video"
      />
    </Box>
  );
}

function PdfViewer({ url }) {
  if (!url) return null;
  return (
    <Box className="w-full rounded-xl overflow-hidden border" style={{ height: "70vh", borderColor: "rgba(0,0,0,0.1)" }}>
      <iframe src={url} className="w-full h-full" title="Lesson PDF" />
    </Box>
  );
}

function ExternalContent({ url }) {
  if (!url) return null;
  return (
    <PremiumCard className="p-8 text-center">
      <ExternalLink className="h-10 w-10 mx-auto mb-3" style={{ color: "#7C3AED" }} />
      <Text as="h3" className="text-base">External Content</Text>
      <Text as="p" className="text-sm mt-1 mb-4" style={{ color: "#555555" }}>
        This lesson opens in an external portal.
      </Text>
      <Button asChild className="border-0 text-[#1a0a00] font-semibold" style={{ background: "linear-gradient(135deg, #EFBD5F, #EC7D50)" }}>
        <a href={url} target="_blank" rel="noopener noreferrer">
          Open External Portal
        </a>
      </Button>
    </PremiumCard>
  );
}

function QuizPlaceholder() {
  return (
    <PremiumCard className="p-8 text-center">
      <HelpCircle className="h-10 w-10 mx-auto mb-3" style={{ color: "#7C3AED" }} />
      <Text as="h3" className="text-base">Quiz</Text>
      <Text as="p" className="text-sm mt-1" style={{ color: "#555555" }}>
        This lesson is a quiz. Head to the Assessments section to attempt it.
      </Text>
    </PremiumCard>
  );
}

export function LessonContent({ courseId, lessonId }) {
  const { user, token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [completing, setCompleting] = useState(false);
  const [status, setStatus] = useState(null);

  useEffect(() => {
    if (!token || !user) return;
    fetchLessonContent({ token, courseId, lessonId, userId: user.id })
      .then((res) => {
        setData(res);
        setStatus(res.progress_status);
      })
      .catch((err) => setError(err.message));
  }, [token, user, courseId, lessonId]);

  const handleMarkComplete = async () => {
    setCompleting(true);
    try {
      await markLessonComplete({ token, courseId, lessonId, userId: user.id });
      setStatus("completed");
    } catch (err) {
      setError(err.message);
    } finally {
      setCompleting(false);
    }
  };

  if (error) {
    return (
      <PremiumCard className="p-6" style={{ borderColor: "rgba(244,63,94,0.3)" }}>
        <Text as="p" className="text-rose-400">Failed to load lesson: {error}</Text>
      </PremiumCard>
    );
  }

  if (!data) return <LessonSkeleton />;

  const { lesson } = data;
  const ContentIcon = CONTENT_TYPE_ICON[lesson.content_type] || FileText;

  const statusBadge = status === "completed"
    ? { backgroundColor: "rgba(16,185,129,0.12)", color: "#10B981" }
    : status === "in_progress"
    ? { backgroundColor: "rgba(124,58,237,0.15)", color: "#A78BFA" }
    : { backgroundColor: "#1A1A1A", color: "#555555" };

  return (
    <Box className="space-y-5">
      {/* ── Back + Breadcrumb ── */}
      <Box className="flex items-center gap-3 flex-wrap">
        <Button
          variant="ghost"
          size="sm"
          className="shrink-0 font-medium"
          style={{ color: "#444444", backgroundColor: "rgba(0,0,0,0.05)", border: "1px solid rgba(0,0,0,0.1)" }}
          onClick={() => router.push(`/my-courses/${courseId}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Course
        </Button>
        {lesson.module && (
          <Text as="span" className="text-xs" style={{ color: "#444444" }}>
            {lesson.module.title}
          </Text>
        )}
      </Box>

      {/* ── Lesson Info ── */}
      <PremiumCard className="border overflow-hidden">
        <CardHeader className="py-4 px-5">
          <Box className="flex items-start justify-between gap-4 flex-wrap">
            <Box className="flex-1 min-w-0">
              <Box className="flex items-center gap-2 mb-1">
                <ContentIcon className="h-4 w-4 text-violet-600 shrink-0" />
                <Badge className="text-[10px] border-0 font-semibold" style={statusBadge}>
                  {status === "completed" ? "Completed" : status === "in_progress" ? "In Progress" : "Not Started"}
                </Badge>
              </Box>
              <CardTitle className="text-lg">{lesson.title}</CardTitle>
              {lesson.description && (
                <Text as="p" className="text-sm mt-1" style={{ color: "#555555" }}>
                  {lesson.description}
                </Text>
              )}
              {lesson.duration_minutes && (
                <Box className="flex items-center gap-1 mt-2">
                  <Clock className="h-3.5 w-3.5" style={{ color: "#666666" }} />
                  <Text as="span" className="text-xs" style={{ color: "#444444" }}>
                    {lesson.duration_minutes} minutes
                  </Text>
                </Box>
              )}
            </Box>

            {status !== "completed" && (
              <Button
                size="sm"
                onClick={handleMarkComplete}
                disabled={completing}
                className="shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
              >
                <CheckCircle2 className="h-4 w-4 mr-1" />
                {completing ? "Marking..." : "Mark Complete"}
              </Button>
            )}
            {status === "completed" && (
              <Box className="flex items-center gap-1.5 text-emerald-400 shrink-0">
                <CheckCircle2 className="h-5 w-5" />
                <Text as="span" className="text-sm font-semibold">Completed</Text>
              </Box>
            )}
          </Box>
        </CardHeader>
      </PremiumCard>

      {/* ── Content Area ── */}
      {lesson.content_type === "video"    && <VideoPlayer url={lesson.content_url} />}
      {lesson.content_type === "pdf"      && <PdfViewer url={lesson.content_url} />}
      {lesson.content_type === "external" && <ExternalContent url={lesson.content_url} />}
      {lesson.content_type === "quiz"     && <QuizPlaceholder />}
    </Box>
  );
}
