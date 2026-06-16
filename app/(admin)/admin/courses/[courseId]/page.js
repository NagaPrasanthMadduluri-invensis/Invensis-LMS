import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { CourseDetailTabs } from "@/components/admin/course-detail-tabs";
import { BookOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function AdminCourseDetailPage({ params }) {
  const { courseId } = await params;

  return (
    <Box className="space-y-6">
      <Box className="flex items-center gap-3 bg-indigo-50 rounded-xl px-5 py-4">
        <Link
          href="/admin/courses"
          className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 hover:bg-indigo-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-indigo-500" />
        </Link>
        <Box className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5 text-indigo-500" />
        </Box>
        <Box>
          <Text as="h1" className="text-xl font-bold text-slate-800 leading-tight">
            Course Management
          </Text>
          <Text as="p" className="text-slate-400 text-xs mt-0.5">
            Admin &rsaquo;{" "}
            <Link href="/admin/courses" className="text-indigo-500 hover:underline font-medium">Courses</Link>{" "}
            &rsaquo; Manage
          </Text>
        </Box>
      </Box>
      <CourseDetailTabs courseId={courseId} />
    </Box>
  );
}
