import { Skeleton } from "@/components/ui/skeleton";
import Box from "@/components/ui/box";

export default function ProfileLoading() {
  return (
    <Box className="space-y-5">
      <Skeleton className="h-24 w-full rounded-2xl" />
      <Skeleton className="h-10 w-64 rounded-lg" />
      <Skeleton className="h-96 w-full rounded-2xl" />
    </Box>
  );
}
