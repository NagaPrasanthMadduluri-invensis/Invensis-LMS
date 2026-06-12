"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Link2,
  Video,
  File,
  Plus,
  Pencil,
  Trash2,
  ExternalLink,
  Users,
  CheckSquare,
  Square,
  AlertCircle,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchResources,
  createResource,
  updateResource,
  deleteResource,
  fetchCourseEnrollments,
  assignResourceToEnrollment,
  unassignResourceFromEnrollment,
} from "@/services/api/admin/admin-api";

const TYPE_ICON = {
  brochure: FileText,
  pdf:      FileText,
  video:    Video,
  link:     Link2,
  document: File,
};
const TYPE_BADGE = {
  brochure: "bg-blue-100 text-blue-700",
  pdf:      "bg-red-100 text-red-700",
  video:    "bg-purple-100 text-purple-700",
  link:     "bg-gray-100 text-gray-600",
  document: "bg-indigo-100 text-indigo-700",
};

const EMPTY_FORM = { title: "", type: "brochure", url: "", description: "", is_active: true };

function ResourceFormDialog({ open, resource, onClose, onSave }) {
  const [form, setForm]     = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [err, setErr]       = useState("");

  useEffect(() => {
    setForm(resource ? { ...resource } : EMPTY_FORM);
    setErr("");
  }, [resource, open]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    if (!form.title.trim()) { setErr("Title is required"); return; }
    if (!form.url.trim())   { setErr("URL is required");   return; }
    setSaving(true);
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">
            {resource ? "Edit Resource" : "Add Resource"}
          </DialogTitle>
        </DialogHeader>

        <Box className="space-y-4 py-1">
          <Box className="space-y-1.5">
            <Label className="text-xs">Title *</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)}
              placeholder="e.g. PMP Course Brochure 2025" className="h-8 text-sm" />
          </Box>

          <Box className="space-y-1.5">
            <Label className="text-xs">Type</Label>
            <Select value={form.type} onValueChange={(v) => set("type", v)}>
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["brochure", "pdf", "video", "link", "document"].map((t) => (
                  <SelectItem key={t} value={t} className="text-sm capitalize">{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Box>

          <Box className="space-y-1.5">
            <Label className="text-xs">URL *</Label>
            <Input value={form.url} onChange={(e) => set("url", e.target.value)}
              placeholder="https://..." className="h-8 text-sm" />
          </Box>

          <Box className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Input value={form.description || ""} onChange={(e) => set("description", e.target.value)}
              placeholder="Optional note" className="h-8 text-sm" />
          </Box>

          <Box className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
            <Label className="text-xs">Active</Label>
          </Box>

          {err && (
            <Box className="flex items-center gap-1.5 text-red-600">
              <AlertCircle className="h-3.5 w-3.5" />
              <Text as="span" className="text-xs">{err}</Text>
            </Box>
          )}
        </Box>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResourceRow({ resource, onEdit, onDelete }) {
  const Icon = TYPE_ICON[resource.type] || File;
  return (
    <Box className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/40 group">
      <Box className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </Box>
      <Box className="flex-1 min-w-0">
        <Box className="flex items-center gap-2">
          <Text as="p" className="text-sm font-medium truncate">{resource.title}</Text>
          <Badge className={`text-[9px] border-0 shrink-0 capitalize ${TYPE_BADGE[resource.type] || TYPE_BADGE.document}`}>
            {resource.type}
          </Badge>
          {!resource.is_active && (
            <Badge variant="secondary" className="text-[9px] shrink-0">Inactive</Badge>
          )}
        </Box>
        {resource.description && (
          <Text as="span" className="text-[11px] text-muted-foreground truncate block">
            {resource.description}
          </Text>
        )}
      </Box>
      <Box className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7"
          onClick={() => window.open(resource.url, "_blank")}>
          <ExternalLink className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(resource)}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600"
          onClick={() => onDelete(resource)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </Box>
    </Box>
  );
}

function EnrollmentAssignments({ courseId, resources, token }) {
  const [enrollments, setEnrollments] = useState(null);
  const [toggling, setToggling]       = useState(new Set());

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchCourseEnrollments({ token, courseId });
      setEnrollments(data.enrollments || []);
    } catch {
      setEnrollments([]);
    }
  }, [token, courseId]);

  useEffect(() => { load(); }, [load]);

  async function toggle(enrollmentId, resourceId, assigned) {
    const key = `${enrollmentId}-${resourceId}`;
    setToggling((s) => new Set([...s, key]));
    try {
      if (assigned) {
        await unassignResourceFromEnrollment({ token, enrollmentId, resourceId });
      } else {
        await assignResourceToEnrollment({ token, enrollmentId, resourceId });
      }
      await load();
    } finally {
      setToggling((s) => { const n = new Set(s); n.delete(key); return n; });
    }
  }

  if (!enrollments) return <Skeleton className="h-24 rounded-lg" />;

  if (enrollments.length === 0) {
    return (
      <Box className="py-6 text-center">
        <Users className="h-7 w-7 mx-auto text-muted-foreground/30 mb-2" />
        <Text as="p" className="text-sm text-muted-foreground">No learners enrolled yet</Text>
      </Box>
    );
  }

  const activeResources = resources.filter((r) => r.is_active);

  return (
    <Box className="space-y-4">
      {enrollments.map((enrollment) => {
        const assignedIds = new Set(enrollment.assigned_resource_ids);
        return (
          <Box key={enrollment.id} className="border rounded-lg overflow-hidden">
            {/* User header */}
            <Box className="flex items-center gap-3 px-4 py-2.5 bg-muted/40">
              <Box className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center shrink-0">
                <Text as="span" className="text-xs font-semibold text-indigo-600">
                  {enrollment.user.name[0]}
                </Text>
              </Box>
              <Box className="flex-1 min-w-0">
                <Text as="p" className="text-sm font-medium truncate">{enrollment.user.name}</Text>
                <Text as="span" className="text-[11px] text-muted-foreground">{enrollment.user.email}</Text>
              </Box>
              <Badge className={`text-[10px] border-0 ${enrollment.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                {enrollment.status}
              </Badge>
            </Box>

            {/* Resource toggles */}
            {activeResources.length === 0 ? (
              <Box className="px-4 py-3">
                <Text as="p" className="text-xs text-muted-foreground">No active resources to assign</Text>
              </Box>
            ) : (
              <Box className="divide-y">
                {activeResources.map((r) => {
                  const assigned = assignedIds.has(r.id);
                  const key      = `${enrollment.id}-${r.id}`;
                  const busy     = toggling.has(key);
                  const Icon     = TYPE_ICON[r.type] || File;
                  return (
                    <Box key={r.id}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30 cursor-pointer transition-colors"
                      onClick={() => !busy && toggle(enrollment.id, r.id, assigned)}>
                      {assigned
                        ? <CheckSquare className={`h-4 w-4 shrink-0 text-indigo-500 ${busy ? "opacity-40" : ""}`} />
                        : <Square     className={`h-4 w-4 shrink-0 text-muted-foreground/40 ${busy ? "opacity-40" : ""}`} />
                      }
                      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <Text as="p" className="text-xs flex-1 truncate">{r.title}</Text>
                      <Badge className={`text-[9px] border-0 shrink-0 ${assigned ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-400"}`}>
                        {assigned ? "Assigned" : "Unassigned"}
                      </Badge>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        );
      })}
    </Box>
  );
}

export function CourseResources({ courseId }) {
  const { token } = useAuth();
  const [resources, setResources] = useState(null);
  const [dialog, setDialog]       = useState({ open: false, resource: null });
  const [deleting, setDeleting]   = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchResources({ token, courseId });
      setResources(data.resources || []);
    } catch {
      setResources([]);
    }
  }, [token, courseId]);

  useEffect(() => { load(); }, [load]);

  async function handleSave(form) {
    if (dialog.resource) {
      await updateResource({ token, resourceId: dialog.resource.id, data: form });
    } else {
      await createResource({ token, courseId, data: form });
    }
    await load();
  }

  async function handleDelete(resource) {
    if (!confirm(`Delete "${resource.title}"?`)) return;
    setDeleting(resource.id);
    try {
      await deleteResource({ token, resourceId: resource.id });
      await load();
    } finally {
      setDeleting(null);
    }
  }

  if (!resources) {
    return (
      <Box className="space-y-3">
        <Skeleton className="h-10 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
        <Skeleton className="h-14 rounded-lg" />
      </Box>
    );
  }

  return (
    <Box className="space-y-6">
      {/* ── Course Resources ── */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between px-4 py-4 space-y-0">
          <CardTitle className="text-sm font-semibold">
            Course Resources
            <Badge variant="secondary" className="ml-2 text-[10px]">{resources.length}</Badge>
          </CardTitle>
          <Button className="h-9 px-5 text-sm gap-2 ml-auto"
            onClick={() => setDialog({ open: true, resource: null })}>
            <Plus className="h-3.5 w-3.5" />
            Add Resource
          </Button>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {resources.length === 0 ? (
            <Box className="py-8 text-center">
              <FileText className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <Text as="p" className="text-sm text-muted-foreground">No resources yet — add brochures, PDFs or links</Text>
            </Box>
          ) : (
            <Box className="divide-y">
              {resources.map((r) => (
                <ResourceRow key={r.id} resource={r}
                  onEdit={(res) => setDialog({ open: true, resource: res })}
                  onDelete={handleDelete}
                />
              ))}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ── Assign to Enrolled Learners ── */}
      <Card>
        <CardHeader className="py-3 px-4 flex-row items-center gap-2 space-y-0">
          <Users className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-sm font-semibold">Assign Resources to Learners</CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <Text as="p" className="text-xs text-muted-foreground mb-3">
            Click a resource to toggle assignment. If nothing is assigned, the learner sees all active resources.
          </Text>
          <EnrollmentAssignments courseId={courseId} resources={resources} token={token} />
        </CardContent>
      </Card>

      <ResourceFormDialog
        open={dialog.open}
        resource={dialog.resource}
        onClose={() => setDialog({ open: false, resource: null })}
        onSave={handleSave}
      />
    </Box>
  );
}
