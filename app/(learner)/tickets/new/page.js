import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import Link from "next/link";
import { LifeBuoy, ArrowLeft } from "lucide-react";
import { RaiseTicket } from "@/components/learner/raise-ticket";

export default function RaiseTicketPage() {
  return (
    <Box className="space-y-6">
      <Box className="rounded-2xl bg-[#d7e3fc] border border-primary-border px-7 py-6 flex items-center gap-4">
        <Link
          href="/tickets"
          className="w-10 h-10 rounded-xl bg-surface border border-primary-border hover:bg-primary-subtle flex items-center justify-center shrink-0 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-primary" />
        </Link>
        <Box className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
          <LifeBuoy className="w-6 h-6 text-primary-foreground" />
        </Box>
        <Box>
          <Text as="h1" className="text-xl font-bold text-foreground leading-tight">Raise a Ticket</Text>
          <Text as="p" className="text-foreground-muted text-xs mt-0.5">
            <Link href="/tickets" className="text-primary hover:text-primary transition-colors">Tickets</Link>
            {" "}&rsaquo; New request
          </Text>
        </Box>
      </Box>
      <RaiseTicket />
    </Box>
  );
}
