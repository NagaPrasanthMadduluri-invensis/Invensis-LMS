import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import Link from "next/link";
import { LifeBuoy, ArrowLeft } from "lucide-react";
import { RaiseTicket } from "@/components/learner/raise-ticket";

export default function RaiseTicketPage() {
  return (
    <Box className="space-y-6">
      <Box className="rounded-2xl bg-gradient-to-r from-violet-50 via-purple-50 to-violet-50 border border-violet-100 px-7 py-6 flex items-center gap-4">
        <Link
          href="/tickets"
          className="w-10 h-10 rounded-xl bg-white border border-violet-100 hover:bg-violet-50 flex items-center justify-center shrink-0 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-violet-600" />
        </Link>
        <Box className="w-12 h-12 rounded-2xl bg-violet-600 flex items-center justify-center shrink-0 shadow-sm">
          <LifeBuoy className="w-6 h-6 text-white" />
        </Box>
        <Box>
          <Text as="h1" className="text-xl font-bold text-slate-800 leading-tight">Raise a Ticket</Text>
          <Text as="p" className="text-slate-500 text-xs mt-0.5">
            <Link href="/tickets" className="text-violet-500 hover:text-violet-700 transition-colors">Tickets</Link>
            {" "}&rsaquo; New request
          </Text>
        </Box>
      </Box>
      <RaiseTicket />
    </Box>
  );
}
