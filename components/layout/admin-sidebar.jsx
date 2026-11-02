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
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { SidebarBrandHeader } from "@/components/layout/sidebar-brand-header";
import { ShieldCheck } from "lucide-react";
import Text from "@/components/ui/text";
import { adminNav } from "@/lib/nav-config";
import { useAuth } from "@/hooks/use-auth";
import { useTicketUnread } from "@/hooks/use-ticket-unread";
import { useCertificatePendingRelease } from "@/hooks/use-certificate-pending-release";
import { fetchAdminTickets } from "@/services/api/admin/admin-api";

function NavGroup({ label, items, pathname, badges = {}, dots = {} }) {
  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const badge = badges[item.href];
            const dot = dots[item.href];
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  isActive={pathname === item.href}
                  render={<Link href={item.href} />}
                >
                  <item.icon />
                  <Text as="span" className="flex-1 text-sidebar-foreground font-medium">
                    {item.title}
                  </Text>
                  {dot && (
                    <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-error" aria-label="Certificates ready to release" />
                  )}
                </SidebarMenuButton>
                {badge > 0 && (
                  <SidebarMenuBadge className="bg-destructive text-white">{badge > 99 ? "99+" : badge}</SidebarMenuBadge>
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout, user, token } = useAuth();
  const ticketUnread = useTicketUnread({ token, userId: user?.id, fetchTickets: fetchAdminTickets });
  const certPendingRelease = useCertificatePendingRelease({ token });

  const handleFooterClick = (href) => {
    if (href === "/logout") {
      logout();
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarBrandHeader
        icon={ShieldCheck}
        title="Invensis Learning"
        subtitle="Admin Portal"
      />
      <SidebarContent>
        <NavGroup label="Overview" items={adminNav.main} pathname={pathname} />
        <NavGroup label="Users & Teams" items={adminNav.users} pathname={pathname} />
        <NavGroup label="Trainings & Certificates" items={adminNav.content} pathname={pathname} dots={{ "/admin/certificates": certPendingRelease > 0 }} />
        <NavGroup label="Communication" items={adminNav.communication} pathname={pathname} badges={{ "/admin/tickets": ticketUnread }} />
      </SidebarContent>
      <SidebarSeparator />
      <SidebarFooter>
        <SidebarMenu>
          {adminNav.footer.map((item) => (
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
                <Text as="span" className="text-sidebar-foreground font-medium">
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
