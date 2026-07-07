"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Hash, Calendar, Clock, Globe, Hourglass, Users, UserCheck, UserX, UserPlus,
  Mail, Phone, Briefcase, Video, MoreHorizontal, Pencil, ArrowLeftRight, XCircle,
  ExternalLink, Plus, BookText, AlertCircle, User, Link2, MessageSquare, CheckSquare2, ChevronDown,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchAdminTrainingDetail, fetchAdminTrainings, fetchTrainers, assignTrainer,
  addParticipant, updateMeeting, updateParticipant, cancelEnrolment, transferEnrolment,
} from "@/services/api/admin/admin-api";
import { TrainerFormDialog } from "@/components/admin/trainer-form-dialog";

const STATUS_CONFIG = {
  pending:   { label: "Pending",   dark: "bg-amber-400/90 text-amber-950",    light: "bg-amber-50 text-amber-700 ring-1 ring-amber-200/80" },
  active:    { label: "Active",    dark: "bg-emerald-400/90 text-emerald-950", light: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80" },
  ongoing:   { label: "Ongoing",   dark: "bg-blue-400/90 text-blue-950",      light: "bg-blue-50 text-blue-700 ring-1 ring-blue-200/80" },
  completed: { label: "Completed", dark: "bg-white/20 text-white/90",          light: "bg-slate-100 text-slate-600" },
  cancelled: { label: "Cancelled", dark: "bg-red-400/90 text-red-950",         light: "bg-red-50 text-red-600 ring-1 ring-red-200/80" },
};

const MODE_LABEL = { virtual: "Live Virtual", in_person: "In Person", hybrid: "Hybrid", one_to_one: "1-to-1 Coaching" };
const PLATFORM_LABEL = { zoom: "Zoom", teams: "Microsoft Teams", other: "Other" };

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}
function formatTime(t) {
  if (!t) return "—";
  const [h, m] = t.split(":");
  const date = new Date();
  date.setHours(Number(h), Number(m), 0, 0);
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}
function formatSessionDateTime(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true });
}

/* ── Shared form helpers ── */
function FInput({ icon: Icon, accentColor = "indigo", textarea, rows, ...props }) {
  const focusRing = accentColor === "red"
    ? "focus-within:border-red-400 focus-within:shadow-[0_0_0_3px_rgba(252,165,165,0.35)]"
    : accentColor === "blue"
    ? "focus-within:border-blue-400 focus-within:shadow-[0_0_0_3px_rgba(147,197,253,0.35)]"
    : "focus-within:border-indigo-400 focus-within:shadow-[0_0_0_3px_rgba(165,180,252,0.35)]";

  if (textarea) {
    return (
      <Box className={`rounded-xl border border-slate-200 bg-white shadow-sm hover:border-slate-300 ${focusRing} transition-all duration-150`}>
        <textarea rows={rows || 3} {...props}
          className="w-full bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400 resize-none px-3.5 py-3" />
      </Box>
    );
  }
  return (
    <Box className={`group flex items-center gap-3 h-12 rounded-xl border border-slate-200 bg-white px-3.5 shadow-sm hover:border-slate-300 ${focusRing} transition-all duration-150`}>
      {Icon && <Icon className="h-4 w-4 text-slate-400 shrink-0 group-focus-within:text-indigo-500 transition-colors" />}
      <input {...props}
        className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed" />
    </Box>
  );
}

function Section({ label, children }) {
  return (
    <Box className="rounded-xl border border-slate-200 overflow-hidden">
      <Box className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-200">
        <Box className="w-1 h-4 rounded-full bg-indigo-500" />
        <Text as="p" className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{label}</Text>
      </Box>
      <Box className="p-5 bg-white space-y-4">{children}</Box>
    </Box>
  );
}

function Field({ label, required, children }) {
  return (
    <Box className="space-y-1.5">
      <Text as="p" className="text-xs font-semibold text-slate-600">
        {label}{required && <Text as="span" className="text-red-500 ml-0.5">*</Text>}
      </Text>
      {children}
    </Box>
  );
}

function FormError({ error, fieldErrors }) {
  if (!error && !fieldErrors) return null;
  return (
    <Box className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
      <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
      <Box>
        {error && <Text as="p" className="text-xs text-red-700 font-medium">{error}</Text>}
        {fieldErrors && Object.entries(fieldErrors).map(([k, msgs]) => (
          <Text as="p" key={k} className="text-xs text-red-600 mt-0.5">
            {k}: {Array.isArray(msgs) ? msgs.join(", ") : String(msgs)}
          </Text>
        ))}
      </Box>
    </Box>
  );
}

