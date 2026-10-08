"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  User, Mail, MapPin, Sparkles, FileText, Upload, X, Download,
  CheckCircle2,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { useProfileCompletion } from "@/providers/profile-completion-provider";
import {
  fetchMyTrainerProfile,
  updateMyTrainerProfile,
  getResumeUploadUrl,
  uploadResumeFile,
} from "@/services/api/trainer";

// A resume PDF is small — cap uploads so we never push a bloated file to storage.
const RESUME_MAX_BYTES = 500 * 1024; // 500 KB
const RESUME_TYPE = "application/pdf";

const inputCls = "h-10 w-full text-sm bg-background border border-border-strong focus-visible:border-primary-border focus-visible:ring-focus";

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
      <CardHeader className="px-6 py-4 border-b border-border bg-slate-50/60">
        <Box className="flex items-center gap-2.5">
          <Box className="w-8 h-8 rounded-lg bg-primary-subtle flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </Box>
          <Box>
            <CardTitle className="text-sm font-bold text-foreground">{title}</CardTitle>
            {description && <Text as="p" className="text-xs text-foreground-subtle mt-0.5">{description}</Text>}
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
      <Label htmlFor={htmlFor} className="text-xs font-semibold text-foreground-muted">
        {label}
        {optional && <Text as="span" className="text-foreground-subtle font-normal ml-1">(Optional)</Text>}
      </Label>
      {children}
      {error && <Text as="p" className="text-xs text-error">{error}</Text>}
    </Box>
  );
}

