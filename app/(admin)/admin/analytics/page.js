import Box from "@/components/ui/box";
import Text from "@/components/ui/text";
import { AnalyticsDashboard } from "@/components/admin/analytics/analytics-dashboard";

export default function AdminAnalyticsPage() {
  return (
    <Box className="space-y-6">
      <Box>
        <Text as="h1" className="text-2xl font-bold text-slate-800 leading-tight">Analytics</Text>
        <Text as="p" className="text-slate-400 text-sm mt-1">
          Live insights across trainers, participants, sessions and the upcoming training pipeline.
        </Text>
      </Box>
      <AnalyticsDashboard />
    </Box>
  );
}
