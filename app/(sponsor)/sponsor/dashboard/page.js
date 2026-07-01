import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { SponsorDashboardContent } from "@/components/sponsor/dashboard-content";

export default function SponsorDashboardPage() {
  return (
    <Box className="space-y-5">
      <Box>
        <Text as="h1" className="text-2xl">Sponsor Dashboard</Text>
        <Text as="p" className="text-muted-foreground text-xs mt-0.5">
          Home &gt; <Text as="span" className="text-amber-600">Dashboard</Text>
        </Text>
      </Box>
      <SponsorDashboardContent />
    </Box>
  );
}
