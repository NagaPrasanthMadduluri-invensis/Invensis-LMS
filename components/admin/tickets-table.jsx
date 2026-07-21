"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  Search, X, HeadphonesIcon, Hash, Mail, BookOpen, Calendar, Ticket,
  Clock, Loader2, CheckCircle2, ChevronRight, MessageSquare,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { markTicketSeen } from "@/lib/ticket-unread";
import { fetchAdminTickets, fetchAdminTicket, updateTicketStatus, replyToAdminTicket } from "@/services/api/admin/admin-api";
import { STATUS_META, PRIORITY_META, categoryLabel, TICKET_CATEGORIES } from "@/lib/ticket-meta";
import { TicketThread } from "@/components/shared/ticket-thread";

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700", "bg-violet-100 text-violet-700", "bg-teal-100 text-teal-700",
  "bg-emerald-100 text-emerald-700", "bg-rose-100 text-rose-700", "bg-amber-100 text-amber-700",
];
function initialsOf(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}
function avatarColor(id = "") {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function formatDateTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}
function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"];

function StatCard({ icon: Icon, value, label, cls }) {
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

function TicketDrawer({ ticketRow, open, onOpenChange, token, onChanged }) {
  const { user } = useAuth();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!open || !ticketRow?.id || !token) return;
    setDetail(null);
    setLoading(true);
    fetchAdminTicket({ token, ticketId: ticketRow.id })
      .then((res) => {
        setDetail(res.ticket);
        // Mark seen up to the replies in the thread → clears the sidebar badge.
        markTicketSeen(user?.id, ticketRow.id, res.ticket?.messages?.length ?? 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [open, ticketRow?.id, token, user?.id]);

  const t = detail || ticketRow;
  if (!t) return null;
  const status = STATUS_META[t.status] || STATUS_META.open;
  const priority = PRIORITY_META[t.priority] || PRIORITY_META.low;
  const isClosed = t.status === "closed";

  async function changeStatus(newStatus) {
    setBusy(true);
    try {
      const res = await updateTicketStatus({ token, ticketId: t.id, status: newStatus });
      setDetail((d) => ({ ...(d || {}), ...res.ticket }));
      onChanged?.(res.ticket);
    } finally {
      setBusy(false);
    }
  }

  async function sendReply(body) {
    setSending(true);
    try {
      const res = await replyToAdminTicket({ token, ticketId: t.id, body });
      setDetail(res.ticket);
      onChanged?.(res.ticket);
    } finally {
      setSending(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="!max-w-none w-full sm:!max-w-xl p-0 gap-0 flex flex-col">
        <SheetHeader className="p-5 border-b border-slate-100 shrink-0">
          <Box className="flex items-center gap-2 flex-wrap">
            <Text as="span" className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-violet-600 bg-violet-50 ring-1 ring-violet-200 px-2 py-0.5 rounded-md">
              <Hash className="h-3 w-3" />{t.code}
            </Text>
            <Badge className={`border-0 text-[11px] font-semibold ${status.badge}`}>{status.label}</Badge>
            <Badge className={`border-0 text-[10px] font-semibold ${priority.badge}`}>{priority.label}</Badge>
          </Box>
          <SheetTitle className="text-base font-bold text-slate-800 mt-2">{t.subject}</SheetTitle>
          <SheetDescription className="text-xs text-slate-400">{categoryLabel(t.category)} · Raised {formatDateTime(t.created_at)}</SheetDescription>
        </SheetHeader>

        {/* Meta + status (compact, scrolls if long) */}
        <Box className="px-5 py-4 border-b border-slate-100 space-y-4 shrink-0 max-h-[40%] overflow-y-auto">
          <Box className="flex items-center gap-3">
            <Box className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${avatarColor(t.learner?.id || "")}`}>
              {initialsOf(t.learner?.name)}
            </Box>
            <Box className="min-w-0">
              <Text as="p" className="text-sm font-semibold text-slate-800">{t.learner?.name}</Text>
              <Box className="flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                <Text as="span" className="text-xs text-slate-500 truncate">{t.learner?.email}</Text>
              </Box>
            </Box>
          </Box>

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
            <Text as="p" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Original request</Text>
            <Text as="p" className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap break-words">{t.description}</Text>
          </Box>

          <Box className="flex items-center gap-3">
            <Text as="span" className="text-xs font-semibold text-slate-600 shrink-0">Status</Text>
            <Select value={t.status} onValueChange={changeStatus} disabled={busy || loading}>
              <SelectTrigger className="h-9 bg-white border-slate-200 rounded-lg text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Box>
        </Box>

        {/* Conversation */}
        <Box className="flex-1 min-h-0 flex flex-col px-5 py-4">
          <Box className="flex items-center gap-2 mb-3 shrink-0">
            <MessageSquare className="h-4 w-4 text-slate-400" />
            <Text as="h4" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Conversation</Text>
          </Box>
          <TicketThread
            messages={detail?.messages || []}
            viewerRole="admin"
            onSend={sendReply}
            sending={sending}
            disabled={isClosed}
            disabledHint="This ticket is closed. Reopen it to reply."
          />
        </Box>
      </SheetContent>
    </Sheet>
  );
}

export function TicketsTable() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [selected, setSelected] = useState(null);

  function loadTickets() {
    return fetchAdminTickets({ token, status, category, search })
      .then(setData)
      .catch((e) => setError(e.message));
  }

  useEffect(() => {
    if (!token) return;
    const handle = setTimeout(loadTickets, 250);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, status, category, search]);

  // A ticket changed inside the drawer (status or reply) — patch the row in place
  // and refresh summary counts so the stat cards stay accurate.
  function handleTicketChanged(updated) {
    setData((d) => (d ? { ...d, tickets: d.tickets.map((t) => (t.id === updated.id ? { ...t, ...updated } : t)) } : d));
    setSelected((s) => (s && s.id === updated.id ? { ...s, ...updated } : s));
    loadTickets();
  }

  if (error) {
    return (
      <Card className="p-6 rounded-2xl border-0 bg-red-50 shadow-sm">
        <Text as="p" className="text-red-600 text-sm">Failed to load tickets: {error}</Text>
      </Card>
    );
  }

  const tickets = data?.tickets || [];
  const summary = data?.summary || { total: 0, open: 0, in_progress: 0, resolved: 0 };
  const hasFilters = !!(search || status || category);

  return (
    <Box className="space-y-5">
      {/* Summary */}
      <Box className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Ticket}       value={summary.total}       label="Total"       cls="bg-slate-50 text-slate-700" />
        <StatCard icon={Clock}        value={summary.open}        label="Open"        cls="bg-red-50 text-red-600" />
        <StatCard icon={Loader2}      value={summary.in_progress} label="In Progress" cls="bg-amber-50 text-amber-700" />
        <StatCard icon={CheckCircle2} value={summary.resolved}    label="Resolved"    cls="bg-emerald-50 text-emerald-700" />
      </Box>

      {/* Toolbar */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm p-3.5 space-y-3.5">
        <Box className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by ticket ID, subject or learner..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            className="pl-10 pr-9 h-10 text-sm bg-slate-50 border-slate-200 rounded-xl focus-visible:ring-2 focus-visible:ring-violet-400/40"
          />
          {search && (
            <button type="button" onClick={() => setSearch("")} aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </Box>
        <Box className="h-px bg-slate-100" />
        <Box className="flex items-center gap-3 flex-wrap">
          <Select value={status || "__all__"} onValueChange={(v) => setStatus(v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-9 w-[160px] bg-white border-slate-200 rounded-lg text-sm">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All statuses</SelectItem>
              {STATUS_OPTIONS.map((s) => <SelectItem key={s} value={s}>{STATUS_META[s].label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={category || "__all__"} onValueChange={(v) => setCategory(v === "__all__" ? "" : v)}>
            <SelectTrigger className="h-9 w-[190px] bg-white border-slate-200 rounded-lg text-sm">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All categories</SelectItem>
              {TICKET_CATEGORIES.map((c) => <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStatus(""); setCategory(""); }}
              className="h-9 px-3 text-xs text-slate-500 hover:text-slate-700">
              <X className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          )}
          <Text as="p" className="ml-auto text-xs text-slate-400 shrink-0">
            {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
          </Text>
        </Box>
      </Card>

      {/* Table */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <Box className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
          <Box className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
            <HeadphonesIcon className="h-4 w-4 text-violet-500" />
          </Box>
          <Text as="h3" className="text-sm font-bold text-slate-800">All Tickets</Text>
        </Box>

        {!data ? (
          <Box className="py-20 text-center">
            <Text as="p" className="text-sm text-slate-400">Loading tickets...</Text>
          </Box>
        ) : tickets.length === 0 ? (
          <Box className="py-20 text-center">
            <Box className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <HeadphonesIcon className="h-6 w-6 text-slate-400" />
            </Box>
            <Text as="p" className="text-sm font-medium text-slate-500">
              {hasFilters ? "No tickets match your filters" : "No tickets yet"}
            </Text>
          </Box>
        ) : (
          <Box className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100">
                  <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3 pl-5">Ticket</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3">Raised by</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3">Category</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3">Training</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3">Priority</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3">Status</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3">Raised</TableHead>
                  <TableHead className="py-3 pr-5" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((t) => {
                  const st = STATUS_META[t.status] || STATUS_META.open;
                  const pr = PRIORITY_META[t.priority] || PRIORITY_META.low;
                  return (
                    <TableRow
                      key={t.id}
                      onClick={() => setSelected(t)}
                      className="group cursor-pointer hover:bg-violet-50/40 border-b border-slate-100 last:border-0 transition-colors"
                    >
                      <TableCell className="py-4 pl-5">
                        <Text as="span" className="text-[11px] font-mono font-bold text-violet-600">{t.code}</Text>
                        <Text as="p" className="text-sm font-semibold text-slate-700 leading-tight mt-0.5 line-clamp-1 break-words">{t.subject}</Text>
                        {t.message_count > 0 && (
                          <Box className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-slate-400">
                            <MessageSquare className="h-3 w-3" />{t.message_count} {t.message_count === 1 ? "reply" : "replies"}
                          </Box>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        <Box className="flex items-center gap-2.5">
                          <Box className={`w-8 h-8 rounded-lg flex items-center justify-center text-[11px] font-bold shrink-0 ${avatarColor(t.learner?.id || "")}`}>
                            {initialsOf(t.learner?.name)}
                          </Box>
                          <Box className="min-w-0">
                            <Text as="p" className="text-sm font-semibold text-slate-700 leading-tight truncate">{t.learner?.name}</Text>
                            <Text as="span" className="text-xs text-slate-400 truncate block">{t.learner?.email}</Text>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge className="border-0 bg-slate-100 text-slate-600 text-[11px] font-semibold">{categoryLabel(t.category)}</Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        {t.training ? (
                          <Box className="min-w-0">
                            <Text as="span" className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-violet-600 bg-violet-50 ring-1 ring-violet-200 px-1.5 py-0.5 rounded-md">
                              <Hash className="h-2.5 w-2.5" />{t.training.code}
                            </Text>
                            <Text as="p" className="text-[11px] text-slate-400 leading-tight mt-1 max-w-[180px] truncate">{t.training.title}</Text>
                          </Box>
                        ) : (
                          <Text as="span" className="text-xs text-slate-300">—</Text>
                        )}
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge className={`border-0 text-[10px] font-semibold ${pr.badge}`}>{pr.label}</Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <Badge className={`border-0 text-[11px] font-semibold ${st.badge}`}>{st.label}</Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <Box className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <Text as="span" className="text-xs text-slate-500">{formatDate(t.created_at)}</Text>
                        </Box>
                      </TableCell>
                      <TableCell className="py-4 pr-5 text-right">
                        <ChevronRight className="h-4 w-4 text-slate-300 inline-block group-hover:text-violet-500 transition-colors" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      <TicketDrawer
        ticketRow={selected}
        open={!!selected}
        onOpenChange={(o) => { if (!o) setSelected(null); }}
        token={token}
        onChanged={handleTicketChanged}
      />
    </Box>
  );
}
