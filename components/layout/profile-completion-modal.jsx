"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, UserPen, ArrowRight } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useProfileCompletion } from "@/providers/profile-completion-provider";

const PROFILE_HREF = { trainer: "/trainer/profile", learner: "/profile" };

/**
 * Post-login nudge to finish the profile. Shows on each login (per session,
 * once dismissed it stays dismissed until the next load) while the profile is
 * incomplete. Never appears once the profile is complete. Suppressed while the
 * user is already on their profile page.
 */
export function ProfileCompletionModal() {
  const ctx = useProfileCompletion();
  const pathname = usePathname();

  if (!ctx || !ctx.tracked) return null;
  const href = PROFILE_HREF[ctx.role];
  // Don't pop over the profile page itself — they're already there fixing it.
  const onProfilePage = pathname === href;
  const open = ctx.promptOpen && !onProfilePage;

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) ctx.dismissPrompt(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <Box className="flex items-center gap-3">
            <Box className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </Box>
            <Box>
              <DialogTitle className="text-base">Complete your profile</DialogTitle>
              <DialogDescription className="text-xs mt-0.5">
                A few details are still missing. Please finish your profile to get the most out of your portal.
              </DialogDescription>
            </Box>
          </Box>
        </DialogHeader>

        <Box className="px-6 py-2">
          <Text as="p" className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
            Still needed
          </Text>
          <Box className="flex flex-wrap gap-1.5">
            {ctx.missing.map((f) => (
              <Badge key={f.key} className="border-0 bg-red-50 text-red-700 text-[11px] font-medium">{f.label}</Badge>
            ))}
          </Box>
        </Box>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => ctx.dismissPrompt()}>Later</Button>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => ctx.dismissPrompt()}
            render={<Link href={href} />}
          >
            <UserPen className="h-3.5 w-3.5 mr-1.5" /> Complete profile <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
