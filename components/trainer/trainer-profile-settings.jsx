"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User, Mail, MapPin, Sparkles, FileText, Upload, X, Download,
  Briefcase, Globe, CheckCircle2,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchMyTrainerProfile,
  updateMyTrainerProfile,
  getResumeUploadUrl,
  uploadResumeFile,
} from "@/services/api/trainer";

// A resume PDF is small — cap uploads so we never push a bloated file to storage.
const RESUME_MAX_BYTES = 500 * 1024; // 500 KB
const RESUME_TYPE = "application/pdf";

const inputCls = "h-10 w-full text-sm bg-background border border-slate-300 focus-visible:border-violet-400 focus-visible:ring-violet-400";

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

// Maps the API's snake_case field-error keys onto our camelCase form-state keys.
function mapFieldErrors(apiErrors, keyMap) {
  const mapped = {};
  for (const [apiKey, formKey] of Object.entries(keyMap)) {
    if (apiErrors?.[apiKey]) mapped[formKey] = apiErrors[apiKey][0];
  }
  return mapped;
}

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
        <Box className="flex items-center gap-2.5">
          <Box className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-violet-500" />
          </Box>
          <Box>
            <CardTitle className="text-sm font-bold text-slate-800">{title}</CardTitle>
            {description && <Text as="p" className="text-xs text-slate-400 mt-0.5">{description}</Text>}
          </Box>
        </Box>
      </CardHeader>
      <CardContent className="p-6 space-y-5">{children}</CardContent>
    </Card>
  );
}

function FieldRow({ label, htmlFor, optional, error, children }) {
  return (
    <Box className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-semibold text-slate-600">
        {label}
        {optional && <Text as="span" className="text-slate-400 font-normal ml-1">(Optional)</Text>}
      </Label>
      {children}
      {error && <Text as="p" className="text-xs text-red-600">{error}</Text>}
    </Box>
  );
}

function ProfileSkeleton() {
  return (
    <Box className="space-y-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <Box className="px-6 py-4 border-b border-slate-100"><Skeleton className="h-5 w-44" /></Box>
          <Box className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, j) => <Skeleton key={j} className="h-10 rounded-lg" />)}
          </Box>
        </Card>
      ))}
    </Box>
  );
}

