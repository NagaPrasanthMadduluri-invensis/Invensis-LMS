"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Search,
  Clock,
  Layers,
  FileText,
  Users,
  HelpCircle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  X,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchAdminCourses } from "@/services/api/admin/admin-api";

const TYPE_CONFIG = {
  certification: { label: "Certification", color: "bg-violet-100 text-violet-700" },
  training_only:  { label: "Training",      color: "bg-amber-100 text-amber-700"  },
};

const GRADIENT = "from-slate-500 to-slate-700";



function CardSkeleton() {
  return (
    <Card className="p-0 overflow-hidden rounded-xl border-0 shadow-sm">
      <Skeleton className="h-28 w-full" />
      <Box className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-8 w-full" />
      </Box>
    </Card>
  );
}

function CourseCard({ course, onClick }) {
  const typeCfg = TYPE_CONFIG[course.type] || TYPE_CONFIG.training_only;

  return (
    <Card
      className="p-0 overflow-hidden group hover:shadow-lg transition-all duration-200 cursor-pointer rounded-xl border-0 shadow-sm"
      onClick={onClick}
    >
      {/* Gradient Banner */}
      <Box className={`relative h-10 bg-gradient-to-br ${GRADIENT}`}>
        <Box className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
        <Box className="absolute -left-2 -bottom-4 w-14 h-14 rounded-full bg-white/10" />
        <Box className="absolute inset-0 flex items-center justify-center">
          <Box className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-white" />
          </Box>
        </Box>
        <Box className="absolute top-2 left-2">
          <Badge className={`text-[10px] border-0 ${typeCfg.color}`}>{typeCfg.label}</Badge>
        </Box>
        <Box className="absolute top-2 right-2">
          <Badge className={`text-[10px] border-0 ${course.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
            {course.is_active ? "Active" : "Inactive"}
          </Badge>
        </Box>
      </Box>

      {/* Body */}
      <Box className="p-4 space-y-3">
        <Box>
          <Text
            as="h3"
            className="text-sm font-semibold text-slate-900 leading-snug group-hover:text-violet-600 transition-colors line-clamp-2"
          >
            {course.name}
          </Text>
          {course.category && (
            <Text as="p" className="text-[11px] text-slate-400 mt-0.5">
              {course.category}
            </Text>
          )}
        </Box>

        {/* Stats 2×2 */}
        <Box className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          <Box className="flex items-center gap-1.5">
            <Layers className="w-3 h-3 text-slate-400 shrink-0" />
            <Text as="span" className="text-[11px] text-slate-500">{course.modules_count ?? 0} Modules</Text>
          </Box>
          <Box className="flex items-center gap-1.5">
            <FileText className="w-3 h-3 text-slate-400 shrink-0" />
            <Text as="span" className="text-[11px] text-slate-500">{course.lessons_count ?? 0} Lessons</Text>
          </Box>
          <Box className="flex items-center gap-1.5">
            <HelpCircle className="w-3 h-3 text-slate-400 shrink-0" />
            <Text as="span" className="text-[11px] text-slate-500">{course.assessments_count ?? 0} Assessments</Text>
          </Box>
          <Box className="flex items-center gap-1.5">
            <Users className="w-3 h-3 text-slate-400 shrink-0" />
            <Text as="span" className="text-[11px] text-slate-500">{course.enrollments_count ?? 0} Enrolled</Text>
          </Box>
        </Box>

        {/* Footer */}
        <Box className="flex items-center justify-between pt-2 border-t border-slate-100">
          <Box className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <Text as="span" className="text-[11px] text-slate-400">
              {course.duration_hours ?? 0}-Hour · {course.duration_days ?? 0} Days
            </Text>
          </Box>
          <Button size="sm" className={`text-xs h-7 px-3 border-0 text-white bg-gradient-to-r ${GRADIENT} hover:opacity-90`}>
            Manage
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </Box>
      </Box>
    </Card>
  );
}

const FILTERS = [
  { key: "all",           label: "All"           },
  { key: "certification", label: "Certification" },
  { key: "training_only", label: "Training Only" },
];

export function CourseSelector() {
  const { token } = useAuth();
  const router    = useRouter();
  const [courses,      setCourses]      = useState(null);
  const [search,       setSearch]       = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [error,        setError]        = useState(null);

  useEffect(() => {
    if (!token) return;
    fetchAdminCourses({ token })
      .then((data) => setCourses(data.courses || []))
      .catch((err) => setError(err.message));
  }, [token]);

  if (error) {
    return (
      <Card className="p-6 border-red-100 bg-red-50">
        <Text as="p" className="text-red-600 text-sm">Failed to load courses: {error}</Text>
      </Card>
    );
  }

  if (!courses) {
    return (
      <Box className="space-y-4">
        <Box className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </Box>
        <Skeleton className="h-10 rounded-xl" />
        <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)}
        </Box>
      </Box>
    );
  }

  const activeCount = courses.filter((c) => c.is_active).length;

  const filtered = courses.filter((c) => {
    const matchesType   = activeFilter === "all" || c.type === activeFilter;
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
                          c.category?.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <Box className="space-y-4">

      {/* ── Stat Cards ── */}
      <Box className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Courses", value: courses.length,              bg: "bg-violet-200",  icon: "bg-violet-300 text-violet-700",  val: "text-violet-900",  Icon: BookOpen     },
          { label: "Active",        value: activeCount,                  bg: "bg-emerald-200", icon: "bg-emerald-300 text-emerald-700", val: "text-emerald-900", Icon: CheckCircle2 },
          { label: "Inactive",      value: courses.length - activeCount, bg: "bg-rose-200",    icon: "bg-rose-300 text-rose-700",       val: "text-rose-900",    Icon: XCircle      },
        ].map((s) => (
          <Card key={s.label} className={`p-4 border-0 shadow-sm rounded-xl ${s.bg}`}>
            <Box className="flex items-start justify-between">
              <Box>
                <Text as="span" className="text-[11px] font-medium text-slate-500 block">{s.label}</Text>
                <Text as="h3" className={`text-3xl font-bold leading-none mt-1 ${s.val}`}>{s.value}</Text>
              </Box>
              <Box className={`p-2 rounded-xl shrink-0 ${s.icon}`}>
                <s.Icon className="h-5 w-5" />
              </Box>
            </Box>
          </Card>
        ))}
      </Box>

      {/* ── Filter Tabs ── */}
<Box className="border-b">
  <Box className="flex items-center">
    {FILTERS.map((f) => (
      <button
        key={f.key}
        onClick={() => setActiveFilter(f.key)}
        className={`
          flex items-center gap-2
          px-5 py-3
          text-sm font-medium
          border-b-2
          transition-colors
          ${
            activeFilter === f.key
              ? "border-primary text-primary"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }
        `}
      >
        {f.label}

        <span
          className={`
            text-xs rounded-full px-2 py-0.5
            ${
              activeFilter === f.key
                ? "bg-primary/10 text-primary"
                : "bg-slate-100 text-slate-500"
            }
          `}
        >
          {f.key === "all"
            ? courses.length
            : courses.filter((c) => c.type === f.key).length}
        </span>
      </button>
    ))}
  </Box>
</Box>

      {/* ── Search ── */}
      <Box className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by course name or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-9 h-10 text-sm bg-white border-slate-400 focus-visible:ring-violet-400"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </Box>

      <Text as="p" className="text-xs text-slate-400">
        Showing {filtered.length} of {courses.length} course{courses.length !== 1 ? "s" : ""}
      </Text>

      {/* ── Course Grid ── */}
      {filtered.length === 0 ? (
        <Card className="p-10 text-center border-0 shadow-sm bg-white rounded-xl">
          <Box className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <BookOpen className="h-6 w-6 text-slate-400" />
          </Box>
          <Text as="p" className="text-sm font-medium text-slate-600 mb-1">
            {search ? "No courses match your search" : "No courses available"}
          </Text>
          {search && <Text as="p" className="text-xs text-slate-400">Try a different keyword</Text>}
        </Card>
      ) : (
        // <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <Box className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((course, index) => (
            <CourseCard
              key={course.id}
              course={course}
              onClick={() => router.push(`/admin/courses/${course.id}`)}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
