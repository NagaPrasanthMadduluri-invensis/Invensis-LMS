import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { LayoutDashboard } from "lucide-react";
import { TrainerDashboardStats } from "@/components/trainer/dashboard-stats";

export default function TrainerDashboardPage() {
  return (
    <Box className="space-y-6">
      <Box className="rounded-2xl bg-gradient-to-r from-teal-50 via-emerald-50 to-cyan-50 border border-teal-100 px-7 py-6 flex items-center gap-4">
        <Box className="w-12 h-12 rounded-2xl bg-teal-600 flex items-center justify-center shrink-0 shadow-sm">
          <LayoutDashboard className="w-6 h-6 text-white" />
        </Box>
        <Box>
          <Text as="h1" className="text-xl font-bold text-slate-800 leading-tight">Trainer Dashboard</Text>
          <Text as="p" className="text-slate-500 text-xs mt-0.5">Welcome back — here&apos;s your training activity overview.</Text>
        </Box>
      </Box>
      <TrainerDashboardStats />
    </Box>
  );
}
