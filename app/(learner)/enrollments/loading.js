import { Skeleton } from "@/components/ui/skeleton";
import Box from "@/components/ui/box";

export default function EnrollmentsLoading() {
  return (
    <Box className="space-y-6">
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {Array.from({ length: 2 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
        ))}
      </Box>
    </Box>
  );
}
