import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { DashboardContent } from "@/components/learner/dashboard-content";

export default function DashboardPage() {
  return (
    <Box className="space-y-5">
      <Box className="flex items-center justify-between flex-wrap gap-3">
        <Box>
          <Text as="h1" className="font-bold tracking-tight" style={{ fontSize: "32px", lineHeight: "1.15", color: "#111111" }}>My Dashboard</Text>
          <Box className="flex items-center gap-1.5 mt-1">
            <Text as="p" className="text-xs" style={{ color: "#6B6B6B" }}>
              Home › <Text as="span" className="font-medium" style={{ color: "#A3A3A3" }}>Dashboard</Text>
            </Text>
          </Box>
        </Box>
        <Box className="flex items-center gap-2">
          <Box className="px-3 py-1.5 rounded-full" style={{ background: "rgba(239,189,95,0.1)", border: "1px solid rgba(239,189,95,0.25)" }}>
            <Text as="span" className="text-xs font-semibold" style={{ color: "#EFBD5F" }}>Active Learner</Text>
          </Box>
        </Box>
      </Box>
      <DashboardContent />
    </Box>
  );
}
