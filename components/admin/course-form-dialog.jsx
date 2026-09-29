"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle,
} from "@/components/ui/dialog";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { createCourse, updateCourse } from "@/services/api/admin/course-resources-api";
import {
  AlertCircle, Library, Hash, Type, Tag, Clock, FileText, Award, CheckCircle2, Info, Layers,
} from "lucide-react";

const EMPTY = {
  slug: "", name: "", course_type: "", certification_included: false,
  duration_hours: "", category_name: "", category_slug: "",
  short_name: "", description: "", is_active: true,
};

const COURSE_TYPES = [
  { value: "certification", label: "Certification" },
  { value: "training_only", label: "Training only" },
  { value: "", label: "Unset" },
];

function FInput({ icon: Icon, ...props }) {
  return (
    <Box className="group flex items-center gap-3 h-12 rounded-xl border border-slate-200 bg-white px-3.5 shadow-sm hover:border-slate-300 focus-within:border-violet-400 focus-within:shadow-[0_0_0_3px_rgba(167,139,250,0.35)] transition-all duration-150">
      {Icon && <Icon className="h-4 w-4 text-slate-400 shrink-0 group-focus-within:text-violet-500 transition-colors" />}
      <input
        {...props}
        className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed"
      />
    </Box>
  );
}

function FTextarea({ rows = 3, ...props }) {
  return (
    <Box className="rounded-xl border border-slate-200 bg-white shadow-sm hover:border-slate-300 focus-within:border-violet-400 focus-within:shadow-[0_0_0_3px_rgba(167,139,250,0.35)] transition-all duration-150">
      <textarea
        rows={rows}
        {...props}
        className="w-full bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400 resize-none px-3.5 py-3"
      />
    </Box>
  );
}

function Section({ label, icon: Icon, hint, children }) {
  return (
    <Box className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      <Box className="flex items-center gap-2.5 px-4 py-3 bg-slate-50/80 border-b border-slate-200">
        <Box className="w-7 h-7 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
          {Icon ? <Icon className="h-3.5 w-3.5 text-violet-600" /> : <Box className="w-1 h-4 rounded-full bg-violet-500" />}
        </Box>
        <Text as="p" className="text-[11px] font-bold uppercase tracking-widest text-slate-500">{label}</Text>
        {hint && <Text as="span" className="ml-auto text-[11px] text-slate-400 normal-case font-normal tracking-normal">{hint}</Text>}
      </Box>
      <Box className="p-5 space-y-4">{children}</Box>
    </Box>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <Box className="space-y-1.5">
      <Box className="flex items-center justify-between">
        <Text as="p" className="text-xs font-semibold text-slate-600">
          {label}{required && <Text as="span" className="text-red-500 ml-0.5">*</Text>}
        </Text>
        {hint && <Text as="span" className="text-[10px] text-slate-400">{hint}</Text>}
      </Box>
      {children}
    </Box>
  );
}

