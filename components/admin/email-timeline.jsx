"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowUpRight, ArrowDownLeft, AlertCircle, Inbox, MailWarning, RefreshCw,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { formatInstantDateTime } from "@/lib/datetime";

const addrLabel = (a) => (a ? (a.name ? `${a.name} <${a.address}>` : a.address) : "—");

// Short-lived, module-level cache so switching away from the Timeline tab and
// back doesn't re-hit the mailbox. Survives component unmount (Radix Tabs
// unmounts the inactive tab). Keyed per person; manual Refresh bypasses it.
const TTL_MS = 5 * 60 * 1000; // 5 minutes
const cache = new Map(); // cacheKey -> { at, messages }

function agoLabel(at) {
  if (!at) return "";
  const s = Math.floor((Date.now() - at) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

/**
 * Live, read-only timeline of the operations@ mailbox for one person.
 * `fetchEmails` returns { email, messages }; `cacheKey` scopes the cache to this
 * person. Fetches on first open, serves from cache for TTL_MS on re-open, and
 * refetches on demand via Refresh.
 */
export function EmailTimeline({ fetchEmails, cacheKey }) {
  const cached = cacheKey ? cache.get(cacheKey) : null;
  const freshFromCache = cached && Date.now() - cached.at < TTL_MS;

  const [state, setState] = useState(
    freshFromCache ? { messages: cached.messages, fetchedAt: cached.at } : { loading: true }
  );
  const [refreshing, setRefreshing] = useState(false);
  const [openId, setOpenId] = useState(null);

  const run = useCallback(async () => {
    try {
      const data = await fetchEmails();
      const messages = data.messages || [];
      const at = Date.now();
      if (cacheKey) cache.set(cacheKey, { at, messages });
      setState({ messages, fetchedAt: at });
    } catch (e) {
      if (e.status === 503) setState({ notConfigured: true });
      else setState({ error: e.message || "Could not load the email timeline." });
    }
  }, [fetchEmails, cacheKey]);

  useEffect(() => {
    // Only hit the network when we didn't hydrate from a fresh cache.
    if (state.loading) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function refresh() {
    setRefreshing(true);
    await run();
    setRefreshing(false);
  }

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
      <Card className="flex items-center justify-between gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
        <Box className="flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
          <Text as="p" className="text-sm text-red-700">{state.error}</Text>
        </Box>
        <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}
          className="shrink-0 border-red-200 text-red-700 hover:bg-red-100">
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} /> Retry
        </Button>
      </Card>
    );
  }

  const messages = state.messages ?? [];

  const header = (
    <Box className="flex items-center justify-between">
      <Text as="p" className="text-[11px] text-slate-400">
        Live from operations@invensislearning.com{state.fetchedAt ? ` · updated ${agoLabel(state.fetchedAt)}` : ""}
      </Text>
      <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}
        className="h-8 border-slate-200 text-slate-600 hover:bg-slate-100">
        <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
        {refreshing ? "Refreshing…" : "Refresh"}
      </Button>
    </Box>
  );

  if (messages.length === 0) {
    return (
      <Box className="space-y-3">
        {header}
        <Card className="flex flex-col items-center justify-center px-6 py-12 text-center rounded-2xl border border-slate-200/80 shadow-sm">
          <Box className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
            <Inbox className="h-6 w-6 text-slate-400" />
          </Box>
          <Text as="h3" className="mt-3 text-base font-bold text-slate-800">No emails yet</Text>
          <Text as="p" className="mt-1 text-sm text-slate-500">
            No correspondence with operations@invensislearning.com was found for this person.
          </Text>
        </Card>
      </Box>
    );
  }

  return (
    <Box className="space-y-2">
      {header}
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
    </Box>
  );
}
