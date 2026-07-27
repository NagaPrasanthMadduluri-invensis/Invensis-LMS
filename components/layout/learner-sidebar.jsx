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
import { GraduationCap } from "lucide-react";
import Text from "@/components/ui/text";
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
    <Sidebar collapsible="icon">
      <SidebarBrandHeader
        icon={GraduationCap}
        title="Invensis Learning"
        subtitle="Learner Portal"
      />
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
