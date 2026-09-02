"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  FileText, Video, FileArchive, FileSpreadsheet, Presentation, Image as ImageIcon,
  Link2, File, Plus, Trash2, Download, UploadCloud, X, AlertCircle, FolderOpen,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchCourseResources,
  fetchTrainingResources,
  deleteResource,
  uploadFileResource,
  createLinkResource,
  inferType,
} from "@/services/api/admin/course-resources-api";

const TYPE_ICON = {
  video: Video, pdf: FileText, zip: FileArchive, word: FileText,
  excel: FileSpreadsheet, ppt: Presentation, image: ImageIcon, link: Link2, other: File,
};
const TYPE_BADGE = {
  video: "bg-purple-100 text-purple-700", pdf: "bg-red-100 text-red-700",
  zip: "bg-amber-100 text-amber-700", word: "bg-blue-100 text-blue-700",
  excel: "bg-emerald-100 text-emerald-700", ppt: "bg-orange-100 text-orange-700",
  image: "bg-pink-100 text-pink-700", link: "bg-slate-100 text-slate-600",
  other: "bg-violet-100 text-violet-700",
};

const ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.zip,.rar,.7z,.mp4,.mov,.avi,.mkv,.webm,.png,.jpg,.jpeg,.gif,.webp";

function formatBytes(n) {
  if (n == null) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function AddResourceDialog({ open, scope, refId, onClose, onSaved }) {
  const { token } = useAuth();
  const [mode, setMode] = useState("file"); // "file" | "link"
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) { setMode("file"); setTitle(""); setDescription(""); setFile(null); setUrl(""); setErr(""); }
  }, [open]);

  function pickFile(f) {
    if (!f) return;
    setFile(f);
    if (!title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }

  async function save() {
    if (!title.trim()) { setErr("Title is required."); return; }
    if (mode === "file" && !file) { setErr("Choose a file to upload."); return; }
    if (mode === "link" && !url.trim()) { setErr("Enter a URL."); return; }
    setSaving(true); setErr("");
    try {
      if (mode === "file") {
        await uploadFileResource({ token, scope, ref: refId, file, title: title.trim(), description });
      } else {
        await createLinkResource({ token, scope, ref: refId, title: title.trim(), description, url: url.trim() });
      }
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">Add Resource</DialogTitle>
        </DialogHeader>

        <Box className="space-y-4 py-1">
          {/* Mode toggle */}
          <Box className="grid grid-cols-2 gap-2">
            <Button type="button" variant={mode === "file" ? "default" : "outline"} size="sm"
              className={mode === "file" ? "bg-violet-600 hover:bg-violet-700 text-white" : ""}
              onClick={() => setMode("file")}>
              <UploadCloud className="h-3.5 w-3.5 mr-1.5" /> Upload file
            </Button>
            <Button type="button" variant={mode === "link" ? "default" : "outline"} size="sm"
              className={mode === "link" ? "bg-violet-600 hover:bg-violet-700 text-white" : ""}
              onClick={() => setMode("link")}>
              <Link2 className="h-3.5 w-3.5 mr-1.5" /> External link
            </Button>
          </Box>

          <Box className="space-y-1.5">
            <Label className="text-xs">Title *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Participant Workbook" className="h-9 text-sm" />
          </Box>

          {mode === "file" ? (
            <Box className="space-y-1.5">
              <Label className="text-xs">File *</Label>
              {file ? (
                <Box className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-slate-50">
                  <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                  <Text as="span" className="text-xs text-slate-700 flex-1 truncate">{file.name}</Text>
                  <Text as="span" className="text-[11px] text-slate-400 shrink-0">{formatBytes(file.size)}</Text>
                  <button type="button" onClick={() => setFile(null)} className="text-slate-400 hover:text-slate-600 shrink-0">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </Box>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl py-6 cursor-pointer hover:bg-slate-50 transition-colors">
                  <UploadCloud className="h-6 w-6 text-slate-400" />
                  <Text as="span" className="text-xs text-slate-500">Click to choose a file</Text>
                  <Text as="span" className="text-[11px] text-slate-400">PDF, Word, Excel, PPT, ZIP, video, image…</Text>
                  <input type="file" className="hidden" accept={ACCEPT}
                    onChange={(e) => pickFile(e.target.files?.[0])} />
                </label>
              )}
              {file && (
                <Text as="span" className="text-[11px] text-slate-400">Detected type: {inferType(file.name)}</Text>
              )}
            </Box>
          ) : (
            <Box className="space-y-1.5">
              <Label className="text-xs">URL *</Label>
              <Input value={url} onChange={(e) => setUrl(e.target.value)}
                placeholder="https://… (e.g. a hosted video)" className="h-9 text-sm" />
            </Box>
          )}

          <Box className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
              rows={2} placeholder="Optional note" className="text-sm" />
          </Box>

          {err && (
            <Box className="flex items-center gap-1.5 text-red-600">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              <Text as="span" className="text-xs">{err}</Text>
            </Box>
          )}
        </Box>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button size="sm" onClick={save} disabled={saving}
            className="bg-violet-600 hover:bg-violet-700 text-white">
            {saving ? (mode === "file" ? "Uploading…" : "Saving…") : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResourceRow({ r, onDelete, deleting }) {
  const Icon = TYPE_ICON[r.type] || File;
  return (
    <Box className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-slate-50 group">
      <Box className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-violet-600" />
      </Box>
      <Box className="flex-1 min-w-0">
        <Box className="flex items-center gap-2">
          <Text as="p" className="text-sm font-medium text-slate-800 truncate">{r.title}</Text>
          <Badge className={`text-[9px] border-0 shrink-0 capitalize ${TYPE_BADGE[r.type] || TYPE_BADGE.other}`}>{r.type}</Badge>
          {r.is_link && <Badge className="text-[9px] border-0 shrink-0 bg-slate-100 text-slate-500">link</Badge>}
        </Box>
        <Box className="flex items-center gap-2 mt-0.5">
          {r.file_name && <Text as="span" className="text-[11px] text-slate-400 truncate">{r.file_name}</Text>}
          {r.file_size != null && <Text as="span" className="text-[11px] text-slate-400 shrink-0">· {formatBytes(r.file_size)}</Text>}
          {r.description && !r.file_name && <Text as="span" className="text-[11px] text-slate-400 truncate">{r.description}</Text>}
        </Box>
      </Box>
      <Box className="flex items-center gap-1 shrink-0">
        {r.url && (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-violet-600"
            render={<a href={r.url} target="_blank" rel="noopener noreferrer" />}
            title={r.is_link ? "Open link" : "Download"}>
            {r.is_link ? <Link2 className="h-4 w-4" /> : <Download className="h-4 w-4" />}
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600"
          onClick={() => onDelete(r)} disabled={deleting === r.id} title="Delete">
          <Trash2 className="h-4 w-4" />
        </Button>
      </Box>
    </Box>
  );
}

/**
 * Admin resource manager. `scope` = "course" (predefined, refId=slug) or
 * "training" (supplementary, refId=training UUID/code).
 */
export function ResourceManager({ scope, refId, heading, subheading }) {
  const { token } = useAuth();
  const [resources, setResources] = useState(null);
  const [error, setError] = useState(null);
  const [dialog, setDialog] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(async () => {
    if (!token || !refId) return;
    setError(null);
    try {
      const data = scope === "training"
        ? await fetchTrainingResources({ token, trainingRef: refId })
        : await fetchCourseResources({ token, courseRef: refId });
      setResources(data.resources || []);
    } catch (e) {
      setError(e.message);
      setResources([]);
    }
  }, [token, refId, scope]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(r) {
    if (!window.confirm(`Delete "${r.title}"? This removes the file permanently.`)) return;
    setDeleting(r.id);
    try {
      await deleteResource({ token, resourceId: r.id });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(null);
    }
  }

  return (
    <Card className="p-0 overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm">
      <Box className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
        <Box className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
          <FolderOpen className="h-4 w-4 text-violet-600" />
        </Box>
        <Box className="min-w-0 flex-1">
          <Text as="h3" className="text-sm font-bold text-slate-800 leading-tight">{heading}</Text>
          {subheading && <Text as="p" className="text-[11px] text-slate-500 mt-0.5">{subheading}</Text>}
        </Box>
        {resources != null && (
          <Badge className="border-0 bg-violet-50 text-violet-600 text-[11px] font-semibold shrink-0">{resources.length}</Badge>
        )}
        <Button size="sm" onClick={() => setDialog(true)}
          className="h-9 px-4 bg-violet-600 hover:bg-violet-700 text-white border-0 rounded-lg text-sm font-semibold shrink-0">
          <Plus className="h-3.5 w-3.5 mr-1" /> Add
        </Button>
      </Box>

      <Box className="p-4">
        {error && (
          <Box className="flex items-center gap-1.5 text-red-600 px-2 py-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <Text as="span" className="text-xs">{error}</Text>
          </Box>
        )}
        {resources == null ? (
          <Box className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
          </Box>
        ) : resources.length === 0 ? (
          <Box className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
            <Box className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <FolderOpen className="h-5 w-5 text-slate-400" />
            </Box>
            <Text as="p" className="text-sm font-medium text-slate-500">No resources yet</Text>
            <Text as="p" className="text-xs text-slate-400 mt-1">Upload courseware — PDFs, videos, ZIPs, Office files — or add a link.</Text>
          </Box>
        ) : (
          <Box className="divide-y divide-slate-100">
            {resources.map((r) => (
              <ResourceRow key={r.id} r={r} onDelete={handleDelete} deleting={deleting} />
            ))}
          </Box>
        )}
      </Box>

      <AddResourceDialog
        open={dialog} scope={scope} refId={refId}
        onClose={() => setDialog(false)} onSaved={load}
      />
    </Card>
  );
}
