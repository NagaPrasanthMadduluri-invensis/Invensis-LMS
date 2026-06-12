"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, ClipboardList, FolderOpen } from "lucide-react";
import { CourseModulesContent } from "@/components/admin/course-modules-content";
import { CourseAssessments } from "@/components/admin/course-assessments";
import { CourseResources } from "@/components/admin/course-resources";

export function CourseDetailTabs({ courseId }) {
  return (
    <Tabs defaultValue="modules">
      <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0">
        <TabsTrigger
          value="modules"
          className="gap-2 rounded-none border-b-2 border-transparent px-5 py-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none"
        >
          <BookOpen className="h-4 w-4" />
          Modules
        </TabsTrigger>

        <TabsTrigger
          value="assessments"
          className="gap-2 rounded-none border-b-2 border-transparent px-5 py-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none"
        >
          <ClipboardList className="h-4 w-4" />
          Assessments
        </TabsTrigger>

        <TabsTrigger
          value="resources"
          className="gap-2 rounded-none border-b-2 border-transparent px-5 py-3 text-sm font-medium data-[state=active]:border-primary data-[state=active]:bg-transparent shadow-none"
        >
          <FolderOpen className="h-4 w-4" />
          Resources
        </TabsTrigger>
      </TabsList>

      <TabsContent value="modules" className="mt-6">
        <CourseModulesContent courseId={courseId} />
      </TabsContent>

      <TabsContent value="assessments" className="mt-6">
        <CourseAssessments courseId={courseId} />
      </TabsContent>

      <TabsContent value="resources" className="mt-6">
        <CourseResources courseId={courseId} />
      </TabsContent>
    </Tabs>
  );
}
