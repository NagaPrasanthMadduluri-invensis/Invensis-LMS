import Link from "next/link";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { ChevronLeft } from "lucide-react";
import { MyCoursesContent } from "@/components/learner/my-courses-content";

/*
 * Full detail for one of the learner's trainings — schedule, sessions,
 * resources and guidelines. This is the view /my-courses used to render on its
 * own, before that page became the list of every training.
 *
 * `trainingRef` is the training's code ("TRN-2026-0019"); the detail endpoint
 * takes a uuid just as happily. Either way the component matches it against the
 * learner's own enrolments first, so the URL alone grants no access.
 *
 * This segment previously served a Course Content + Assessments page backed by
 * `/lms/courses/...` — endpoints the API never exposed, and which nothing in
 * the portal linked to.
 */
export default async function TrainingDetailPage({ params }) {
  const { trainingRef } = await params;

  return (
    <Box className="space-y-5">
      <Link
        href="/my-courses"
        className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 transition-colors hover:text-violet-600"
      >
        <ChevronLeft className="h-3.5 w-3.5" />
        <Text as="span" className="text-xs text-inherit">All trainings</Text>
      </Link>
      <MyCoursesContent trainingRef={trainingRef} />
    </Box>
  );
}
