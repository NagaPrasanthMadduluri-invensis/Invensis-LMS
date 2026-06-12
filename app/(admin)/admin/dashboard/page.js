import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { AdminDashboardContent } from "@/components/admin/dashboard-content";

export default function AdminDashboardPage() {
  return (
    <Box className="space-y-5">
      <Box>
        <Text as="h1" className="text-2xl font-bold">Admin Dashboard</Text>
        <Box className="flex items-center gap-1 mt-1">
          <Box className="w-1 h-4 rounded-full bg-primary" />
          <Text as="p" className="text-muted-foreground text-xs">
            Home › <Text as="span" className="text-primary font-medium">Dashboard</Text>
          </Text>
        </Box>
      </Box>

      <AdminDashboardContent />
    </Box>
  );
}
