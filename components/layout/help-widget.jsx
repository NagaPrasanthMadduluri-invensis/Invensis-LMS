"use client";

import { useEffect, useRef, useState } from "react";
import { HelpCircle, LifeBuoy, Mail, Copy, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";

// Operations inbox users are directed to for help. Overridable via env.
const OPS_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "operations@invensislearning.com";
const MAIL_SUBJECT = encodeURIComponent("Help needed — Invensis Learning portal");

/**
 * Floating "Need help?" launcher pinned to the bottom-right corner. Opens a
 * small popup directing the user to email the operations team, with a one-tap
 * copy of the address. Rendered by the learner, trainer and sponsor shells —
 * the portals whose users contact operations (admins are the ones contacted).
 */
export function HelpWidget() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const rootRef = useRef(null);

  // Close on Escape and on a click outside the widget.
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    function onClick(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClick);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  async function copyEmail() {
    try {
      await navigator.clipboard.writeText(OPS_EMAIL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — the email link still works */
    }
  }

  return (
    <Box ref={rootRef} className="fixed bottom-5 right-5 z-50 flex flex-col items-end">
      {open && (
        <Box
          role="dialog"
          aria-label="Need help?"
          className="mb-3 w-[min(20rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl border border-border bg-background shadow-xl"
        >
          {/* Header */}
          <Box className="flex items-start gap-3 bg-primary px-4 py-3.5 text-primary-foreground">
            <Box className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <LifeBuoy className="h-5 w-5" />
            </Box>
            <Box className="min-w-0 flex-1">
              <Text as="p" className="text-sm font-semibold leading-tight">Need help?</Text>
              <Text as="p" className="mt-0.5 text-xs text-white/80">
                Our operations team is here for you.
              </Text>
            </Box>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close help"
              className="-mr-1 -mt-1 rounded-md p-1 text-white/70 transition-colors hover:bg-white/15 hover:text-primary-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
            >
              <X className="h-4 w-4" />
            </button>
          </Box>

          {/* Body */}
          <Box className="space-y-3 px-4 py-4">
            <Text as="p" className="text-sm text-muted-foreground">
              Have a question or hit a snag? Email our operations team and we&apos;ll
              get back to you.
            </Text>

            <Box className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2">
              <Mail className="h-4 w-4 shrink-0 text-primary" />
              <Text as="span" className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {OPS_EMAIL}
              </Text>
            </Box>

            <Box className="flex items-center gap-2">
              <Button
                size="sm"
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary-hover"
                render={<a href={`mailto:${OPS_EMAIL}?subject=${MAIL_SUBJECT}`} />}
              >
                <Mail className="h-3.5 w-3.5" />
                Email operations
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={copyEmail}
                aria-label="Copy email address"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </Box>
          </Box>
        </Box>
      )}

      {/* Launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Close help" : "Need help?"}
        aria-expanded={open}
        className="flex h-12 items-center gap-2 rounded-full bg-primary pl-4 pr-5 text-primary-foreground shadow-lg transition-all hover:bg-primary-hover hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
      >
        {open ? <X className="h-5 w-5" /> : <HelpCircle className="h-5 w-5" />}
        <Text as="span" className="text-sm font-semibold">Need help?</Text>
      </button>
    </Box>
  );
}
