"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle,
} from "@/components/ui/dialog";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { createTrainer, updateTrainer } from "@/services/api/admin/admin-api";
import {
  AlertCircle, GraduationCap, User, Mail, Clock,
  CheckCircle2, Plus, X, Award, Eye, EyeOff,
  MapPin, Globe2, IndianRupee, Target, Wifi, Briefcase, Sparkles,
} from "lucide-react";

const EMPTY = {
  name: "", email: "", bio: "", experience: "",
  rate: "", city: "", country: "", is_remote: false, is_active: true,
};

const AVATAR_COLORS = [
  "bg-violet-500", "bg-teal-500", "bg-emerald-500", "bg-rose-500",
  "bg-amber-500", "bg-cyan-500", "bg-pink-500", "bg-indigo-500",
];

function getInitials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "T";
}

function avatarColor(seed = "") {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) & 0xff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

const CERT_PRESETS = [
  "PMP", "PMI-ACP", "PRINCE2", "CSM", "CSPO", "SAFe", "ITIL", "Six Sigma",
  "AWS Certified", "Azure Fundamentals", "Google Cloud", "CPA", "CFA", "SHRM",
];

// Fixed list of subject-excellence areas the admin picks from.
const SPECIALIZATION_PRESETS = [
  "PMP", "PRINCE2", "PMI-ACP", "Scrum (CSM)", "Product Owner (CSPO)", "SAFe Agile",
  "ITIL", "Six Sigma", "Business Analysis", "Agile Coaching", "DevOps",
  "AWS", "Azure", "Leadership & Management",
];

function FInput({ icon: Icon, accentColor = "indigo", type, ...props }) {
  const [showPwd, setShowPwd] = useState(false);
  const isPassword = type === "password";
  const focusRing = accentColor === "red"
    ? "focus-within:border-red-400 focus-within:shadow-[0_0_0_3px_rgba(252,165,165,0.35)]"
    : "focus-within:border-violet-400 focus-within:shadow-[0_0_0_3px_rgba(167,139,250,0.35)]";
  return (
    <Box className={`group flex items-center gap-3 h-12 rounded-xl border border-slate-200 bg-white px-3.5 shadow-sm hover:border-slate-300 ${focusRing} transition-all duration-150`}>
      {Icon && <Icon className="h-4 w-4 text-slate-400 shrink-0 group-focus-within:text-violet-500 transition-colors" />}
      <input
        {...props}
        type={isPassword ? (showPwd ? "text" : "password") : type}
        className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      {isPassword && (
        <button type="button" onClick={() => setShowPwd((v) => !v)}
          className="shrink-0 text-slate-400 hover:text-violet-500 transition-colors">
          {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      )}
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
            <Box key={cert} className="inline-flex items-center gap-1 bg-violet-50 ring-1 ring-violet-200 text-violet-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
              <Award className="h-3 w-3 shrink-0" />
              {cert}
              <button type="button" onClick={() => remove(cert)} className="ml-0.5 text-violet-400 hover:text-violet-700 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </Box>
          ))}
        </Box>
      )}

      {/* Custom input */}
      <Box className="group flex items-center gap-2 h-11 rounded-xl border border-slate-200 bg-white px-3 shadow-sm hover:border-slate-300 focus-within:border-violet-400 focus-within:shadow-[0_0_0_3px_rgba(167,139,250,0.35)] transition-all duration-150">
        <Award className="h-4 w-4 text-slate-400 shrink-0 group-focus-within:text-violet-500 transition-colors" />
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type a certification and press Enter…"
          className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400"
        />
        {input.trim() && (
          <button type="button" onClick={() => add(input)}
            className="flex items-center gap-1 text-[11px] font-semibold text-violet-600 hover:text-violet-700 bg-violet-50 hover:bg-violet-100 px-2 py-1 rounded-md transition-colors shrink-0">
            <Plus className="h-3 w-3" /> Add
          </button>
        )}
      </Box>

      {/* Preset quick-add pills */}
      <Box className="flex flex-wrap gap-1.5">
        {CERT_PRESETS.filter((c) => !value.includes(c)).map((cert) => (
          <button key={cert} type="button" onClick={() => add(cert)}
            className="text-[11px] font-medium text-slate-500 hover:text-violet-600 bg-slate-100 hover:bg-violet-50 hover:ring-1 hover:ring-violet-200 px-2.5 py-1 rounded-lg transition-all">
            + {cert}
          </button>
        ))}
      </Box>
    </Box>
  );
}

