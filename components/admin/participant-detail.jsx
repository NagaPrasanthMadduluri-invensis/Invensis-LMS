"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen, CheckCircle2, Clock, PlayCircle, Award, XCircle, Mail,
  Briefcase, MapPin, Calendar, Hash, Video, Users2, Phone, GraduationCap,
  Building2, Layers, Clock3, Link2, ExternalLink, LogIn, UserCheck, UserCog, AlertCircle,
} from "lucide-react";
import Link from "next/link";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { formatDate as fmtDate, formatInstantDate } from "@/lib/datetime";
import { lastLoginLabel, lastLoginTitle, hasNeverLoggedIn } from "@/lib/last-login";
import {
  fetchParticipantDetail, resendParticipantSetupEmail,
  fetchParticipantEmailRecipients, sendParticipantEmail, changeParticipantRole,
  fetchParticipantEmails,
} from "@/services/api/admin/admin-api";
import { ResendSetupButton } from "@/components/admin/resend-setup-button";
import { ComposeEmailDialog } from "@/components/admin/compose-email-dialog";
import { EmailTimeline } from "@/components/admin/email-timeline";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const AVATAR_COLORS = [
  "bg-violet-500", "bg-violet-500", "bg-teal-500", "bg-emerald-500",
  "bg-rose-500", "bg-amber-500", "bg-cyan-500", "bg-pink-500",
];

function getInitials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "U";
}

function avatarColor(id = "") {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// Training dates are wall-clock values and print exactly as sent; the audit
// timestamps beside them are real instants. See `lib/datetime`.
const formatDate = (iso) => fmtDate(iso, { day: "2-digit" });
const formatStamp = (iso) => formatInstantDate(iso, { day: "2-digit" });

function formatRange(start, end) {
  if (!start && !end) return "Not scheduled";
  if (start && end) return `${formatDate(start)} → ${formatDate(end)}`;
  return formatDate(start || end);
}

// Category → visual treatment. Keys match the `category` field the API returns.
const CATEGORY_META = {
  completed:   { label: "Completed",   badge: "bg-success-subtle text-success-subtle-foreground ring-1 ring-success-border",  icon: CheckCircle2 },
  ongoing:     { label: "In progress", badge: "bg-info-subtle text-info-subtle-foreground ring-1 ring-info-border",           icon: PlayCircle },
  upcoming:    { label: "Upcoming",    badge: "bg-primary-subtle text-primary ring-1 ring-primary-border",     icon: Clock },
  transferred: { label: "Transferred", badge: "bg-warning-subtle text-warning-subtle-foreground ring-1 ring-warning-border",        icon: XCircle },
  cancelled:   { label: "Cancelled",   badge: "bg-surface-muted text-foreground-muted ring-1 ring-border",       icon: XCircle },
  failed:      { label: "Failed",      badge: "bg-error-subtle text-error-subtle-foreground ring-1 ring-error-border",           icon: XCircle },
};

// Section grouping shown on the page, in display order.
const SECTIONS = [
  { key: "completed", title: "Completed trainings",     accent: "text-success", cats: ["completed"] },
  { key: "ongoing",   title: "In progress",             accent: "text-info",    cats: ["ongoing"] },
  { key: "upcoming",  title: "Upcoming trainings",      accent: "text-primary",  cats: ["upcoming"] },
  { key: "inactive",  title: "Cancelled & transferred", accent: "text-foreground-subtle",   cats: ["cancelled", "transferred", "failed"] },
];

function Fact({ icon: Icon, label, value, href, title, muted = false }) {
  return (
    <Box className="flex items-start gap-3">
      <Box className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-subtle">
        <Icon className="h-4 w-4 text-primary" />
      </Box>
      <Box className="min-w-0">
        <Text as="p" className="text-[11px] uppercase tracking-wider text-foreground-subtle font-semibold">{label}</Text>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-primary hover:text-primary hover:underline leading-tight mt-0.5 break-all inline-block"
          >
            {value}
          </a>
        ) : (
          <Text as="p" title={title}
            className={`text-sm leading-tight mt-0.5 break-words ${muted ? "italic font-medium text-foreground-subtle" : "font-semibold text-foreground"}`}>{value}</Text>
        )}
      </Box>
    </Box>
  );
}

