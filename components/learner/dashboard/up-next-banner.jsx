import Link from "next/link";
import { Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { deliveryLabel, formatSessionWindow, isSessionLive } from "./dashboard-utils";

/**
 * The single most actionable thing on the page: the learner's next session,
 * with a one-click way into it. Rendered only when there IS a next session —
 * `DashboardContent` skips this band entirely otherwise.
 */
export function UpNextBanner({ course, detail, session }) {
  const live = isSessionLive(session);
  const window = formatSessionWindow(session.start_time, session.end_time, detail?.timezone);
  const meetingUrl = detail?.meeting?.url ?? null;

  const total = course.total_sessions ?? 0;
  const done = course.completed_sessions ?? 0;
  // The certificate is unlocked by finishing the training, so it's only "one
  // session away" when this is the last one on the plan.
  const lastOne = total > 0 && done === total - 1;

  const meta = [
    course.title,
    course.code,
    window,
    detail?.trainer?.name ? `Trainer ${detail.trainer.name}` : null,
    !window ? deliveryLabel(course.delivery_mode) : null,
  ].filter(Boolean);

  return (
    <Box className="bg-brand-up-next relative w-full overflow-hidden rounded-2xl px-6 py-5">
      <Box className="relative flex flex-wrap items-center justify-between gap-x-8 gap-y-5">
        <Box className="min-w-[260px] flex-1">
          <Box className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1">
            <Box
              className={`h-1.5 w-1.5 rounded-full ${live ? "animate-pulse bg-emerald-400" : "bg-brand-violet-soft"}`}
            />
            <Text as="span" className="text-[10px] font-bold tracking-[0.12em] text-white/85">
              UP NEXT{live ? " · LIVE" : ""}
            </Text>
          </Box>

          <Text as="h2" className="mt-3 break-normal text-xl font-bold text-white">
            Session {session.day_number}
            {session.planned_topics?.trim() ? ` · ${session.planned_topics.trim()}` : ""}
          </Text>

          <Text as="p" className="mt-1.5 break-normal text-xs text-white/65">
            {meta.join(" · ")}
          </Text>
        </Box>

        <Box className="flex shrink-0 items-center gap-5">
          {total > 0 && (
            <Box className="hidden text-right sm:block">
              <Text as="p" className="text-xs font-semibold text-white">
                {done} of {total} session{total === 1 ? "" : "s"} done
              </Text>
              {lastOne && (
                <Text as="span" className="text-[11px] text-white/55">
                  Certificate unlocks after this one
                </Text>
              )}
            </Box>
          )}

          {meetingUrl ? (
            <Button
              render={<a href={meetingUrl} target="_blank" rel="noopener noreferrer" />}
              size="lg"
              className="h-11 gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-brand-hero hover:bg-white/90"
            >
              <Video className="h-4 w-4" />
              Join session
            </Button>
          ) : (
            <Button
              render={<Link href="/my-courses" />}
              size="lg"
              className="h-11 gap-2 rounded-xl bg-white/12 px-5 text-sm font-semibold text-white hover:bg-white/20"
            >
              <Video className="h-4 w-4" />
              {course.delivery_mode === "in_person" ? "View details" : "Link pending"}
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