function SpecializationInput({ value, onChange }) {
  function toggle(item) {
    onChange(value.includes(item) ? value.filter((s) => s !== item) : [...value, item]);
  }
  return (
    <Box className="space-y-3">
      {value.length > 0 && (
        <Box className="flex flex-wrap gap-1.5">
          {value.map((s) => (
            <Box key={s} className="inline-flex items-center gap-1 bg-violet-50 ring-1 ring-violet-200 text-violet-700 text-xs font-semibold px-2.5 py-1 rounded-lg">
              <Target className="h-3 w-3 shrink-0" />
              {s}
              <button type="button" onClick={() => toggle(s)} className="ml-0.5 text-violet-400 hover:text-violet-700 transition-colors">
                <X className="h-3 w-3" />
              </button>
            </Box>
          ))}
        </Box>
      )}
      <Box className="flex flex-wrap gap-1.5">
        {SPECIALIZATION_PRESETS.map((s) => {
          const active = value.includes(s);
          return (
            <button key={s} type="button" onClick={() => toggle(s)}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all ${
                active
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-500 hover:text-violet-600 bg-slate-100 hover:bg-violet-50 hover:ring-1 hover:ring-violet-200"
              }`}>
              {active ? "✓ " : "+ "}{s}
            </button>
          );
        })}
      </Box>
    </Box>
  );
}

export function TrainerFormDialog({ open, onOpenChange, token, mode = "create", trainer = null, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [certifications, setCertifications] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState(null);
  const isEdit = mode === "edit";

  useEffect(() => {
    if (!open) return;
    setError(null); setFieldErrors(null);
    if (isEdit && trainer) {
      setForm({
        ...EMPTY,
        name: trainer.name || "",
        email: trainer.email || "",
        bio: trainer.bio || "",
        experience: trainer.experience || "",
        rate: trainer.rate != null ? String(trainer.rate) : "",
        city: trainer.city || "",
        country: trainer.country || "",
        is_remote: !!trainer.is_remote,
        is_active: trainer.is_active !== false,
      });
      setCertifications(Array.isArray(trainer.certificates) ? trainer.certificates.map((c) => c?.title ?? c) : []);
      setSpecializations(Array.isArray(trainer.specializations) ? trainer.specializations : []);
    } else {
      setForm(EMPTY);
      setCertifications([]);
      setSpecializations([]);
    }
  }, [open, isEdit, trainer]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit() {
    if (!form.name.trim() || !form.email.trim()) { setError("Name and email are required."); return; }
    setSubmitting(true); setError(null); setFieldErrors(null);
    try {
      const rateNum = form.rate.trim() === "" ? null : Number(form.rate);
      if (rateNum != null && (Number.isNaN(rateNum) || rateNum < 0)) {
        setError("Rate must be a valid non-negative number."); setSubmitting(false); return;
      }
      if (isEdit) {
        const data = {
          name: form.name.trim(),
          email: form.email.trim(),
          bio: form.bio.trim(),
          experience: form.experience.trim(),
          city: form.city.trim(),
          country: form.country.trim(),
          is_remote: form.is_remote,
          is_active: form.is_active,
          rate: rateNum,
          specializations,
          certificates: certifications.map((c) => ({ title: c })),
        };
        await updateTrainer({ token, trainerId: trainer.id, data });
      } else {
        // New Trainer collects only name + email. The account is created with no
        // password (a setup link is emailed), and the trainer fills in the rest
        // of their profile themselves — the admin can also edit it later.
        await createTrainer({ token, data: { name: form.name.trim(), email: form.email.trim() } });
      }
      onSaved?.(); onOpenChange(false);
    } catch (e) {
      setError(e.message); setFieldErrors(e.errors || null);
    } finally { setSubmitting(false); }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={`${isEdit ? "sm:max-w-[960px]" : "sm:max-w-[540px]"} overflow-hidden`} style={{ padding: 0, gap: 0 }}>

        {/* ── Header ── identifies whose profile is being edited ── */}
        <Box className="bg-gradient-to-r from-violet-600 to-indigo-600 px-7 py-5">
          {isEdit ? (
            <Box className="flex items-center gap-4">
              <Box className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-lg font-bold shrink-0 shadow-md ring-2 ring-white/30 ${avatarColor(trainer?.id || form.name)}`}>
                {getInitials(form.name)}
              </Box>
              <Box className="min-w-0 flex-1">
                <DialogTitle className="text-base font-bold text-white truncate">{form.name || "Edit trainer"}</DialogTitle>
                <DialogDescription className="text-[13px] text-violet-100 mt-0.5 truncate">
                  {form.email || "Update this trainer's profile"}
                </DialogDescription>
              </Box>
              <Box className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold shrink-0 ${form.is_active ? "bg-emerald-400/20 text-emerald-50 ring-1 ring-emerald-300/40" : "bg-slate-900/20 text-white/80 ring-1 ring-white/20"}`}>
                <Box className={`w-1.5 h-1.5 rounded-full ${form.is_active ? "bg-emerald-300" : "bg-slate-300"}`} />
                {form.is_active ? "Active" : "Inactive"}
              </Box>
            </Box>
          ) : (
            <Box className="flex items-center gap-3">
              <Box className="w-11 h-11 rounded-xl bg-white/15 ring-1 ring-white/25 flex items-center justify-center shrink-0">
                <GraduationCap className="w-5 h-5 text-white" />
              </Box>
              <Box>
                <DialogTitle className="text-[15px] font-bold text-white">Add a new trainer</DialogTitle>
                <DialogDescription className="text-[13px] text-violet-100 mt-0.5">
                  Start with their name and email — they set up the rest.
                </DialogDescription>
              </Box>
            </Box>
          )}
        </Box>

        <Box className="px-7 py-6 max-h-[74vh] overflow-y-auto bg-slate-50/60">
          {isEdit ? (
            <Box className="space-y-5">
              <Section label="Identity" icon={User}>
                <Box className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full name" required>
                    <FInput icon={User} value={form.name} onChange={set("name")} placeholder="Jane Trainer" />
                  </Field>
                  <Field label="Email" required hint="Changing this changes their login">
                    <FInput icon={Mail} type="email" value={form.email} onChange={set("email")} placeholder="trainer@example.com" />
                  </Field>
                </Box>
              </Section>

              {/* Two columns — use the extra width instead of one long scroll */}
              <Box className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                <Box className="space-y-5">
                  <Section label="Professional" icon={Briefcase}>
                    <Box className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Experience">
                        <FInput icon={Clock} value={form.experience} onChange={set("experience")} placeholder="10 years" />
                      </Field>
                      <Field label="Rate" hint="per hour (₹)">
                        <FInput icon={IndianRupee} type="number" min="0" value={form.rate} onChange={set("rate")} placeholder="150" />
                      </Field>
                    </Box>
                    <Field label="Bio">
                      <FTextarea value={form.bio} onChange={set("bio")} placeholder="PMP-certified trainer with expertise in…" rows={4} />
                    </Field>
                  </Section>

                  <Section label="Based in" icon={MapPin}>
                    <Box className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="City">
                        <FInput icon={MapPin} value={form.city} onChange={set("city")} placeholder="Bengaluru" />
                      </Field>
                      <Field label="Country">
                        <FInput icon={Globe2} value={form.country} onChange={set("country")} placeholder="India" />
                      </Field>
                    </Box>
                    <Box className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                      <Box className="flex items-center gap-3">
                        <Box className={`w-8 h-8 rounded-lg flex items-center justify-center ${form.is_remote ? "bg-blue-100" : "bg-slate-100"}`}>
                          <Wifi className={`h-4 w-4 ${form.is_remote ? "text-blue-600" : "text-slate-400"}`} />
                        </Box>
                        <Box>
                          <Text as="p" className="text-sm font-semibold text-slate-800">Delivers remotely</Text>
                          <Text as="p" className="text-xs text-slate-500 mt-0.5">Can run sessions online.</Text>
                        </Box>
                      </Box>
                      <Switch checked={form.is_remote} onCheckedChange={(v) => setForm((f) => ({ ...f, is_remote: v }))} />
                    </Box>
                  </Section>
                </Box>

                <Box className="space-y-5">
                  <Section label="Expertise" icon={Target} hint="What they can train">
                    <SpecializationInput value={specializations} onChange={setSpecializations} />
                  </Section>

                  <Section label="Certifications" icon={Award} hint="Enter or comma to add">
                    <CertInput value={certifications} onChange={setCertifications} />
                  </Section>
                </Box>
              </Box>

              <Section label="Account status" icon={CheckCircle2}>
                <Box className="flex items-center justify-between">
                  <Box className="flex items-center gap-3">
                    <Box className={`w-8 h-8 rounded-lg flex items-center justify-center ${form.is_active ? "bg-emerald-100" : "bg-slate-100"}`}>
                      <CheckCircle2 className={`h-4 w-4 ${form.is_active ? "text-emerald-600" : "text-slate-400"}`} />
                    </Box>
                    <Box>
                      <Text as="p" className="text-sm font-semibold text-slate-800">Active trainer</Text>
                      <Text as="p" className="text-xs text-slate-500 mt-0.5">Inactive trainers can&apos;t be assigned to trainings.</Text>
                    </Box>
                  </Box>
                  <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
                </Box>
              </Section>
            </Box>
          ) : (
            <Box className="space-y-5">
              <Section label="Identity" icon={User}>
                <Field label="Full name" required>
                  <FInput icon={User} value={form.name} onChange={set("name")} placeholder="Jane Trainer" />
                </Field>
                <Field label="Email" required hint="We'll email them a setup link">
                  <FInput icon={Mail} type="email" value={form.email} onChange={set("email")} placeholder="trainer@example.com" />
                </Field>
              </Section>

              <Box className="flex items-start gap-3 rounded-2xl border border-violet-100 bg-violet-50/70 px-4 py-3.5">
                <Box className="w-8 h-8 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-violet-600" />
                </Box>
                <Text as="p" className="text-xs text-slate-600 leading-relaxed">
                  The trainer gets an email to set their password and fill in their bio, expertise, certifications, and resume. You can review or edit all of it later from this table.
                </Text>
              </Box>
            </Box>
          )}

          {(error || fieldErrors) && (
            <Box className="mt-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3">
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting} className="border-slate-200 text-slate-600 hover:bg-slate-100">Cancel</Button>
          <Button onClick={submit} disabled={submitting} className="bg-violet-600 hover:bg-violet-700 text-white border-0 shadow-sm px-6">
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Add trainer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
