import { Skeleton } from "@/components/ui/skeleton";
import Box from "@/components/ui/box";

/** Mirrors the real dashboard's geometry so nothing shifts when data lands. */
export function DashboardSkeleton() {
  return (
    <Box className="w-full space-y-4">
      <Box className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </Box>

      <Skeleton className="h-[112px] w-full rounded-2xl" />
      <Skeleton className="h-[104px] w-full rounded-2xl" />

      <Box className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_460px]">
        <Skeleton className="h-[400px] rounded-2xl" />
        <Box className="space-y-4">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-36 rounded-2xl" />
        </Box>
      </Box>
    </Box>
  );
}
