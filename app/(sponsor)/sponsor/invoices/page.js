import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { InvoicesList } from "@/components/shared/invoices-list";

export default function SponsorInvoicesPage() {
  return (
    <Box className="space-y-5">
      <Box>
        <Text as="h1" className="text-2xl">Invoices &amp; Receipts</Text>
        <Text as="p" className="text-muted-foreground text-xs mt-0.5">
          Home &gt; <Text as="span" className="text-amber-600">Invoices &amp; Receipts</Text>
        </Text>
      </Box>
      <InvoicesList />
    </Box>
  );
}
