import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { LifeBuoy } from "lucide-react";
import { TicketsContent } from "@/components/learner/tickets-content";

export default function TicketsPage() {
  return (
    <Box className="space-y-6">
      <Box className="rounded-2xl bg-[#d7e3fc] border border-primary-border px-7 py-6 flex items-center gap-4">
        <Box className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
          <LifeBuoy className="w-6 h-6 text-primary-foreground" />
        </Box>
        <Box>
          <Text as="h1" className="text-xl font-bold text-foreground leading-tight">Support Tickets</Text>
          <Text as="p" className="text-foreground-muted text-xs mt-0.5">
            Raise a request and track its progress — our team typically responds within a day.
          </Text>
        </Box>
      </Box>
      <TicketsContent />
    </Box>
  );
}
