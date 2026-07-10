import { Skeleton } from "@/components/ui/skeleton";
import Box from "@/components/ui/box";

export default function AdminDashboardLoading() {
  return (
    <Box className="space-y-6">
      <Skeleton className="h-8 w-56" />
      <Box className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-2xl" />
        ))}
      </Box>
      <Box className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
        ))}
      </Box>
      <Box className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-72 rounded-2xl" />
      </Box>
    </Box>
  );
}
