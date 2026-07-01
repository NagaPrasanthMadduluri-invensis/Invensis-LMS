import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { SponsoredLearners } from "@/components/sponsor/sponsored-learners";

export default function SponsorLearnersPage() {
  return (
    <Box className="space-y-5">
      <Box>
        <Text as="h1" className="text-2xl">My Learners</Text>
        <Text as="p" className="text-muted-foreground text-xs mt-0.5">
          Home &gt; <Text as="span" className="text-amber-600">My Learners</Text>
        </Text>
      </Box>
      <SponsoredLearners />
    </Box>
  );
}
