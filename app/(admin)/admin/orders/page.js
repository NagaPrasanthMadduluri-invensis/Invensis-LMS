import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { OrdersTable } from "@/components/admin/orders-table";

export default function AdminOrdersPage() {
  return (
    <Box className="space-y-5">
      <Box>
        <Text as="h1" className="text-2xl font-bold">Orders & Payments</Text>
        <Box className="flex items-center gap-1 mt-1">
          <Box className="w-1 h-4 rounded-full bg-primary" />
          <Text as="p" className="text-muted-foreground text-xs">
            Admin › <Text as="span" className="text-primary font-medium">Orders & Payments</Text>
          </Text>
        </Box>
      </Box>
      <OrdersTable />
    </Box>
  );
}
