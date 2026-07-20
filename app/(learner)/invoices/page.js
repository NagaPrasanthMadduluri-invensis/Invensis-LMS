import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { Receipt } from "lucide-react";
import { InvoicesList } from "@/components/shared/invoices-list";

export default function LearnerInvoicesPage() {
  return (
    <Box className="space-y-6">
      <Box className="rounded-2xl bg-gradient-to-r from-violet-50 via-purple-50 to-violet-50 border border-violet-100 px-7 py-6 flex items-center gap-4">
        <Box className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center shrink-0 shadow-sm">
          <Receipt className="w-6 h-6 text-white" />
        </Box>
        <Box>
          <Text as="h1" className="text-xl font-bold text-slate-800 leading-tight">Invoices &amp; Receipts</Text>
          <Text as="p" className="text-slate-500 text-xs mt-0.5">
            Your invoices and proforma invoices — download the PDF or pay any outstanding balance online.
          </Text>
        </Box>
      </Box>
      <InvoicesList />
    </Box>
  );
}
