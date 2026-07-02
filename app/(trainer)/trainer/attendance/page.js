import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { ClipboardCheck } from "lucide-react";

export default function TrainerAttendancePage() {
  return (
    <Box className="space-y-6">
      <Box className="rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-100 px-7 py-6 flex items-center gap-4">
        <Box className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
          <ClipboardCheck className="w-6 h-6 text-white" />
        </Box>
        <Box>
          <Text as="h1" className="text-xl font-bold text-slate-800 leading-tight">Attendance</Text>
          <Text as="p" className="text-slate-500 text-xs mt-0.5">Track and record learner attendance for your sessions.</Text>
        </Box>
      </Box>
    </Box>
  );
}
