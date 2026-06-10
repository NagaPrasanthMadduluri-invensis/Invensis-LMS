import { Skeleton } from "@/components/ui/skeleton";
import Box from "@/components/ui/box";

export default function OrdersLoading() {
  return (
    <Box className="space-y-5">
      <Box className="space-y-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </Box>
      <Box className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1,2,3,4].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </Box>
      <Skeleton className="h-96 rounded-xl" />
    </Box>
  );
}
