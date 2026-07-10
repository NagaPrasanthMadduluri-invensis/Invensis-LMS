import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { Award } from "lucide-react";
import { CertificatesContent } from "@/components/learner/certificates-content";

export default function CertificatesPage() {
  return (
    <Box className="space-y-6">
      <Box className="rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border border-amber-100 px-7 py-6 flex items-center gap-4">
        <Box className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shrink-0 shadow-sm">
          <Award className="w-6 h-6 text-white" />
        </Box>
        <Box>
          <Text as="h1" className="text-xl font-bold text-slate-800 leading-tight">My Certificates</Text>
          <Text as="p" className="text-slate-500 text-xs mt-0.5">
            Certificates for the trainings you&apos;ve completed. Share your feedback to unlock the download.
          </Text>
        </Box>
      </Box>
      <CertificatesContent />
    </Box>
  );
}
