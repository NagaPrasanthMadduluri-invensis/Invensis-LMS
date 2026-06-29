import { Skeleton } from "@/components/ui/skeleton";
import Box from "@/components/ui/box";

export default function TrainerDashboardLoading() {
  return (
    <Box className="space-y-6">
      <Box className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </Box>
      <Box className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </Box>
    </Box>
  );
}
