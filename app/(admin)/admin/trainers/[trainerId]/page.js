import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import Link from "next/link";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { TrainerDetail } from "@/components/admin/trainer-detail";

export default async function AdminTrainerDetailPage({ params }) {
  const { trainerId } = await params;

  return (
    <Box className="space-y-6">
      <Box className="flex items-center gap-3 bg-indigo-50 rounded-xl px-5 py-4">
        <Link
          href="/admin/trainers"
          className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0 hover:bg-indigo-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-indigo-500" />
        </Link>
        <Box className="w-9 h-9 rounded-lg bg-white flex items-center justify-center shrink-0">
          <GraduationCap className="w-5 h-5 text-indigo-500" />
        </Box>
        <Box>
          <Text as="h1" className="text-xl font-bold text-slate-800 leading-tight">
            Trainer Profile
          </Text>
          <Text as="p" className="text-slate-400 text-xs mt-0.5">
            Admin &rsaquo;{" "}
            <Link href="/admin/trainers" className="text-indigo-500 hover:underline font-medium">Trainers</Link>{" "}
            &rsaquo; Profile
          </Text>
        </Box>
      </Box>
      <TrainerDetail trainerId={trainerId} />
    </Box>
  );
}
