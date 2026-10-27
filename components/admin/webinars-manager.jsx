"use client";

import { useCallback, useEffect, useState } from "react";
import moment from "moment-timezone";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Megaphone, Plus, Pencil, Trash2, Calendar, Clock, User, Link2 } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { ZONE_OPTIONS } from "@/components/shared/timezone-converter";
import { fetchWebinars, createWebinar, updateWebinar, deleteWebinar } from "@/services/api/webinars-api";

const LEAD_HOURS = 6;

// Format a webinar's instants in its own timezone for the admin list.
function label(w) {
  const tz = w.timezone || undefined;
  const start = new Date(w.start_at);
  const end = new Date(w.end_at);
  const date = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short", month: "short", day: "numeric", year: "numeric" }).format(start);
  const time = (d) => new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true }).format(d);
  const zone = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "short" }).formatToParts(start).find((p) => p.type === "timeZoneName")?.value || "";
  return { date, window: `${time(start)}–${time(end)} ${zone}` };
}

// Where a webinar sits relative to the banner's 6h-before-start rule.
function statusOf(w) {
  const start = new Date(w.start_at).getTime();
  const now = Date.now();
  if (!w.is_active) return { text: "Inactive", cls: "bg-surface-muted text-foreground-muted" };
  if (start <= now) return { text: "Past / live", cls: "bg-surface-muted text-foreground-muted" };
  if (start <= now + LEAD_HOURS * 3600 * 1000) return { text: "Starting soon (hidden)", cls: "bg-warning-subtle text-warning-subtle-foreground ring-1 ring-warning-border" };
  return { text: "Upcoming", cls: "bg-success-subtle text-success-subtle-foreground ring-1 ring-success-border" };
}

const EMPTY = { title: "", speaker: "", date: "", startTime: "", endTime: "", timezone: "America/New_York", register_url: "", is_active: true };

