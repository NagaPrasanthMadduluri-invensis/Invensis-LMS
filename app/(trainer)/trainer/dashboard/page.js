import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { TrainerDashboardStats } from "@/components/trainer/dashboard-stats";

export default function TrainerDashboardPage() {
  return (
    <Box className="space-y-6">
      <Box>
        <Text as="h1" className="text-2xl font-bold tracking-tight">Trainer Dashboard</Text>
        <Text as="p" className="text-muted-foreground text-sm mt-1">
          Welcome back. Here&apos;s an overview of your training activity.
        </Text>
      </Box>
      <TrainerDashboardStats />
    </Box>
  );
}
