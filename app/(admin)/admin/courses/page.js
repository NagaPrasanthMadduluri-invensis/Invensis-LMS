import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { CourseSelector } from "@/components/admin/course-selector";

export default function AdminCoursesPage() {
  return (
    <Box className="space-y-5">
      <Box>
        <Text as="h1" className="text-2xl font-bold">Courses</Text>
        <Box className="flex items-center gap-1 mt-1">
          <Box className="w-1 h-4 rounded-full bg-primary" />
          <Text as="p" className="text-muted-foreground text-xs">
            Admin › <Text as="span" className="text-primary font-medium">Courses</Text>
          </Text>
        </Box>
      </Box>
      <CourseSelector />
    </Box>
  );
}
