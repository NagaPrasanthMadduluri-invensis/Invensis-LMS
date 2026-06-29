"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchAdminTrainingDetail,
  fetchTrainers,
  assignTrainer,
  addParticipant,
} from "@/services/api/admin/admin-api";

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

/* ── Assign trainer dialog ── */
function AssignTrainerDialog({ open, onOpenChange, token, trainingRef, currentTrainerId, onAssigned }) {
  const [trainers, setTrainers] = useState(null);
  const [selected, setSelected] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !token) return;
    setError(null);
    fetchTrainers({ token })
      .then((d) => setTrainers(d.trainers || []))
      .catch((e) => setError(e.message));
  }, [open, token]);

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
          {error && <Text as="p" className="text-xs text-red-600">{error}</Text>}
        </Box>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>{submitting ? "Assigning..." : "Assign"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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

export function TrainingManagement({ trainingId }) {
  const { token } = useAuth();
  const [detail, setDetail] = useState(null);
  const [error, setError] = useState(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    fetchAdminTrainingDetail({ token, trainingRef: trainingId })
      .then(setDetail)
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
    </Box>
  );
}
