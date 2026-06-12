"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  Calendar,
  MapPin,
  Video,
  Monitor,
  Play,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchMyCourses } from "@/services/api/learner/learner-api";
import { PremiumCard } from "@/components/ui/wave-card";

const MOCK_COURSES = [
  {
    enrollment_id: 1,
    course: { id: "pmp-001", name: "PMP Certification Training", duration_hours: 35 },
    schedule: { training_mode: "live_virtual", start_date: "2024-02-01", end_date: "2024-04-30" },
    progress_percentage: 68,
    status: "active",
    granted_at: "2024-01-28T00:00:00Z",
  },
  {
    enrollment_id: 2,
    course: { id: "itil-002", name: "ITIL 4 Foundation", duration_hours: 24 },
    schedule: { training_mode: "self_paced", start_date: null, end_date: null },
    progress_percentage: 35,
    status: "active",
    granted_at: "2024-03-10T00:00:00Z",
  },
  {
    enrollment_id: 3,
    course: { id: "six-sigma-003", name: "Six Sigma Green Belt", duration_hours: 30 },
    schedule: { training_mode: "classroom", start_date: "2024-05-01", end_date: "2024-06-30" },
    progress_percentage: 12,
    status: "active",
    granted_at: "2024-04-20T00:00:00Z",
  },
  {
    enrollment_id: 4,
    course: { id: "csm-004", name: "Scrum Master (CSM)", duration_hours: 20 },
    schedule: { training_mode: "live_virtual", start_date: "2023-10-01", end_date: "2023-12-15" },
    progress_percentage: 100,
    status: "completed",
    granted_at: "2023-09-25T00:00:00Z",
  },
  {
    enrollment_id: 5,
    course: { id: "prince2-005", name: "PRINCE2 Foundation", duration_hours: 22 },
    schedule: { training_mode: "self_paced", start_date: null, end_date: null },
    progress_percentage: 0,
    status: "active",
    granted_at: "2024-06-01T00:00:00Z",
  },
  {
    enrollment_id: 6,
    course: { id: "capm-006", name: "CAPM Certification Training", duration_hours: 28 },
    schedule: { training_mode: "live_virtual", start_date: "2023-06-01", end_date: "2023-08-30" },
    progress_percentage: 100,
    status: "completed",
    granted_at: "2023-05-20T00:00:00Z",
  },
];

const MODE_CONFIG = {
  live_virtual: { label: "Live Virtual", icon: Video },
  classroom:    { label: "Classroom",    icon: MapPin },
  self_paced:   { label: "Self-Paced",   icon: Monitor },
};

const STATUS_CONFIG = {
  active:    { label: "Active",     dot: "bg-emerald-400" },
  completed: { label: "Completed",  dot: "bg-blue-400" },
  expired:   { label: "Expired",    dot: "bg-red-400" },
};

const BANNER_GRADIENT = "linear-gradient(178.73deg, #4F2183 -26.7%, #090909 126.7%)";

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function CourseCardSkeleton() {
  return (
    <Card className="p-0 overflow-hidden">
      <Skeleton className="h-32 w-full" style={{ backgroundColor: "#cccccc" }} />
      <Box className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" style={{ backgroundColor: "#cccccc" }} />
        <Skeleton className="h-3 w-1/2" style={{ backgroundColor: "#cccccc" }} />
        <Skeleton className="h-2 w-full rounded-full" style={{ backgroundColor: "#cccccc" }} />
        <Skeleton className="h-8 w-full" style={{ backgroundColor: "#cccccc" }} />
      </Box>
    </Card>
  );
}

