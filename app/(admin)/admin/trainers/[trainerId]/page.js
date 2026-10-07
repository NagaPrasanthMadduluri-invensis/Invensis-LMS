import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import Link from "next/link";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { TrainerDetail } from "@/components/admin/trainer-detail";

export default async function AdminTrainerDetailPage({ params }) {
  const { trainerId } = await params;

  return (
    <Box className="space-y-7">
      <Box className="rounded-2xl bg-[#d7e3fc] border border-primary-border px-7 py-6 flex items-center gap-4">
        <Link
          href="/admin/trainers"
          className="w-10 h-10 rounded-xl bg-surface border border-primary-border hover:bg-primary-subtle flex items-center justify-center shrink-0 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-primary" />
        </Link>
        <Box className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shrink-0 shadow-sm">
          <GraduationCap className="w-6 h-6 text-primary-foreground" />
        </Box>
        <Box>
          <Text as="h1" className="text-xl font-bold text-foreground leading-tight">Trainer Profile</Text>
          <Text as="p" className="text-foreground-muted text-xs mt-0.5">
            <Link href="/admin/trainers" className="text-primary hover:text-primary transition-colors">Trainers</Link>
            {" "}&rsaquo; Profile
          </Text>
        </Box>
      </Box>
      <TrainerDetail trainerId={trainerId} />
    </Box>
  );
}
