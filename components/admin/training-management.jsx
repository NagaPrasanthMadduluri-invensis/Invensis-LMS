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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Hash,
  Calendar,
  Clock,
  Globe,
  Hourglass,
  Users,
  UserCheck,
  UserX,
  UserPlus,
  Mail,
  Phone,
  Briefcase,
  Video,
  MoreHorizontal,
  Pencil,
  ArrowLeftRight,
  XCircle,
  ExternalLink,
  Plus,
  BookText,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchAdminTrainingDetail,
  fetchAdminTrainings,
  fetchTrainers,
  assignTrainer,
  addParticipant,
  updateMeeting,
  updateParticipant,
  cancelEnrolment,
  transferEnrolment,
} from "@/services/api/admin/admin-api";
import { TrainerFormDialog } from "@/components/admin/trainer-form-dialog";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700" },
  active: { label: "Active", color: "bg-emerald-100 text-emerald-700" },
  ongoing: { label: "Ongoing", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", color: "bg-slate-100 text-slate-600" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-600" },
};

const MODE_LABEL = {
  virtual: "Live Virtual",
  in_person: "In Person",
  hybrid: "Hybrid",
  one_to_one: "1-to-1 Coaching",
};

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
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric", month: "short", hour: "numeric", minute: "2-digit", hour12: true,
  });
}

