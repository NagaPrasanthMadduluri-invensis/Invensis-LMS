import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { UserCog } from "lucide-react";
import { LearnerProfileSettings } from "@/components/learner/profile-settings";

export default function ProfilePage() {
  return (
    <Box className="space-y-6">
      <Box className="rounded-2xl bg-gradient-to-r from-indigo-50 via-purple-50 to-violet-50 border border-indigo-100 px-7 py-6 flex items-center gap-4">
        <Box className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
          <UserCog className="w-6 h-6 text-white" />
        </Box>
        <Box>
          <Text as="h1" className="text-xl font-bold text-slate-800 leading-tight">Profile & Settings</Text>
          <Text as="p" className="text-slate-500 text-xs mt-0.5">Manage your personal, professional, and account details.</Text>
        </Box>
      </Box>
      <LearnerProfileSettings />
    </Box>
  );
}
