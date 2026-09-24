"use client";

/*
 * Contained failure state for a route segment.
 *
 * Without an error boundary, one component throwing during render unmounts the
 * whole tree and Next.js replaces the page with the bare string "Application
 * error: a client-side exception has occurred" — no navigation, no sidebar, no
 * indication of what failed, and in a production build the message is stripped.
 * A user cannot act on that and a support ticket carries nothing useful.
 *
 * This keeps the shell, offers a retry (`reset` re-renders the segment, which
 * is enough when the cause was a transient fetch), and surfaces the error
 * `digest` — the id Next.js also writes to the server log, which is what turns
 * "it crashed" into a traceable report.
 */

import { AlertTriangle, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";

export function RouteError({ error, reset, what = "this page" }) {
  return (
    <Card className="mx-auto max-w-lg rounded-2xl border border-red-200/70 bg-white p-8 text-center shadow-sm">
      <Box className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
        <AlertTriangle className="h-7 w-7 text-red-500" />
      </Box>
      <Text as="h2" className="text-base font-bold text-slate-800">Something went wrong loading {what}</Text>
      <Text as="p" className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
        The page couldn&apos;t be displayed. Trying again often clears it — if it
        doesn&apos;t, send the reference below to support and we can trace exactly
        what failed.
      </Text>

      {/* A production build strips the message, so the digest is usually the
          only identifying detail available on the client. */}
      {(error?.digest || error?.message) && (
        <Text as="p" className="mt-4 rounded-lg bg-slate-50 px-3 py-2 font-mono text-[11px] break-all text-slate-500">
          {error.digest ? `Reference: ${error.digest}` : error.message}
        </Text>
      )}

      <Box className="mt-5 flex items-center justify-center gap-2">
        <Button onClick={() => reset?.()} className="h-9 gap-1.5 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white hover:bg-violet-700">
          <RotateCw className="h-3.5 w-3.5" /> Try again
        </Button>
        <Button
          variant="outline"
          onClick={() => { if (typeof window !== "undefined") window.location.reload(); }}
          className="h-9 rounded-lg px-4 text-sm"
        >
          Reload
        </Button>
      </Box>
    </Card>
  );
}