/* ── Read-only day-wise topics (as set by the assigned trainer) ── */
function SessionTopicsCard({ sessions }) {
  const list = Array.isArray(sessions) ? sessions : [];
  const anyTopics = list.some((s) => s.planned_topics?.trim());

  return (
    <Card className="p-5 border-0 shadow-sm rounded-xl">
      <Box className="flex items-center gap-2 mb-3">
        <BookText className="h-4 w-4 text-slate-500" />
        <Text as="h3" className="text-sm font-semibold text-slate-700">Day-wise Topics</Text>
        {list.length > 0 && (
          <Badge className="border-0 bg-slate-100 text-slate-600 text-[11px]">{list.length} day{list.length !== 1 ? "s" : ""}</Badge>
        )}
      </Box>

      {list.length === 0 ? (
        <Box className="rounded-lg border border-dashed border-slate-200 py-8 text-center">
          <Text as="p" className="text-sm text-slate-500">
            Topics are set by the assigned trainer and aren&apos;t available on this view.
          </Text>
        </Box>
      ) : !anyTopics ? (
        <Box className="rounded-lg border border-dashed border-slate-200 py-8 text-center">
          <Text as="p" className="text-sm text-slate-500">The trainer hasn&apos;t published any topics yet.</Text>
        </Box>
      ) : (
        <Accordion type="multiple" className="space-y-2">
          {list.map((s) => {
            const when = formatSessionDateTime(s.start_time);
            const hasTopics = !!s.planned_topics?.trim();
            return (
              <AccordionItem key={s.day_number} value={`day-${s.day_number}`} className="border rounded-lg px-4 bg-white">
                <AccordionTrigger className="hover:no-underline">
                  <Box className="flex flex-1 items-center justify-between gap-3 pr-2">
                    <Box className="flex items-center gap-2.5">
                      <Box className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-100 text-slate-700 text-xs font-bold shrink-0">
                        {s.day_number}
                      </Box>
                      <Box className="text-left">
                        <Text as="p" className="text-sm font-semibold leading-tight">Day {s.day_number}</Text>
                        {when && <Text as="span" className="text-[11px] text-muted-foreground">{when}</Text>}
                      </Box>
                    </Box>
                    {!hasTopics && <Badge className="border-0 bg-amber-100 text-amber-700 text-[10px]">No topics</Badge>}
                  </Box>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  {hasTopics ? (
                    <Text as="p" className="text-sm text-slate-700 whitespace-pre-wrap">{s.planned_topics}</Text>
                  ) : (
                    <Text as="p" className="text-sm italic text-muted-foreground">Not set yet.</Text>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </Card>
  );
}

function Fact({ icon: Icon, label, value }) {
  return (
    <Box className="flex items-start gap-2.5">
      <Box className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
        <Icon className="h-4 w-4 text-slate-500" />
      </Box>
      <Box className="min-w-0">
        <Text as="p" className="text-[11px] uppercase tracking-wide text-slate-400">{label}</Text>
        <Text as="p" className="text-sm font-semibold text-slate-800 leading-tight mt-0.5">{value}</Text>
      </Box>
    </Box>
  );
}

/* ── Assign trainer dialog (with inline onboard shortcut) ── */
function AssignTrainerDialog({ open, onOpenChange, token, trainingRef, currentTrainerId, onAssigned }) {
  const [trainers, setTrainers] = useState(null);
  const [selected, setSelected] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);

  const loadTrainers = useCallback(() => {
    if (!token) return;
    setError(null);
    fetchTrainers({ token })
      .then((d) => setTrainers(d.trainers || []))
      .catch((e) => setError(e.message));
  }, [token]);

  useEffect(() => {
    if (!open) return;
    loadTrainers();
  }, [open, loadTrainers]);

  async function submit() {
    if (!selected) { setError("Please select a trainer."); return; }
    setSubmitting(true);
    setError(null);
    try {
      await assignTrainer({ token, trainingRef, trainerId: selected });
      onAssigned();
      onOpenChange(false);
      setSelected("");
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Trainer</DialogTitle>
            <DialogDescription>Select an active trainer to assign to this training.</DialogDescription>
          </DialogHeader>
          <Box className="space-y-3 py-2">
            <Select value={selected} onValueChange={setSelected}>
              <SelectTrigger>
                <SelectValue placeholder={trainers ? "Choose a trainer" : "Loading trainers..."} />
              </SelectTrigger>
              <SelectContent>
                {(trainers || []).map((t) => (
                  <SelectItem key={t.id} value={t.id} disabled={t.id === currentTrainerId}>
                    {t.name}{t.id === currentTrainerId ? " (current)" : ""} · {t.experience || "—"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" className="h-8 px-2 text-indigo-600" onClick={() => setCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Onboard a new trainer
            </Button>
            {error && <Text as="p" className="text-xs text-red-600">{error}</Text>}
          </Box>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={submit} disabled={submitting}>{submitting ? "Assigning..." : "Assign"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <TrainerFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        token={token}
        mode="create"
        onSaved={loadTrainers}
      />
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
    if (!form.name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const data = { name: form.name.trim(), email: form.email.trim() };
      if (form.phone.trim()) data.phone = form.phone.trim();
      if (form.job_title.trim()) data.job_title = form.job_title.trim();
      await addParticipant({ token, trainingRef, data });
      onAdded();
      onOpenChange(false);
      setForm({ name: "", email: "", phone: "", job_title: "" });
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Participant</DialogTitle>
          <DialogDescription>Manually enrol a participant in this training.</DialogDescription>
        </DialogHeader>
        <Box className="space-y-3 py-2">
          <Box className="space-y-1.5">
            <Label htmlFor="p-name">Full name *</Label>
            <Input id="p-name" value={form.name} onChange={set("name")} placeholder="Jane Doe" />
          </Box>
          <Box className="space-y-1.5">
            <Label htmlFor="p-email">Email *</Label>
            <Input id="p-email" type="email" value={form.email} onChange={set("email")} placeholder="jane@example.com" />
          </Box>
          <Box className="grid grid-cols-2 gap-3">
            <Box className="space-y-1.5">
              <Label htmlFor="p-phone">Phone</Label>
              <Input id="p-phone" value={form.phone} onChange={set("phone")} placeholder="+91 …" />
            </Box>
            <Box className="space-y-1.5">
              <Label htmlFor="p-job">Job title</Label>
              <Input id="p-job" value={form.job_title} onChange={set("job_title")} placeholder="Project Manager" />
            </Box>
          </Box>
          {error && <Text as="p" className="text-xs text-red-600">{error}</Text>}
        </Box>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? "Adding..." : "Add Participant"}</Button>
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
    setForm({
      name: participant.name || "",
      phone: participant.phone || "",
      job_title: participant.job_title || "",
    });
  }, [participant]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit() {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSubmitting(true);
    setError(null);
    try {
      await updateParticipant({
        token,
        participantId: participant.participant_id,
        data: { name: form.name.trim(), phone: form.phone.trim(), job_title: form.job_title.trim() },
      });
      onSaved();
      onOpenChange(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Participant</DialogTitle>
          <DialogDescription>Email is the login identity and can't be changed here.</DialogDescription>
        </DialogHeader>
        <Box className="space-y-3 py-2">
          <Box className="space-y-1.5">
            <Label htmlFor="e-name">Full name *</Label>
            <Input id="e-name" value={form.name} onChange={set("name")} />
          </Box>
          <Box className="grid grid-cols-2 gap-3">
            <Box className="space-y-1.5">
              <Label htmlFor="e-phone">Phone</Label>
              <Input id="e-phone" value={form.phone} onChange={set("phone")} placeholder="+91 …" />
            </Box>
            <Box className="space-y-1.5">
              <Label htmlFor="e-job">Job title</Label>
              <Input id="e-job" value={form.job_title} onChange={set("job_title")} placeholder="Project Manager" />
            </Box>
          </Box>
          {error && <Text as="p" className="text-xs text-red-600">{error}</Text>}
        </Box>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</Button>
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

  useEffect(() => {
    if (participant) { setReason(""); setError(null); }
  }, [participant]);

  async function submit() {
    if (!reason.trim()) { setError("A reason is required."); return; }
    setSubmitting(true);
    setError(null);
    try {
      await cancelEnrolment({ token, enrolmentId: participant.enrolment_id, reason: reason.trim() });
      onDone();
      onOpenChange(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel Enrolment</DialogTitle>
          <DialogDescription>
            This frees the seat for {participant?.name}. The reason is recorded for audit.
          </DialogDescription>
        </DialogHeader>
        <Box className="space-y-3 py-2">
          <Box className="space-y-1.5">
            <Label htmlFor="c-reason">Reason *</Label>
            <Textarea id="c-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} placeholder="e.g. duplicate registration" />
          </Box>
          {error && <Text as="p" className="text-xs text-red-600">{error}</Text>}
        </Box>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Back</Button>
          <Button variant="destructive" onClick={submit} disabled={submitting}>
            {submitting ? "Cancelling..." : "Cancel Enrolment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ── Transfer enrolment dialog ── */
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
    fetchAdminTrainings({ token })
      .then((d) => setTrainings(d.trainings || []))
      .catch((e) => setError(e.message));
  }, [open, token]);

  async function submit() {
    if (!target) { setError("Select a target training."); return; }
    if (!reason.trim()) { setError("A reason is required."); return; }
    setSubmitting(true);
    setError(null);
    try {
      await transferEnrolment({ token, enrolmentId: participant.enrolment_id, trainingId: target, reason: reason.trim() });
      onDone();
      onOpenChange(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  const options = (trainings || []).filter((t) => t.id !== currentTrainingId);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Participant</DialogTitle>
          <DialogDescription>
            Move {participant?.name} to another training. Their sponsor/order link is preserved.
          </DialogDescription>
        </DialogHeader>
        <Box className="space-y-3 py-2">
          <Box className="space-y-1.5">
            <Label>Target training *</Label>
            <Select value={target} onValueChange={setTarget}>
              <SelectTrigger>
                <SelectValue placeholder={trainings ? "Choose a training" : "Loading…"} />
              </SelectTrigger>
              <SelectContent>
                {options.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.code} · {t.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Box>
          <Box className="space-y-1.5">
            <Label htmlFor="tr-reason">Reason *</Label>
            <Textarea id="tr-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="e.g. learner requested a different batch" />
          </Box>
          {error && <Text as="p" className="text-xs text-red-600">{error}</Text>}
        </Box>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? "Transferring..." : "Transfer"}</Button>
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
    setUrl(meeting?.url || "");
    setPlatform(meeting?.platform || "zoom");
    setReleased(!!meeting?.released);
    setOverride(false);
    setError(null);
  }, [open, meeting]);

  async function submit() {
    if (!url.trim()) { setError("Meeting URL is required."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const data = {
        meeting_url: url.trim(),
        meeting_platform: platform,
        meeting_released: released,
      };
      if (released && override) data.min_seats_override = true;
      const res = await updateMeeting({ token, trainingRef, data });
      onSaved(res.training);
      onOpenChange(false);
    } catch (e) {
      setError(e.message);
      // min-seats failures come back as 422 — surface the override option.
      if (e.status === 422) setOverride((o) => o);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Meeting Link</DialogTitle>
          <DialogDescription>Set the virtual meeting link and release it to enrolled participants.</DialogDescription>
        </DialogHeader>
        <Box className="space-y-3 py-2">
          <Box className="space-y-1.5">
            <Label htmlFor="m-url">Meeting URL *</Label>
            <Input id="m-url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://zoom.us/j/123456789" />
          </Box>
          <Box className="space-y-1.5">
            <Label>Platform</Label>
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="zoom">Zoom</SelectItem>
                <SelectItem value="teams">Microsoft Teams</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </Box>
          <Box className="flex items-center justify-between rounded-lg border px-3 py-2">
            <Box>
              <Text as="p" className="text-sm font-medium">Release to participants</Text>
              <Text as="p" className="text-xs text-muted-foreground">
                {canRelease ? "Min-seats requirement met." : "Below min-seats — needs override to release."}
              </Text>
            </Box>
            <Switch checked={released} onCheckedChange={setReleased} />
          </Box>
          {released && !canRelease && (
            <Box className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2">
              <Text as="p" className="text-xs font-medium text-amber-700">Override the min-seats rule</Text>
              <Switch checked={override} onCheckedChange={setOverride} />
            </Box>
          )}
          {error && <Text as="p" className="text-xs text-red-600">{error}</Text>}
        </Box>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? "Saving..." : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
        // Seed meeting state from the detail if the API includes it.
        if (d.meeting_url != null || d.meeting_released != null) {
          setMeeting({
            url: d.meeting_url ?? null,
            platform: d.meeting_platform ?? null,
            released: !!d.meeting_released,
          });
        }
      })
      .catch((e) => setError(e.message));
  }, [token, trainingId]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <Card className="p-6 border-red-100 bg-red-50">
        <Text as="p" className="text-red-600 text-sm">Failed to load training: {error}</Text>
      </Card>
    );
  }

  if (!detail) {
    return (
      <Box className="space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </Box>
    );
  }

  const statusCfg = STATUS_CONFIG[detail.status] || STATUS_CONFIG.active;
  const isVirtual = detail.delivery_mode !== "in_person";
  const canRelease = detail.enrolled_count >= (detail.min_seats ?? 1);

  function onMeetingSaved(training) {
    setMeeting({
      url: training?.meeting_url ?? null,
      platform: training?.meeting_platform ?? null,
      released: !!training?.meeting_released,
    });
    load();
  }

  return (
    <Box className="space-y-5">
      {/* ── Header / schedule ── */}
      <Card className="p-0 overflow-hidden border-0 shadow-sm rounded-xl">
        <Box className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 text-white">
          <Box className="flex flex-wrap items-center justify-between gap-3">
            <Box className="flex items-center gap-2">
              <Hash className="h-4 w-4 text-white/70" />
              <Text as="span" className="text-sm font-semibold tracking-wide">{detail.training_id}</Text>
              <Badge className={`ml-1 border-0 text-[10px] ${statusCfg.color}`}>{statusCfg.label}</Badge>
            </Box>
            <Badge className="border-0 bg-white/15 text-white text-[11px]">{MODE_LABEL[detail.delivery_mode] || detail.delivery_mode}</Badge>
          </Box>
          <Text as="h2" className="text-xl font-semibold mt-1">{detail.title}</Text>
        </Box>
        <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-6">
          <Fact icon={Calendar} label="Dates" value={`${formatDate(detail.start_date)} – ${formatDate(detail.end_date)}`} />
          <Fact icon={Clock} label="Daily Timing" value={`${formatTime(detail.start_time)} – ${formatTime(detail.end_time)}`} />
          <Fact icon={Globe} label="Timezone" value={detail.timezone || "—"} />
          <Fact icon={Hourglass} label="Duration" value={detail.duration_hours != null ? `${detail.duration_hours} hours` : "—"} />
          <Fact icon={Users} label="Capacity" value={`${detail.enrolled_count} / ${detail.capacity ?? "—"} enrolled`} />
        </Box>
      </Card>

      {/* ── Trainer ── */}
      <Card className="p-5 border-0 shadow-sm rounded-xl">
        <Box className="flex items-center justify-between gap-3">
          <Text as="h3" className="text-sm font-semibold text-slate-700">Trainer</Text>
          <Button size="sm" variant={detail.trainer ? "outline" : "default"} onClick={() => setAssignOpen(true)}>
            {detail.trainer ? "Reassign" : "Assign Trainer"}
          </Button>
        </Box>
        {detail.trainer ? (
          <Box className="mt-3 flex items-center gap-3 rounded-lg bg-emerald-50 px-4 py-3">
            <UserCheck className="h-5 w-5 text-emerald-600 shrink-0" />
            <Box>
              <Text as="p" className="text-sm font-semibold text-slate-800">{detail.trainer.name}</Text>
              <Text as="p" className="text-xs text-slate-500">
                {detail.trainer.email}{detail.trainer.experience ? ` · ${detail.trainer.experience}` : ""}
              </Text>
            </Box>
          </Box>
        ) : (
          <Box className="mt-3 flex items-center gap-3 rounded-lg bg-amber-50 ring-1 ring-amber-200 px-4 py-3">
            <UserX className="h-5 w-5 text-amber-600 shrink-0" />
            <Text as="p" className="text-sm font-semibold text-amber-700">
              No trainer assigned — assign one to run this training.
            </Text>
          </Box>
        )}
      </Card>

      {/* ── Meeting link (virtual deliveries) ── */}
      {isVirtual && (
        <Card className="p-5 border-0 shadow-sm rounded-xl">
          <Box className="flex items-center justify-between gap-3">
            <Box className="flex items-center gap-2">
              <Video className="h-4 w-4 text-slate-500" />
              <Text as="h3" className="text-sm font-semibold text-slate-700">Meeting Link</Text>
            </Box>
            <Button size="sm" variant={meeting?.url ? "outline" : "default"} onClick={() => setMeetingOpen(true)}>
              {meeting?.url ? "Manage" : "Set Link"}
            </Button>
          </Box>
          {meeting?.url ? (
            <Box className="mt-3 flex flex-wrap items-center gap-3 rounded-lg bg-slate-50 px-4 py-3">
              <Badge className={`border-0 text-[10px] ${meeting.released ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                {meeting.released ? "Released" : "Not released"}
              </Badge>
              {meeting.platform && (
                <Badge className="border-0 bg-slate-200 text-slate-600 text-[10px]">{PLATFORM_LABEL[meeting.platform] || meeting.platform}</Badge>
              )}
              <a href={meeting.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline inline-flex items-center gap-1 truncate">
                {meeting.url} <ExternalLink className="h-3 w-3 shrink-0" />
              </a>
            </Box>
          ) : (
            <Box className="mt-3 rounded-lg border border-dashed border-slate-200 px-4 py-3">
              <Text as="p" className="text-sm text-slate-500">
                No meeting link set. {canRelease ? "" : `Releasing needs ${detail.min_seats ?? 1} confirmed enrolment(s) (currently ${detail.enrolled_count}).`}
              </Text>
            </Box>
          )}
        </Card>
      )}

      {/* ── Day-wise topics (set by trainer) ── */}
      <SessionTopicsCard sessions={detail.sessions} />

      {/* ── Participants ── */}
      <Card className="p-5 border-0 shadow-sm rounded-xl">
        <Box className="flex items-center justify-between gap-3 mb-3">
          <Box className="flex items-center gap-2">
            <Text as="h3" className="text-sm font-semibold text-slate-700">Participants</Text>
            <Badge className="border-0 bg-slate-100 text-slate-600 text-[11px]">{detail.participants.length}</Badge>
          </Box>
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <UserPlus className="h-3.5 w-3.5 mr-1.5" />
            Add Participant
          </Button>
        </Box>

        {detail.participants.length === 0 ? (
          <Box className="rounded-lg border border-dashed border-slate-200 py-10 text-center">
            <Text as="p" className="text-sm text-slate-500">No participants enrolled yet.</Text>
          </Box>
        ) : (
          <Box className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead><Box className="flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Box></TableHead>
                  <TableHead><Box className="flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</Box></TableHead>
                  <TableHead><Box className="flex items-center gap-1"><Briefcase className="h-3 w-3" /> Job Title</Box></TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {detail.participants.map((p) => (
                  <TableRow key={p.enrolment_id}>
                    <TableCell className="font-medium text-slate-800">{p.name}</TableCell>
                    <TableCell className="text-slate-600">{p.email}</TableCell>
                    <TableCell className="text-slate-600">{p.phone || "—"}</TableCell>
                    <TableCell className="text-slate-600">{p.job_title || "—"}</TableCell>
                    <TableCell>
                      <Badge className="border-0 bg-emerald-100 text-emerald-700 text-[10px] capitalize">{p.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={`border-0 text-[10px] ${p.added_manually ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"}`}>
                        {p.added_manually ? "Manual" : "Order"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
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
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => setCancelParticipant(p)}
                          >
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

      <AssignTrainerDialog
        open={assignOpen}
        onOpenChange={setAssignOpen}
        token={token}
        trainingRef={trainingId}
        currentTrainerId={detail.trainer?.id}
        onAssigned={load}
      />
      <AddParticipantDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        token={token}
        trainingRef={trainingId}
        onAdded={load}
      />
      <MeetingDialog
        open={meetingOpen}
        onOpenChange={setMeetingOpen}
        token={token}
        trainingRef={trainingId}
        meeting={meeting}
        canRelease={canRelease}
        onSaved={onMeetingSaved}
      />
      <EditParticipantDialog
        participant={editParticipant}
        onOpenChange={() => setEditParticipant(null)}
        token={token}
        onSaved={load}
      />
      <CancelEnrolmentDialog
        participant={cancelParticipant}
        onOpenChange={() => setCancelParticipant(null)}
        token={token}
        onDone={load}
      />
      <TransferDialog
        participant={transferParticipant}
        onOpenChange={() => setTransferParticipant(null)}
        token={token}
        currentTrainingId={detail.id}
        onDone={load}
      />
    </Box>
  );
}
