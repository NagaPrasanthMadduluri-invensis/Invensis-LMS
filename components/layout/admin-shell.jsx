"use client";

import { SidebarProvider } from "@/components/ui/sidebar";
import { TopNav } from "@/components/layout/top-nav";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AuthProvider } from "@/providers/auth-provider";
import Box from "@/components/ui/box";

export function AdminShell({ children }) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <Box className="flex h-full flex-col">
          <TopNav portalLabel="Invensis Admin" />
          <Box className="flex flex-1 overflow-hidden h-full">
            <AdminSidebar />
            <Box as="main" className="flex-1 overflow-auto p-6 bg-background h-full">
              {children}
            </Box>
          </Box>
        </Box>
      </SidebarProvider>
    </AuthProvider>
  );
}
