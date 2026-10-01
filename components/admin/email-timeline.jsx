"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Mail, ArrowUpRight, ArrowDownLeft, AlertCircle, Inbox, MailWarning,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { formatInstantDateTime } from "@/lib/datetime";

const addrLabel = (a) => (a ? (a.name ? `${a.name} <${a.address}>` : a.address) : "—");

/**
 * Live, read-only timeline of the operations@ mailbox for one person.
 * `fetchEmails` is an already-bound async call returning { email, messages }.
 * It runs on mount — this component is mounted only when the Timeline tab is
 * opened, so the IMAP fetch happens on demand.
 */
export function EmailTimeline({ fetchEmails }) {
  const [state, setState] = useState({ loading: true });
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchEmails();
        if (!cancelled) setState({ messages: data.messages || [] });
      } catch (e) {
        if (cancelled) return;
        if (e.status === 503) setState({ notConfigured: true });
        else setState({ error: e.message || "Could not load the email timeline." });
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (state.loading) {
    return (
      <Box className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </Box>
    );
  }

  if (state.notConfigured) {
    return (
      <Card className="flex flex-col items-center justify-center px-6 py-12 text-center rounded-2xl border border-slate-200/80 shadow-sm">
        <Box className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50">
          <MailWarning className="h-6 w-6 text-amber-500" />
        </Box>
        <Text as="h3" className="mt-3 text-base font-bold text-slate-800">Mailbox not connected</Text>
        <Text as="p" className="mt-1 max-w-md text-sm text-slate-500">
          The operations mailbox isn&apos;t configured yet, so there&apos;s nothing to show. Once it&apos;s connected, emails to and from this person will appear here.
        </Text>
      </Card>
    );
  }

  if (state.error) {
    return (
      <Card className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
        <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
        <Text as="p" className="text-sm text-red-700">{state.error}</Text>
      </Card>
    );
  }

  const messages = state.messages ?? [];
  if (messages.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center px-6 py-12 text-center rounded-2xl border border-slate-200/80 shadow-sm">
        <Box className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
          <Inbox className="h-6 w-6 text-slate-400" />
        </Box>
        <Text as="h3" className="mt-3 text-base font-bold text-slate-800">No emails yet</Text>
        <Text as="p" className="mt-1 text-sm text-slate-500">
          No correspondence with operations@invensislearning.com was found for this person.
        </Text>
      </Card>
    );
  }

  return (
    <Box className="space-y-2">
      {messages.map((m) => {
        const outbound = m.direction === "outbound";
        const counterpart = outbound ? `To ${addrLabel(m.to?.[0])}` : `From ${addrLabel(m.from)}`;
        const isOpen = openId === m.id;
        return (
          <Card key={m.id}
            className="p-0 overflow-hidden rounded-xl border border-slate-200/80 shadow-sm">
            <button type="button" onClick={() => setOpenId(isOpen ? null : m.id)}
              className="w-full text-left px-4 py-3 hover:bg-slate-50/70 transition-colors">
              <Box className="flex items-start gap-3">
                <Box className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${outbound ? "bg-violet-50" : "bg-sky-50"}`}>
                  {outbound
                    ? <ArrowUpRight className="h-4 w-4 text-violet-600" />
                    : <ArrowDownLeft className="h-4 w-4 text-sky-600" />}
                </Box>
                <Box className="min-w-0 flex-1">
                  <Box className="flex items-center gap-2">
                    <Text as="p" className="min-w-0 truncate text-sm font-semibold text-slate-800">{m.subject}</Text>
                    <Badge className={`border-0 text-[10px] font-semibold shrink-0 ${outbound ? "bg-violet-50 text-violet-700" : "bg-sky-50 text-sky-700"}`}>
                      {outbound ? "Sent" : "Received"}
                    </Badge>
                  </Box>
                  <Text as="p" className="mt-0.5 truncate text-xs text-slate-500">{counterpart}</Text>
                  {!isOpen && m.snippet && (
                    <Text as="p" className="mt-1 truncate text-xs text-slate-400">{m.snippet}</Text>
                  )}
                </Box>
                <Text as="span" className="shrink-0 text-[11px] text-slate-400">{formatInstantDateTime(m.date)}</Text>
              </Box>
            </button>
            {isOpen && (
              <Box className="border-t border-slate-100 bg-slate-50/50 px-4 py-3 space-y-2">
                <Box className="text-[11px] text-slate-500 space-y-0.5">
                  <Text as="p"><Box as="span" className="font-semibold text-slate-600">From:</Box> {addrLabel(m.from)}</Text>
                  <Text as="p"><Box as="span" className="font-semibold text-slate-600">To:</Box> {(m.to ?? []).map(addrLabel).join(", ") || "—"}</Text>
                  {m.cc?.length > 0 && (
                    <Text as="p"><Box as="span" className="font-semibold text-slate-600">Cc:</Box> {m.cc.map(addrLabel).join(", ")}</Text>
                  )}
                </Box>
                <Box as="pre" className="whitespace-pre-wrap break-words font-sans text-sm text-slate-700">
                  {m.text || "(no text content)"}
                </Box>
              </Box>
            )}
          </Card>
        );
      })}
      <Text as="p" className="pt-1 text-[11px] text-slate-400">
        Live from operations@invensislearning.com · newest {messages.length} shown
      </Text>
    </Box>
  );
}
