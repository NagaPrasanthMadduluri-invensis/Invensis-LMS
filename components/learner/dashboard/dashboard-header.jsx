import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { firstNameOf, greetingFor } from "./dashboard-utils";

/** Greeting line plus a one-sentence status of where the learner stands. */
export function DashboardHeader({ name, summary }) {
  return (
    <Box className="min-w-0">
      <Text as="h1" className="break-normal text-2xl font-bold text-foreground">
        {greetingFor()}, {firstNameOf(name)}
      </Text>
      {summary && (
        <Text as="p" className="mt-1 break-normal text-sm text-muted-foreground">
          {summary}
        </Text>
      )}
    </Box>
  );
}
