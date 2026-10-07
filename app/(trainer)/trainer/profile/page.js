import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { UserCog } from "lucide-react";
import { TrainerProfileSettings } from "@/components/trainer/trainer-profile-settings";

export default function TrainerProfilePage() {
  return (
    <Box className="space-y-6">
      <Box className="rounded-2xl bg-[#d7e3fc] border border-primary-border px-7 py-6 flex items-center gap-4">
        <Box className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
          <UserCog className="w-6 h-6 text-primary-foreground" />
        </Box>
        <Box>
          <Text as="h1" className="text-xl font-bold text-foreground leading-tight">My Profile</Text>
          <Text as="p" className="text-foreground-muted text-xs mt-0.5">Update your details, expertise, and resume.</Text>
        </Box>
      </Box>
      <TrainerProfileSettings />
    </Box>
  );
}
