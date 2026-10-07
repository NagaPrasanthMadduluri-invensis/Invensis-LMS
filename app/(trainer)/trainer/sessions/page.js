import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { CalendarDays } from "lucide-react";
import { TrainerSessions } from "@/components/trainer/trainer-sessions";

export default function TrainerSessionsPage() {
  return (
    <Box className="space-y-6">
      <Box className="rounded-2xl bg-[#d7e3fc] border border-primary-border px-7 py-6 flex items-center gap-4">
        <Box className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
          <CalendarDays className="w-6 h-6 text-primary-foreground" />
        </Box>
        <Box>
          <Text as="h1" className="text-xl font-bold text-foreground leading-tight">Sessions</Text>
          <Text as="p" className="text-foreground-muted text-xs mt-0.5">Set day-wise topics for your trainings — learners see these immediately.</Text>
        </Box>
      </Box>
      <TrainerSessions />
    </Box>
  );
}
