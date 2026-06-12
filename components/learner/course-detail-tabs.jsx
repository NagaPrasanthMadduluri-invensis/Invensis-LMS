"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, ClipboardList } from "lucide-react";
import { CourseDetailContent }      from "@/components/learner/course-detail-content";
import { LearnerCourseAssessments } from "@/components/learner/course-assessments";

export function LearnerCourseDetailTabs({ courseId }) {
  return (
    <Tabs defaultValue="content">
      <TabsList className="h-9" style={{ backgroundColor: "#1A1A1A", border: "1px solid #2A2A2A" }}>
        <TabsTrigger value="content" className="gap-1.5 text-xs">
          <BookOpen className="h-3.5 w-3.5" />
          Course Content
        </TabsTrigger>
        <TabsTrigger value="assessments" className="gap-1.5 text-xs">
          <ClipboardList className="h-3.5 w-3.5" />
          Assessments
        </TabsTrigger>
      </TabsList>

      <TabsContent value="content" className="mt-4">
        <CourseDetailContent courseId={courseId} />
      </TabsContent>

      <TabsContent value="assessments" className="mt-4">
        <LearnerCourseAssessments courseId={courseId} />
      </TabsContent>
    </Tabs>
  );
}
