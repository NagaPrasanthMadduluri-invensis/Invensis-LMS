import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { ClipboardCheck } from "lucide-react";
import { TrainerAttendance } from "@/components/trainer/trainer-attendance";

export default function TrainerAttendancePage() {
  return (
    <Box className="space-y-6">
      <Box className="rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-success-border px-7 py-6 flex items-center gap-4">
        <Box className="w-12 h-12 rounded-2xl bg-success flex items-center justify-center shrink-0 shadow-sm">
          <ClipboardCheck className="w-6 h-6 text-success-foreground" />
        </Box>
        <Box>
          <Text as="h1" className="text-xl font-bold text-foreground leading-tight">Attendance</Text>
          <Text as="p" className="text-foreground-muted text-xs mt-0.5">Pick a training, then mark each participant present, absent, late or excused per session.</Text>
        </Box>
      </Box>
      <TrainerAttendance />
    </Box>
  );
}
