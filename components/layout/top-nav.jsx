"use client";

import Image from "next/image";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";

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

        <Box className="flex items-center gap-2 rounded-full border border-border py-1 pr-3 pl-1">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar || ""} alt={user?.name || "User"} />
            <AvatarFallback className="bg-primary text-xs text-primary-foreground">
              {user?.initials || "U"}
            </AvatarFallback>
          </Avatar>
          <Text as="span" className="hidden text-sm font-medium text-foreground sm:inline-block">
            {user?.name || "User"}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