function CourseCard({ course }) {
  const { course: courseData, schedule, progress_percentage, status, granted_at } = course;
  const mode = MODE_CONFIG[schedule?.training_mode] || MODE_CONFIG.self_paced;
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.active;
  const ModeIcon = mode.icon;
  const isComplete = progress_percentage >= 100;

  return (
    <Link href={`/my-courses/${courseData.id}`} className="block group">
      <PremiumCard className="p-0 overflow-hidden group-hover:scale-[1.02] transition-all duration-200">

        {/* ── Banner ── */}
        <Box className="relative h-36 flex flex-col justify-between p-4 overflow-hidden" style={{ background: BANNER_GRADIENT, color: "white" }}>
          <Text as="span" className="absolute -bottom-2 -right-1 text-[7rem] font-black leading-none text-white/20 select-none pointer-events-none">
            {courseData.name.charAt(0)}
          </Text>

          <Box className="flex items-center justify-between relative z-10">
            <Box className="flex items-center gap-1.5 bg-black/40 rounded-full px-2.5 py-1">
              <ModeIcon className="h-3 w-3 text-white/80" />
              <Text as="span" className="text-[10px] text-white/90 font-medium">{mode.label}</Text>
            </Box>
            <Box className="flex items-center gap-1.5 bg-black/40 rounded-full px-2.5 py-1">
              <Box className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
              <Text as="span" className="text-[10px] text-white/90 font-medium">{statusCfg.label}</Text>
            </Box>
          </Box>

          <Box className="relative z-10">
            <Text as="p" className="text-white font-bold text-sm leading-snug line-clamp-2">
              {courseData.name}
            </Text>
          </Box>
        </Box>

        {/* ── Body ── */}
        <Box className="p-4 space-y-3">

          <Box className="flex items-center gap-3 flex-wrap">
            {courseData.duration_hours && (
              <Box className="flex items-center gap-1">
                <Clock className="h-3 w-3" style={{ color: "#555555" }} />
                <Text as="span" className="text-[11px]" style={{ color: "#555555" }}>{courseData.duration_hours} hrs</Text>
              </Box>
            )}
            {schedule?.start_date && (
              <Box className="flex items-center gap-1">
                <Calendar className="h-3 w-3" style={{ color: "#555555" }} />
                <Text as="span" className="text-[11px]" style={{ color: "#555555" }}>{formatDate(schedule.start_date)}</Text>
              </Box>
            )}
            <Text as="span" className="text-[11px] ml-auto" style={{ color: "#555555" }}>
              Enrolled {formatDate(granted_at)}
            </Text>
          </Box>

          <Box>
            <Box className="flex items-center justify-between mb-1.5">
              <Text as="span" className="text-[11px]" style={{ color: "#444444" }}>Progress</Text>
              <Text as="span" className="text-[11px] font-bold">{Math.round(progress_percentage)}%</Text>
            </Box>
            <Box className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(0,0,0,0.12)" }}>
              <Box
                className="h-full rounded-full transition-all duration-500"
                role="progressbar"
                aria-valuenow={progress_percentage}
                style={{ width: `${progress_percentage}%`, background: isComplete ? "#10B981" : "linear-gradient(90deg, #7C3AED, #EFBD5F)" }}
              />
            </Box>
          </Box>

          <Button
            className="w-full h-9 font-semibold text-sm rounded-full border-0 text-[#1a0a00] transition-all"
            style={{ background: "linear-gradient(135deg, #EFBD5F, #EC7D50)" }}
            variant="ghost"
          >
            <Play className="h-3.5 w-3.5 mr-2" />
            {isComplete ? "Review Course" : progress_percentage > 0 ? "Continue Learning" : "Start Course"}
          </Button>

        </Box>
      </PremiumCard>
    </Link>
  );
}

export function MyCoursesContent() {
  const { user, token } = useAuth();
  const [courses, setCourses] = useState(MOCK_COURSES);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !user) return;

    fetchMyCourses({ token, userId: user.id })
      .then((data) => { if (data.courses?.length) setCourses(data.courses); })
      .catch(() => {});
  }, [token, user]);

  if (error) {
    return (
      <Card className="p-6">
        <Text as="p" className="text-red-600">Failed to load courses: {error}</Text>
      </Card>
    );
  }

  if (!courses) {
    return (
      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <CourseCardSkeleton key={i} />
        ))}
      </Box>
    );
  }

  if (courses.length === 0) {
    return (
      <PremiumCard className="p-12 text-center">
        <Text as="h3" className="text-base">No courses yet</Text>
        <Text as="p" className="text-sm mt-1" style={{ color: "#555555" }}>
          Browse the course catalog to enroll in your first course.
        </Text>
        <Button
          className="mt-4 border-0 text-[#1a0a00] font-semibold"
          size="sm"
          style={{ background: "linear-gradient(135deg, #EFBD5F, #EC7D50)" }}
        >
          Browse Courses
        </Button>
      </PremiumCard>
    );
  }

  return (
    <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {courses.map((course, index) => (
        <CourseCard key={course.enrollment_id} course={course} />
      ))}
    </Box>
  );
}
