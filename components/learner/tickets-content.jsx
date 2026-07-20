"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Plus, Ticket, Hash, Calendar, BookOpen, LifeBuoy, CheckCircle2, Clock, Loader2,
  MessageSquare, ChevronRight,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchMyTickets, fetchMyTicket, replyToMyTicket } from "@/services/api/learner/learner-api";
import { STATUS_META, PRIORITY_META, categoryLabel } from "@/lib/ticket-meta";
import { TicketThread } from "@/components/shared/ticket-thread";

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function StatChip({ icon: Icon, value, label, cls }) {
  return (
    <Card className={`rounded-2xl border-0 shadow-sm p-4 ${cls}`}>
      <Box className="flex items-center gap-2">
        <Icon className="h-4 w-4" />
        <Text as="span" className="text-2xl font-bold leading-none">{value}</Text>
      </Box>
      <Text as="p" className="text-xs font-medium mt-1.5 opacity-80">{label}</Text>
    </Card>
  );
}

function TicketRow({ t, onClick }) {
  const status = STATUS_META[t.status] || STATUS_META.open;
  const priority = PRIORITY_META[t.priority] || PRIORITY_META.low;
  return (
    <Card
      onClick={onClick}
      className="group rounded-2xl border border-slate-200/80 shadow-sm p-5 cursor-pointer hover:border-violet-300 hover:shadow-md transition-all"
    >
      <Box className="flex items-start justify-between gap-3">
        <Box className="min-w-0">
          <Box className="flex items-center gap-2 flex-wrap">
            <Text as="span" className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-violet-600 bg-violet-50 ring-1 ring-violet-200 px-2 py-0.5 rounded-md">
              <Hash className="h-3 w-3" />{t.code}
            </Text>
            <Badge className="border-0 bg-slate-100 text-slate-600 text-[11px] font-semibold">{categoryLabel(t.category)}</Badge>
          </Box>
          <Text as="h3" className="text-sm font-bold text-slate-800 leading-snug mt-2 break-words">{t.subject}</Text>
        </Box>
        <Box className="flex flex-col items-end gap-1.5 shrink-0">
          <Badge className={`border-0 text-[11px] font-semibold ${status.badge}`}>{status.label}</Badge>
          <Badge className={`border-0 text-[10px] font-semibold ${priority.badge}`}>{priority.label}</Badge>
        </Box>
      </Box>

      {t.description && (
        <Text as="p" className="text-xs text-slate-500 leading-relaxed mt-2.5 line-clamp-2 break-words">{t.description}</Text>
      )}

      <Box className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3 pt-3 border-t border-slate-100">
        {t.training && (
          <Box className="flex items-center gap-1.5 min-w-0">
            <BookOpen className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <Text as="span" className="text-xs text-slate-600 truncate">
              {t.training.code} · {t.training.title}
            </Text>
          </Box>
        )}
        <Box className="flex items-center gap-3 ml-auto shrink-0">
          {t.message_count > 0 && (
            <Box className="flex items-center gap-1 text-xs text-violet-500 font-semibold">
              <MessageSquare className="h-3.5 w-3.5" />{t.message_count}
            </Box>
          )}
          <Box className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <Text as="span" className="text-xs text-slate-500">{formatDate(t.created_at)}</Text>
          </Box>
          <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-violet-500 transition-colors" />
        </Box>
      </Box>
    </Card>
  );
}