function FSelect({ value, onChange, disabled, placeholder, children }) {
  return (
    <Box className="relative rounded-xl border border-slate-200 bg-white shadow-sm hover:border-slate-300 focus-within:border-indigo-400 focus-within:shadow-[0_0_0_3px_rgba(165,180,252,0.35)] transition-all duration-150">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full h-12 bg-transparent border-none outline-none text-sm text-slate-800 px-3.5 pr-9 appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {children}
      </select>
      <Box className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2">
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </Box>
    </Box>
  );
}

/* ── Fact display block ── */
function Fact({ icon: Icon, label, value }) {
  return (
    <Box className="flex items-start gap-3">
      <Box className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100">
        <Icon className="h-4 w-4 text-slate-500" />
      </Box>
      <Box className="min-w-0">
        <Text as="p" className="text-[11px] uppercase tracking-wide text-slate-400 font-medium">{label}</Text>
        <Text as="p" className="text-sm font-semibold text-slate-800 leading-tight mt-0.5">{value}</Text>
      </Box>
    </Box>
  );
}

/* ── Day-wise topics timeline ── */
function SessionTopicsCard({ sessions }) {
  const list = Array.isArray(sessions) ? sessions : [];
  const anyTopics = list.some((s) => s.planned_topics?.trim());

  return (
    <Card className="p-0 overflow-hidden border border-slate-200/80 shadow-sm rounded-xl bg-white">
      <Box className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
        <BookText className="h-4 w-4 text-slate-400" />
        <Text as="h3" className="text-sm font-semibold text-slate-700">Day-wise Topics</Text>
        {list.length > 0 && (
          <Badge className="border-0 bg-slate-100 text-slate-600 text-[11px] ml-1">
            {list.length} day{list.length !== 1 ? "s" : ""}
          </Badge>
        )}
      </Box>

      <Box className="p-5">
        {list.length === 0 ? (
          <Box className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
            <Text as="p" className="text-sm text-slate-400">Topics are set by the assigned trainer and aren&apos;t available on this view.</Text>
          </Box>
        ) : !anyTopics ? (
          <Box className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
            <Text as="p" className="text-sm text-slate-400">The trainer hasn&apos;t published any topics yet.</Text>
          </Box>
        ) : (
          <Box className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {list.map((s) => {
              const when = formatSessionDateTime(s.start_time);
              const hasTopics = !!s.planned_topics?.trim();
              return (
                <Box key={s.day_number} className="rounded-xl border border-slate-200/70 bg-slate-50/60 p-4">
                  <Box className="flex items-center gap-2.5">
                    <Box className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-50">
                      <Calendar className="h-4 w-4 text-indigo-600" />
                    </Box>
                    <Box className="min-w-0">
                      <Text as="p" className="text-sm font-semibold leading-tight text-slate-800">Day {s.day_number}</Text>
                      {when && <Text as="span" className="text-[11px] text-slate-400">{when}</Text>}
                    </Box>
                  </Box>
                  {hasTopics ? (
                    <Text as="p" className="mt-3 text-sm whitespace-pre-wrap text-slate-600">
                      {s.planned_topics}
                    </Text>
                  ) : (
                    <Box className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-slate-200 px-2.5 py-2">
                      <AlertCircle className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                      <Text as="p" className="text-xs text-slate-400">Topics not added yet</Text>
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        )}
      </Box>
    </Card>
  );
}

/* ── Assign trainer dialog ── */
function AssignTrainerDialog({ open, onOpenChange, token, trainingRef, currentTrainerId, onAssigned }) {
  const [trainers, setTrainers] = useState(null);
  const [selected, setSelected] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const loadTrainers = useCallback(() => {
    if (!token) return;
    setError(null);
    fetchTrainers({ token }).then((d) => setTrainers(d.trainers || [])).catch((e) => setError(e.message));
  }, [token]);

  useEffect(() => { if (!open) return; loadTrainers(); }, [open, loadTrainers]);

  async function submit() {
    if (!selected) { setError("Please select a trainer."); return; }
    setSubmitting(true); setError(null);
    try {
      await assignTrainer({ token, trainingRef, trainerId: selected });
      onAssigned(); onOpenChange(false); setSelected("");
    } catch (e) { setError(e.message); } finally { setSubmitting(false); }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] overflow-hidden" style={{padding:0,gap:0}}>
          <Box className="bg-gradient-to-r from-indigo-50 via-purple-50 to-violet-50 border-b border-indigo-100 px-6 py-5">
            <Box className="flex items-center gap-3">
              <Box className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4 text-white" />
              </Box>
              <Box>
                <DialogTitle className="text-base font-semibold text-slate-800">Assign Trainer</DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-0.5">Select an active trainer for this training.</DialogDescription>
              </Box>
            </Box>
          </Box>
          <Box className="px-6 py-5 space-y-4">
            <Section label="Select Trainer">
              <Field label="Trainer" required>
                <FSelect
                  value={selected}
                  onChange={(e) => setSelected(e.target.value)}
                  placeholder={trainers ? "Choose a trainer" : "Loading trainers..."}
                >
                  {(trainers || []).map((t) => (
                    <option key={t.id} value={t.id} disabled={t.id === currentTrainerId}>
                      {t.name}{t.id === currentTrainerId ? " (current)" : ""}{t.experience ? ` · ${t.experience}` : ""}
                    </option>
                  ))}
                </FSelect>
              </Field>
              <Button variant="ghost" size="sm"
                className="h-9 px-3 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-xl border border-indigo-100 w-full justify-center text-xs font-semibold"
                onClick={() => setCreateOpen(true)}>
                <Plus className="h-3.5 w-3.5 mr-1.5" /> Onboard a new trainer
              </Button>
            </Section>
            <FormError error={error} />
          </Box>
          <DialogFooter className="px-6 pt-4 pb-6 border-t border-slate-100 bg-slate-50/50">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="border-slate-200 text-slate-600 hover:bg-slate-100">Cancel</Button>
            <Button onClick={submit} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-sm">
              {submitting ? "Assigning..." : "Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <TrainerFormDialog open={createOpen} onOpenChange={setCreateOpen} token={token} mode="create" onSaved={loadTrainers} />
    </>
  );
}

/* ── Add participant dialog ── */
function AddParticipantDialog({ open, onOpenChange, token, trainingRef, onAdded }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", job_title: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit() {
    if (!form.name.trim() || !form.email.trim()) { setError("Name and email are required."); return; }
    setSubmitting(true); setError(null);
    try {
      const data = { name: form.name.trim(), email: form.email.trim() };
      if (form.phone.trim()) data.phone = form.phone.trim();
      if (form.job_title.trim()) data.job_title = form.job_title.trim();
      await addParticipant({ token, trainingRef, data });
      onAdded(); onOpenChange(false); setForm({ name: "", email: "", phone: "", job_title: "" });
    } catch (e) { setError(e.message); } finally { setSubmitting(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] overflow-hidden" style={{padding:0,gap:0}}>
        <Box className="bg-gradient-to-r from-indigo-50 via-purple-50 to-violet-50 border-b border-indigo-100 px-6 py-5">
          <Box className="flex items-center gap-3">
            <Box className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <UserPlus className="w-4 h-4 text-white" />
            </Box>
            <Box>
              <DialogTitle className="text-base font-semibold text-slate-800">Add Participant</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">Manually enrol a participant in this training.</DialogDescription>
            </Box>
          </Box>
        </Box>
        <Box className="px-6 py-6 space-y-5 max-h-[65vh] overflow-y-auto">
          <Section label="Participant Info">
            <Field label="Full name" required>
              <FInput icon={User} value={form.name} onChange={set("name")} placeholder="Jane Doe" />
            </Field>
            <Field label="Email" required>
              <FInput icon={Mail} type="email" value={form.email} onChange={set("email")} placeholder="jane@example.com" />
            </Field>
            <Box className="grid grid-cols-2 gap-3">
              <Field label="Phone">
                <FInput icon={Phone} value={form.phone} onChange={set("phone")} placeholder="+91 …" />
              </Field>
              <Field label="Job title">
                <FInput icon={Briefcase} value={form.job_title} onChange={set("job_title")} placeholder="Project Manager" />
              </Field>
            </Box>
          </Section>
          <FormError error={error} />
        </Box>
        <DialogFooter className="px-6 pt-4 pb-6 border-t border-slate-100 bg-slate-50/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="border-slate-200 text-slate-600 hover:bg-slate-100">Cancel</Button>
          <Button onClick={submit} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-sm">
            {submitting ? "Adding..." : "Add Participant"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Edit participant dialog ── */
function EditParticipantDialog({ participant, onOpenChange, token, onSaved }) {
  const open = !!participant;
  const [form, setForm] = useState({ name: "", phone: "", job_title: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!participant) return;
    setError(null);
    setForm({ name: participant.name || "", phone: participant.phone || "", job_title: participant.job_title || "" });
  }, [participant]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit() {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSubmitting(true); setError(null);
    try {
      await updateParticipant({ token, participantId: participant.participant_id, data: { name: form.name.trim(), phone: form.phone.trim(), job_title: form.job_title.trim() } });
      onSaved(); onOpenChange(false);
    } catch (e) { setError(e.message); } finally { setSubmitting(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent className="sm:max-w-[620px] overflow-hidden" style={{padding:0,gap:0}}>
        <Box className="bg-gradient-to-r from-indigo-50 via-purple-50 to-violet-50 border-b border-indigo-100 px-6 py-5">
          <Box className="flex items-center gap-3">
            <Box className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <Pencil className="w-4 h-4 text-white" />
            </Box>
            <Box>
              <DialogTitle className="text-base font-semibold text-slate-800">Edit Participant</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">Email is the login identity and cannot be changed here.</DialogDescription>
            </Box>
          </Box>
        </Box>
        <Box className="px-6 py-5 space-y-4">
          <Section label="Update Details">
            <Field label="Full name" required>
              <FInput icon={User} value={form.name} onChange={set("name")} />
            </Field>
            <Box className="grid grid-cols-2 gap-3">
              <Field label="Phone">
                <FInput icon={Phone} value={form.phone} onChange={set("phone")} placeholder="+91 …" />
              </Field>
              <Field label="Job title">
                <FInput icon={Briefcase} value={form.job_title} onChange={set("job_title")} placeholder="Project Manager" />
              </Field>
            </Box>
          </Section>
          <FormError error={error} />
        </Box>
        <DialogFooter className="px-6 pt-4 pb-6 border-t border-slate-100 bg-slate-50/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="border-slate-200 text-slate-600 hover:bg-slate-100">Cancel</Button>
          <Button onClick={submit} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-sm">
            {submitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Cancel enrolment dialog ── */
function CancelEnrolmentDialog({ participant, onOpenChange, token, onDone }) {
  const open = !!participant;
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { if (participant) { setReason(""); setError(null); } }, [participant]);

  async function submit() {
    if (!reason.trim()) { setError("A reason is required."); return; }
    setSubmitting(true); setError(null);
    try {
      await cancelEnrolment({ token, enrolmentId: participant.enrolment_id, reason: reason.trim() });
      onDone(); onOpenChange(false);
    } catch (e) { setError(e.message); } finally { setSubmitting(false); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent className="sm:max-w-[600px] overflow-hidden" style={{padding:0,gap:0}}>
        <Box className="bg-gradient-to-r from-red-50 via-rose-50 to-pink-50 border-b border-red-100 px-6 py-5">
          <Box className="flex items-center gap-3">
            <Box className="w-9 h-9 rounded-xl bg-red-500 flex items-center justify-center shrink-0">
              <XCircle className="w-4 h-4 text-white" />
            </Box>
            <Box>
              <DialogTitle className="text-base font-semibold text-slate-800">Cancel Enrolment</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                This frees the seat for {participant?.name}. The reason is recorded for audit.
              </DialogDescription>
            </Box>
          </Box>
        </Box>
        <Box className="px-6 py-5 space-y-4">
          {participant && (
            <Box className="flex items-center gap-3 rounded-xl bg-red-50 border border-red-100 px-4 py-3">
              <Box className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-red-500" />
              </Box>
              <Box>
                <Text as="p" className="text-sm font-semibold text-slate-800">{participant.name}</Text>
                <Text as="p" className="text-xs text-slate-500">{participant.email}</Text>
              </Box>
            </Box>
          )}
          <Field label="Reason" required>
            <FInput textarea accentColor="red" value={reason}
              onChange={(e) => setReason(e.target.value)} rows={3}
              placeholder="e.g. duplicate registration" />
          </Field>
          <FormError error={error} />
        </Box>
        <DialogFooter className="px-6 pt-4 pb-6 border-t border-slate-100 bg-slate-50/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="border-slate-200 text-slate-600 hover:bg-slate-100">Back</Button>
          <Button variant="destructive" onClick={submit} disabled={submitting} className="shadow-sm">
            {submitting ? "Cancelling..." : "Cancel Enrolment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Transfer dialog ── */
function TransferDialog({ participant, onOpenChange, token, currentTrainingId, onDone }) {
  const open = !!participant;
  const [trainings, setTrainings] = useState(null);
  const [target, setTarget] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !token) return;
    setTarget(""); setReason(""); setError(null);
    fetchAdminTrainings({ token }).then((d) => setTrainings(d.trainings || [])).catch((e) => setError(e.message));
  }, [open, token]);

  async function submit() {
    if (!target) { setError("Select a target training."); return; }
    if (!reason.trim()) { setError("A reason is required."); return; }
    setSubmitting(true); setError(null);
    try {
      await transferEnrolment({ token, enrolmentId: participant.enrolment_id, trainingId: target, reason: reason.trim() });
      onDone(); onOpenChange(false);
    } catch (e) { setError(e.message); } finally { setSubmitting(false); }
  }

  const options = (trainings || []).filter((t) => t.id !== currentTrainingId);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent className="sm:max-w-[620px] overflow-hidden" style={{padding:0,gap:0}}>
        <Box className="bg-gradient-to-r from-violet-50 via-purple-50 to-indigo-50 border-b border-violet-100 px-6 py-5">
          <Box className="flex items-center gap-3">
            <Box className="w-9 h-9 rounded-xl bg-violet-600 flex items-center justify-center shrink-0">
              <ArrowLeftRight className="w-4 h-4 text-white" />
            </Box>
            <Box>
              <DialogTitle className="text-base font-semibold text-slate-800">Transfer Participant</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                Move {participant?.name} to another training. Their sponsor/order link is preserved.
              </DialogDescription>
            </Box>
          </Box>
        </Box>
        <Box className="px-6 py-5 space-y-4">
          <Section label="Transfer Details">
            <Field label="Target training" required>
              <Select value={target} onValueChange={setTarget}>
                <SelectTrigger style={{height:"44px",borderRadius:"12px",backgroundColor:"white",borderColor:"rgb(226,232,240)",boxShadow:"0 1px 2px 0 rgba(0,0,0,0.05)"}}>
                  <SelectValue placeholder={trainings ? "Choose a training" : "Loading…"} />
                </SelectTrigger>
                <SelectContent>
                  {options.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.code} · {t.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Reason" required>
              <FInput textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2}
                placeholder="e.g. learner requested a different batch" />
            </Field>
          </Section>
          <FormError error={error} />
        </Box>
        <DialogFooter className="px-6 pt-4 pb-6 border-t border-slate-100 bg-slate-50/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="border-slate-200 text-slate-600 hover:bg-slate-100">Cancel</Button>
          <Button onClick={submit} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-sm">
            {submitting ? "Transferring..." : "Transfer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Meeting link dialog ── */
function MeetingDialog({ open, onOpenChange, token, trainingRef, meeting, canRelease, onSaved }) {
  const [url, setUrl] = useState("");
  const [platform, setPlatform] = useState("zoom");
  const [released, setReleased] = useState(false);
  const [override, setOverride] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setUrl(meeting?.url || ""); setPlatform(meeting?.platform || "zoom");
    setReleased(!!meeting?.released); setOverride(false); setError(null);
  }, [open, meeting]);

  async function submit() {
    if (!url.trim()) { setError("Meeting URL is required."); return; }
    setSubmitting(true); setError(null);
    try {
      const data = { meeting_url: url.trim(), meeting_platform: platform, meeting_released: released };
      if (released && override) data.min_seats_override = true;
      const res = await updateMeeting({ token, trainingRef, data });
      onSaved(res.training); onOpenChange(false);
    } catch (e) {
      setError(e.message);
      if (e.status === 422) setOverride((o) => o);
    } finally { setSubmitting(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[620px] overflow-hidden" style={{padding:0,gap:0}}>
        <Box className="bg-gradient-to-r from-blue-50 via-indigo-50 to-violet-50 border-b border-blue-100 px-6 py-5">
          <Box className="flex items-center gap-3">
            <Box className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <Video className="w-4 h-4 text-white" />
            </Box>
            <Box>
              <DialogTitle className="text-base font-semibold text-slate-800">Meeting Link</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">Set the virtual meeting link and release it to enrolled participants.</DialogDescription>
            </Box>
          </Box>
        </Box>
        <Box className="px-6 py-6 space-y-5 max-h-[65vh] overflow-y-auto">
          <Section label="Link Details">
            <Field label="Meeting URL" required>
              <FInput icon={Link2} accentColor="blue" value={url}
                onChange={(e) => setUrl(e.target.value)} placeholder="https://zoom.us/j/123456789" />
            </Field>
            <Field label="Platform">
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger style={{height:"44px",borderRadius:"12px",backgroundColor:"white",borderColor:"rgb(226,232,240)",boxShadow:"0 1px 2px 0 rgba(0,0,0,0.05)"}}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="teams">Microsoft Teams</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </Section>
          <Box className="flex items-center justify-between rounded-xl border border-slate-200 bg-white shadow-sm px-4 py-3.5">
            <Box>
              <Text as="p" className="text-sm font-semibold text-slate-800">Release to participants</Text>
              <Text as="p" className="text-xs text-slate-500 mt-0.5">
                {canRelease ? "Min-seats requirement met." : "Below min-seats — override needed to release."}
              </Text>
            </Box>
            <Switch checked={released} onCheckedChange={setReleased} />
          </Box>
          {released && !canRelease && (
            <Box className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5">
              <Text as="p" className="text-xs font-semibold text-amber-800">Override the min-seats rule</Text>
              <Switch checked={override} onCheckedChange={setOverride} />
            </Box>
          )}
          <FormError error={error} />
        </Box>
        <DialogFooter className="px-6 pt-4 pb-6 border-t border-slate-100 bg-slate-50/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="border-slate-200 text-slate-600 hover:bg-slate-100">Cancel</Button>
          <Button onClick={submit} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-sm">
            {submitting ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════════════════ Main component ══ */
export function TrainingManagement({ trainingId }) {
  const { token } = useAuth();
  const [detail, setDetail] = useState(null);
  const [meeting, setMeeting] = useState(null);
  const [error, setError] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);
  const [editParticipant, setEditParticipant] = useState(null);
  const [cancelParticipant, setCancelParticipant] = useState(null);
  const [transferParticipant, setTransferParticipant] = useState(null);

  const load = useCallback(() => {
    if (!token) return;
    fetchAdminTrainingDetail({ token, trainingRef: trainingId })
      .then((d) => {
        setDetail(d);
        if (d.meeting_url != null || d.meeting_released != null) {
          setMeeting({ url: d.meeting_url ?? null, platform: d.meeting_platform ?? null, released: !!d.meeting_released });
        }
      })
      .catch((e) => setError(e.message));
  }, [token, trainingId]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <Card className="p-6 border border-red-200/60 bg-red-50 rounded-xl">
        <Text as="p" className="text-red-600 text-sm">Failed to load training: {error}</Text>
      </Card>
    );
  }

  if (!detail) {
    return (
      <Box className="space-y-4">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </Box>
    );
  }

  const statusCfg = STATUS_CONFIG[detail.status] || STATUS_CONFIG.active;
  const isVirtual = detail.delivery_mode !== "in_person";
  const canRelease = detail.enrolled_count >= (detail.min_seats ?? 1);

  function onMeetingSaved(training) {
    setMeeting({ url: training?.meeting_url ?? null, platform: training?.meeting_platform ?? null, released: !!training?.meeting_released });
    load();
  }

  return (
    <Box className="space-y-5">
      {/* ── Training info ── */}
      <Card className="p-0 overflow-hidden border border-slate-200/80 shadow-sm rounded-xl bg-white">
        <Box className="bg-gradient-to-r from-indigo-50 via-purple-50 to-violet-50 border-b border-indigo-100 px-6 py-5">
          <Box className="flex flex-wrap items-center justify-between gap-3 mb-2">
            <Box className="flex items-center gap-2 flex-wrap">
              <Hash className="h-4 w-4 text-indigo-400" />
              <Text as="span" className="text-sm font-mono font-semibold tracking-wide text-indigo-700">{detail.training_id}</Text>
              <Badge className={`border-0 text-[10px] font-semibold ${statusCfg.light}`}>{statusCfg.label}</Badge>
            </Box>
            <Badge className="border-0 bg-indigo-100 text-indigo-700 text-[11px] font-medium">
              {MODE_LABEL[detail.delivery_mode] || detail.delivery_mode}
            </Badge>
          </Box>
          <Text as="h2" className="text-xl font-bold text-slate-900 leading-tight">{detail.title}</Text>
        </Box>
        <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          <Fact icon={Calendar} label="Dates" value={`${formatDate(detail.start_date)} – ${formatDate(detail.end_date)}`} />
          <Fact icon={Clock} label="Daily Timing" value={`${formatTime(detail.start_time)} – ${formatTime(detail.end_time)}`} />
          <Fact icon={Globe} label="Timezone" value={detail.timezone || "—"} />
          <Fact icon={Hourglass} label="Duration" value={detail.duration_hours != null ? `${detail.duration_hours} hours` : "—"} />
          <Fact icon={Users} label="Capacity" value={`${detail.enrolled_count} / ${detail.capacity ?? "—"} enrolled`} />
        </Box>
      </Card>

      {/* ── Trainer + Meeting link (side by side) ── */}
      <Box className={`grid grid-cols-1 gap-5 ${isVirtual ? "md:grid-cols-2" : ""}`}>

        {/* Trainer */}
        <Card className="p-0 overflow-hidden border border-slate-200/80 shadow-sm rounded-xl bg-white flex flex-col">
          <Box className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <Box className="flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-slate-400" />
              <Text as="h3" className="text-sm font-semibold text-slate-700">Trainer</Text>
            </Box>
            <Button size="sm" variant={detail.trainer ? "outline" : "default"}
              className={detail.trainer ? "h-8 px-3 border-slate-200 text-slate-700 hover:bg-slate-50" : "h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white border-0"}
              onClick={() => setAssignOpen(true)}>
              {detail.trainer ? "Reassign" : "Assign Trainer"}
            </Button>
          </Box>
          <Box className="p-5 flex-1 flex flex-col justify-center">
            {detail.trainer ? (
              <Box className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200/60 px-4 py-4">
                <Box className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Text as="span" className="text-[13px] font-bold text-white leading-none">
                    {detail.trainer.name.trim().split(/\s+/).slice(0,2).map(p=>p[0].toUpperCase()).join("")}
                  </Text>
                </Box>
                <Box className="min-w-0">
                  <Text as="p" className="text-sm font-bold text-slate-800">{detail.trainer.name}</Text>
                  <Text as="p" className="text-xs text-slate-500 truncate">
                    {detail.trainer.email}{detail.trainer.experience ? ` · ${detail.trainer.experience}` : ""}
                  </Text>
                </Box>
                <UserCheck className="h-4 w-4 text-emerald-500 shrink-0 ml-auto" />
              </Box>
            ) : (
              <Box className="flex items-center gap-3 rounded-xl bg-amber-50 border border-amber-200/60 px-4 py-4">
                <Box className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center shrink-0">
                  <UserX className="h-5 w-5 text-amber-700" />
                </Box>
                <Box>
                  <Text as="p" className="text-sm font-bold text-amber-800">No Trainer Assigned</Text>
                  <Text as="p" className="text-xs text-amber-600 mt-0.5">Assign one to run this training.</Text>
                </Box>
              </Box>
            )}
          </Box>
        </Card>

        {/* Meeting link (virtual only) */}
        {isVirtual && (
          <Card className="p-0 overflow-hidden border border-slate-200/80 shadow-sm rounded-xl bg-white flex flex-col">
            <Box className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <Box className="flex items-center gap-2">
                <Video className="h-4 w-4 text-slate-400" />
                <Text as="h3" className="text-sm font-semibold text-slate-700">Meeting Link</Text>
              </Box>
              <Button size="sm"
                className={meeting?.url ? "h-8 px-3 border-slate-200 text-slate-700 hover:bg-slate-50 border" : "h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white border-0"}
                variant={meeting?.url ? "outline" : "default"}
                onClick={() => setMeetingOpen(true)}>
                {meeting?.url ? "Manage" : "Set Link"}
              </Button>
            </Box>
            <Box className="p-5 flex-1 flex flex-col justify-center">
              {meeting?.url ? (
                <Box className="rounded-xl bg-indigo-50 border border-indigo-200/60 px-4 py-4 space-y-3">
                  <Box className="flex items-center gap-2 flex-wrap">
                    <Badge className={`border-0 text-[10px] font-semibold ${meeting.released ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200" : "bg-amber-100 text-amber-700 ring-1 ring-amber-200"}`}>
                      {meeting.released ? "● Released" : "● Not released"}
                    </Badge>
                    {meeting.platform && (
                      <Badge className="border-0 bg-indigo-100 text-indigo-700 text-[10px]">{PLATFORM_LABEL[meeting.platform] || meeting.platform}</Badge>
                    )}
                  </Box>
                  <a href={meeting.url} target="_blank" rel="noopener noreferrer"
                    className="text-xs text-indigo-600 hover:underline inline-flex items-center gap-1.5 break-all">
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                    {meeting.url}
                  </a>
                </Box>
              ) : (
                <Box className="flex items-center gap-3 rounded-xl bg-slate-50 border border-dashed border-slate-300 px-4 py-4">
                  <Box className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <Video className="h-5 w-5 text-slate-400" />
                  </Box>
                  <Box>
                    <Text as="p" className="text-sm font-bold text-slate-500">No meeting link set</Text>
                    {!canRelease && (
                      <Text as="p" className="text-xs text-slate-400 mt-0.5">
                        Requires {detail.min_seats ?? 1} enrolment(s) to release.
                      </Text>
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          </Card>
        )}

      </Box>

      {/* ── Participants ── */}
      <Card className="p-0 overflow-hidden border border-slate-200/80 shadow-sm rounded-xl bg-white">
        <Box className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <Box className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-400" />
            <Text as="h3" className="text-sm font-semibold text-slate-700">Participants</Text>
            <Badge className="border-0 bg-slate-100 text-slate-600 text-[11px]">{detail.participants.length}</Badge>
          </Box>
          <Button size="sm" onClick={() => setAddOpen(true)} className="h-8 px-3 bg-indigo-600 hover:bg-indigo-700 text-white border-0">
            <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Add Participant
          </Button>
        </Box>

        {detail.participants.length === 0 ? (
          <Box className="py-14 text-center">
            <Box className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Users className="h-5 w-5 text-slate-400" />
            </Box>
            <Text as="p" className="text-sm text-slate-400">No participants enrolled yet.</Text>
          </Box>
        ) : (
          <Box className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-200/60">
                  <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide py-3">Name</TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide py-3">
                    <Box className="flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Box>
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide py-3">
                    <Box className="flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</Box>
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide py-3">
                    <Box className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> Job Title</Box>
                  </TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide py-3">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide py-3">Source</TableHead>
                  <TableHead className="text-right text-[11px] font-semibold text-slate-500 uppercase tracking-wide py-3">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.participants.map((p) => (
                  <TableRow key={p.enrolment_id} className="hover:bg-slate-50/70 transition-colors border-b border-slate-100/80 last:border-0">
                    <TableCell className="py-3.5 font-semibold text-slate-800 text-sm">{p.name}</TableCell>
                    <TableCell className="py-3.5 text-slate-500 text-sm">{p.email}</TableCell>
                    <TableCell className="py-3.5 text-slate-500 text-sm">{p.phone || "—"}</TableCell>
                    <TableCell className="py-3.5 text-slate-500 text-sm">{p.job_title || "—"}</TableCell>
                    <TableCell className="py-3.5">
                      <Badge className="border-0 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80 text-[10px] font-medium capitalize">{p.status}</Badge>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <Badge className={`border-0 text-[10px] font-medium ${p.added_manually ? "bg-violet-50 text-violet-700 ring-1 ring-violet-200/80" : "bg-blue-50 text-blue-700 ring-1 ring-blue-200/80"}`}>
                        {p.added_manually ? "Manual" : "Order"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-3.5 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => setEditParticipant(p)}>
                            <Pencil className="mr-2 h-3.5 w-3.5" /> Edit details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setTransferParticipant(p)}>
                            <ArrowLeftRight className="mr-2 h-3.5 w-3.5" /> Transfer
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => setCancelParticipant(p)}>
                            <XCircle className="mr-2 h-3.5 w-3.5" /> Cancel enrolment
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      {/* ── Day-wise topics ── */}
      <SessionTopicsCard sessions={detail.sessions} />

      <AssignTrainerDialog open={assignOpen} onOpenChange={setAssignOpen} token={token} trainingRef={trainingId} currentTrainerId={detail.trainer?.id} onAssigned={load} />
      <AddParticipantDialog open={addOpen} onOpenChange={setAddOpen} token={token} trainingRef={trainingId} onAdded={load} />
      <MeetingDialog open={meetingOpen} onOpenChange={setMeetingOpen} token={token} trainingRef={trainingId} meeting={meeting} canRelease={canRelease} onSaved={onMeetingSaved} />
      <EditParticipantDialog participant={editParticipant} onOpenChange={() => setEditParticipant(null)} token={token} onSaved={load} />
      <CancelEnrolmentDialog participant={cancelParticipant} onOpenChange={() => setCancelParticipant(null)} token={token} onDone={load} />
      <TransferDialog participant={transferParticipant} onOpenChange={() => setTransferParticipant(null)} token={token} currentTrainingId={detail.id} onDone={load} />
    </Box>
  );
}
