import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { TrainersList } from "@/components/admin/trainers-list";
import { GraduationCap } from "lucide-react";

export default function AdminTrainersPage() {
  return (
    <Box className="space-y-7">
      <Box className="rounded-2xl bg-[#d7e3fc] border border-primary-border px-7 py-6 flex items-center gap-4">
        <Box className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
          <GraduationCap className="w-6 h-6 text-primary-foreground" />
        </Box>
        <Box>
          <Text as="h1" className="text-xl font-bold text-foreground leading-tight">Trainers</Text>
          <Text as="p" className="text-foreground-muted text-xs mt-0.5">Manage trainer profiles and assignments</Text>
        </Box>
      </Box>
      <TrainersList />
    </Box>
  );
}
