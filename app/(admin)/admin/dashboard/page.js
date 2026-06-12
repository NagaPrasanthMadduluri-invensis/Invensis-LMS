import Box from "@/components/ui/box";
import Text from "@/components/ui/text";
import { AdminDashboardContent } from "@/components/admin/dashboard-content";

export default function AdminDashboardPage() {
  return (
    <Box className="space-y-6">
      <Box>
        <Text as="h1" className="text-2xl font-bold text-slate-800 leading-tight">Admin Dashboard</Text>
        <Text as="p" className="text-slate-400 text-sm mt-1">Welcome back — here&rsquo;s what&rsquo;s happening today.</Text>
      </Box>
      <AdminDashboardContent />
    </Box>
  );
}
