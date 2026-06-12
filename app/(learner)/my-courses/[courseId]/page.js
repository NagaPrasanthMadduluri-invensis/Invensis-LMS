import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { LearnerCourseDetailTabs } from "@/components/learner/course-detail-tabs";

export default async function CourseDetailPage({ params }) {
  const { courseId } = await params;

  return (
    <Box className="space-y-5">
      <Box>
        <Text as="h1" className="font-bold tracking-tight" style={{ fontSize: "32px", lineHeight: "1.15", color: "#111111" }}>Course Detail</Text>
        <Text as="p" className="text-xs mt-1" style={{ color: "#6B6B6B" }}>
          Home › <Text as="span" className="font-medium" style={{ color: "#A3A3A3" }}>My Courses</Text>
          <Text as="span" style={{ color: "#6B6B6B" }}> › Course Detail</Text>
        </Text>
      </Box>
      <LearnerCourseDetailTabs courseId={courseId} />
    </Box>
  );
}
