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
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { GraduationCap } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { learnerNav } from "@/lib/nav-config";
import { useAuth } from "@/hooks/use-auth";
import { useTicketUnread } from "@/hooks/use-ticket-unread";
import { fetchMyTickets } from "@/services/api/learner/learner-api";

function NavGroup({ label, items, pathname, badges = {} }) {
  return (
    <SidebarGroup>
      {label && <SidebarGroupLabel>{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const badge = badges[item.href];
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

export function LearnerSidebar() {
  const pathname = usePathname();
  const { logout, capabilities, user, token } = useAuth();
  const ticketUnread = useTicketUnread({ token, userId: user?.id, fetchTickets: fetchMyTickets });

  const handleFooterClick = (href) => {
    if (href === "/logout") {
      logout();
    }
  };

  // "Invoices & Receipts" is only for users who are BOTH a learner and a sponsor.
  const canSeeInvoices = !!(capabilities?.learner && capabilities?.sponsor);
  const paymentsItems = learnerNav.payments.filter(
    (item) => item.href !== "/invoices" || canSeeInvoices
  );

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <Box className="flex items-center gap-2.5">
          <Box className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-white">
            <GraduationCap className="w-6 h-5 text-violet-500" />
          </Box>
          <Box>
            <Text as="span" className="text-sidebar-foreground text-sm font-bold leading-none block">
              Invensis Learning
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
        <NavGroup label="Payments" items={paymentsItems} pathname={pathname} />
        <NavGroup label="Support" items={learnerNav.support} pathname={pathname} badges={{ "/tickets": ticketUnread }} />
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
