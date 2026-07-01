import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { TrainerSessions } from "@/components/trainer/trainer-sessions";

export default function TrainerSessionsPage() {
  return (
    <Box className="space-y-6">
      <Box>
        <Text as="h1" className="text-2xl font-bold tracking-tight">Sessions</Text>
        <Text as="p" className="text-muted-foreground text-sm mt-1">
          Set the day-wise topics for the trainings assigned to you. Learners see these immediately.
        </Text>
      </Box>
      <TrainerSessions />
    </Box>
  );
}