function StatCard({ icon: Icon, value, label, bg, border, iconBg, iconCls, valueCls, labelCls }) {
  return (
    <Card className={`rounded-2xl ${border} shadow-sm ${bg} p-5`}>
      <Box className="flex items-start justify-between mb-3">
        <Box className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${iconCls}`} />
        </Box>
        <Text as="p" className={`text-3xl font-bold ${valueCls} leading-none`}>{value}</Text>
      </Box>
      <Text as="p" className={`text-xs ${labelCls} font-medium`}>{label}</Text>
    </Card>
  );
}

function TrainingCard({ e }) {
  const meta = CATEGORY_META[e.category] || CATEGORY_META.upcoming;
  const StatusIcon = meta.icon;
  return (
    <Link href={`/admin/courses/${e.training_id}`} className="block">
    <Card className="rounded-2xl border border-slate-200/80 shadow-sm p-4 hover:border-primary-border hover:shadow-md transition-all cursor-pointer">
      <Box className="flex items-start justify-between gap-3">
        <Box className="min-w-0">
          <Text as="p" className="text-sm font-semibold text-foreground leading-snug">{e.title}</Text>
          <Box className="flex items-center gap-1.5 mt-1">
            <Hash className="h-3 w-3 text-foreground-subtle shrink-0" />
            <Text as="span" className="text-xs text-foreground-muted font-mono">{e.training_code}</Text>
          </Box>
        </Box>
        <Box className="flex items-center gap-2 shrink-0">
          <Badge className={`border-0 text-[11px] font-semibold px-2 py-0.5 ${meta.badge}`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {meta.label}
          </Badge>
          <Box
            aria-hidden="true"
            className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-foreground-subtle transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Box>
        </Box>
      </Box>

      <Box className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
        <Box className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-foreground-subtle shrink-0" />
          <Text as="span" className="text-xs text-foreground-muted">{formatRange(e.start_date, e.end_date)}</Text>
        </Box>
        {e.delivery_mode && (
          <Box className="flex items-center gap-1.5">
            <Video className="h-3.5 w-3.5 text-foreground-subtle shrink-0" />
            <Text as="span" className="text-xs text-foreground-muted capitalize">{e.delivery_mode.replace(/_/g, " ")}</Text>
          </Box>
        )}
        {e.bucket && (
          <Box className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-foreground-subtle shrink-0" />
            <Text as="span" className="text-xs text-foreground-muted uppercase">{e.bucket}</Text>
          </Box>
        )}
      </Box>

      {(e.certificate_issued || e.added_manually) && (
        <Box className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-border">
          {e.certificate_issued && (
            <Box className="inline-flex items-center gap-1.5 bg-warning-subtle text-warning-subtle-foreground text-[11px] font-semibold px-2 py-0.5 rounded-lg ring-1 ring-warning-border">
              <Award className="h-3 w-3" />
              Certificate {e.certificate_code ? `· ${e.certificate_code}` : "issued"}
            </Box>
          )}
          {e.added_manually && (
            <Box className="inline-flex items-center gap-1.5 bg-surface-hover text-foreground-muted text-[11px] font-medium px-2 py-0.5 rounded-lg ring-1 ring-border">
              <Users2 className="h-3 w-3" />
              Added manually
            </Box>
          )}
        </Box>
      )}
    </Card>
    </Link>
  );
}

export function ParticipantDetail({ userId }) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [emailOpen, setEmailOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [roleSwitching, setRoleSwitching] = useState(false);
  const [roleError, setRoleError] = useState(null);

  const load = useCallback(() => {
    if (!token || !userId) return;
    setError(null);
    fetchParticipantDetail({ token, participantId: userId })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [token, userId]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <Card className="p-6 rounded-2xl border-0 bg-error-subtle shadow-sm">
        <Text as="p" className="text-error text-sm">Failed to load learner: {error}</Text>
      </Card>
    );
  }

  if (!data) {
    return (
      <Box className="space-y-5">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Box className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </Box>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </Box>
    );
  }

  const p = data.participant || {};
  const summary = data.summary || {};
  const enrolments = data.enrolments || [];
  const setupPending = p.account_active && !p.has_password;
  // Only a learner-role account with a linked user can be switched to sponsor.
  const canSwitchToSponsor = p.role === "learner" && !!p.user_id;

  async function switchToSponsor() {
    setRoleSwitching(true); setRoleError(null);
    try {
      await changeParticipantRole({ token, participantId: p.id, role: "sponsor" });
      setRoleDialogOpen(false);
      load();
    } catch (e) {
      setRoleError(e.message);
    } finally {
      setRoleSwitching(false);
    }
  }

  return (
    <Box className="space-y-5">

      <ComposeEmailDialog
        open={emailOpen}
        onOpenChange={setEmailOpen}
        title={`Email ${p.name || "learner"}`}
        fetchRecipients={async () =>
          (await fetchParticipantEmailRecipients({ token, participantId: p.id })).recipients}
        onSend={({ subject, message, recipientIds }) =>
          sendParticipantEmail({ token, participantId: p.id, subject, message, recipientIds })}
      />

      <AlertDialog open={roleDialogOpen} onOpenChange={(v) => !roleSwitching && setRoleDialogOpen(v)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch {p.name || "this learner"} to sponsor?</AlertDialogTitle>
            <AlertDialogDescription>
              This changes their default portal to the sponsor dashboard and signs them out of any
              active session (they&apos;ll sign back in to the sponsor view). It does not remove any
              learner access they already have through their enrolments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {roleError && (
            <Box className="flex items-start gap-2 rounded-lg border border-error-border bg-error-subtle px-3 py-2">
              <AlertCircle className="h-4 w-4 text-error shrink-0 mt-0.5" />
              <Text as="p" className="text-xs text-error-subtle-foreground">{roleError}</Text>
            </Box>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={roleSwitching}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); switchToSponsor(); }}
              disabled={roleSwitching}
              className="bg-primary hover:bg-primary-hover">
              {roleSwitching ? "Switching…" : "Switch to sponsor"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Tabs defaultValue="profile" className="space-y-5">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-5 mt-0">

      {/* Profile hero */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <Box className="bg-[#d7e3fc] border-b border-primary-border px-7 py-7">
          <Box className="flex items-start justify-between gap-4 flex-wrap">
          <Box className="flex items-center gap-5">
            <Box className={`h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0 shadow-sm ${avatarColor(p.id || "")}`}>
              {getInitials(p.name)}
            </Box>
            <Box className="min-w-0">
              <Box className="flex items-center gap-2.5 flex-wrap">
                <Text as="h2" className="text-xl font-bold text-foreground">{p.name}</Text>
                <Badge className={`border-0 text-[11px] font-semibold px-2.5 py-0.5 ${
                  !p.account_active
                    ? "bg-surface-muted text-foreground-muted ring-1 ring-border"
                    : setupPending
                    ? "bg-warning-subtle text-warning-subtle-foreground ring-1 ring-warning-border"
                    : "bg-success-subtle text-success-subtle-foreground ring-1 ring-success-border"
                }`}>
                  {!p.account_active ? "● Inactive" : setupPending ? "● Setup pending" : "● Active"}
                </Badge>
              </Box>
              <Box className="flex items-center gap-1.5 mt-1">
                <Mail className="h-3.5 w-3.5 text-foreground-subtle shrink-0" />
                <Text as="p" className="text-sm text-foreground-muted truncate">{p.email}</Text>
              </Box>
            </Box>
          </Box>
          <Box className="flex items-center gap-2">
            {canSwitchToSponsor && (
              <Button variant="outline" onClick={() => { setRoleError(null); setRoleDialogOpen(true); }}
                className="h-9 gap-1.5 border-border text-foreground hover:bg-surface-muted">
                <UserCog className="h-4 w-4" /> Switch to sponsor
              </Button>
            )}
            <Button variant="outline" onClick={() => setEmailOpen(true)}
              className="h-9 gap-1.5 border-border text-foreground hover:bg-surface-muted">
              <Mail className="h-4 w-4" /> Email
            </Button>
            {/* Never followed their setup link — send it again */}
            {setupPending && (
              <ResendSetupButton
                label="Resend setup email"
                onResend={() => resendParticipantSetupEmail({ token, participantId: p.id })}
              />
            )}
          </Box>
          </Box>
        </Box>

        <Box className="p-6">
          <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Fact icon={Briefcase} label="Job Title" value={p.job_title || "—"} />
            <Fact icon={Building2} label="Company" value={p.company_name || "—"} />
            <Fact icon={UserCheck} label="Agent" value={p.agent || "—"} />
            <Fact icon={Layers} label="Department" value={p.department || "—"} />
            <Fact
              icon={Clock3}
              label="Experience"
              value={p.years_experience != null ? `${p.years_experience} ${p.years_experience === 1 ? "year" : "years"}` : "—"}
            />
            <Fact icon={MapPin} label="Location" value={p.location || "—"} />
            <Fact icon={Phone} label="Phone" value={p.phone || "—"} />
            <Fact
              icon={Link2}
              label="LinkedIn"
              value={p.linkedin_url ? "View profile" : "—"}
              href={p.linkedin_url || undefined}
            />
            <Fact icon={Calendar} label="Joined" value={formatStamp(p.created_at)} />
            {/* Sits beside Joined on purpose — "joined in March, never signed
                in" is the pair an admin reads to spot a stalled invitation. */}
            <Fact icon={LogIn} label="Last Login" value={lastLoginLabel(p.last_login_at)}
              title={lastLoginTitle(p.last_login_at)} muted={hasNeverLoggedIn(p.last_login_at)} />
          </Box>
        </Box>
      </Card>

      {/* Summary stats */}
      <Box className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={BookOpen}     value={summary.total ?? 0}        label="Total Enrolments" bg="bg-surface-hover"    border="border border-border"   iconBg="bg-surface-muted"   iconCls="text-foreground-muted"   valueCls="text-foreground"   labelCls="text-foreground-muted" />
        <StatCard icon={CheckCircle2} value={summary.completed ?? 0}    label="Completed"        bg="bg-success-subtle"  border="border border-success-border" iconBg="bg-success-subtle" iconCls="text-success" valueCls="text-success-subtle-foreground" labelCls="text-success" />
        <StatCard icon={Clock}        value={summary.upcoming ?? 0}     label="Upcoming"         bg="bg-primary-subtle"   border="border border-primary-border"  iconBg="bg-primary-subtle"  iconCls="text-primary"  valueCls="text-primary"  labelCls="text-primary" />
        <StatCard icon={PlayCircle}   value={summary.ongoing ?? 0}      label="In Progress"      bg="bg-info-subtle"     border="border border-info-border"    iconBg="bg-info-subtle"    iconCls="text-info"    valueCls="text-blue-900"    labelCls="text-info" />
        <StatCard icon={Award}        value={summary.certificates ?? 0} label="Certificates"     bg="bg-warning-subtle"    border="border border-warning-border"   iconBg="bg-warning-subtle"   iconCls="text-warning"   valueCls="text-warning-subtle-foreground"   labelCls="text-warning" />
      </Box>

      {/* Enrolments */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <Box className="px-6 py-4 border-b border-border flex items-center gap-2.5">
          <Box className="w-8 h-8 rounded-lg bg-primary-subtle flex items-center justify-center">
            <GraduationCap className="h-4 w-4 text-primary" />
          </Box>
          <Text as="h3" className="text-sm font-bold text-foreground">Trainings &amp; Enrolments</Text>
          <Badge className="border-0 bg-primary-subtle text-primary text-[11px] font-semibold ml-1">{enrolments.length}</Badge>
        </Box>

        {enrolments.length === 0 ? (
          <Box className="py-20 text-center">
            <Box className="w-12 h-12 rounded-2xl bg-surface-muted flex items-center justify-center mx-auto mb-3">
              <BookOpen className="h-6 w-6 text-foreground-subtle" />
            </Box>
            <Text as="p" className="text-sm font-medium text-foreground-muted">No enrolments yet</Text>
            <Text as="p" className="text-xs text-foreground-subtle mt-1">This learner hasn&apos;t enrolled in any training.</Text>
          </Box>
        ) : (
          <Box className="p-6 space-y-6">
            {SECTIONS.map((section) => {
              const items = enrolments.filter((e) => section.cats.includes(e.category));
              if (items.length === 0) return null;
              return (
                <Box key={section.key} className="space-y-3">
                  <Box className="flex items-center gap-2">
                    <Text as="h4" className={`text-[11px] font-bold uppercase tracking-wider ${section.accent}`}>{section.title}</Text>
                    <Badge className="border-0 bg-surface-muted text-foreground-muted text-[10px] font-semibold">{items.length}</Badge>
                  </Box>
                  <Box className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {items.map((e) => <TrainingCard key={e.enrolment_id} e={e} />)}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Card>
        </TabsContent>

        <TabsContent value="timeline" className="mt-0">
          <EmailTimeline cacheKey={`participant:${p.id}`} fetchEmails={() => fetchParticipantEmails({ token, participantId: p.id })} />
        </TabsContent>
      </Tabs>
    </Box>
  );
}
