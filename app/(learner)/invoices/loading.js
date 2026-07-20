import { Skeleton } from "@/components/ui/skeleton";
import Box from "@/components/ui/box";

export default function InvoicesLoading() {
  return (
    <Box className="space-y-6">
      <Skeleton className="h-20 w-full rounded-2xl" />
      <Box className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </Box>
    </Box>
  );
}
