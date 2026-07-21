import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { LearnerCourseDetailTabs } from "@/components/learner/course-detail-tabs";

export default async function CourseDetailPage({ params }) {
  const { courseId } = await params;

  return (
    <Box className="space-y-5">
      <Box>
        <Text as="p" className="text-muted-foreground text-xs">
          Home &gt; <Text as="span" className="text-violet-500">My Trainings</Text> &gt; Training Detail
        </Text>
      </Box>
      <LearnerCourseDetailTabs courseId={courseId} />
    </Box>
  );
}
