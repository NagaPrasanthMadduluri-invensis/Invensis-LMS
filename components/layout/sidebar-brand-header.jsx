"use client";

import { SidebarHeader, SidebarTrigger } from "@/components/ui/sidebar";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";

/**
 * Shared brand block at the top of every portal sidebar, with the collapse
 * trigger alongside it. The trigger lives here rather than in the top nav so
 * the control sits with the thing it controls.
 *
 * Sidebars using this must be `collapsible="icon"` — an offcanvas sidebar
 * takes the trigger off-screen with it, leaving no way to reopen it.
 */
export function SidebarBrandHeader({ icon: Icon, title, subtitle }) {
  return (
    <SidebarHeader className="border-b border-sidebar-border px-4 py-3 group-data-[collapsible=icon]:px-2">
      <Box className="flex items-center gap-2.5">
        <Box className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white">
          <Icon className="h-5 w-5 text-violet-500" />
        </Box>
        <Box className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
          <Text as="span" className="block text-sm font-bold leading-none text-sidebar-foreground">
            {title}
          </Text>
          <Text as="span" className="mt-0.5 block text-[10px] leading-none text-sidebar-foreground/50">
            {subtitle}
          </Text>
        </Box>
        <SidebarTrigger className="shrink-0 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden" />
      </Box>

      {/* Collapsed rail: the brand mark alone can't reopen the sidebar, so the
          trigger gets its own row underneath it. */}
      <SidebarTrigger className="mt-1 hidden w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground group-data-[collapsible=icon]:flex" />
    </SidebarHeader>
  );
}
