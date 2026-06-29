import Text from "@/components/ui/text";
import Box from "@/components/ui/box";

export default function TrainerSessionsPage() {
  return (
    <Box className="space-y-6">
      <Box>
        <Text as="h1" className="text-2xl font-bold tracking-tight">Sessions</Text>
        <Text as="p" className="text-muted-foreground text-sm mt-1">
          View and manage your upcoming and past training sessions.
        </Text>
      </Box>
    </Box>
  );
}
