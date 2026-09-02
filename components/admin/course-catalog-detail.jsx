"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Library, Award, Clock, Hash, AlertCircle } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchCourse } from "@/services/api/admin/course-resources-api";
import { ResourceManager } from "@/components/admin/resource-manager";

export function CourseCatalogDetail({ slug }) {
  const { token } = useAuth();
  const [course, setCourse] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !slug) return;
    fetchCourse({ token, courseRef: slug })
      .then((d) => setCourse(d.course))
      .catch((e) => setError(e.message));
  }, [token, slug]);

  if (error) {
    return (
      <Card className="p-5 border-red-100 bg-red-50 rounded-2xl">
        <Box className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <Text as="p" className="text-sm text-red-600">{error}</Text>
        </Box>
      </Card>
    );
  }

  if (!course) {
    return (
      <Box className="space-y-5">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </Box>
    );
  }

  return (
    <Box className="space-y-6">
      {/* Course summary */}
      <Card className="p-5 rounded-2xl border border-slate-200/80 shadow-sm">
        <Box className="flex items-start gap-4">
          <Box className="w-12 h-12 rounded-2xl bg-violet-50 flex items-center justify-center shrink-0">
            <Library className="h-6 w-6 text-violet-600" />
          </Box>
          <Box className="min-w-0 flex-1">
            <Text as="h2" className="text-lg font-bold text-slate-900 leading-snug">{course.name}</Text>
            <Box className="flex items-center gap-1.5 mt-1">
              <Hash className="h-3 w-3 text-slate-400 shrink-0" />
              <Text as="span" className="text-xs text-slate-500 font-mono">{course.slug}</Text>
            </Box>
            {course.description && (
              <Text as="p" className="text-sm text-slate-600 mt-2 line-clamp-3">{course.description}</Text>
            )}
            <Box className="flex flex-wrap items-center gap-2 mt-3">
              {course.category?.name && (
                <Badge className="border-0 bg-slate-100 text-slate-600 text-[11px] font-medium">{course.category.name}</Badge>
              )}
              {course.course_type && (
                <Badge className="border-0 bg-violet-50 text-violet-700 text-[11px] font-medium capitalize">{course.course_type.replace(/_/g, " ")}</Badge>
              )}
              {course.certification_included && (
                <Badge className="border-0 bg-amber-50 text-amber-700 text-[11px] font-medium">
                  <Award className="h-3 w-3 mr-1" /> Certification included
                </Badge>
              )}
              {course.duration_hours != null && (
                <Badge className="border-0 bg-slate-100 text-slate-600 text-[11px] font-medium">
                  <Clock className="h-3 w-3 mr-1" /> {course.duration_hours}h
                </Badge>
              )}
            </Box>
          </Box>
        </Box>
      </Card>

      {/* Predefined resources */}
      <ResourceManager
        scope="course"
        refId={course.slug}
        heading="Predefined Resources"
        subheading="Courseware shipped with every run of this course — visible to all enrolled learners."
      />
    </Box>
  );
}
