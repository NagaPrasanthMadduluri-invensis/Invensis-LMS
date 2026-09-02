"use client";

import Image from "next/image";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { HelpMenu } from "@/components/layout/help-menu";
import { useProfileCompletion } from "@/providers/profile-completion-provider";

/**
 * White top bar shared by every portal.
 *
 * `statusSlot` is how a portal injects its own status UI (the learner shell
 * passes the "Session live now" pill) without this component having to know
 * which portal it's rendering in.
 *
 * The collapse trigger lives in the sidebar now; the one kept here is
 * mobile-only, because on small screens the sidebar is an off-screen sheet
 * with no visible control of its own.
 */
export function TopNav({ portalLabel = "Invensis Learning", statusSlot = null }) {
  const { user } = useAuth();
  const completion = useProfileCompletion();
  // Red profile treatment while a trainer/learner profile is still incomplete.
  const profileIncomplete = !!completion && completion.tracked && !completion.loading && !completion.complete;

  return (
    <Box
      as="header"
      className="sticky top-0 z-50 flex h-16 w-full shrink-0 items-center justify-between border-b border-border bg-card px-4"
    >
      <Box className="flex items-center gap-2">
        <SidebarTrigger className="text-foreground md:hidden" />
        {/* Intrinsic viewBox is 156×38 — keep that ratio or the mark skews. */}
        <Image
          src="/invensis-learning-logo.svg"
          alt={portalLabel}
          width={152}
          height={37}
          priority
          unoptimized
          className="select-none"
        />
      </Box>

      <Box className="flex items-center gap-3">
        {statusSlot}

        {/* Need-help menu — shown for trainer / sponsor / learner (not admin). */}
        <HelpMenu />

        <Box
          className={`flex items-center gap-2 rounded-full border py-1 pr-3 pl-1 ${profileIncomplete ? "border-red-300 bg-red-50" : "border-border"}`}
          title={profileIncomplete ? "Your profile is incomplete" : undefined}
        >
          <Box className="relative">
            <Avatar className={`h-8 w-8 ${profileIncomplete ? "ring-2 ring-red-500" : ""}`}>
              <AvatarImage src={user?.avatar || ""} alt={user?.name || "User"} />
              <AvatarFallback className={`text-xs ${profileIncomplete ? "bg-red-500 text-white" : "bg-primary text-primary-foreground"}`}>
                {user?.initials || "U"}
              </AvatarFallback>
            </Avatar>
            {profileIncomplete && (
              <Box className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-card" />
            )}
          </Box>
          <Text as="span" className={`hidden text-sm font-medium sm:inline-block ${profileIncomplete ? "text-red-700" : "text-foreground"}`}>
            {user?.name || "User"}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
