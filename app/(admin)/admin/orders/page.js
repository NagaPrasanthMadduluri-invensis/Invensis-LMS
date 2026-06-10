import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { OrdersTable } from "@/components/admin/orders-table";

export default function AdminOrdersPage() {
  return (
    <Box className="space-y-5">
      <Box>
        <Text as="h1" className="text-2xl">Orders & Payments</Text>
        <Text as="p" className="text-muted-foreground text-xs mt-0.5">
          Admin &gt; <Text as="span" className="text-indigo-500">Orders & Payments</Text>
        </Text>
      </Box>
      <OrdersTable />
    </Box>
  );
}
