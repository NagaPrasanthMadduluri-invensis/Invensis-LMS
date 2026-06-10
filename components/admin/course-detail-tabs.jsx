"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, ClipboardList, FolderOpen } from "lucide-react";
import { CourseModulesContent } from "@/components/admin/course-modules-content";
import { CourseAssessments }   from "@/components/admin/course-assessments";
import { CourseResources }     from "@/components/admin/course-resources";

export function CourseDetailTabs({ courseId }) {
  return (
    <Tabs defaultValue="modules">
      <TabsList className="h-9">
        <TabsTrigger value="modules" className="gap-1.5 text-xs">
          <BookOpen className="h-3.5 w-3.5" />
          Modules
        </TabsTrigger>
        <TabsTrigger value="assessments" className="gap-1.5 text-xs">
          <ClipboardList className="h-3.5 w-3.5" />
          Assessments
        </TabsTrigger>
        <TabsTrigger value="resources" className="gap-1.5 text-xs">
          <FolderOpen className="h-3.5 w-3.5" />
          Resources
        </TabsTrigger>
      </TabsList>

      <TabsContent value="modules" className="mt-4">
        <CourseModulesContent courseId={courseId} />
      </TabsContent>

      <TabsContent value="assessments" className="mt-4">
        <CourseAssessments courseId={courseId} />
      </TabsContent>

      <TabsContent value="resources" className="mt-4">
        <CourseResources courseId={courseId} />
      </TabsContent>
    </Tabs>
  );
}
