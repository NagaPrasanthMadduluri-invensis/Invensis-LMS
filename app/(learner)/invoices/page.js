import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { Receipt } from "lucide-react";
import { InvoicesList } from "@/components/shared/invoices-list";

export default function LearnerInvoicesPage() {
  return (
    <Box className="space-y-6">
      <Box className="rounded-2xl bg-[#d7e3fc] border border-primary-border px-7 py-6 flex items-center gap-4">
        <Box className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
          <Receipt className="w-6 h-6 text-primary-foreground" />
        </Box>
        <Box>
          <Text as="h1" className="text-xl font-bold text-foreground leading-tight">Invoices &amp; Receipts</Text>
          <Text as="p" className="text-foreground-muted text-xs mt-0.5">
            Your invoices and proforma invoices — download the PDF or pay any outstanding balance online.
          </Text>
        </Box>
      </Box>
      <InvoicesList />
    </Box>
  );
}
