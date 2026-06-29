"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { GraduationCap } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { learnerNav } from "@/lib/nav-config";
import { useAuth } from "@/hooks/use-auth";

function NavGroup({ label, items, pathname }) {
  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                isActive={pathname === item.href}
                render={<Link href={item.href} />}
              >
                <item.icon />
                <Text as="span" className="flex-1 text-sidebar-foreground">
                  {item.title}
                </Text>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function LearnerSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const handleFooterClick = (href) => {
    if (href === "/logout") {
      logout();
    }
  };

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <Box className="flex items-center gap-2.5">
          <Box className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-emerald-500">
            <GraduationCap className="w-4 h-4 text-white" />
          </Box>
          <Box>
            <Text as="span" className="text-sidebar-foreground text-sm font-bold leading-none block">
              Invensis LMS
            </Text>
            <Text as="span" className="text-sidebar-foreground/50 text-[10px] leading-none block mt-0.5">
              Learner Portal
            </Text>
          </Box>
        </Box>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Main" items={learnerNav.main} pathname={pathname} />
        <NavGroup label="Learning" items={learnerNav.learning} pathname={pathname} />
        <NavGroup label="Payments" items={learnerNav.payments} pathname={pathname} />
        <NavGroup label="Engage" items={learnerNav.engage} pathname={pathname} />
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          {learnerNav.footer.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                isActive={pathname === item.href}
                render={
                  item.href === "/logout" ? (
                    <button type="button" onClick={() => handleFooterClick(item.href)} />
                  ) : (
                    <Link href={item.href} />
                  )
                }
              >
                <item.icon />
                <Text as="span" className="text-sidebar-foreground">
                  {item.title}
                </Text>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