// Small segmented control — course_type has only three states, so a Select is overkill.
function Segmented({ value, onChange, options }) {
  return (
    <Box className="inline-flex flex-wrap gap-1.5 rounded-xl bg-slate-100 p-1">
      {options.map((o) => {
        const active = value === o.value;
        return (
          <button
            key={o.label} type="button" onClick={() => onChange(o.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              active ? "bg-violet-600 text-white shadow-sm" : "text-slate-500 hover:text-violet-600 hover:bg-white"
            }`}>
            {o.label}
          </button>
        );
      })}
    </Box>
  );
}

function ToggleRow({ icon: Icon, on, onChange, title, desc, accent = "emerald" }) {
  const onBg = accent === "amber" ? "bg-amber-100" : "bg-emerald-100";
  const onFg = accent === "amber" ? "text-amber-600" : "text-emerald-600";
  return (
    <Box className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
      <Box className="flex items-center gap-3">
        <Box className={`w-8 h-8 rounded-lg flex items-center justify-center ${on ? onBg : "bg-slate-100"}`}>
          <Icon className={`h-4 w-4 ${on ? onFg : "text-slate-400"}`} />
        </Box>
        <Box>
          <Text as="p" className="text-sm font-semibold text-slate-800">{title}</Text>
          <Text as="p" className="text-xs text-slate-500 mt-0.5">{desc}</Text>
        </Box>
      </Box>
      <Switch checked={on} onCheckedChange={onChange} />
    </Box>
  );
}

export function CourseFormDialog({ open, onOpenChange, token, mode = "create", course = null, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState(null);
  const isEdit = mode === "edit";
  // A locally-defined course has no CMS id; a synced one gets overwritten on re-sync.
  const isCmsSynced = isEdit && course?.cms_id != null;

  useEffect(() => {
    if (!open) return;
    setError(null); setFieldErrors(null);
    if (isEdit && course) {
      setForm({
        slug: course.slug || "",
        name: course.name || "",
        course_type: course.course_type || "",
        certification_included: !!course.certification_included,
        duration_hours: course.duration_hours != null ? String(course.duration_hours) : "",
        category_name: course.category?.name || "",
        category_slug: course.category?.slug || "",
        short_name: course.short_name || "",
        description: course.description || "",
        is_active: course.is_active !== false,
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, isEdit, course]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit() {
    if (!isEdit && !form.slug.trim()) { setError("Slug is required."); return; }
    if (!form.name.trim()) { setError("Course name is required."); return; }

    // duration_hours: blank → null; otherwise a positive whole number.
    let duration = null;
    if (form.duration_hours.trim() !== "") {
      duration = Number(form.duration_hours);
      if (!Number.isInteger(duration) || duration < 1) {
        setError("Duration must be a positive whole number of hours."); return;
      }
    }

    setSubmitting(true); setError(null); setFieldErrors(null);
    try {
      const data = {
        name: form.name.trim(),
        course_type: form.course_type || null,
        certification_included: form.certification_included,
        duration_hours: duration,
        category_name: form.category_name.trim() || null,
        category_slug: form.category_slug.trim() || null,
        short_name: form.short_name.trim() || null,
        description: form.description.trim() || null,
        is_active: form.is_active,
      };
      let res;
      if (isEdit) {
        res = await updateCourse({ token, courseRef: course.slug, data });
      } else {
        res = await createCourse({ token, data: { ...data, slug: form.slug.trim() } });
      }
      onSaved?.(res?.course ?? null);
      onOpenChange(false);
    } catch (e) {
      setError(e.message); setFieldErrors(e.errors || null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px] overflow-hidden" style={{ padding: 0, gap: 0 }}>

        {/* ── Header ── */}
        <Box className="bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-5">
          <Box className="flex items-center gap-3">
            <Box className="w-11 h-11 rounded-xl bg-white/15 ring-1 ring-white/25 flex items-center justify-center shrink-0">
              <Library className="w-5 h-5 text-white" />
            </Box>
            <Box className="min-w-0">
              <DialogTitle className="text-[15px] font-bold text-white truncate">
                {isEdit ? (form.name || "Edit course") : "Add a course"}
              </DialogTitle>
              <DialogDescription className="text-[13px] text-violet-100 mt-0.5 truncate">
                {isEdit ? form.slug : "Define a course that arrives via CRM orders but isn't in the CMS."}
              </DialogDescription>
            </Box>
          </Box>
        </Box>

        <Box className="px-7 py-6 max-h-[74vh] overflow-y-auto bg-slate-50/60 space-y-5">
          {isCmsSynced && (
            <Box className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3">
              <Info className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
              <Text as="p" className="text-xs text-amber-700 leading-relaxed">
                This course is synced from the CMS. Your edits apply now, but the next <b>Sync from CMS</b> will overwrite them.
              </Text>
            </Box>
          )}

          <Section label="Identity" icon={Type}>
            <Field label="Slug" required={!isEdit}
              hint={isEdit ? "Immutable join key" : "Must match the order's course slug"}>
              {isEdit ? (
                <Box className="flex items-center gap-2 h-12 rounded-xl border border-slate-200 bg-slate-100/70 px-3.5">
                  <Hash className="h-4 w-4 text-slate-400 shrink-0" />
                  <Text as="span" className="text-sm text-slate-500 font-mono truncate">{form.slug}</Text>
                </Box>
              ) : (
                <FInput icon={Hash} value={form.slug} onChange={set("slug")} placeholder="pmp-certification-training" />
              )}
            </Field>
            <Field label="Course name" required>
              <FInput icon={Type} value={form.name} onChange={set("name")} placeholder="PMP Certification Training" />
            </Field>
            <Field label="Short name" hint="optional">
              <FInput icon={Type} value={form.short_name} onChange={set("short_name")} placeholder="PMP" />
            </Field>
          </Section>

          <Section label="Classification" icon={Layers}>
            <Field label="Course type" hint="Drives 'is certification' on certificates">
              <Segmented value={form.course_type}
                onChange={(v) => setForm((f) => ({ ...f, course_type: v }))} options={COURSE_TYPES} />
            </Field>
            <ToggleRow icon={Award} accent="amber"
              on={form.certification_included}
              onChange={(v) => setForm((f) => ({ ...f, certification_included: v }))}
              title="Certification included"
              desc="The awarding body's certification is part of this course." />
            <Box className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Duration" hint="hours">
                <FInput icon={Clock} type="number" min="1" step="1"
                  value={form.duration_hours} onChange={set("duration_hours")} placeholder="16" />
              </Field>
              <Field label="Category name">
                <FInput icon={Tag} value={form.category_name} onChange={set("category_name")} placeholder="Project Management" />
              </Field>
            </Box>
            <Field label="Category slug" hint="optional">
              <FInput icon={Tag} value={form.category_slug} onChange={set("category_slug")} placeholder="project-management" />
            </Field>
          </Section>

          <Section label="Details" icon={FileText}>
            <Field label="Description" hint="optional">
              <FTextarea value={form.description} onChange={set("description")} rows={4}
                placeholder="A short summary of the course…" />
            </Field>
          </Section>

          <Section label="Status" icon={CheckCircle2}>
            <ToggleRow icon={CheckCircle2}
              on={form.is_active}
              onChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              title="Active"
              desc="Inactive courses are hidden from the active catalogue." />
          </Section>

          {(error || fieldErrors) && (
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
          )}
        </Box>

        <DialogFooter className="px-7 pt-4 pb-6 border-t border-slate-100 bg-white">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}
            className="border-slate-200 text-slate-600 hover:bg-slate-100">Cancel</Button>
          <Button onClick={submit} disabled={submitting}
            className="bg-violet-600 hover:bg-violet-700 text-white border-0 shadow-sm px-6">
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Add course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
