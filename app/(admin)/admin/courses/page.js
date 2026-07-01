import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { TrainingsList } from "@/components/admin/trainings-list";
import { BookOpen } from "lucide-react";

export default function AdminCoursesPage() {
  return (
    <Box className="space-y-7">
      <Box className="rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-violet-50 border border-indigo-100 px-7 py-6 flex items-center gap-4">
        <Box className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
          <BookOpen className="w-6 h-6 text-white" />
        </Box>
        <Box>
          <Text as="h1" className="text-xl font-bold text-slate-800 leading-tight">Trainings</Text>
          <Text as="p" className="text-slate-500 text-xs mt-0.5">Manage all training sessions and participants</Text>
        </Box>
      </Box>
      <TrainingsList />
    </Box>
  );
}
