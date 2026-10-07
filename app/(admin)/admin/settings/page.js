import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { Settings } from "lucide-react";
import { AdminSettings } from "@/components/admin/admin-settings";

export default function AdminSettingsPage() {
  return (
    <Box className="space-y-6">
      <Box className="flex items-center gap-3 bg-primary-subtle rounded-xl px-5 py-4">
        <Box className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center shrink-0">
          <Settings className="w-5 h-5 text-primary" />
        </Box>
        <Box>
          <Text as="h1" className="text-xl font-bold text-foreground leading-tight">Settings</Text>
          <Text as="p" className="text-foreground-subtle text-xs mt-0.5">
            Admin &rsaquo; <Text as="span" className="text-foreground-muted font-medium">Settings</Text>
          </Text>
        </Box>
      </Box>
      <AdminSettings />
    </Box>
  );
}
