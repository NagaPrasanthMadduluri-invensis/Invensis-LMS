"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { PhoneInput, splitPhone, isPhoneValid } from "@/components/ui/phone-input";
import {
  User, Briefcase, GraduationCap, Shield, Camera, Mail,
  Building2, Link2, BookOpen, CheckCircle2, Award, Lock, Bell, ShieldCheck,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { useProfileCompletion } from "@/providers/profile-completion-provider";
import { fetchMyProfile, updateMyProfile, getAvatarUploadUrl, uploadAvatarFile } from "@/services/api/me";

// A fixed list rather than free text: trainers see the industry in place of the
// employer name on their roster, so it only groups usefully if it's consistent.
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
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_MAX_BYTES = 2 * 1024 * 1024;

function splitName(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return { first: parts[0] || "", last: parts.slice(1).join(" ") };
}

// A LinkedIn profile or company page, with or without the scheme/subdomain —
// `linkedin.com/in/lena`, `https://www.linkedin.com/company/acme`, `in.linkedin.com/in/x`.
const LINKEDIN_PATTERN =
  /^(https?:\/\/)?([a-z]{2,3}\.)?linkedin\.com\/(in|pub|company|school)\/[\w\-%.()]+\/?(\?.*)?$/i;

const validateFirstName = (v) => (v.trim() ? null : "First name is required.");
const validateLastName = (v) => (v.trim() ? null : "Last name is required.");
const validateCountry = (v) => (v.trim() ? null : "Country is required.");
const validateCity = (v) => (v.trim() ? null : "City is required.");
// The dial code and the digits are validated together: a number is only valid
// for a given country, so libphonenumber checks the pair, not a generic pattern.
function validateMobile(v) {
  if (!v || !v.trim()) return "Mobile number is required.";
  const { country, national } = splitPhone(v);
  if (!national) return "Mobile number is required.";
  return isPhoneValid(country, national) ? null : "Enter a valid mobile number for the selected country.";
}
const validateCompany = (v) => (v.trim() ? null : "Company name is required.");
const validateIndustry = (v) => (v.trim() ? null : "Industry is required.");
const validateJobTitle = (v) => (v.trim() ? null : "Job title is required.");
const validateDepartment = (v) => (v.trim() ? null : "Department is required.");
function validateExperience(v) {
  if (!v.trim()) return "Years of experience is required.";
  const n = Number(v);
  if (Number.isNaN(n) || n < 0) return "Enter a valid number of years.";
  if (n > 80) return "Enter 80 years or fewer.";
  return null;
}
// People paste `linkedin.com/in/x` as often as the full URL; the API only takes
// a fully-qualified one.
const withScheme = (v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`);

function validateLinkedin(v) {
  if (!v.trim()) return "LinkedIn profile is required.";
  return LINKEDIN_PATTERN.test(v.trim())
    ? null
    : "Enter a LinkedIn profile URL (e.g. https://linkedin.com/in/your-name).";
}

// Only clears an existing error once the field becomes valid — never adds a
// new one while typing, so red marks don't flash up mid-edit.
function clearErrorIfValid(setErrors, field, validate, value) {
  setErrors((prev) => {
    if (!prev[field] || validate(value)) return prev;
    const { [field]: _omit, ...rest } = prev;
    return rest;
  });
}

// Maps the API's snake_case field-error keys (API.md §1.2/§3.5.2) onto our
// camelCase form-state keys, so a 422 response highlights the right field.
function mapFieldErrors(apiErrors, keyMap) {
  const mapped = {};
  for (const [apiKey, formKey] of Object.entries(keyMap)) {
    if (apiErrors?.[apiKey]) mapped[formKey] = apiErrors[apiKey][0];
  }
  return mapped;
}

const inputCls = "h-10 w-full text-sm bg-background border border-slate-300 focus-visible:border-violet-400 focus-visible:ring-violet-400";

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

function FieldRow({ label, htmlFor, error, children }) {
  return (
    <Box className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-semibold text-slate-600">
        {label}
      </Label>
      {children}
      {error && <Text as="p" className="text-xs text-red-600">{error}</Text>}
    </Box>
  );
}

function ProfileSkeleton() {
  return (
    <Box className="space-y-5">
      <Skeleton className="h-10 w-72 rounded-full" />
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <Box className="px-6 py-4 border-b border-slate-100">
          <Skeleton className="h-5 w-40" />
        </Box>
        <Box className="p-6 space-y-5">
          <Skeleton className="h-16 w-16 rounded-full" />
          <Box className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-lg" />)}
          </Box>
        </Box>
      </Card>
    </Box>
  );
}

export function LearnerProfileSettings() {
  const { user, sponsor, token, updateUser } = useAuth();
  const completion = useProfileCompletion();
  const { first, last } = splitName(user?.name);

  // Country and city lists are served by /api/locations, which keeps the 7.7 MB
  // `country-state-city` dataset on the server. Cities depend on the chosen
  // country, so they're fetched again whenever it changes.
  const [countryOptions, setCountryOptions] = useState([]);
  const [cityOptions, setCityOptions] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(false);

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);

  /* ── 1. Personal information ── */
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const [firstName, setFirstName] = useState(first);
  const [lastName, setLastName] = useState(last);
  const [mobile, setMobile] = useState("");
  const [country, setCountry] = useState("India");
  const [city, setCity] = useState("");
  const [personalSaving, setPersonalSaving] = useState(false);
  const [personalSaved, setPersonalSaved] = useState(false);
  const [personalError, setPersonalError] = useState("");
  const [personalErrors, setPersonalErrors] = useState({});

  /* ── 2. Professional information ── */
  const [company, setCompany] = useState("");
  const [industry, setIndustry] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [experience, setExperience] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [professionalSaving, setProfessionalSaving] = useState(false);
  const [professionalSaved, setProfessionalSaved] = useState(false);
  const [professionalError, setProfessionalError] = useState("");
  const [professionalErrors, setProfessionalErrors] = useState({});

  /* ── 4. Account settings — no API yet; local-only ── */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [preferencesSaved, setPreferencesSaved] = useState(false);

  // Country list — static, so fetched once and cached hard by the route.
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

  // Cities for the selected country. The country is stored by name, so the ISO
  // code the API needs is resolved from the country list.
  const countryIso = countryOptions.find((c) => c.value === country)?.iso;

  useEffect(() => {
    if (!countryIso) {
      setCityOptions([]);
      return;
    }
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

  useEffect(() => {
    if (!token) return;
    fetchMyProfile({ token })
      .then(({ profile }) => {
        setFirstName(profile.first_name || first);
        setLastName(profile.last_name || last);
        setMobile(profile.phone || "");
        setCountry(profile.country || "India");
        setCity(profile.city || "");
        setCompany(profile.company_name || "");
        setIndustry(profile.industry || "");
        setJobTitle(profile.job_title || "");
        setDepartment(profile.department || "");
        setExperience(profile.years_experience != null ? String(profile.years_experience) : "");
        setLinkedin(profile.linkedin_url || "");
        setAvatarUrl(profile.avatar_url || null);
      })
      .catch((e) => setProfileError(e.message))
      .finally(() => setProfileLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  function flashSaved(setter) {
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  async function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError("");

    if (!AVATAR_TYPES.includes(file.type)) {
      setAvatarError("Please choose a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarError("Image must be 2MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);

    setAvatarUploading(true);
    try {
      const { upload_url, avatar_key, headers } = await getAvatarUploadUrl({ token, contentType: file.type });
      await uploadAvatarFile({ uploadUrl: upload_url, headers, file });
      const { profile } = await updateMyProfile({ token, data: { avatar_key } });
      setAvatarUrl(profile.avatar_url);
      setPhotoPreview(null);
    } catch (err) {
      setAvatarError(err.message || "Failed to upload photo. Please try again.");
      setPhotoPreview(null);
    } finally {
      setAvatarUploading(false);
    }
  }

  async function savePersonalInfo() {
    const errors = {};
    const firstNameError = validateFirstName(firstName);
    const lastNameError = validateLastName(lastName);
    const mobileError = validateMobile(mobile);
    const countryError = validateCountry(country);
    const cityError = validateCity(city);
    if (firstNameError) errors.firstName = firstNameError;
    if (lastNameError) errors.lastName = lastNameError;
    if (mobileError) errors.mobile = mobileError;
    if (countryError) errors.country = countryError;
    if (cityError) errors.city = cityError;
    setPersonalErrors(errors);
    setPersonalError("");
    if (Object.keys(errors).length) return;

    setPersonalSaving(true);
    try {
      await updateMyProfile({
        token,
        data: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone: mobile.trim(),
          country,
          city: city.trim(),
        },
      });
      updateUser({ name: `${firstName.trim()} ${lastName.trim()}`.trim() });
      completion?.refresh?.();
      flashSaved(setPersonalSaved);
    } catch (e) {
      setPersonalErrors(mapFieldErrors(e.errors, {
        first_name: "firstName", last_name: "lastName", phone: "mobile", country: "country", city: "city",
      }));
      setPersonalError(e.message || "Failed to save. Please try again.");
    } finally {
      setPersonalSaving(false);
    }
  }

  async function saveProfessionalInfo() {
    const errors = {};
    const companyError = validateCompany(company);
    const industryError = validateIndustry(industry);
    const jobTitleError = validateJobTitle(jobTitle);
    const departmentError = validateDepartment(department);
    const experienceError = validateExperience(experience);
    const linkedinError = validateLinkedin(linkedin);
    if (companyError) errors.company = companyError;
    if (industryError) errors.industry = industryError;
    if (jobTitleError) errors.jobTitle = jobTitleError;
    if (departmentError) errors.department = departmentError;
    if (experienceError) errors.experience = experienceError;
    if (linkedinError) errors.linkedin = linkedinError;
    setProfessionalErrors(errors);
    setProfessionalError("");
    if (Object.keys(errors).length) return;

    setProfessionalSaving(true);
    try {
      await updateMyProfile({
        token,
        data: {
          company_name: company.trim(),
          industry: industry.trim(),
          job_title: jobTitle.trim(),
          department: department.trim(),
          years_experience: Number(experience),
          // The API requires a fully-qualified URL; the form accepts the bare
          // `linkedin.com/in/...` form people paste, so normalise on the way out.
          linkedin_url: withScheme(linkedin.trim()),
        },
      });
      completion?.refresh?.();
      flashSaved(setProfessionalSaved);
    } catch (e) {
      setProfessionalErrors(mapFieldErrors(e.errors, {
        company_name: "company", industry: "industry", job_title: "jobTitle",
        department: "department", years_experience: "experience", linkedin_url: "linkedin",
      }));
      setProfessionalError(e.message || "Failed to save. Please try again.");
    } finally {
      setProfessionalSaving(false);
    }
  }

  function savePassword() {
    setPasswordError("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation don't match.");
      return;
    }
    console.log("Password change submitted:", { currentPassword, newPassword });
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    flashSaved(setPasswordSaved);
  }

  function savePreferences() {
    console.log("Account settings updated:", { emailNotifications, smsNotifications, twoFactorEnabled });
    flashSaved(setPreferencesSaved);
  }

  if (profileLoading) return <ProfileSkeleton />;

  if (profileError) {
    return (
      <Card className="p-6 rounded-2xl border-0 bg-red-50 shadow-sm">
        <Text as="p" className="text-red-600 text-sm">Failed to load your profile: {profileError}</Text>
      </Card>
    );
  }

  return (
    <Tabs defaultValue="personal">
      <TabsList className="h-auto w-full sm:w-fit flex-wrap gap-1 rounded-full bg-slate-200 p-1.5">
        <TabsTrigger value="personal" className="gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-slate-600 data-active:bg-violet-200 data-active:text-violet-800 data-active:ring-1 data-active:ring-violet-300 data-active:shadow-sm">
          <User className="h-4 w-4" /> Personal
        </TabsTrigger>
        <TabsTrigger value="professional" className="gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-slate-600 data-active:bg-violet-200 data-active:text-violet-800 data-active:ring-1 data-active:ring-violet-300 data-active:shadow-sm">
          <Briefcase className="h-4 w-4" /> Professional
        </TabsTrigger>
        <TabsTrigger value="training" className="gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-slate-600 data-active:bg-violet-200 data-active:text-violet-800 data-active:ring-1 data-active:ring-violet-300 data-active:shadow-sm">
          <GraduationCap className="h-4 w-4" /> Training
        </TabsTrigger>
        <TabsTrigger value="account" className="gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-slate-600 data-active:bg-violet-200 data-active:text-violet-800 data-active:ring-1 data-active:ring-violet-300 data-active:shadow-sm">
          <Shield className="h-4 w-4" /> Account
        </TabsTrigger>
      </TabsList>

      {/* 1. Personal Information */}
      <TabsContent value="personal" className="mt-5">
        <SectionCard icon={User} title="Personal Information" description="Your basic profile details.">
          <Box className="flex items-center gap-4">
            <Avatar size="lg">
              {(photoPreview || avatarUrl) && <AvatarImage src={photoPreview || avatarUrl} alt={user?.name} />}
              <AvatarFallback className="bg-violet-100 text-violet-700 text-sm font-bold">
                {user?.initials || "U"}
              </AvatarFallback>
            </Avatar>
            <Box>
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                disabled={avatarUploading}
                className="h-8 px-3 text-xs border-slate-200"
                render={<label htmlFor="profile-photo" className="cursor-pointer flex items-center gap-1.5" />}
              >
                <Camera className="h-3.5 w-3.5" /> {avatarUploading ? "Uploading..." : "Change Photo"}
              </Button>
              <input
                id="profile-photo" type="file" accept="image/jpeg,image/png,image/webp"
                className="hidden" disabled={avatarUploading} onChange={handlePhotoChange}
              />
              <Text as="p" className="text-[11px] text-slate-400 mt-1.5">JPG, PNG, or WEBP, up to 2MB.</Text>
              {avatarError && <Text as="p" className="text-xs text-red-600 mt-1">{avatarError}</Text>}
            </Box>
          </Box>

          <Box className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FieldRow label="First Name" htmlFor="firstName" error={personalErrors.firstName}>
              <Input
                id="firstName" value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  clearErrorIfValid(setPersonalErrors, "firstName", validateFirstName, e.target.value);
                }}
                aria-invalid={!!personalErrors.firstName} className={inputCls}
              />
            </FieldRow>
            <FieldRow label="Last Name" htmlFor="lastName" error={personalErrors.lastName}>
              <Input
                id="lastName" value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  clearErrorIfValid(setPersonalErrors, "lastName", validateLastName, e.target.value);
                }}
                aria-invalid={!!personalErrors.lastName} className={inputCls}
              />
            </FieldRow>
            <FieldRow label="Email" htmlFor="email">
              <Box className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input id="email" value={user?.email || ""} disabled className={`${inputCls} pl-9 text-slate-500`} />
              </Box>
            </FieldRow>
            <FieldRow label="Mobile Number" htmlFor="mobile" error={personalErrors.mobile}>
              <PhoneInput
                id="mobile" value={mobile}
                onChange={(v) => {
                  setMobile(v);
                  clearErrorIfValid(setPersonalErrors, "mobile", validateMobile, v);
                }}
                invalid={!!personalErrors.mobile}
              />
            </FieldRow>
            <FieldRow label="Country" htmlFor="country" error={personalErrors.country}>
              <Combobox
                id="country" value={country}
                onChange={(v) => {
                  setCountry(v);
                  // The old city belongs to the old country — clear it rather
                  // than leave a mismatched pair behind.
                  setCity("");
                  clearErrorIfValid(setPersonalErrors, "country", validateCountry, v);
                }}
                options={countryOptions}
                placeholder="Select your country"
                searchPlaceholder="Search countries..."
                emptyText="No country found."
                loading={countryOptions.length === 0}
                invalid={!!personalErrors.country}
              />
            </FieldRow>
            <FieldRow label="City" htmlFor="city" error={personalErrors.city}>
              <Combobox
                id="city" value={city}
                onChange={(v) => {
                  setCity(v);
                  clearErrorIfValid(setPersonalErrors, "city", validateCity, v);
                }}
                options={cityOptions}
                placeholder={country ? "Select your city" : "Pick a country first"}
                searchPlaceholder="Search cities..."
                emptyText="No city found for this country."
                disabled={!countryIso}
                loading={citiesLoading}
                invalid={!!personalErrors.city}
              />
            </FieldRow>
          </Box>

          {personalError && <Text as="p" className="text-xs text-red-600">{personalError}</Text>}
          <Button onClick={savePersonalInfo} disabled={personalSaving} className="h-10 px-5 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg">
            {personalSaving ? "Saving..." : personalSaved ? "Saved ✓" : "Save Changes"}
          </Button>
        </SectionCard>
      </TabsContent>

      {/* 2. Professional Information */}
      <TabsContent value="professional" className="mt-5">
        <SectionCard icon={Briefcase} title="Professional Information" description="Helps tailor recommendations and certificates.">
          <Box className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FieldRow label="Company Name" htmlFor="company" error={professionalErrors.company}>
              <Box className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="company" value={company}
                  onChange={(e) => {
                    setCompany(e.target.value);
                    clearErrorIfValid(setProfessionalErrors, "company", validateCompany, e.target.value);
                  }}
                  aria-invalid={!!professionalErrors.company} className={`${inputCls} pl-9`}
                />
              </Box>
            </FieldRow>
            <FieldRow label="Industry" htmlFor="industry" error={professionalErrors.industry}>
              <Select
                value={industry}
                onValueChange={(v) => {
                  setIndustry(v);
                  clearErrorIfValid(setProfessionalErrors, "industry", validateIndustry, v);
                }}
              >
                <SelectTrigger id="industry" aria-invalid={!!professionalErrors.industry} className={inputCls}>
                  <SelectValue placeholder="Select your industry" />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Job Title" htmlFor="jobTitle" error={professionalErrors.jobTitle}>
              <Input
                id="jobTitle" value={jobTitle}
                onChange={(e) => {
                  setJobTitle(e.target.value);
                  clearErrorIfValid(setProfessionalErrors, "jobTitle", validateJobTitle, e.target.value);
                }}
                aria-invalid={!!professionalErrors.jobTitle} className={inputCls}
              />
            </FieldRow>
            <FieldRow label="Department" htmlFor="department" error={professionalErrors.department}>
              <Input
                id="department" value={department}
                onChange={(e) => {
                  setDepartment(e.target.value);
                  clearErrorIfValid(setProfessionalErrors, "department", validateDepartment, e.target.value);
                }}
                aria-invalid={!!professionalErrors.department} className={inputCls}
              />
            </FieldRow>
            <FieldRow label="Years of Experience" htmlFor="experience" error={professionalErrors.experience}>
              <Input
                id="experience" type="number" min="0" value={experience}
                onChange={(e) => {
                  setExperience(e.target.value);
                  clearErrorIfValid(setProfessionalErrors, "experience", validateExperience, e.target.value);
                }}
                aria-invalid={!!professionalErrors.experience} className={inputCls}
              />
            </FieldRow>
            <FieldRow label="LinkedIn Profile" htmlFor="linkedin" error={professionalErrors.linkedin}>
              <Box className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="linkedin" value={linkedin}
                  onChange={(e) => {
                    setLinkedin(e.target.value);
                    clearErrorIfValid(setProfessionalErrors, "linkedin", validateLinkedin, e.target.value);
                  }}
                  placeholder="https://linkedin.com/in/..." aria-invalid={!!professionalErrors.linkedin} className={`${inputCls} pl-9`}
                />
              </Box>
            </FieldRow>
          </Box>
          {professionalError && <Text as="p" className="text-xs text-red-600">{professionalError}</Text>}
          <Button onClick={saveProfessionalInfo} disabled={professionalSaving} className="h-10 px-5 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg">
            {professionalSaving ? "Saving..." : professionalSaved ? "Saved ✓" : "Save Changes"}
          </Button>
        </SectionCard>
      </TabsContent>

      {/* 3. Training Information (read-only) */}
      <TabsContent value="training" className="mt-5">
        <SectionCard icon={GraduationCap} title="Training Information" description="Read-only — managed by your enrolments and organisation.">
          <Box className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FieldRow label="Purchase Type">
              <Badge className="border-0 bg-violet-50 text-violet-700 text-xs font-semibold w-fit">
                {sponsor ? "Corporate" : "Self"}
              </Badge>
            </FieldRow>
            <FieldRow label="Sponsor / Organization">
              <Text as="p" className="text-sm font-medium text-slate-700">{sponsor?.name || "Self-sponsored"}</Text>
            </FieldRow>
          </Box>

          <Box className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2">
            <Box className="space-y-2">
              <Text as="p" className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5 text-slate-400" /> Upcoming Trainings
              </Text>
              <Box className="rounded-xl border border-dashed border-slate-200 py-6 text-center">
                <Text as="p" className="text-xs text-slate-400">No upcoming trainings yet.</Text>
              </Box>
            </Box>
            <Box className="space-y-2">
              <Text as="p" className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-slate-400" /> Completed Trainings
              </Text>
              <Box className="rounded-xl border border-dashed border-slate-200 py-6 text-center">
                <Text as="p" className="text-xs text-slate-400">No completed trainings yet.</Text>
              </Box>
            </Box>
          </Box>

          <Box className="space-y-2">
            <Text as="p" className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <Award className="h-3.5 w-3.5 text-slate-400" /> Certificates
            </Text>
            <Box className="rounded-xl border border-dashed border-slate-200 py-6 text-center">
              <Text as="p" className="text-xs text-slate-400">No certificates issued yet.</Text>
            </Box>
          </Box>
        </SectionCard>
      </TabsContent>

      {/* 4. Account Settings */}
      <TabsContent value="account" className="mt-5 space-y-5">
        <SectionCard icon={Lock} title="Change Password">
          <Box className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FieldRow label="Current Password" htmlFor="currentPassword">
              <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className={inputCls} />
            </FieldRow>
            <Box className="hidden sm:block" />
            <FieldRow label="New Password" htmlFor="newPassword">
              <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputCls} />
            </FieldRow>
            <FieldRow label="Confirm New Password" htmlFor="confirmPassword">
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputCls} />
            </FieldRow>
          </Box>
          {passwordError && <Text as="p" className="text-xs text-red-600">{passwordError}</Text>}
          <Button onClick={savePassword} className="h-10 px-5 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg">
            {passwordSaved ? "Password Updated ✓" : "Update Password"}
          </Button>
        </SectionCard>

        <SectionCard icon={Bell} title="Notifications & Security">
          <Box className="flex items-center justify-between py-1">
            <Box>
              <Text as="p" className="text-sm font-medium text-slate-700">Email Notifications</Text>
              <Text as="p" className="text-xs text-slate-400">Course updates, reminders, and receipts.</Text>
            </Box>
            <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
          </Box>
          <Box className="flex items-center justify-between py-1">
            <Box>
              <Text as="p" className="text-sm font-medium text-slate-700">SMS Notifications</Text>
              <Text as="p" className="text-xs text-slate-400">Session reminders via text message.</Text>
            </Box>
            <Switch checked={smsNotifications} onCheckedChange={setSmsNotifications} />
          </Box>
          <Box className="flex items-center justify-between py-1">
            <Box>
              <Text as="p" className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" /> Two-Factor Authentication
              </Text>
              <Text as="p" className="text-xs text-slate-400">Optional — adds an extra step at login.</Text>
            </Box>
            <Switch checked={twoFactorEnabled} onCheckedChange={setTwoFactorEnabled} />
          </Box>
          <Button onClick={savePreferences} className="h-10 px-5 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg">
            {preferencesSaved ? "Saved ✓" : "Save Changes"}
          </Button>
        </SectionCard>
      </TabsContent>
    </Tabs>
  );
}
