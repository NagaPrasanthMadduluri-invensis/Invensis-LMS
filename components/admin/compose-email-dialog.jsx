"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Send, AlertCircle, CheckCircle2, Users } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";

const ROLE_BADGE = {
  trainer: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",
  learner: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",
  sponsor: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
};

/**
 * Compose + send a free-text email from the portal.
 *
 * Selectable mode: pass `fetchRecipients` (async → [{ id, name, email, role }]);
 * checkboxes render, all selected by default. `onSend({ subject, message,
 * recipientIds })` performs the send.
 *
 * Fixed mode: pass `fixedRecipient` ({ name, email }); no checkboxes, and
 * `onSend({ subject, message })` is called (recipientIds omitted).
 */
export function ComposeEmailDialog({
  open, onOpenChange, title = "Send email", fetchRecipients, fixedRecipient, onSend,
}) {
  const selectable = !fixedRecipient;
  const [recipients, setRecipients] = useState(null); // null = loading
  const [selected, setSelected] = useState(() => new Set());
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null); // { recipients, sent, failed }

  useEffect(() => {
    if (!open) return;
    setSubject(""); setMessage(""); setError(null); setResult(null);
    if (!selectable) { setRecipients([{ id: "fixed", ...fixedRecipient }]); setSelected(new Set()); return; }
    setRecipients(null);
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchRecipients();
        if (cancelled) return;
        setRecipients(list);
        setSelected(new Set(list.map((r) => r.id))); // default: all
      } catch (e) {
        if (!cancelled) { setRecipients([]); setError(e.message); }
      }
    })();
    return () => { cancelled = true; };
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const allChecked = selectable && recipients?.length > 0 && selected.size === recipients.length;
  const toggle = (id) => setSelected((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });
  const toggleAll = () => setSelected((prev) =>
    prev.size === recipients.length ? new Set() : new Set(recipients.map((r) => r.id)));

  const canSend = useMemo(() => {
    if (!subject.trim() || !message.trim() || submitting) return false;
    if (selectable) return selected.size > 0;
    return true;
  }, [subject, message, submitting, selectable, selected]);

  async function submit() {
    setSubmitting(true); setError(null);
    try {
      const payload = { subject: subject.trim(), message: message.trim() };
      if (selectable) payload.recipientIds = [...selected];
      const res = await onSend(payload);
      setResult(res ?? { sent: selectable ? selected.size : 1, failed: [] });
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const recipientCount = selectable ? selected.size : 1;

  return (
    <Dialog open={open} onOpenChange={(v) => !submitting && onOpenChange(v)}>
      <DialogContent className="sm:max-w-[600px] overflow-hidden" style={{ padding: 0, gap: 0 }}>
        {/* Header */}
        <Box className="bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-5">
          <Box className="flex items-center gap-3">
            <Box className="w-11 h-11 rounded-xl bg-white/15 ring-1 ring-white/25 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-white" />
            </Box>
            <Box className="min-w-0">
              <DialogTitle className="text-[15px] font-bold text-white truncate">{title}</DialogTitle>
              <DialogDescription className="text-[13px] text-violet-100 mt-0.5 truncate">
                Sent from operations@invensislearning.com
              </DialogDescription>
            </Box>
          </Box>
        </Box>

        <Box className="px-7 py-6 max-h-[70vh] overflow-y-auto bg-slate-50/60 space-y-5">
          {result ? (
            <Box className="flex flex-col items-center justify-center py-6 text-center">
              <Box className="w-12 h-12 rounded-2xl bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-emerald-600" />
              </Box>
              <Text as="h3" className="mt-3 text-base font-bold text-slate-800">
                Sent to {result.sent} recipient{result.sent === 1 ? "" : "s"}
              </Text>
              {result.failed?.length > 0 && (
                <Text as="p" className="mt-1 text-sm text-amber-600">
                  {result.failed.length} could not be delivered.
                </Text>
              )}
            </Box>
          ) : (
            <>
              {/* Recipients */}
              {selectable && (
                <Box className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                  <Box className="flex items-center justify-between px-4 py-2.5 bg-slate-50/80 border-b border-slate-200">
                    <Box className="flex items-center gap-2">
                      <Users className="h-3.5 w-3.5 text-slate-400" />
                      <Text as="p" className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                        Recipients ({selected.size})
                      </Text>
                    </Box>
                    {recipients?.length > 0 && (
                      <button type="button" onClick={toggleAll}
                        className="text-[11px] font-semibold text-violet-600 hover:text-violet-700">
                        {allChecked ? "Clear all" : "Select all"}
                      </button>
                    )}
                  </Box>
                  <Box className="max-h-[240px] overflow-y-auto p-2 space-y-1">
                    {recipients === null ? (
                      Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-11 rounded-lg" />)
                    ) : recipients.length === 0 ? (
                      <Text as="p" className="px-2 py-3 text-sm text-slate-500">No recipients available.</Text>
                    ) : (
                      recipients.map((r) => (
                        <label key={r.id}
                          className="flex items-center gap-3 px-2.5 py-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                          <Checkbox checked={selected.has(r.id)} onCheckedChange={() => toggle(r.id)} />
                          <Box className="min-w-0 flex-1">
                            <Text as="p" className="text-sm font-medium text-slate-800 truncate">{r.name || r.email}</Text>
                            <Text as="span" className="text-[11px] text-slate-400 truncate">{r.email}</Text>
                          </Box>
                          <Badge className={`border-0 text-[10px] font-semibold capitalize ${ROLE_BADGE[r.role] || "bg-slate-100 text-slate-600"}`}>
                            {r.role}
                          </Badge>
                        </label>
                      ))
                    )}
                  </Box>
                </Box>
              )}
              {!selectable && (
                <Box className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <Box className="min-w-0 flex-1">
                    <Text as="p" className="text-[11px] font-bold uppercase tracking-widest text-slate-500">To</Text>
                    <Text as="p" className="text-sm font-medium text-slate-800 truncate mt-0.5">
                      {fixedRecipient.name || fixedRecipient.email}
                    </Text>
                    <Text as="span" className="text-[11px] text-slate-400">{fixedRecipient.email}</Text>
                  </Box>
                </Box>
              )}

              {/* Subject + message */}
              <Box className="space-y-1.5">
                <Text as="p" className="text-xs font-semibold text-slate-600">Subject</Text>
                <Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={200}
                  placeholder="Subject line" className="h-11 text-sm" />
              </Box>
              <Box className="space-y-1.5">
                <Text as="p" className="text-xs font-semibold text-slate-600">Message</Text>
                <Textarea value={message} onChange={(e) => setMessage(e.target.value)} maxLength={5000} rows={8}
                  placeholder="Write your message…" className="text-sm resize-none" />
              </Box>

              {error && (
                <Box className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
                  <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  <Text as="p" className="text-xs text-red-700 font-medium">{error}</Text>
                </Box>
              )}
            </>
          )}
        </Box>

        <DialogFooter className="px-7 pt-4 pb-6 border-t border-slate-100 bg-white">
          {result ? (
            <Button onClick={() => onOpenChange(false)} className="bg-violet-600 hover:bg-violet-700 text-white border-0 px-6">Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}
                className="border-slate-200 text-slate-600 hover:bg-slate-100">Cancel</Button>
              <Button onClick={submit} disabled={!canSend}
                className="bg-violet-600 hover:bg-violet-700 text-white border-0 shadow-sm px-6 gap-1.5">
                <Send className="h-4 w-4" />
                {submitting ? "Sending…" : `Send${selectable ? ` (${recipientCount})` : ""}`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
