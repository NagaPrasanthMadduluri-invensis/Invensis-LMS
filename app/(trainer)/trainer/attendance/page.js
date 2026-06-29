import Text from "@/components/ui/text";
import Box from "@/components/ui/box";

export default function TrainerAttendancePage() {
  return (
    <Box className="space-y-6">
      <Box>
        <Text as="h1" className="text-2xl font-bold tracking-tight">Attendance</Text>
        <Text as="p" className="text-muted-foreground text-sm mt-1">
          Track and record learner attendance for your sessions.
        </Text>
      </Box>
    </Box>
  );
}