function ProfileSkeleton() {
  return (
    <Box className="space-y-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <Card key={i} className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <Box className="px-6 py-4 border-b border-border"><Skeleton className="h-5 w-44" /></Box>
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
  const completion = useProfileCompletion();

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
  const [countryOptions, setCountryOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
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

  // Country list — static, fetched once.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/locations?type=countries")
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setCountryOptions(
          (d.countries || []).map((c) => ({
            value: c.name,
            label: c.name,
            iso: c.iso,
            prefix: <Text as="span" className="text-base leading-none">{c.flag}</Text>,
          }))
        );
      })
      .catch(() => setCountryOptions([]));
    return () => { cancelled = true; };
  }, []);

  // Cities for the selected country (country is stored by name → resolve its ISO).
  const countryIso = countryOptions.find((c) => c.value === country)?.iso;

  useEffect(() => {
    if (!countryIso) { setCityOptions([]); return; }
    let cancelled = false;
    setCitiesLoading(true);
    fetch(`/api/locations?type=cities&country=${countryIso}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        setCityOptions((d.cities || []).map((name) => ({ value: name, label: name })));
      })
      .catch(() => { if (!cancelled) setCityOptions([]); })
      .finally(() => { if (!cancelled) setCitiesLoading(false); });
    return () => { cancelled = true; };
  }, [countryIso]);

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
      completion?.refresh?.();
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
      completion?.refresh?.();
    } catch (err) {
      setResumeError(err.message || "Failed to remove resume. Please try again.");
    } finally {
      setResumeUploading(false);
    }
  }

  async function saveProfile() {
    // Fold any half-typed specialization into the list before validating.
    const specs = specInput.trim() && !specializations.includes(specInput.trim())
      ? [...specializations, specInput.trim()]
      : specializations;

    // All profile fields are mandatory — a trainer's profile must be complete.
    const nextErrors = {};
    if (!name.trim()) nextErrors.name = "Name is required.";
    if (!bio.trim()) nextErrors.bio = "Bio is required.";
    if (!experience.trim()) nextErrors.experience = "Experience is required.";
    if (specs.length === 0) nextErrors.specializations = "Add at least one specialization.";
    if (!country.trim()) nextErrors.country = "Country is required.";
    if (!city.trim()) nextErrors.city = "City is required.";
    if (!resumeKey) nextErrors.resume = "A resume (PDF) is required.";
    setErrors(nextErrors);
    setResumeError(nextErrors.resume || "");
    setSaveError(Object.keys(nextErrors).length ? "Please complete all required fields before saving." : "");
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const { trainer } = await updateMyTrainerProfile({
        token,
        data: {
          name: name.trim(),
          bio: bio.trim(),
          experience: experience.trim(),
          specializations: specs,
          city: city.trim(),
          country: country.trim(),
          is_remote: isRemote,
        },
      });
      setSpecializations(Array.isArray(trainer.specializations) ? trainer.specializations : specs);
      setSpecInput("");
      updateUser({ name: trainer.name });
      setSaved(true);
      completion?.refresh?.();
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setErrors(mapFieldErrors(e.errors, { name: "name", bio: "bio", experience: "experience", specializations: "specializations", city: "city", country: "country" }));
      setSaveError(e.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <ProfileSkeleton />;

  if (loadError) {
    return (
      <Card className="p-6 rounded-2xl border-0 bg-error-subtle shadow-sm">
        <Text as="p" className="text-error text-sm">Failed to load your profile: {loadError}</Text>
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
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle" />
              <Input value={email} disabled className={`${inputCls} pl-9 text-foreground-muted`} />
            </Box>
            <Text as="p" className="text-[11px] text-foreground-subtle">Managed by your admin — contact them to change it.</Text>
          </FieldRow>
        </Box>
      </SectionCard>

      {/* About & expertise */}
      <SectionCard icon={Sparkles} title="About & Expertise" description="How you're presented to learners and admins.">
        <FieldRow label="Bio" htmlFor="bio" error={errors.bio}>
          <Textarea
            id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={4}
            placeholder="A short professional summary…"
            className="w-full text-sm bg-background border border-border-strong focus-visible:border-primary-border focus-visible:ring-focus"
          />
        </FieldRow>
        <FieldRow label="Experience" htmlFor="experience" error={errors.experience}>
          <Textarea
            id="experience" value={experience} onChange={(e) => setExperience(e.target.value)} rows={3}
            placeholder="e.g. 12 years delivering PMP & PRINCE2 corporate training."
            className="w-full text-sm bg-background border border-border-strong focus-visible:border-primary-border focus-visible:ring-focus"
          />
        </FieldRow>
        <FieldRow label="Specializations" htmlFor="specializations" error={errors.specializations}>
          <Box className="rounded-lg border border-border-strong bg-background px-2.5 py-2 focus-within:border-primary-border focus-within:ring-1 focus-within:ring-focus">
            <Box className="flex flex-wrap items-center gap-1.5">
              {specializations.map((s) => (
                <Badge key={s} className="border-0 bg-primary-subtle text-primary text-xs font-semibold gap-1 pr-1">
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
          <Text as="p" className="text-[11px] text-foreground-subtle">Press Enter or comma to add each subject.</Text>
        </FieldRow>
      </SectionCard>

      {/* Location */}
      <SectionCard icon={MapPin} title="Location & Availability" description="Where you're based and how you deliver.">
        <Box className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FieldRow label="Country" htmlFor="country" error={errors.country}>
            <Combobox
              id="country" value={country}
              onChange={(v) => { setCountry(v); setCity(""); }}
              options={countryOptions}
              placeholder="Select your country"
              searchPlaceholder="Search countries..."
              emptyText="No country found."
              loading={countryOptions.length === 0}
              invalid={!!errors.country}
            />
          </FieldRow>
          <FieldRow label="City" htmlFor="city" error={errors.city}>
            <Combobox
              id="city" value={city}
              onChange={(v) => setCity(v)}
              options={cityOptions}
              placeholder={country ? "Select your city" : "Pick a country first"}
              searchPlaceholder="Search cities..."
              emptyText="No city found for this country."
              disabled={!countryIso}
              loading={citiesLoading}
              invalid={!!errors.city}
            />
          </FieldRow>
        </Box>
        <Box className="flex items-center justify-between py-1">
          <Box>
            <Text as="p" className="text-sm font-medium text-foreground">Remote delivery</Text>
            <Text as="p" className="text-xs text-foreground-subtle">I deliver training online.</Text>
          </Box>
          <Switch checked={isRemote} onCheckedChange={setIsRemote} />
        </Box>
      </SectionCard>

      {/* Resume */}
      <SectionCard icon={FileText} title="Resume / CV" description={`PDF only, up to ${formatBytes(RESUME_MAX_BYTES)}.`}>
        {resumeKey ? (
          <Box className="flex items-center justify-between gap-3 rounded-xl border border-border bg-slate-50/60 px-4 py-3">
            <Box className="flex items-center gap-3 min-w-0">
              <Box className="w-9 h-9 rounded-lg bg-error-subtle flex items-center justify-center shrink-0">
                <FileText className="h-4 w-4 text-error" />
              </Box>
              <Box className="min-w-0">
                <Text as="p" className="text-sm font-semibold text-foreground truncate">Resume uploaded</Text>
                <Text as="p" className="text-xs text-foreground-subtle">PDF document</Text>
              </Box>
            </Box>
            <Box className="flex items-center gap-2 shrink-0">
              {resumeUrl && (
                <Button
                  variant="outline" size="sm" nativeButton={false}
                  className="h-8 px-3 text-xs border-border"
                  render={<a href={resumeUrl} target="_blank" rel="noopener noreferrer" />}
                >
                  <Download className="h-3.5 w-3.5 mr-1" /> View
                </Button>
              )}
              <Button
                variant="ghost" size="sm" disabled={resumeUploading}
                onClick={removeResume}
                className="h-8 px-3 text-xs text-error hover:text-error-subtle-foreground hover:bg-error-subtle"
              >
                <X className="h-3.5 w-3.5 mr-1" /> Remove
              </Button>
            </Box>
          </Box>
        ) : (
          <Box className="rounded-xl border border-dashed border-border-strong py-8 text-center">
            <Box className="w-12 h-12 rounded-2xl bg-surface-muted flex items-center justify-center mx-auto mb-3">
              <Upload className="h-6 w-6 text-foreground-subtle" />
            </Box>
            <Text as="p" className="text-sm font-medium text-foreground-muted">No resume uploaded yet</Text>
            <Text as="p" className="text-xs text-foreground-subtle mt-1">PDF, up to {formatBytes(RESUME_MAX_BYTES)}.</Text>
          </Box>
        )}

        <Box>
          <Button
            variant="outline" size="sm" nativeButton={false} disabled={resumeUploading}
            className="h-9 px-4 text-xs border-border"
            render={<label htmlFor="resume-file" className="cursor-pointer flex items-center gap-1.5" />}
          >
            <Upload className="h-3.5 w-3.5" />
            {resumeUploading ? "Uploading…" : resumeKey ? "Replace resume" : "Upload resume"}
          </Button>
          <input
            id="resume-file" ref={resumeInputRef} type="file" accept="application/pdf"
            className="hidden" disabled={resumeUploading} onChange={handleResumeChange}
          />
          {resumeError && <Text as="p" className="text-xs text-error mt-2">{resumeError}</Text>}
        </Box>
      </SectionCard>

      {/* Save */}
      <Box className="flex items-center gap-3">
        <Button onClick={saveProfile} disabled={saving} className="h-10 px-5 text-sm bg-primary hover:bg-primary-hover text-primary-foreground rounded-lg">
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
        </Button>
        {saved && (
          <Text as="span" className="text-xs text-success font-medium flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5" /> Profile updated
          </Text>
        )}
        {saveError && <Text as="span" className="text-xs text-error">{saveError}</Text>}
      </Box>
    </Box>
  );
}
