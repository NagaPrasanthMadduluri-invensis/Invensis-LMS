"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  User, Briefcase, GraduationCap, Shield, Camera, Mail, Phone,
  Building2, Link2, BookOpen, CheckCircle2, Award, Lock, Bell, ShieldCheck,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";

const COUNTRIES = ["India", "United States", "United Kingdom", "Australia", "UAE", "Singapore", "Canada", "Other"];
const TIMEZONES = ["Asia/Kolkata (IST)", "America/New_York (ET)", "Europe/London (GMT)", "Asia/Dubai (GST)", "Asia/Singapore (SGT)", "Australia/Sydney (AEST)"];
const LANGUAGES = ["English", "Hindi", "Spanish", "French", "German", "Arabic"];

function splitName(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return { first: parts[0] || "", last: parts.slice(1).join(" ") };
}

const inputCls = "h-10 text-sm border-slate-200 focus-visible:ring-indigo-400";

function SectionCard({ icon: Icon, title, description, children }) {
  return (
    <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-slate-100 bg-slate-50/60">
        <Box className="flex items-center gap-2.5">
          <Box className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-indigo-500" />
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

function FieldRow({ label, htmlFor, optional, children }) {
  return (
    <Box className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs font-semibold text-slate-600">
        {label}
        {optional && <Text as="span" className="text-slate-400 font-normal ml-1">(Optional)</Text>}
      </Label>
      {children}
    </Box>
  );
}

export function LearnerProfileSettings() {
  const { user, sponsor } = useAuth();
  const { first, last } = splitName(user?.name);

  /* ── 1. Personal information ── */
  const [photoPreview, setPhotoPreview] = useState(null);
  const [firstName, setFirstName] = useState(first);
  const [lastName, setLastName] = useState(last);
  const [mobile, setMobile] = useState("");
  const [country, setCountry] = useState("India");
  const [timezone, setTimezone] = useState("Asia/Kolkata (IST)");
  const [language, setLanguage] = useState("English");
  const [personalSaved, setPersonalSaved] = useState(false);

  /* ── 2. Professional information ── */
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [experience, setExperience] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [professionalSaved, setProfessionalSaved] = useState(false);

  /* ── 4. Account settings ── */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [preferencesSaved, setPreferencesSaved] = useState(false);

  function flashSaved(setter) {
    setter(true);
    setTimeout(() => setter(false), 2000);
  }

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result);
    reader.readAsDataURL(file);
  }

  function savePersonalInfo() {
    console.log("Personal Information updated:", {
      photo: photoPreview ? "New photo selected" : "Unchanged",
      firstName, lastName, email: user?.email, mobile, country, timezone, language,
    });
    flashSaved(setPersonalSaved);
  }

  function saveProfessionalInfo() {
    console.log("Professional Information updated:", { company, jobTitle, department, experience, linkedin });
    flashSaved(setProfessionalSaved);
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

  return (
    <Tabs defaultValue="personal">
      <TabsList className="h-auto w-full sm:w-fit flex-wrap gap-1 rounded-xl bg-slate-100 p-1.5">
        <TabsTrigger value="personal" className="gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold">
          <User className="h-4 w-4" /> Personal
        </TabsTrigger>
        <TabsTrigger value="professional" className="gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold">
          <Briefcase className="h-4 w-4" /> Professional
        </TabsTrigger>
        <TabsTrigger value="training" className="gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold">
          <GraduationCap className="h-4 w-4" /> Training
        </TabsTrigger>
        <TabsTrigger value="account" className="gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold">
          <Shield className="h-4 w-4" /> Account
        </TabsTrigger>
      </TabsList>

      {/* 1. Personal Information */}
      <TabsContent value="personal" className="mt-5">
        <SectionCard icon={User} title="Personal Information" description="Your basic profile details.">
          <Box className="flex items-center gap-4">
            <Avatar size="lg">
              {photoPreview && <AvatarImage src={photoPreview} alt={user?.name} />}
              <AvatarFallback className="bg-indigo-100 text-indigo-700 text-sm font-bold">
                {user?.initials || "U"}
              </AvatarFallback>
            </Avatar>
            <Box>
              <Button
                variant="outline"
                size="sm"
                nativeButton={false}
                className="h-8 px-3 text-xs border-slate-200"
                render={<label htmlFor="profile-photo" className="cursor-pointer flex items-center gap-1.5" />}
              >
                <Camera className="h-3.5 w-3.5" /> Change Photo
              </Button>
              <input id="profile-photo" type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              <Text as="p" className="text-[11px] text-slate-400 mt-1.5">JPG or PNG, up to 2MB.</Text>
            </Box>
          </Box>

          <Box className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FieldRow label="First Name" htmlFor="firstName">
              <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
            </FieldRow>
            <FieldRow label="Last Name" htmlFor="lastName">
              <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
            </FieldRow>
            <FieldRow label="Email" htmlFor="email">
              <Box className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input id="email" value={user?.email || ""} disabled className={`${inputCls} pl-9 bg-slate-50 text-slate-500`} />
              </Box>
            </FieldRow>
            <FieldRow label="Mobile Number" htmlFor="mobile">
              <Box className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} placeholder="+91 90000 00000" className={`${inputCls} pl-9`} />
              </Box>
            </FieldRow>
            <FieldRow label="Country">
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Time Zone">
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldRow>
            <FieldRow label="Preferred Language">
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className={inputCls}><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldRow>
          </Box>

          <Button onClick={savePersonalInfo} className="h-10 px-5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
            {personalSaved ? "Saved ✓" : "Save Changes"}
          </Button>
        </SectionCard>
      </TabsContent>

      {/* 2. Professional Information */}
      <TabsContent value="professional" className="mt-5">
        <SectionCard icon={Briefcase} title="Professional Information" description="Helps tailor recommendations and certificates.">
          <Box className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FieldRow label="Company Name" htmlFor="company">
              <Box className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} className={`${inputCls} pl-9`} />
              </Box>
            </FieldRow>
            <FieldRow label="Job Title" htmlFor="jobTitle">
              <Input id="jobTitle" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputCls} />
            </FieldRow>
            <FieldRow label="Department" htmlFor="department" optional>
              <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} className={inputCls} />
            </FieldRow>
            <FieldRow label="Years of Experience" htmlFor="experience" optional>
              <Input id="experience" type="number" min="0" value={experience} onChange={(e) => setExperience(e.target.value)} className={inputCls} />
            </FieldRow>
            <FieldRow label="LinkedIn Profile" htmlFor="linkedin" optional>
              <Box className="relative">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input id="linkedin" value={linkedin} onChange={(e) => setLinkedin(e.target.value)} placeholder="https://linkedin.com/in/..." className={`${inputCls} pl-9`} />
              </Box>
            </FieldRow>
          </Box>
          <Button onClick={saveProfessionalInfo} className="h-10 px-5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
            {professionalSaved ? "Saved ✓" : "Save Changes"}
          </Button>
        </SectionCard>
      </TabsContent>

      {/* 3. Training Information (read-only) */}
      <TabsContent value="training" className="mt-5">
        <SectionCard icon={GraduationCap} title="Training Information" description="Read-only — managed by your enrolments and organisation.">
          <Box className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <FieldRow label="Purchase Type">
              <Badge className="border-0 bg-indigo-50 text-indigo-700 text-xs font-semibold w-fit">
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
          <Button onClick={savePassword} className="h-10 px-5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
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
          <Button onClick={savePreferences} className="h-10 px-5 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg">
            {preferencesSaved ? "Saved ✓" : "Save Changes"}
          </Button>
        </SectionCard>
      </TabsContent>
    </Tabs>
  );
}
