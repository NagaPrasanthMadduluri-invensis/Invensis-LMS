"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  ChevronRight,
  Search,
  Clock,
  Layers,
  FileText,
  Users,
  HelpCircle,
  CalendarDays,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchAdminCourses } from "@/services/api/admin/admin-api";

const TYPE_CONFIG = {
  certification: { label: "Certification", color: "bg-indigo-100 text-indigo-700" },
  training_only: { label: "Training", color: "bg-amber-100 text-amber-700" },
};

export function CourseSelector() {
  const { token } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;

    fetchAdminCourses({ token })
      .then((data) => setCourses(data.courses || []))
      .catch((err) => setError(err.message));
  }, [token]);

  if (error) {
    return (
      <Card className="p-6">
        <Text as="p" className="text-red-600">Failed to load courses: {error}</Text>
      </Card>
    );
  }

  if (!courses) {
    return (
      <Box className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full rounded-lg" />
        ))}
      </Box>
    );
  }

  const filtered = courses.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.category?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box className="space-y-4">
      {/* Search */}
      <Box className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by course name or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-9 text-sm"
        />
      </Box>

      <Text as="p" className="text-sm text-muted-foreground">
        {filtered.length} course{filtered.length !== 1 ? "s" : ""}
      </Text>

      {/* Course list */}
      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
          <Text as="p" className="text-sm text-muted-foreground">
            {search ? "No courses match your search." : "No courses available."}
          </Text>
        </Card>
      ) : (
        <Box className="space-y-2">
          {filtered.map((course) => {
            const typeCfg = TYPE_CONFIG[course.course_type] || TYPE_CONFIG.training_only;

            return (
              <Card
                key={course.id}
                className="p-0 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => router.push(`/admin/courses/${course.id}`)}
              >
                <Box className="flex items-center gap-4 px-4 py-3">
                  <Box className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
                    <BookOpen className="h-5 w-5 text-indigo-600" />
                  </Box>

                  <Box className="flex-1 min-w-0">
                    <Box className="flex items-center gap-2 flex-wrap">
                      <Text as="p" className="text-sm font-semibold truncate">
                        {course.name}
                      </Text>
                      <Badge variant="secondary" className={`text-[10px] shrink-0 ${typeCfg.color}`}>
                        {typeCfg.label}
                      </Badge>
                      {!course.is_active && (
                        <Badge variant="secondary" className="text-[10px] bg-red-100 text-red-700 shrink-0">
                          Inactive
                        </Badge>
                      )}
                    </Box>

                    <Box className="flex items-center gap-3 mt-1 flex-wrap">
                      {course.category && (
                        <Text as="span" className="text-[11px] text-muted-foreground">
                          {course.category.name}
                        </Text>
                      )}
                      <Box className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <Text as="span" className="text-[11px] text-muted-foreground">
                          {course.duration_hours}h
                        </Text>
                      </Box>
                      <Box className="flex items-center gap-1">
                        <CalendarDays className="h-3 w-3 text-muted-foreground" />
                        <Text as="span" className="text-[11px] text-muted-foreground">
                          {course.duration_days}d
                        </Text>
                      </Box>
                      <Box className="flex items-center gap-1">
                        <Layers className="h-3 w-3 text-muted-foreground" />
                        <Text as="span" className="text-[11px] text-muted-foreground">
                          {course.modules_count} modules
                        </Text>
                      </Box>
                      <Box className="flex items-center gap-1">
                        <FileText className="h-3 w-3 text-muted-foreground" />
                        <Text as="span" className="text-[11px] text-muted-foreground">
                          {course.lessons_count} lessons
                        </Text>
                      </Box>
                      <Box className="flex items-center gap-1">
                        <HelpCircle className="h-3 w-3 text-muted-foreground" />
                        <Text as="span" className="text-[11px] text-muted-foreground">
                          {course.assessments_count} assessments
                        </Text>
                      </Box>
                      <Box className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <Text as="span" className="text-[11px] text-muted-foreground">
                          {course.enrollments_count} enrolled
                        </Text>
                      </Box>
                    </Box>
                  </Box>

                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </Box>
              </Card>
            );
          })}
        </Box>
      )}
    </Box>
  );
}
