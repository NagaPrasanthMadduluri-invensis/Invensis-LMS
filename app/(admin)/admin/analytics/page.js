import Box from "@/components/ui/box";
import Text from "@/components/ui/text";
import { AnalyticsDashboard } from "@/components/admin/analytics/analytics-dashboard";

export default function AdminAnalyticsPage() {
  return (
    <Box className="space-y-6">
      <Box>
        <Text as="h1" className="text-2xl font-bold text-foreground leading-tight">Analytics</Text>
        <Text as="p" className="text-foreground-subtle text-sm mt-1">
          Live insights across trainers, participants, sessions and the upcoming training pipeline.
        </Text>
      </Box>
      <AnalyticsDashboard />
    </Box>
  );
}