export function TrainerProfileSettings() {
  const { token, updateUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  /* ── editable fields ── */
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [experience, setExperience] = useState("");
  const [specializations, setSpecializations] = useState([]);
  const [specInput, setSpecInput] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [isRemote, setIsRemote] = useState(false);

  /* ── resume ── */
  const [resumeUrl, setResumeUrl] = useState(null);
  const [resumeKey, setResumeKey] = useState(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const resumeInputRef = useRef(null);

  /* ── save state ── */
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!token) return;
    fetchMyTrainerProfile({ token })
      .then(({ trainer }) => {
        setName(trainer.name || "");
        setEmail(trainer.email || "");
        setBio(trainer.bio || "");
        setExperience(trainer.experience || "");
        setSpecializations(Array.isArray(trainer.specializations) ? trainer.specializations : []);
        setCity(trainer.city || "");
        setCountry(trainer.country || "");
        setIsRemote(!!trainer.is_remote);
        setResumeUrl(trainer.resume_url || null);
        setResumeKey(trainer.resume_key || null);
      })
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  function addSpecialization(raw) {
    const value = raw.trim();
    if (!value) return;
    setSpecializations((prev) => (prev.includes(value) ? prev : [...prev, value]));
    setSpecInput("");
  }

  function handleSpecKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSpecialization(specInput);
    } else if (e.key === "Backspace" && !specInput && specializations.length) {
      setSpecializations((prev) => prev.slice(0, -1));
    }
  }

  function removeSpecialization(value) {
    setSpecializations((prev) => prev.filter((s) => s !== value));
  }

  async function handleResumeChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setResumeError("");

    if (file.type !== RESUME_TYPE) {
      setResumeError("Please choose a PDF file.");
      if (resumeInputRef.current) resumeInputRef.current.value = "";
      return;
    }
    if (file.size > RESUME_MAX_BYTES) {
      setResumeError(`File must be ${formatBytes(RESUME_MAX_BYTES)} or smaller (yours is ${formatBytes(file.size)}).`);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
      return;
    }

    setResumeUploading(true);
    try {
      const { upload_url, resume_key, headers } = await getResumeUploadUrl({ token });
      await uploadResumeFile({ uploadUrl: upload_url, headers, file });
      const { trainer } = await updateMyTrainerProfile({ token, data: { resume_key } });
      setResumeUrl(trainer.resume_url || null);
      setResumeKey(trainer.resume_key || null);
    } catch (err) {
      setResumeError(err.message || "Failed to upload resume. Please try again.");
    } finally {
      setResumeUploading(false);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
    }
  }

  async function removeResume() {
    setResumeError("");
    setResumeUploading(true);
    try {
      const { trainer } = await updateMyTrainerProfile({ token, data: { resume_key: null } });
      setResumeUrl(trainer.resume_url || null);
      setResumeKey(trainer.resume_key || null);
    } catch (err) {
      setResumeError(err.message || "Failed to remove resume. Please try again.");
    } finally {
      setResumeUploading(false);
    }
  }

  async function saveProfile() {
    const nextErrors = {};
    if (!name.trim()) nextErrors.name = "Name is required.";
    setErrors(nextErrors);
    setSaveError("");
    if (Object.keys(nextErrors).length) return;

    // Fold any half-typed specialization into the list before saving.
    const specs = specInput.trim() && !specializations.includes(specInput.trim())
      ? [...specializations, specInput.trim()]
      : specializations;

    setSaving(true);
    try {
      const { trainer } = await updateMyTrainerProfile({
        token,
        data: {
          name: name.trim(),
          bio: bio.trim() || null,
          experience: experience.trim() || null,
          specializations: specs,
          city: city.trim() || null,
          country: country.trim() || null,
          is_remote: isRemote,
        },
      });
      setSpecializations(Array.isArray(trainer.specializations) ? trainer.specializations : specs);
      setSpecInput("");
      updateUser({ name: trainer.name });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setErrors(mapFieldErrors(e.errors, { name: "name", bio: "bio", experience: "experience" }));
      setSaveError(e.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <ProfileSkeleton />;

  if (loadError) {
    return (
      <Card className="p-6 rounded-2xl border-0 bg-red-50 shadow-sm">
        <Text as="p" className="text-red-600 text-sm">Failed to load your profile: {loadError}</Text>
      </Card>
    );
  }

  return (
    <Box className="space-y-5">
      {/* Basic info */}
      <SectionCard icon={User} title="Basic Information" description="Your name and contact identity.">
        <Box className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FieldRow label="Full Name" htmlFor="name" error={errors.name}>
            <Input
              id="name" value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={!!errors.name} className={inputCls}
            />
          </FieldRow>
          <FieldRow label="Email">
            <Box className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input value={email} disabled className={`${inputCls} pl-9 text-slate-500`} />
            </Box>
            <Text as="p" className="text-[11px] text-slate-400">Managed by your admin — contact them to change it.</Text>
          </FieldRow>
        </Box>
      </SectionCard>

      {/* About & expertise */}
      <SectionCard icon={Sparkles} title="About & Expertise" description="How you're presented to learners and admins.">
        <FieldRow label="Bio" htmlFor="bio" optional>
          <Textarea
            id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4}
            placeholder="A short professional summary…"
            className="w-full text-sm bg-background border border-slate-300 focus-visible:border-violet-400 focus-visible:ring-violet-400"
          />
        </FieldRow>
        <FieldRow label="Experience" htmlFor="experience" optional>
          <Textarea
            id="experience" value={experience} onChange={(e) => setExperience(e.target.value)} rows={3}
            placeholder="e.g. 12 years delivering PMP & PRINCE2 corporate training."
            className="w-full text-sm bg-background border border-slate-300 focus-visible:border-violet-400 focus-visible:ring-violet-400"
          />
        </FieldRow>
        <FieldRow label="Specializations" htmlFor="specializations" optional>
          <Box className="rounded-lg border border-slate-300 bg-background px-2.5 py-2 focus-within:border-violet-400 focus-within:ring-1 focus-within:ring-violet-400">
            <Box className="flex flex-wrap items-center gap-1.5">
              {specializations.map((s) => (
                <Badge key={s} className="border-0 bg-violet-50 text-violet-700 text-xs font-semibold gap-1 pr-1">
                  {s}
                  <button type="button" onClick={() => removeSpecialization(s)} className="rounded-full hover:bg-violet-200/60 p-0.5">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <input
                id="specializations"
                value={specInput}
                onChange={(e) => setSpecInput(e.target.value)}
                onKeyDown={handleSpecKeyDown}
                onBlur={() => addSpecialization(specInput)}
                placeholder={specializations.length ? "" : "e.g. PMP, PRINCE2, Scrum…"}
                className="flex-1 min-w-[120px] bg-transparent text-sm outline-none py-1"
              />
            </Box>
          </Box>
          <Text as="p" className="text-[11px] text-slate-400">Press Enter or comma to add each subject.</Text>
        </FieldRow>
      </SectionCard>

      {/* Location */}
      <SectionCard icon={MapPin} title="Location & Availability" description="Where you're based and how you deliver.">
        <Box className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FieldRow label="City" htmlFor="city" optional>
            <Box className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} className={`${inputCls} pl-9`} />
            </Box>
          </FieldRow>
          <FieldRow label="Country" htmlFor="country" optional>
            <Box className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} className={`${inputCls} pl-9`} />
            </Box>
          </FieldRow>
        </Box>
        <Box className="flex items-center justify-between py-1">
          <Box>
            <Text as="p" className="text-sm font-medium text-slate-700">Remote delivery</Text>
            <Text as="p" className="text-xs text-slate-400">I deliver training online.</Text>
          </Box>
          <Switch checked={isRemote} onCheckedChange={setIsRemote} />
        </Box>
      </SectionCard>

      {/* Resume */}
      <SectionCard icon={FileText} title="Resume / CV" description={`PDF only, up to ${formatBytes(RESUME_MAX_BYTES)}.`}>
        {resumeKey ? (
          <Box className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            <Box className="flex items-center gap-3 min-w-0">
              <Box className="w-9 h-9 rounded-lg bg-rose-50 flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-rose-500" />
              </Box>
              <Box className="min-w-0">
                <Text as="p" className="text-sm font-semibold text-slate-700 truncate">Resume uploaded</Text>
                <Text as="p" className="text-xs text-slate-400">PDF document</Text>
              </Box>
            </Box>
            <Box className="flex items-center gap-2 shrink-0">
              {resumeUrl && (
                <Button
                  variant="outline" size="sm" nativeButton={false}
                  className="h-8 px-3 text-xs border-slate-200"
                  render={<a href={resumeUrl} target="_blank" rel="noopener noreferrer" />}
                >
                  <Download className="h-3.5 w-3.5 mr-1" /> View
                </Button>
              )}
              <Button
                variant="ghost" size="sm" disabled={resumeUploading}
                onClick={removeResume}
                className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <X className="h-3.5 w-3.5 mr-1" /> Remove
              </Button>
            </Box>
          </Box>
        ) : (
          <Box className="rounded-xl border border-dashed border-slate-300 py-8 text-center">
            <Box className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Upload className="h-6 w-6 text-slate-400" />
            </Box>
            <Text as="p" className="text-sm font-medium text-slate-500">No resume uploaded yet</Text>
            <Text as="p" className="text-xs text-slate-400 mt-1">PDF, up to {formatBytes(RESUME_MAX_BYTES)}.</Text>
          </Box>
        )}

        <Box>
          <Button
            variant="outline" size="sm" nativeButton={false} disabled={resumeUploading}
            className="h-9 px-4 text-xs border-slate-200"
            render={<label htmlFor="resume-file" className="cursor-pointer flex items-center gap-1.5" />}
          >
            <Upload className="h-3.5 w-3.5" />
            {resumeUploading ? "Uploading…" : resumeKey ? "Replace resume" : "Upload resume"}
          </Button>
          <input
            id="resume-file" ref={resumeInputRef} type="file" accept="application/pdf"
            className="hidden" disabled={resumeUploading} onChange={handleResumeChange}
          />
          {resumeError && <Text as="p" className="text-xs text-red-600 mt-2">{resumeError}</Text>}
        </Box>
      </SectionCard>

      {/* Save */}
      <Box className="flex items-center gap-3">
        <Button onClick={saveProfile} disabled={saving} className="h-10 px-5 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg">
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
        </Button>
        {saved && (
          <Text as="span" className="text-xs text-emerald-600 font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Profile updated
          </Text>
        )}
        {saveError && <Text as="span" className="text-xs text-red-600">{saveError}</Text>}
      </Box>
    </Box>
  );
}
