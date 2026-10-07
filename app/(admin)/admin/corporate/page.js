import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { Building2 } from "lucide-react";
import { CorporateAccounts } from "@/components/admin/corporate-accounts";

export default function AdminCorporatePage() {
  return (
    <Box className="space-y-6">
      <Box className="flex items-center gap-3 bg-primary-subtle rounded-xl px-5 py-4">
        <Box className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center shrink-0">
          <Building2 className="w-5 h-5 text-primary" />
        </Box>
        <Box>
          <Text as="h1" className="text-xl font-bold text-foreground leading-tight">Corporate Accounts</Text>
          <Text as="p" className="text-foreground-subtle text-xs mt-0.5">
            Admin &rsaquo; <Text as="span" className="text-foreground-muted font-medium">Corporate</Text>
          </Text>
        </Box>
      </Box>
      <CorporateAccounts />
    </Box>
  );
}
