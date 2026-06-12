import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { MyCoursesContent } from "@/components/learner/my-courses-content";

export default function MyCoursesPage() {
  return (
    <Box className="space-y-5">
      <Box className="flex items-center justify-between flex-wrap gap-3">
        <Box>
          <Text as="h1" className="font-bold tracking-tight" style={{ fontSize: "32px", lineHeight: "1.15", color: "#111111" }}>My Courses</Text>
          <Text as="p" className="text-xs mt-1" style={{ color: "#6B6B6B" }}>
            Home › <Text as="span" className="font-medium" style={{ color: "#A3A3A3" }}>My Courses</Text>
          </Text>
        </Box>
      </Box>
      <MyCoursesContent />
    </Box>
  );
}
