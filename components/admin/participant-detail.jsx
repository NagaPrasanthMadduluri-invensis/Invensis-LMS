"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen, CheckCircle2, Clock, PlayCircle, Award, XCircle, Mail,
  Briefcase, MapPin, Calendar, Hash, Video, Users2, Phone, GraduationCap,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchParticipantDetail } from "@/services/api/admin/admin-api";

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

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatRange(start, end) {
  if (!start && !end) return "Not scheduled";
  if (start && end) return `${formatDate(start)} → ${formatDate(end)}`;
  return formatDate(start || end);
}

// Category → visual treatment. Keys match the `category` field the API returns.
const CATEGORY_META = {
  completed:   { label: "Completed",   badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",  icon: CheckCircle2 },
  ongoing:     { label: "In progress", badge: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",           icon: PlayCircle },
  upcoming:    { label: "Upcoming",    badge: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",     icon: Clock },
  transferred: { label: "Transferred", badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",        icon: XCircle },
  cancelled:   { label: "Cancelled",   badge: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",       icon: XCircle },
  failed:      { label: "Failed",      badge: "bg-rose-50 text-rose-700 ring-1 ring-rose-200",           icon: XCircle },
};

// Section grouping shown on the page, in display order.
const SECTIONS = [
  { key: "completed", title: "Completed trainings",     accent: "text-emerald-500", cats: ["completed"] },
  { key: "ongoing",   title: "In progress",             accent: "text-blue-500",    cats: ["ongoing"] },
  { key: "upcoming",  title: "Upcoming trainings",      accent: "text-violet-500",  cats: ["upcoming"] },
  { key: "inactive",  title: "Cancelled & transferred", accent: "text-slate-400",   cats: ["cancelled", "transferred", "failed"] },
];

function Fact({ icon: Icon, label, value }) {
  return (
    <Box className="flex items-start gap-3">
      <Box className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-50">
        <Icon className="h-4 w-4 text-violet-500" />
      </Box>
      <Box className="min-w-0">
        <Text as="p" className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{label}</Text>
        <Text as="p" className="text-sm font-semibold text-slate-800 leading-tight mt-0.5 break-words">{value}</Text>
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
    <Card className="rounded-2xl border border-slate-200/80 shadow-sm p-4 hover:border-violet-200 hover:shadow-md transition-all">
      <Box className="flex items-start justify-between gap-3">
        <Box className="min-w-0">
          <Text as="p" className="text-sm font-semibold text-slate-800 leading-snug">{e.title}</Text>
          <Box className="flex items-center gap-1.5 mt-1">
            <Hash className="h-3 w-3 text-slate-400 shrink-0" />
            <Text as="span" className="text-xs text-slate-500 font-mono">{e.training_code}</Text>
          </Box>
        </Box>
        <Badge className={`border-0 text-[11px] font-semibold px-2 py-0.5 shrink-0 ${meta.badge}`}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {meta.label}
        </Badge>
      </Box>

      <Box className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-3">
        <Box className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <Text as="span" className="text-xs text-slate-600">{formatRange(e.start_date, e.end_date)}</Text>
        </Box>
        {e.delivery_mode && (
          <Box className="flex items-center gap-1.5">
            <Video className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <Text as="span" className="text-xs text-slate-600 capitalize">{e.delivery_mode.replace(/_/g, " ")}</Text>
          </Box>
        )}
        {e.bucket && (
          <Box className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <Text as="span" className="text-xs text-slate-600 uppercase">{e.bucket}</Text>
          </Box>
        )}
      </Box>

      {(e.certificate_issued || e.added_manually) && (
        <Box className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
          {e.certificate_issued && (
            <Box className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-[11px] font-semibold px-2 py-0.5 rounded-lg ring-1 ring-amber-200">
              <Award className="h-3 w-3" />
              Certificate {e.certificate_code ? `· ${e.certificate_code}` : "issued"}
            </Box>
          )}
          {e.added_manually && (
            <Box className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-500 text-[11px] font-medium px-2 py-0.5 rounded-lg ring-1 ring-slate-200">
              <Users2 className="h-3 w-3" />
              Added manually
            </Box>
          )}
        </Box>
      )}
    </Card>
  );
}

export function ParticipantDetail({ userId }) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !userId) return;
    setError(null);
    fetchParticipantDetail({ token, participantId: userId })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [token, userId]);

  if (error) {
    return (
      <Card className="p-6 rounded-2xl border-0 bg-red-50 shadow-sm">
        <Text as="p" className="text-red-600 text-sm">Failed to load learner: {error}</Text>
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

  return (
    <Box className="space-y-5">

      {/* Profile hero */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <Box className="bg-gradient-to-r from-violet-50 via-purple-50 to-violet-50 border-b border-violet-100 px-7 py-7">
          <Box className="flex items-center gap-5">
            <Box className={`h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shrink-0 shadow-sm ${avatarColor(p.id || "")}`}>
              {getInitials(p.name)}
            </Box>
            <Box className="min-w-0">
              <Box className="flex items-center gap-2.5 flex-wrap">
                <Text as="h2" className="text-xl font-bold text-slate-900">{p.name}</Text>
                <Badge className={`border-0 text-[11px] font-semibold px-2.5 py-0.5 ${
                  !p.account_active
                    ? "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                    : setupPending
                    ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200"
                    : "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                }`}>
                  {!p.account_active ? "● Inactive" : setupPending ? "● Setup pending" : "● Active"}
                </Badge>
              </Box>
              <Box className="flex items-center gap-1.5 mt-1">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <Text as="p" className="text-sm text-slate-500 truncate">{p.email}</Text>
              </Box>
            </Box>
          </Box>
        </Box>

        <Box className="p-6">
          <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Fact icon={Briefcase} label="Job Title" value={p.job_title || "—"} />
            <Fact icon={MapPin} label="Location" value={p.location || "—"} />
            <Fact icon={Phone} label="Phone" value={p.phone || "—"} />
            <Fact icon={Calendar} label="Joined" value={formatDate(p.created_at)} />
          </Box>
        </Box>
      </Card>

      {/* Summary stats */}
      <Box className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={BookOpen}     value={summary.total ?? 0}        label="Total Enrolments" bg="bg-slate-50"    border="border border-slate-200"   iconBg="bg-slate-100"   iconCls="text-slate-500"   valueCls="text-slate-800"   labelCls="text-slate-500" />
        <StatCard icon={CheckCircle2} value={summary.completed ?? 0}    label="Completed"        bg="bg-emerald-50"  border="border border-emerald-100" iconBg="bg-emerald-100" iconCls="text-emerald-600" valueCls="text-emerald-900" labelCls="text-emerald-600" />
        <StatCard icon={Clock}        value={summary.upcoming ?? 0}     label="Upcoming"         bg="bg-violet-50"   border="border border-violet-100"  iconBg="bg-violet-100"  iconCls="text-violet-600"  valueCls="text-violet-900"  labelCls="text-violet-500" />
        <StatCard icon={PlayCircle}   value={summary.ongoing ?? 0}      label="In Progress"      bg="bg-blue-50"     border="border border-blue-100"    iconBg="bg-blue-100"    iconCls="text-blue-600"    valueCls="text-blue-900"    labelCls="text-blue-500" />
        <StatCard icon={Award}        value={summary.certificates ?? 0} label="Certificates"     bg="bg-amber-50"    border="border border-amber-100"   iconBg="bg-amber-100"   iconCls="text-amber-600"   valueCls="text-amber-900"   labelCls="text-amber-500" />
      </Box>

      {/* Enrolments */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <Box className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
          <Box className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
            <GraduationCap className="h-4 w-4 text-violet-500" />
          </Box>
          <Text as="h3" className="text-sm font-bold text-slate-800">Trainings &amp; Enrolments</Text>
          <Badge className="border-0 bg-violet-50 text-violet-600 text-[11px] font-semibold ml-1">{enrolments.length}</Badge>
        </Box>

        {enrolments.length === 0 ? (
          <Box className="py-20 text-center">
            <Box className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="h-6 w-6 text-slate-400" />
            </Box>
            <Text as="p" className="text-sm font-medium text-slate-500">No enrolments yet</Text>
            <Text as="p" className="text-xs text-slate-400 mt-1">This learner hasn&apos;t enrolled in any training.</Text>
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
                    <Badge className="border-0 bg-slate-100 text-slate-500 text-[10px] font-semibold">{items.length}</Badge>
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
    </Box>
  );
}
