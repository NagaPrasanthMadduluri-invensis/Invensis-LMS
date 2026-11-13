"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Dialog, DialogContent, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserCheck, Lock, Loader2, ArrowRight } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { useProfileCompletion } from "@/providers/profile-completion-provider";
import { updateMyProfile } from "@/services/api/me";

const PROFILE_HREF = { trainer: "/trainer/profile", learner: "/profile" };

// Mirrors the industry list on the full profile form (components/learner/
// profile-settings.jsx). Kept in sync by hand — it's a stable, rarely-changed set.
const INDUSTRIES = [
  "Information Technology",
  "Banking & Financial Services",
  "Insurance",
  "Healthcare & Pharmaceuticals",
  "Manufacturing",
  "Retail & E-commerce",
  "Telecommunications",
  "Energy & Utilities",
  "Construction & Real Estate",
  "Transportation & Logistics",
  "Education",
  "Government & Public Sector",
  "Media & Entertainment",
  "Professional Services & Consulting",
  "Other",
];

// Per-field input type + placeholder for the quick inline form. The backend
// (profile.schema) stores these as free text, so a light control is enough here;
// the full profile page keeps the stricter validation.
const FIELD_META = {
  first_name: { type: "text", placeholder: "e.g. Priya" },
  last_name: { type: "text", placeholder: "e.g. Sharma" },
  phone: { type: "tel", placeholder: "e.g. +91 98765 43210" },
  country: { type: "text", placeholder: "e.g. India" },
  city: { type: "text", placeholder: "e.g. Bengaluru" },
  company_name: { type: "text", placeholder: "e.g. Acme Corp" },
  industry: { type: "industry" },
  job_title: { type: "text", placeholder: "e.g. Project Manager" },
  department: { type: "text", placeholder: "e.g. Operations" },
  years_experience: { type: "number", placeholder: "e.g. 5" },
};

const inputCls =
  "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-foreground shadow-sm " +
  "placeholder:text-foreground-subtle focus:outline-none focus:ring-2 focus:ring-primary-border";

/**
 * Post-login nudge to finish the profile. Learners get an inline mini-form that
 * saves in place; trainers get the same look but are sent to their profile page
 * (their missing items — résumé, specializations — don't fit a quick modal).
 * Suppressed on the profile page itself and once the profile is complete.
 */
export function ProfileCompletionModal() {
  const ctx = useProfileCompletion();
  const pathname = usePathname();

  if (!ctx || !ctx.tracked) return null;
  const href = PROFILE_HREF[ctx.role];
  const onProfilePage = pathname === href;
  const open = ctx.promptOpen && !onProfilePage;

  return ctx.role === "learner"
    ? <LearnerModal ctx={ctx} open={open} />
    : <TrainerModal ctx={ctx} open={open} href={href} />;
}

/** Shared chrome: icon header, progress bar, body, privacy note, footer. */
function Shell({ ctx, open, onClose, children, footer }) {
  const total = ctx.total || 0;
  const left = ctx.missing.length;
  const pct = total > 0 ? Math.round(((total - left) / total) * 100) : 100;
  const secs = Math.max(10, left * 10);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-[520px] overflow-hidden" style={{ padding: 0, gap: 0 }}>
        {/* Header */}
        <Box className="px-6 pt-6 pb-5">
          <Box className="flex items-start gap-3">
            <Box className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-success-subtle">
              <UserCheck className="h-5 w-5 text-success" />
            </Box>
            <Box className="min-w-0 pr-6">
              <DialogTitle className="text-xl font-bold text-foreground leading-tight">You&apos;re almost there</DialogTitle>
              <DialogDescription className="text-sm text-foreground-muted mt-1">
                Add a few quick details so we can show programs and events that fit your work.
              </DialogDescription>
            </Box>
          </Box>

          {/* Progress */}
          <Box className="mt-5 space-y-1.5">
            <Box className="flex items-center justify-between gap-3">
              <Text as="p" className="text-sm font-semibold text-foreground">Profile {pct}% complete</Text>
              <Text as="p" className="text-xs text-foreground-muted">
                {left} quick detail{left === 1 ? "" : "s"} left · ~{secs} sec
              </Text>
            </Box>
            <Box className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
              <Box className="h-full rounded-full bg-success transition-all" style={{ width: `${pct}%` }} />
            </Box>
          </Box>
        </Box>

        {/* Body */}
        <Box className="px-6 pb-2 space-y-4 max-h-[48vh] overflow-y-auto">
          {children}
        </Box>

        {/* Privacy note */}
        <Box className="flex items-center gap-1.5 px-6 pt-3 pb-5">
          <Lock className="h-3.5 w-3.5 shrink-0 text-foreground-subtle" />
          <Text as="p" className="text-xs text-foreground-muted">
            Only used to personalise your portal. You can edit this anytime.
          </Text>
        </Box>

        {/* Footer */}
        <Box className="flex items-center justify-between gap-3 border-t border-border bg-slate-50/60 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="text-sm font-semibold text-foreground-muted hover:text-foreground transition-colors"
          >
            Remind me later
          </button>
          {footer}
        </Box>
      </DialogContent>
    </Dialog>
  );
}

