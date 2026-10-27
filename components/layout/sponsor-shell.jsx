"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { SponsorSidebar } from "@/components/layout/sponsor-sidebar";
import { AuthProvider } from "@/providers/auth-provider";
import { HelpWidget } from "@/components/layout/help-widget";
import { WebinarBanner } from "@/components/layout/webinar-banner";
import { WebinarBannerProvider } from "@/providers/webinar-banner-provider";
import Box from "@/components/ui/box";

export function SponsorShell({ children }) {
  return (
    <AuthProvider>
      <WebinarBannerProvider>
      <SidebarProvider>
        <Box className="flex h-full flex-col">
          <TopNav portalLabel="Invensis Sponsor" />
          <WebinarBanner />
          <Box className="flex flex-1 overflow-hidden bg-sidebar">
            <SponsorSidebar />
            <Box as="main" className="flex-1 overflow-auto p-6 bg-background">
              {children}
            </Box>
          </Box>
        </Box>
        <HelpWidget />
      </SidebarProvider>
      </WebinarBannerProvider>
    </AuthProvider>
  );
}
