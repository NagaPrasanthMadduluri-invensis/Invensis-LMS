import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { TrainersList } from "@/components/admin/trainers-list";
import { GraduationCap } from "lucide-react";

export default function AdminTrainersPage() {
  return (
    <Box className="space-y-7">
      <Box className="rounded-2xl bg-gradient-to-r from-violet-50 via-purple-50 to-violet-50 border border-violet-100 px-7 py-6 flex items-center gap-4">
        <Box className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center shrink-0 shadow-sm">
          <GraduationCap className="w-6 h-6 text-white" />
        </Box>
        <Box>
          <Text as="h1" className="text-xl font-bold text-slate-800 leading-tight">Trainers</Text>
          <Text as="p" className="text-slate-500 text-xs mt-0.5">Manage trainer profiles and assignments</Text>
        </Box>
      </Box>
      <TrainersList />
    </Box>
  );
}
