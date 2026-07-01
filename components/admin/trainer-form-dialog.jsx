"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle,
} from "@/components/ui/dialog";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { createTrainer, updateTrainer } from "@/services/api/admin/admin-api";
import {
  AlertCircle, GraduationCap, Pencil, User, Mail, Lock, Clock,
  CheckCircle2, Plus, X, Upload, FileText, Award,
} from "lucide-react";

const EMPTY = { name: "", email: "", password: "", bio: "", experience: "", is_active: true };

const CERT_PRESETS = [
  "PMP", "PMI-ACP", "PRINCE2", "CSM", "CSPO", "SAFe", "ITIL", "Six Sigma",
  "AWS Certified", "Azure Fundamentals", "Google Cloud", "CPA", "CFA", "SHRM",
];

function FInput({ icon: Icon, accentColor = "indigo", ...props }) {
  const focusRing = accentColor === "red"
    ? "focus-within:border-red-400 focus-within:shadow-[0_0_0_3px_rgba(252,165,165,0.35)]"
    : "focus-within:border-indigo-400 focus-within:shadow-[0_0_0_3px_rgba(165,180,252,0.35)]";
  return (
    <Box className={`group flex items-center gap-3 h-12 rounded-xl border border-slate-200 bg-white px-3.5 shadow-sm hover:border-slate-300 ${focusRing} transition-all duration-150`}>
      {Icon && <Icon className="h-4 w-4 text-slate-400 shrink-0 group-focus-within:text-indigo-500 transition-colors" />}
      <input
        {...props}
        className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </Box>
  );
}

function FTextarea({ rows = 3, ...props }) {
  return (
    <Box className="rounded-xl border border-slate-200 bg-white shadow-sm hover:border-slate-300 focus-within:border-indigo-400 focus-within:shadow-[0_0_0_3px_rgba(165,180,252,0.35)] transition-all duration-150">
      <textarea
        rows={rows}
        {...props}
        className="w-full bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400 resize-none px-3.5 py-3"
      />
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

function CertInput({ value, onChange }) {
  const [input, setInput] = useState("");

  function add(cert) {
    const trimmed = cert.trim();
    if (!trimmed || value.includes(trimmed)) return;
    onChange([...value, trimmed]);
    setInput("");
  }

  function remove(cert) {
    onChange(value.filter((c) => c !== cert));
  }

  function onKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      add(input);
    }
    if (e.key === "Backspace" && !input && value.length) {
      remove(value[value.length - 1]);
    }
  }

  return (
    <Box className="space-y-3">
      {/* Tag chips */}
      {value.length > 0 && (
        <Box className="flex flex-wrap gap-1.5">
          {value.map((cert) => (
            <Box key={cert} className="inline-flex items-center gap-1 bg-indigo-50 ring-1 ring-indigo-200 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
              <Award className="h-3 w-3 shrink-0" />
              {cert}
              <button type="button" onClick={() => remove(cert)} className="ml-0.5 text-indigo-400 hover:text-indigo-700 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </Box>
          ))}
        </Box>
      )}

      {/* Custom input */}
      <Box className="group flex items-center gap-2 h-11 rounded-xl border border-slate-200 bg-white px-3 shadow-sm hover:border-slate-300 focus-within:border-indigo-400 focus-within:shadow-[0_0_0_3px_rgba(165,180,252,0.35)] transition-all duration-150">
        <Award className="h-4 w-4 text-slate-400 shrink-0 group-focus-within:text-indigo-500 transition-colors" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a certification and press Enter…"
          className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400"
        />
        {input.trim() && (
          <button type="button" onClick={() => add(input)}
            className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-md transition-colors shrink-0">
            <Plus className="h-3 w-3" /> Add
          </button>
        )}
      </Box>

      {/* Preset quick-add pills */}
      <Box className="flex flex-wrap gap-1.5">
        {CERT_PRESETS.filter((c) => !value.includes(c)).map((cert) => (
          <button key={cert} type="button" onClick={() => add(cert)}
            className="text-[11px] font-medium text-slate-500 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 hover:ring-1 hover:ring-indigo-200 px-2.5 py-1 rounded-lg transition-all">
            + {cert}
          </button>
        ))}
      </Box>
    </Box>
  );
}

function CVUpload({ value, onChange }) {
  const inputRef = useRef(null);

  function onFileChange(e) {
    const file = e.target.files?.[0] || null;
    onChange(file);
  }

  function clear(e) {
    e.stopPropagation();
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <Box>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        className="hidden"
        onChange={onFileChange}
      />
      {value ? (
        <Box className="flex items-center gap-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3">
          <Box className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0">
            <FileText className="h-4 w-4 text-indigo-600" />
          </Box>
          <Box className="flex-1 min-w-0">
            <Text as="p" className="text-sm font-semibold text-indigo-800 truncate">{value.name}</Text>
            <Text as="p" className="text-[11px] text-indigo-500 mt-0.5">{(value.size / 1024).toFixed(0)} KB</Text>
          </Box>
          <button type="button" onClick={clear}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-indigo-400 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0">
            <X className="h-3.5 w-3.5" />
          </button>
        </Box>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 bg-slate-50 py-5 transition-all group">
          <Box className="w-9 h-9 rounded-xl bg-white border border-slate-200 group-hover:border-indigo-200 flex items-center justify-center shadow-sm transition-colors">
            <Upload className="h-4 w-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
          </Box>
          <Box className="text-center">
            <Text as="p" className="text-xs font-semibold text-slate-600 group-hover:text-indigo-600 transition-colors">Click to upload CV</Text>
            <Text as="p" className="text-[10px] text-slate-400 mt-0.5">PDF, DOC, DOCX</Text>
          </Box>
        </button>
      )}
    </Box>
  );
}

