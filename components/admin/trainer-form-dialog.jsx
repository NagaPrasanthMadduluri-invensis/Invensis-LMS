"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { createTrainer, updateTrainer } from "@/services/api/admin/admin-api";

const EMPTY = { name: "", email: "", password: "", bio: "", experience: "", rate: "", is_active: true };

/**
 * Create or edit a trainer.
 *   mode="create" → POST /admin/trainers (name + email required; password optional)
 *   mode="edit"   → PATCH /admin/trainers/:id (email is NOT editable)
 */
export function TrainerFormDialog({ open, onOpenChange, token, mode = "create", trainer = null, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState(null);

  const isEdit = mode === "edit";

  useEffect(() => {
    if (!open) return;
    setError(null);
    setFieldErrors(null);
    setForm(
      isEdit && trainer
        ? {
            ...EMPTY,
            name: trainer.name || "",
            email: trainer.email || "",
            bio: trainer.bio || "",
            experience: trainer.experience || "",
            rate: trainer.rate != null ? String(trainer.rate) : "",
            is_active: trainer.is_active !== false,
          }
        : EMPTY
    );
  }, [open, isEdit, trainer]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit() {
    if (!isEdit && (!form.name.trim() || !form.email.trim())) {
      setError("Name and email are required.");
      return;
    }
    if (isEdit && !form.name.trim()) {
      setError("Name is required.");
      return;
    }
    setSubmitting(true);
    setError(null);
    setFieldErrors(null);
    try {
      if (isEdit) {
        const data = {
          name: form.name.trim(),
          bio: form.bio.trim(),
          experience: form.experience.trim(),
          is_active: form.is_active,
        };
        if (form.rate.trim()) data.rate = Number(form.rate);
        await updateTrainer({ token, trainerId: trainer.id, data });
      } else {
        const data = { name: form.name.trim(), email: form.email.trim() };
        if (form.password.trim()) data.password = form.password.trim();
        if (form.bio.trim()) data.bio = form.bio.trim();
        if (form.experience.trim()) data.experience = form.experience.trim();
        if (form.rate.trim()) data.rate = Number(form.rate);
        await createTrainer({ token, data });
      }
      onSaved?.();
      onOpenChange(false);
    } catch (e) {
      setError(e.message);
      setFieldErrors(e.errors || null);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Trainer" : "Onboard Trainer"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update this trainer's profile. Email can't be changed."
              : "Create a trainer profile. A trainer account is created if the email is new."}
          </DialogDescription>
        </DialogHeader>
        <Box className="space-y-3 py-2">
          <Box className="space-y-1.5">
            <Label htmlFor="t-name">Full name *</Label>
            <Input id="t-name" value={form.name} onChange={set("name")} placeholder="Jane Trainer" />
          </Box>
          <Box className="space-y-1.5">
            <Label htmlFor="t-email">Email {isEdit ? "" : "*"}</Label>
            <Input
              id="t-email"
              type="email"
              value={form.email}
              onChange={set("email")}
              placeholder="trainer@example.com"
              disabled={isEdit}
            />
          </Box>
          {!isEdit && (
            <Box className="space-y-1.5">
              <Label htmlFor="t-pass">Password</Label>
              <Input
                id="t-pass"
                type="password"
                value={form.password}
                onChange={set("password")}
                placeholder="Optional — min 8 chars (default used if blank)"
              />
            </Box>
          )}
          <Box className="grid grid-cols-2 gap-3">
            <Box className="space-y-1.5">
              <Label htmlFor="t-exp">Experience</Label>
              <Input id="t-exp" value={form.experience} onChange={set("experience")} placeholder="10 years" />
            </Box>
            <Box className="space-y-1.5">
              <Label htmlFor="t-rate">Rate</Label>
              <Input id="t-rate" type="number" value={form.rate} onChange={set("rate")} placeholder="1500" />
            </Box>
          </Box>
          <Box className="space-y-1.5">
            <Label htmlFor="t-bio">Bio</Label>
            <Textarea id="t-bio" value={form.bio} onChange={set("bio")} placeholder="PMP-certified trainer…" rows={3} />
          </Box>
          {isEdit && (
            <Box className="flex items-center justify-between rounded-lg border px-3 py-2">
              <Box>
                <Text as="p" className="text-sm font-medium">Active</Text>
                <Text as="p" className="text-xs text-muted-foreground">Inactive trainers can't be assigned.</Text>
              </Box>
              <Switch
                checked={form.is_active}
                onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
              />
            </Box>
          )}
          {error && <Text as="p" className="text-xs text-red-600">{error}</Text>}
          {fieldErrors && (
            <Box className="text-xs text-red-600 space-y-0.5">
              {Object.entries(fieldErrors).map(([k, msgs]) => (
                <Text as="p" key={k}>{k}: {Array.isArray(msgs) ? msgs.join(", ") : String(msgs)}</Text>
              ))}
            </Box>
          )}
        </Box>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={submit} disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Save Changes" : "Create Trainer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
