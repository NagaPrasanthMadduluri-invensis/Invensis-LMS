import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { Star } from "lucide-react";

export default function TrainerFeedbackPage() {
  return (
    <Box className="space-y-6">
      <Box className="rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 border border-amber-100 px-7 py-6 flex items-center gap-4">
        <Box className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shrink-0 shadow-sm">
          <Star className="w-6 h-6 text-white" />
        </Box>
        <Box>
          <Text as="h1" className="text-xl font-bold text-slate-800 leading-tight">Feedback</Text>
          <Text as="p" className="text-slate-500 text-xs mt-0.5">Review feedback submitted by learners for your sessions.</Text>
        </Box>
      </Box>
    </Box>
  );
}