export function TrainerFormDialog({ open, onOpenChange, token, mode = "create", trainer = null, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [certifications, setCertifications] = useState([]);
  const [cvFile, setCvFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState(null);
  const isEdit = mode === "edit";

  useEffect(() => {
    if (!open) return;
    setError(null); setFieldErrors(null); setCvFile(null);
    if (isEdit && trainer) {
      setForm({ ...EMPTY, name: trainer.name || "", email: trainer.email || "", bio: trainer.bio || "", experience: trainer.experience || "", is_active: trainer.is_active !== false });
      setCertifications(Array.isArray(trainer.certificates) ? trainer.certificates : []);
    } else {
      setForm(EMPTY);
      setCertifications([]);
    }
  }, [open, isEdit, trainer]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit() {
    if (!isEdit && (!form.name.trim() || !form.email.trim())) { setError("Name and email are required."); return; }
    if (isEdit && !form.name.trim()) { setError("Name is required."); return; }
    setSubmitting(true); setError(null); setFieldErrors(null);
    try {
      if (isEdit) {
        const data = { name: form.name.trim(), bio: form.bio.trim(), experience: form.experience.trim(), is_active: form.is_active };
        if (certifications.length) data.certificates = certifications;
        await updateTrainer({ token, trainerId: trainer.id, data });
      } else {
        const data = { name: form.name.trim(), email: form.email.trim() };
        if (form.password.trim()) data.password = form.password.trim();
        if (form.bio.trim()) data.bio = form.bio.trim();
        if (form.experience.trim()) data.experience = form.experience.trim();
        if (certifications.length) data.certificates = certifications;
        await createTrainer({ token, data });
      }
      onSaved?.(); onOpenChange(false);
    } catch (e) {
      setError(e.message); setFieldErrors(e.errors || null);
    } finally { setSubmitting(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] overflow-hidden" style={{padding:0,gap:0}}>
        <Box className="bg-gradient-to-r from-indigo-50 via-purple-50 to-violet-50 border-b border-indigo-100 px-6 py-5">
          <Box className="flex items-center gap-3">
            <Box className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
              {isEdit ? <Pencil className="w-4 h-4 text-white" /> : <GraduationCap className="w-5 h-5 text-white" />}
            </Box>
            <Box>
              <DialogTitle className="text-[15px] font-bold text-slate-800">
                {isEdit ? "Edit Trainer" : "Onboard Trainer"}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">
                {isEdit ? "Update profile. Email cannot be changed." : "Create a trainer profile and account."}
              </DialogDescription>
            </Box>
          </Box>
        </Box>

        <Box className="px-6 py-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <Section label="Identity">
            <Field label="Full name" required>
              <FInput icon={User} value={form.name} onChange={set("name")} placeholder="Jane Trainer" />
            </Field>
            <Field label="Email" required={!isEdit}>
              <FInput icon={Mail} type="email" value={form.email} onChange={set("email")} placeholder="trainer@example.com" disabled={isEdit} />
            </Field>
            {!isEdit && (
              <Field label="Password">
                <FInput icon={Lock} type="password" value={form.password} onChange={set("password")} placeholder="Optional — defaults used if blank" />
              </Field>
            )}
          </Section>

          <Section label="Profile">
            <Field label="Experience">
              <FInput icon={Clock} value={form.experience} onChange={set("experience")} placeholder="10 years" />
            </Field>
            <Field label="Bio">
              <FTextarea value={form.bio} onChange={set("bio")} placeholder="PMP-certified trainer with expertise in..." rows={3} />
            </Field>
          </Section>

          <Section label="Certifications">
            <Field label="Add certifications" hint="Press Enter or comma to add">
              <CertInput value={certifications} onChange={setCertifications} />
            </Field>
          </Section>

          {!isEdit && (
            <Section label="CV / Resume">
              <Field label="Upload CV" hint="Optional">
                <CVUpload value={cvFile} onChange={setCvFile} />
              </Field>
            </Section>
          )}

          {isEdit && (
            <Box className="flex items-center justify-between rounded-xl border border-indigo-100 bg-indigo-50/60 px-4 py-3.5">
              <Box className="flex items-center gap-3">
                <Box className={`w-8 h-8 rounded-lg flex items-center justify-center ${form.is_active ? "bg-emerald-100" : "bg-slate-100"}`}>
                  <CheckCircle2 className={`h-4 w-4 ${form.is_active ? "text-emerald-600" : "text-slate-400"}`} />
                </Box>
                <Box>
                  <Text as="p" className="text-sm font-semibold text-slate-800">Active trainer</Text>
                  <Text as="p" className="text-xs text-slate-500 mt-0.5">Inactive trainers can&apos;t be assigned.</Text>
                </Box>
              </Box>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
            </Box>
          )}

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

        <DialogFooter className="px-6 pt-4 pb-6 border-t border-slate-100 bg-slate-50/50">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="border-slate-200 text-slate-600 hover:bg-slate-100">Cancel</Button>
          <Button onClick={submit} disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white border-0 shadow-sm px-6">
            {submitting ? "Saving..." : isEdit ? "Save Changes" : "Create Trainer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