function WebinarDialog({ open, onOpenChange, token, editing, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editing) {
      const tz = editing.timezone || "America/New_York";
      const s = moment.tz(editing.start_at, tz);
      const e = moment.tz(editing.end_at, tz);
      setForm({
        title: editing.title || "",
        speaker: editing.speaker || "",
        date: s.format("YYYY-MM-DD"),
        startTime: s.format("HH:mm"),
        endTime: e.format("HH:mm"),
        timezone: tz,
        register_url: editing.register_url || "",
        is_active: editing.is_active ?? true,
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, editing]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    const { title, date, startTime, endTime, timezone, register_url } = form;
    if (!title.trim() || !date || !startTime || !endTime || !timezone || !register_url.trim()) {
      setError("Fill in title, date, start/end time, timezone and the register URL.");
      return;
    }
    const start = moment.tz(`${date} ${startTime}`, "YYYY-MM-DD HH:mm", timezone);
    const end = moment.tz(`${date} ${endTime}`, "YYYY-MM-DD HH:mm", timezone);
    if (!end.isAfter(start)) { setError("End time must be after the start time."); return; }

    setSaving(true); setError(null);
    try {
      const data = {
        title: title.trim(),
        speaker: form.speaker.trim() || null,
        start_at: start.toISOString(),
        end_at: end.toISOString(),
        timezone,
        register_url: register_url.trim(),
        is_active: form.is_active,
      };
      if (editing) await updateWebinar({ token, id: editing.id, data });
      else await createWebinar({ token, data });
      onSaved();
      onOpenChange(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit webinar" : "Add webinar"}</DialogTitle>
          <DialogDescription>The banner shows the soonest active webinar and drops it 6 hours before it starts.</DialogDescription>
        </DialogHeader>

        <Box className="space-y-3.5 py-1">
          <Field label="Title">
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="The New PMP Exam: What Has Changed…" className="h-10" />
          </Field>
          <Field label="Speaker (optional)">
            <Input value={form.speaker} onChange={(e) => set("speaker", e.target.value)} placeholder="Youssef Belaid" className="h-10" />
          </Field>
          <Box className="grid grid-cols-3 gap-3">
            <Field label="Date">
              <Input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className="h-10" />
            </Field>
            <Field label="Start">
              <Input type="time" value={form.startTime} onChange={(e) => set("startTime", e.target.value)} className="h-10" />
            </Field>
            <Field label="End">
              <Input type="time" value={form.endTime} onChange={(e) => set("endTime", e.target.value)} className="h-10" />
            </Field>
          </Box>
          <Field label="Timezone">
            <Combobox
              value={form.timezone}
              onChange={(z) => z && set("timezone", z)}
              options={ZONE_OPTIONS}
              placeholder="Select a timezone"
              searchPlaceholder="Search country or city…"
              emptyText="No timezone found."
            />
          </Field>
          <Field label="Register URL">
            <Input value={form.register_url} onChange={(e) => set("register_url", e.target.value)} placeholder="https://www.invensislearning.com/webinar/…" className="h-10" />
          </Field>
          <label className="flex items-center gap-2 text-sm text-foreground-muted cursor-pointer">
            <input type="checkbox" checked={form.is_active} onChange={(e) => set("is_active", e.target.checked)} className="h-4 w-4 accent-[var(--color-primary)]" />
            Active (eligible to show on the banner)
          </label>
          {error && <Text as="p" className="text-xs text-error">{error}</Text>}
        </Box>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving} className="bg-primary hover:bg-primary-hover text-primary-foreground border-0">
            {saving ? "Saving…" : editing ? "Save changes" : "Add webinar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }) {
  return (
    <Box className="space-y-1.5">
      <Text as="label" className="text-xs font-semibold text-foreground-muted">{label}</Text>
      {children}
    </Box>
  );
}

export function WebinarsManager() {
  const { token } = useAuth();
  const [list, setList] = useState(null);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => {
    if (!token) return;
    fetchWebinars({ token }).then((d) => setList(d.webinars || [])).catch((e) => setError(e.message));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function confirmDelete(w) {
    try { await deleteWebinar({ token, id: w.id }); setDeleting(null); load(); }
    catch (e) { setError(e.message); }
  }

  if (error) {
    return <Card className="p-6 border-error-border bg-error-subtle"><Text as="p" className="text-sm text-error">Failed: {error}</Text></Card>;
  }

  return (
    <Box className="space-y-4">
      <Box className="flex justify-end">
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }} className="h-9 gap-1.5 bg-primary hover:bg-primary-hover text-primary-foreground border-0">
          <Plus className="h-4 w-4" /> Add webinar
        </Button>
      </Box>

      {!list ? (
        <Box className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}</Box>
      ) : list.length === 0 ? (
        <Card className="p-14 text-center rounded-2xl border border-slate-200/80 shadow-sm">
          <Box className="w-14 h-14 rounded-2xl bg-surface-muted flex items-center justify-center mx-auto mb-4"><Megaphone className="h-7 w-7 text-foreground-subtle" /></Box>
          <Text as="p" className="text-sm font-semibold text-foreground-muted">No webinars yet</Text>
          <Text as="p" className="text-xs text-foreground-subtle mt-1">Add one and it'll appear on the learner &amp; sponsor banner automatically.</Text>
        </Card>
      ) : (
        <Box className="space-y-3">
          {list.map((w) => {
            const { date, window } = label(w);
            const st = statusOf(w);
            return (
              <Card key={w.id} className="rounded-2xl border border-slate-200/80 shadow-sm p-4">
                <Box className="flex items-start justify-between gap-3">
                  <Box className="min-w-0">
                    <Box className="flex items-center gap-2 flex-wrap">
                      <Text as="h3" className="text-sm font-bold text-foreground">{w.title}</Text>
                      <Badge className={`border-0 text-[10px] font-semibold ${st.cls}`}>{st.text}</Badge>
                    </Box>
                    <Box className="flex items-center gap-x-4 gap-y-1 flex-wrap mt-2 text-xs text-foreground-muted">
                      <Box className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-foreground-subtle" />{date}</Box>
                      <Box className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-foreground-subtle" />{window}</Box>
                      {w.speaker && <Box className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-foreground-subtle" />{w.speaker}</Box>}
                      <a href={w.register_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline truncate max-w-[280px]">
                        <Link2 className="h-3.5 w-3.5 shrink-0" /><span className="truncate">{w.register_url}</span>
                      </a>
                    </Box>
                  </Box>
                  <Box className="flex items-center gap-1.5 shrink-0">
                    <Button size="sm" variant="outline" onClick={() => { setEditing(w); setDialogOpen(true); }} className="h-8 px-2.5 border-border text-foreground-muted hover:text-primary hover:border-primary-border">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setDeleting(w)} className="h-8 px-2.5 border-border text-foreground-muted hover:text-error hover:border-error-border">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </Box>
                </Box>
              </Card>
            );
          })}
        </Box>
      )}

      <WebinarDialog open={dialogOpen} onOpenChange={setDialogOpen} token={token} editing={editing} onSaved={load} />

      <Dialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Delete webinar?</DialogTitle>
            <DialogDescription>“{deleting?.title}” will be removed. This can't be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button onClick={() => confirmDelete(deleting)} className="bg-error hover:bg-error text-white border-0">
              <Trash2 className="h-4 w-4 mr-1.5" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
