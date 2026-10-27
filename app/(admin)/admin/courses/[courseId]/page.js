import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { BookOpen, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { TrainingManagement } from "@/components/admin/training-management";

export default async function AdminCourseDetailPage({ params, searchParams }) {
  const { courseId } = await params;
  // Preserve the list tab the admin came from, so Back returns to it.
  const sp = await searchParams;
  const tab = typeof sp?.tab === "string" ? sp.tab : "";
  const backHref = tab ? `/admin/courses?tab=${encodeURIComponent(tab)}` : "/admin/courses";

  return (
    <Box className="space-y-7">
      <Box className="rounded-2xl bg-[#d7e3fc] border border-primary-border px-7 py-6 flex items-center gap-4">
        <Link
          href={backHref}
          className="w-10 h-10 rounded-xl bg-surface border border-primary-border hover:bg-primary-subtle flex items-center justify-center shrink-0 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-primary" />
        </Link>
        <Box className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
          <BookOpen className="w-6 h-6 text-primary-foreground" />
        </Box>
        <Box>
          <Text as="h1" className="text-xl font-bold text-foreground leading-tight">Training Management</Text>
          <Text as="p" className="text-foreground-muted text-xs mt-0.5">
            <Link href={backHref} className="text-primary hover:text-primary transition-colors">Courses</Link>
            {" "}&rsaquo; Manage
          </Text>
        </Box>
      </Box>
      <TrainingManagement trainingId={courseId} />
    </Box>
  );
}
