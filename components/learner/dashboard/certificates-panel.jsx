import Link from "next/link";
import { Award, ChevronRight, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { activeCoursesOf, formatDate } from "./dashboard-utils";

/**
 * Earned certificates, plus the ones still locked behind an unfinished
 * training — the locked rows are the nudge, so they stay visible.
 */
export function CertificatesPanel({ certificates = [], myCourses = {} }) {
  const locked = activeCoursesOf(myCourses).slice(0, 2);
  const empty = certificates.length === 0 && locked.length === 0;

  return (
    <Card className="gap-0 rounded-2xl p-0">
      <Box className="flex items-center justify-between gap-3 px-5 py-4">
        <Text as="h3" className="text-base font-bold text-foreground">
          Certificates
        </Text>
        {certificates.length > 0 && (
          <Link
            href="/certificates"
            className="flex shrink-0 items-center gap-0.5 text-xs font-semibold text-primary hover:underline"
          >
            All ({certificates.length})
          </Link>
        )}
      </Box>

      {empty ? (
        <Box className="flex flex-col items-center gap-2 px-5 pb-8 pt-2 text-center">
          <Award className="h-7 w-7 text-border" />
          <Text as="p" className="text-xs text-muted-foreground">
            No certificates yet — finish a training to earn one.
          </Text>
        </Box>
      ) : (
        <Box className="space-y-2 px-4 pb-4">
          {certificates.map((cert) => (
            <Link
              key={cert.training_id || cert.training_code}
              href="/certificates"
              className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5 transition-colors hover:border-primary/40 hover:bg-secondary/50"
            >
              <Box className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                <Award className="h-4 w-4 text-primary" />
              </Box>
              <Box className="min-w-0 flex-1">
                <Text as="p" className="truncate break-normal text-sm font-semibold text-foreground">
                  {cert.title}
                </Text>
                <Text as="span" className="block text-[11px] text-muted-foreground">
                  Completed {formatDate(cert.completed_at || cert.end_date)}
                </Text>
              </Box>
              <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          ))}

          {locked.map((course) => {
            const total = course.total_sessions ?? 0;
            const done = course.completed_sessions ?? 0;
            const remaining = Math.max(total - done, 0);
            return (
              <Box
                key={`locked-${course.id}`}
                className="flex items-center gap-3 rounded-xl border border-dashed border-border px-3 py-2.5"
              >
                <Box className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                </Box>
                <Text as="p" className="min-w-0 break-normal text-xs text-muted-foreground">
                  {course.title}{" "}
                  {remaining > 0
                    ? `unlocks after ${remaining} more session${remaining === 1 ? "" : "s"}.`
                    : "unlocks once the training is marked complete."}
                </Text>
              </Box>
            );
          })}
        </Box>
      )}
    </Card>
  );
}
