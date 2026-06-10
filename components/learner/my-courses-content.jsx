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
import Image from "next/image";

const MODE_CONFIG = {
  live_virtual: { label: "Live Virtual", icon: Video, color: "bg-blue-100 text-blue-600" },
  classroom: { label: "Classroom", icon: MapPin, color: "bg-emerald-100 text-emerald-600" },
  self_paced: { label: "Self-Paced", icon: Monitor, color: "bg-violet-100 text-violet-600" },
};

const STATUS_CONFIG = {
  active: { label: "Active", color: "bg-emerald-100 text-emerald-700" },
  completed: { label: "Completed", color: "bg-blue-100 text-blue-700" },
  expired: { label: "Expired", color: "bg-red-100 text-red-700" },
};

const GRADIENT_POOL = [
  "from-indigo-400/60 to-purple-500/60",
  "from-emerald-400/60 to-teal-500/60",
  "from-orange-400/60 to-red-500/60",
  "from-cyan-400/60 to-blue-500/60",
  "from-pink-400/60 to-rose-500/60",
  "from-violet-400/60 to-purple-600/60",
];

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
      <Skeleton className="h-32 w-full" />
      <Box className="p-4 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-2 w-full rounded-full" />
        <Skeleton className="h-8 w-full" />
      </Box>
    </Card>
  );
}

function CourseCard({ course, index }) {
  const { enrollment_id, course: courseData, schedule, progress_percentage, status, granted_at } = course;
  const mode = MODE_CONFIG[schedule?.training_mode] || MODE_CONFIG.self_paced;
  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.active;
  const ModeIcon = mode.icon;
  const gradient = GRADIENT_POOL[index % GRADIENT_POOL.length];

  return (
    <Link href={`/my-courses/${courseData.id}`} className="block">
    <Card className="p-0 overflow-hidden group hover:shadow-md transition-shadow">
      {/* Banner */}
      <Box className={`relative h-32 bg-gradient-to-br ${gradient}`}>
        {courseData.banner_image_url && (
          <Image
            src={courseData.banner_image_url}
            alt={courseData.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <Box className="absolute top-2 right-2 flex gap-1.5">
          <Badge className={`text-[10px] border-0 ${statusCfg.color}`}>
            {statusCfg.label}
          </Badge>
          <Badge className={`text-[10px] border-0 ${mode.color}`}>
            <ModeIcon className="h-3 w-3 mr-1" />
            {mode.label}
          </Badge>
        </Box>
      </Box>

      {/* Body */}
      <Box className="p-4 space-y-3">
        <Box>
          <Text as="p" className="text-sm font-semibold leading-tight">{courseData.name}</Text>
          <Box className="flex items-center gap-3 mt-1.5">
            {courseData.duration_hours && (
              <Box className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                <Text as="span" className="text-[11px] text-muted-foreground">{courseData.duration_hours} hrs</Text>
              </Box>
            )}
            {schedule?.start_date && (
              <Box className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                <Text as="span" className="text-[11px] text-muted-foreground">
                  {formatDate(schedule.start_date)} – {formatDate(schedule.end_date)}
                </Text>
              </Box>
            )}
          </Box>
        </Box>

        {/* Progress */}
        <Box>
          <Box className="flex items-center justify-between mb-1">
            <Text as="span" className="text-[11px] text-muted-foreground">Progress</Text>
            <Text as="span" className="text-[11px] font-semibold">
              {Math.round(progress_percentage)}%
            </Text>
          </Box>
          <Box className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <Box
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
              role="progressbar"
              aria-valuenow={progress_percentage}
              style={{ width: `${progress_percentage}%` }}
            />
          </Box>
        </Box>

        {/* Footer */}
        <Box className="flex items-center justify-between pt-1">
          <Text as="span" className="text-[10px] text-muted-foreground">
            Enrolled {formatDate(granted_at)}
          </Text>
          <Button
            size="sm"
            className="text-xs h-7 px-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
          >
            <Play className="h-3 w-3 mr-1" />
            {progress_percentage > 0 ? "Continue" : "Start"}
          </Button>
        </Box>
      </Box>
    </Card>
    </Link>
  );
}

export function MyCoursesContent() {
  const { user, token } = useAuth();
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !user) return;

    fetchMyCourses({ token, userId: user.id })
      .then((data) => setCourses(data.courses || []))
      .catch((err) => setError(err.message));
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
      <Card className="p-12 text-center">
        <Text as="h3" className="text-base">No courses yet</Text>
        <Text as="p" className="text-sm text-muted-foreground mt-1">
          Browse the course catalog to enroll in your first course.
        </Text>
        <Button
          className="mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white"
          size="sm"
        >
          Browse Courses
        </Button>
      </Card>
    );
  }

  return (
    <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {courses.map((course, index) => (
        <CourseCard key={course.enrollment_id} course={course} index={index} />
      ))}
    </Box>
  );
}
