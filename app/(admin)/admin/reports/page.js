import Box from "@/components/ui/box";
import Text from "@/components/ui/text";
import { ReportsView } from "@/components/admin/reports/reports-view";

export default function AdminReportsPage() {
  return (
    <Box className="space-y-6">
      <Box>
        <Text as="h1" className="text-2xl font-bold text-foreground leading-tight">Reports</Text>
        <Text as="p" className="text-foreground-subtle text-sm mt-1">
          Revenue snapshot — where sales are happening and where they&apos;re weak. Pick a
          period, apply filters, and download a PDF.
        </Text>
      </Box>
      <ReportsView />
    </Box>
  );
}