function FieldInput({ field, value, onChange, disabled }) {
  const meta = FIELD_META[field.key] || { type: "text" };
  return (
    <Box className="space-y-1.5">
      <Text as="label" htmlFor={`pc-${field.key}`} className="block text-sm font-semibold text-foreground">
        {field.label}
      </Text>
      {meta.type === "industry" ? (
        <select
          id={`pc-${field.key}`} value={value} disabled={disabled}
          onChange={(e) => onChange(e.target.value)} className={inputCls}
        >
          <option value="">Select your industry</option>
          {INDUSTRIES.map((i) => <option key={i} value={i}>{i}</option>)}
        </select>
      ) : (
        <input
          id={`pc-${field.key}`}
          type={meta.type === "number" ? "number" : meta.type === "tel" ? "tel" : "text"}
          inputMode={meta.type === "number" ? "numeric" : undefined}
          min={meta.type === "number" ? 0 : undefined}
          max={meta.type === "number" ? 80 : undefined}
          value={value} disabled={disabled}
          placeholder={meta.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      )}
    </Box>
  );
}

function LearnerModal({ ctx, open }) {
  const { token } = useAuth();
  const [values, setValues] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function save() {
    const payload = {};
    for (const f of ctx.missing) {
      const raw = values[f.key];
      if (raw == null || String(raw).trim() === "") continue;
      if (f.key === "years_experience") {
        const n = parseInt(raw, 10);
        if (!Number.isNaN(n)) payload.years_experience = n;
      } else {
        payload[f.key] = String(raw).trim();
      }
    }
    // Nothing entered — treat "Save" as "remind me later".
    if (Object.keys(payload).length === 0) { ctx.dismissPrompt(); return; }

    setSaving(true); setError(null);
    try {
      await updateMyProfile({ token, data: payload });
      await ctx.refresh(); // recompute; closes automatically once complete
      setValues({});
    } catch (e) {
      setError(e?.message || "Couldn't save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Shell
      ctx={ctx}
      open={open}
      onClose={() => ctx.dismissPrompt()}
      footer={
        <Button
          size="sm" disabled={saving}
          onClick={save}
          className="h-10 px-5 bg-error hover:bg-error text-error-foreground border-0 rounded-lg text-sm font-semibold"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save details"}
        </Button>
      }
    >
      {ctx.missing.map((f) => (
        <FieldInput
          key={f.key} field={f} value={values[f.key] ?? ""} disabled={saving}
          onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))}
        />
      ))}
      {error && <Text as="p" className="text-xs text-error">{error}</Text>}
    </Shell>
  );
}

function TrainerModal({ ctx, open, href }) {
  return (
    <Shell
      ctx={ctx}
      open={open}
      onClose={() => ctx.dismissPrompt()}
      footer={
        <Button
          size="sm"
          onClick={() => ctx.dismissPrompt()}
          render={<Link href={href} />}
          className="h-10 px-5 bg-error hover:bg-error text-error-foreground border-0 rounded-lg text-sm font-semibold"
        >
          Save details <ArrowRight className="h-4 w-4 ml-1.5" />
        </Button>
      }
    >
      <Text as="p" className="text-[11px] uppercase tracking-wider text-foreground-subtle font-semibold">
        Still needed
      </Text>
      <Box className="flex flex-wrap gap-1.5">
        {ctx.missing.map((f) => (
          <Box
            key={f.key}
            className="inline-flex items-center rounded-lg bg-surface-muted px-2.5 py-1 text-[11px] font-medium text-foreground-muted ring-1 ring-border"
          >
            {f.label}
          </Box>
        ))}
      </Box>
    </Shell>
  );
}
