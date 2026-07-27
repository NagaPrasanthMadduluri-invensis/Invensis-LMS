import { Card } from "@/components/ui/card";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { cn } from "@/lib/utils";
import { formatDate } from "./dashboard-utils";

const MAX_ITEMS = 5;

/** The journey feed, newest first — enrolments and completions. */
export function RecentActivityPanel({ journey = [] }) {
  const items = [...journey]
    .sort((a, b) => new Date(b.date ?? 0) - new Date(a.date ?? 0))
    .slice(0, MAX_ITEMS);

  return (
    <Card className="gap-0 rounded-2xl p-0">
      <Box className="px-5 py-4">
        <Text as="h3" className="text-base font-bold text-foreground">
          Recent activity
        </Text>
      </Box>

      {items.length === 0 ? (
        <Box className="px-5 pb-6">
          <Text as="p" className="text-xs text-muted-foreground">
            Your activity will show up here once you enrol.
          </Text>
        </Box>
      ) : (
        <Box className="space-y-3 px-5 pb-4">
          {items.map((item, i) => (
            <Box key={`${item.training_code}-${item.type}-${i}`} className="flex items-start gap-2.5">
              <Box
                className={cn(
                  "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full",
                  item.type === "completed" ? "bg-emerald-500" : "bg-primary"
                )}
              />
              <Box className="min-w-0">
                <Text as="p" className="break-normal text-sm font-medium text-foreground">
                  {item.type === "completed" ? "Completed" : "Enrolled in"} {item.title}
                </Text>
                <Text as="span" className="block text-[11px] text-muted-foreground">
                  {formatDate(item.date)}
                </Text>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Card>
  );
}
