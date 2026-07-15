import { Skeleton } from "@/components/ui/skeleton";
import Box from "@/components/ui/box";

export default function AdminAnalyticsLoading() {
  return (
    <Box className="space-y-6">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-16 rounded-2xl" />
      <Box className="grid grid-cols-2 gap-4 sm:grid-cols-4 xl:grid-cols-8">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </Box>
      <Box className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-80 rounded-2xl" />
        ))}
      </Box>
    </Box>
  );
}
