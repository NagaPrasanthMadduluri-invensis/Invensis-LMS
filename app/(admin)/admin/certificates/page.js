import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { Award } from "lucide-react";
import { CertificatesList } from "@/components/admin/certificates-list";

export default function AdminCertificatesPage() {
  return (
    <Box className="space-y-6">
      <Box className="flex items-center gap-3 bg-violet-50 rounded-xl px-5 py-4">
        <Box className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0">
          <Award className="w-5 h-5 text-violet-500" />
        </Box>
        <Box>
          <Text as="h1" className="text-xl font-bold text-slate-800 leading-tight">Certificates</Text>
          <Text as="p" className="text-slate-400 text-xs mt-0.5">
            Admin &rsaquo; <Text as="span" className="text-slate-500 font-medium">Certificates</Text>
          </Text>
        </Box>
      </Box>
      <CertificatesList />
    </Box>
  );
}