function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function LearnerTicketDrawer({ ticketRow, open, onOpenChange, token, onChanged }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open || !ticketRow?.id || !token) return;
    setDetail(null);
    setLoadError(null);
    setLoading(true);
    fetchMyTicket({ token, ticketId: ticketRow.id })
      .then((r) => setDetail(r.ticket))
      .catch((e) => setLoadError(e.message || "Couldn't load this conversation"))
      .finally(() => setLoading(false));
  }, [open, ticketRow?.id, token]);

  const t = detail || ticketRow;
  if (!t) return null;
  const status = STATUS_META[t.status] || STATUS_META.open;
  const isClosed = t.status === "closed";

  async function sendReply(body) {
    setSending(true);
    try {
      const res = await replyToMyTicket({ token, ticketId: t.id, body });
      setDetail(res.ticket);
      onChanged?.(res.ticket);
    } finally {
      setSending(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="!max-w-none w-full sm:!max-w-lg p-0 gap-0 flex flex-col">
        <SheetHeader className="p-5 border-b border-slate-100 shrink-0">
          <Box className="flex items-center gap-2 flex-wrap">
            <Text as="span" className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-violet-600 bg-violet-50 ring-1 ring-violet-200 px-2 py-0.5 rounded-md">
              <Hash className="h-3 w-3" />{t.code}
            </Text>
            <Badge className={`border-0 text-[11px] font-semibold ${status.badge}`}>{status.label}</Badge>
          </Box>
          <SheetTitle className="text-base font-bold text-slate-800 mt-2">{t.subject}</SheetTitle>
          <SheetDescription className="text-xs text-slate-400">{categoryLabel(t.category)} · Raised {formatDateTime(t.created_at)}</SheetDescription>
        </SheetHeader>

        <Box className="px-5 py-4 border-b border-slate-100 space-y-3 shrink-0 max-h-[38%] overflow-y-auto">
          {t.training && (
            <Box className="rounded-xl bg-slate-50 ring-1 ring-slate-200 px-4 py-2.5">
              <Text as="p" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Related training</Text>
              <Box className="flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-violet-500 shrink-0" />
                <Text as="span" className="text-sm font-semibold text-slate-700 font-mono">{t.training.code}</Text>
                <Text as="span" className="text-sm text-slate-500 truncate">· {t.training.title}</Text>
              </Box>
            </Box>
          )}
          <Box>
            <Text as="p" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Your request</Text>
            <Text as="p" className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap break-words">{t.description}</Text>
          </Box>
        </Box>

        <Box className="flex-1 min-h-0 flex flex-col px-5 py-4">
          <Box className="flex items-center gap-2 mb-3 shrink-0">
            <MessageSquare className="h-4 w-4 text-slate-400" />
            <Text as="h4" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conversation</Text>
            {detail?.messages?.length > 0 && (
              <Badge className="border-0 bg-slate-100 text-slate-500 text-[10px] font-semibold">{detail.messages.length}</Badge>
            )}
          </Box>
          {loading ? (
            <Box className="flex-1 flex items-center justify-center py-10">
              <Text as="span" className="text-xs text-slate-400">Loading conversation…</Text>
            </Box>
          ) : loadError ? (
            <Box className="rounded-xl bg-red-50 ring-1 ring-red-100 px-3.5 py-3">
              <Text as="span" className="text-xs text-red-600">Couldn&apos;t load the conversation: {loadError}</Text>
            </Box>
          ) : (
            <TicketThread
              messages={detail?.messages || []}
              viewerRole="learner"
              onSend={sendReply}
              sending={sending}
              disabled={isClosed}
              disabledHint="This ticket is closed. Raise a new one if you still need help."
            />
          )}
        </Box>
      </SheetContent>
    </Sheet>
  );
}

export function TicketsContent() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);

  function load() {
    return fetchMyTickets({ token }).then(setData).catch((e) => setError(e.message));
  }

  useEffect(() => {
    if (!token) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function handleChanged(updated) {
    setData((d) => (d ? { ...d, tickets: d.tickets.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)) } : d));
    setSelected((s) => (s && s.id === updated.id ? { ...s, ...updated } : s));
    load();
  }

  if (error) {
    return (
      <Card className="p-6 rounded-2xl border-0 bg-red-50 shadow-sm">
        <Text as="p" className="text-red-600 text-sm">Failed to load tickets: {error}</Text>
      </Card>
    );
  }

  if (!data) {
    return (
      <Box className="space-y-5">
        <Box className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </Box>
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
      </Box>
    );
  }

  const { tickets, summary } = data;

  return (
    <Box className="space-y-5">
      {/* Summary + raise button */}
      <Box className="flex items-center justify-between gap-3 flex-wrap">
        <Text as="h2" className="text-base font-bold text-slate-800">Your tickets</Text>
        <Button render={<Link href="/tickets/new" />} className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl gap-1.5 h-10 px-4">
          <Plus className="h-4 w-4" /> Raise a ticket
        </Button>
      </Box>

      <Box className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatChip icon={Ticket}       value={summary.total}       label="Total"       cls="bg-slate-50 text-slate-700" />
        <StatChip icon={Clock}        value={summary.open}        label="Open"        cls="bg-red-50 text-red-600" />
        <StatChip icon={Loader2}      value={summary.in_progress} label="In Progress" cls="bg-amber-50 text-amber-700" />
        <StatChip icon={CheckCircle2} value={summary.resolved}    label="Resolved"    cls="bg-emerald-50 text-emerald-700" />
      </Box>

      {tickets.length === 0 ? (
        <Card className="p-14 text-center rounded-2xl border border-slate-200/80 shadow-sm bg-white">
          <Box className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
            <LifeBuoy className="h-7 w-7 text-violet-400" />
          </Box>
          <Text as="p" className="text-sm font-semibold text-slate-700">No tickets yet</Text>
          <Text as="p" className="text-xs text-slate-400 mt-1 mb-5">
            Have a question about a training, certificate, or your account? Raise a ticket and we&apos;ll help.
          </Text>
          <Button render={<Link href="/tickets/new" />} className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl gap-1.5 h-10 px-4 mx-auto">
            <Plus className="h-4 w-4" /> Raise a ticket
          </Button>
        </Card>
      ) : (
        <Box className="space-y-4">
          {tickets.map((t) => <TicketRow key={t.id} t={t} onClick={() => setSelected(t)} />)}
        </Box>
      )}

      <LearnerTicketDrawer
        ticketRow={selected}
        open={!!selected}
        onOpenChange={(o) => { if (!o) setSelected(null); }}
        token={token}
        onChanged={handleChanged}
      />
    </Box>
  );
}
