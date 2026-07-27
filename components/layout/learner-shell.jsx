"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { LearnerSidebar } from "@/components/layout/learner-sidebar";
import { AuthProvider } from "@/providers/auth-provider";
import { SessionLiveIndicator } from "@/components/learner/session-live-indicator";
import Box from "@/components/ui/box";

export function LearnerShell({ children }) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <Box className="flex h-full flex-col">
          {/* The live-session pill is learner-only, so the shell injects it
              rather than TopNav branching on portal. */}
          <TopNav portalLabel="Invensis Learning" statusSlot={<SessionLiveIndicator />} />
          <Box className="flex flex-1 overflow-hidden bg-sidebar">
            <LearnerSidebar />
            <Box as="main" className="flex-1 overflow-auto p-6 bg-background">
              {children}
            </Box>
          </Box>
        </Box>
      </SidebarProvider>
    </AuthProvider>
  );
}
