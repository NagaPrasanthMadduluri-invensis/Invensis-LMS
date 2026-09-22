import Box from "@/components/ui/box";
import { LessonContent } from "@/components/learner/lesson-content";

/*
 * NOTE: this route is not reachable from the learner portal and its components
 * call `/lms/courses/...`, which the API does not serve. It is kept only so the
 * rename of the parent segment doesn't silently leave a broken param behind —
 * see the note on the parent page.
 */
export default async function LessonPage({ params }) {
  const { trainingRef, lessonId } = await params;

  return (
    <Box className="space-y-5">
      <LessonContent courseId={trainingRef} lessonId={lessonId} />
    </Box>
  );
}
