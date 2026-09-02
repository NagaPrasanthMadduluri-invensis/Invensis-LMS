"use client";

import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HelpCircle, Mail, LifeBuoy, Copy, Check } from "lucide-react";
import { useState } from "react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";

// Operations inbox users are directed to for help. Overridable via env.
const OPS_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "operations@invensislearning.com";
const MAIL_SUBJECT = encodeURIComponent("Help needed — Invensis Learning portal");

// Per-role in-app tickets destination (portals without a tickets page get none).
const TICKETS_HREF = {
  learner: "/tickets",
  // trainer / sponsor have no tickets page yet — they get the email contact only.
};

/**
 * "Need help?" menu for the top bar. Shown to non-admin portals (trainer,
 * sponsor, learner) — admins are the ones being contacted. Offers a direct
 * mailto to the operations team and, where the portal has one, a link to raise
 * or view a support ticket.
 */
export function HelpMenu() {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);

  // Admins don't need to contact themselves.
  if (!user || user.role === "admin") return null;

  const ticketsHref = TICKETS_HREF[user.role] || null;

  async function copyEmail(e) {
    // Keep the menu open; just copy the address.
    e.preventDefault();
    try {
      await navigator.clipboard.writeText(OPS_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — the mailto item still works */
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Need help?"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      >
        <HelpCircle className="h-5 w-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 p-2">
        <DropdownMenuLabel className="px-2 pt-1 pb-0.5">
          <Text as="p" className="text-sm font-semibold text-foreground">Need help?</Text>
          <Text as="p" className="text-xs text-muted-foreground mt-0.5">
            Reach our operations team, or raise a support ticket.
          </Text>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Email operations */}
        <DropdownMenuItem
          className="cursor-pointer p-0"
          render={
            <a href={`mailto:${OPS_EMAIL}?subject=${MAIL_SUBJECT}`} />
          }
        >
          <Box className="flex items-start gap-2.5 w-full px-2 py-1.5">
            <Box className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50">
              <Mail className="h-4 w-4 text-violet-600" />
            </Box>
            <Box className="min-w-0">
              <Text as="p" className="text-sm font-medium text-foreground leading-tight">Email operations</Text>
              <Text as="span" className="text-xs text-muted-foreground break-all">{OPS_EMAIL}</Text>
            </Box>
          </Box>
        </DropdownMenuItem>

        {/* Copy address (doesn't close the menu) */}
        <DropdownMenuItem className="cursor-pointer" onClick={copyEmail}>
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
          <Text as="span" className="text-sm">{copied ? "Copied!" : "Copy email address"}</Text>
        </DropdownMenuItem>

        {ticketsHref && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="cursor-pointer p-0"
              render={<Link href={ticketsHref} />}
            >
              <Box className="flex items-start gap-2.5 w-full px-2 py-1.5">
                <Box className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-50">
                  <LifeBuoy className="h-4 w-4 text-violet-600" />
                </Box>
                <Box className="min-w-0">
                  <Text as="p" className="text-sm font-medium text-foreground leading-tight">Support tickets</Text>
                  <Text as="span" className="text-xs text-muted-foreground">Raise a new ticket or track existing ones</Text>
                </Box>
              </Box>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
