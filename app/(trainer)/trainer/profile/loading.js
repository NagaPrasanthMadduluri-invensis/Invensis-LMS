import { Skeleton } from "@/components/ui/skeleton";
import Box from "@/components/ui/box";

export default function TrainerProfileLoading() {
  return (
    <Box className="space-y-5">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </Box>
  );
}
