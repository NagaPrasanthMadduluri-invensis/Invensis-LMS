import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { CreditCard } from "lucide-react";
import { EnrollmentsContent } from "@/components/learner/enrollments-content";

export default function EnrollmentsPage() {
  return (
    <Box className="space-y-6">
      <Box className="rounded-2xl bg-gradient-to-r from-sky-50 via-cyan-50 to-blue-50 border border-sky-100 px-7 py-6 flex items-center gap-4">
        <Box className="w-12 h-12 rounded-2xl bg-sky-600 flex items-center justify-center shrink-0 shadow-sm">
          <CreditCard className="w-6 h-6 text-white" />
        </Box>
        <Box>
          <Text as="h1" className="text-xl font-bold text-slate-800 leading-tight">My Enrolments</Text>
          <Text as="p" className="text-slate-500 text-xs mt-0.5">
            The trainings you&apos;ve completed — with trainer, sponsor and certificate — plus what&apos;s coming up next.
          </Text>
        </Box>
      </Box>
      <EnrollmentsContent />
    </Box>
  );
}
