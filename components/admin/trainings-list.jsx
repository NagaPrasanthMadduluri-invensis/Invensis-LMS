"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Calendar, Users, Clock, UserCheck, UserX, UserPlus,
  ChevronRight, BookOpen, LayoutGrid, Link2, LinkIcon,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchAdminTrainings } from "@/services/api/admin/admin-api";

const STATUS_CONFIG = {
  pending:   { label: "Pending",   badge: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",   accent: "bg-amber-400" },
  active:    { label: "Active",    badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", accent: "bg-emerald-500" },
  ongoing:   { label: "Ongoing",   badge: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",       accent: "bg-blue-500" },
  completed: { label: "Completed", badge: "bg-slate-100 text-slate-600",                          accent: "bg-slate-400" },
  cancelled: { label: "Cancelled", badge: "bg-red-50 text-red-600 ring-1 ring-red-200",           accent: "bg-red-500" },
};

const MODE_LABEL = {
  virtual: "Live Virtual", in_person: "In Person", hybrid: "Hybrid", one_to_one: "1-to-1",
};

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function StatCard({ label, value, icon: Icon, bg, border, iconBg, iconCls, valueCls, labelCls }) {
  return (
    <Card className={`rounded-2xl ${border} shadow-sm ${bg} p-5`}>
      <Box className="flex items-start justify-between mb-4">
        <Box className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${iconCls}`} />
        </Box>
        <Text as="p" className={`text-3xl font-bold ${valueCls} leading-none`}>{value}</Text>
      </Box>
      <Text as="p" className={`text-sm ${labelCls} font-medium`}>{label}</Text>
    </Card>
  );
}

function CardSkeleton() {
  return (
    <Card className="rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
      <Box className="flex justify-between">
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </Box>
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-3/5" />
      <Box className="space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </Box>
      <Skeleton className="h-9 w-full rounded-xl" />
    </Card>
  );
}

function initialsOf(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join("") || "?";
}

function TrainingCard({ training, onClick }) {
  const statusCfg = STATUS_CONFIG[training.status] || STATUS_CONFIG.active;
  const hasTrainer = training.trainer_assigned;

  return (
    <Card
      className="rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer bg-white overflow-hidden group flex flex-col"
      onClick={onClick}
    >
      <Box className="p-5 flex flex-col flex-1 gap-4">

        {/* Row 1: Training ID + Status */}
        <Box className="flex items-center justify-between">
          <Text as="span" className="text-[11px] font-mono font-bold text-indigo-600 bg-indigo-50 ring-1 ring-indigo-200 px-2.5 py-1 rounded-lg tracking-wide">
            {training.code}
          </Text>
          <Badge className={`text-[10px] font-semibold border-0 ${statusCfg.badge}`}>{statusCfg.label}</Badge>
        </Box>

        {/* Title */}
        <Text as="h3" className="text-[17px] font-bold text-slate-900 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {training.title}
        </Text>

        {/* Metadata pills */}
        <Box className="flex flex-wrap gap-2">
          <Box className="flex items-center gap-2 bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-2">
            <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <Text as="span" className="text-xs font-medium text-slate-600 leading-none">{formatDate(training.start_date)}</Text>
          </Box>
          <Box className="flex items-center gap-2 bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-2">
            <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <Text as="span" className="text-xs font-medium text-slate-600 leading-none">
              {MODE_LABEL[training.delivery_mode] || training.delivery_mode}
              {training.duration_hours != null && ` · ${training.duration_hours}h`}
            </Text>
          </Box>
          <Box className="flex items-center gap-2 bg-slate-50 border border-slate-200/70 rounded-xl px-3 py-2">
            <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <Text as="span" className="text-xs font-medium text-slate-600 leading-none">{training.enrolled_count}/{training.capacity} seats</Text>
          </Box>
        </Box>

        {/* Info blocks — trainer + meeting link */}
        <Box className="flex-1 flex flex-col gap-2.5">

          {/* Trainer block */}
          {hasTrainer ? (
            <Box className="flex items-center gap-3 bg-emerald-50 ring-1 ring-emerald-200 rounded-xl px-3.5 py-3">
              <Box className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                <Text as="span" className="text-[11px] font-bold text-white leading-none">{initialsOf(training.trainer_name)}</Text>
              </Box>
              <Box className="min-w-0 flex-1">
                <Text as="p" className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest leading-none mb-0.5">Trainer</Text>
                <Text as="p" className="text-sm font-semibold text-emerald-900 truncate">{training.trainer_name}</Text>
              </Box>
              <UserCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            </Box>
          ) : (
            <Box
              className="flex items-center justify-between gap-3 bg-amber-50 ring-1 ring-amber-300 rounded-xl px-3.5 py-3 hover:bg-amber-100 transition-colors"
              onClick={(e) => { e.stopPropagation(); onClick(); }}
            >
              <Box className="flex items-center gap-3 min-w-0">
                <Box className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center shrink-0">
                  <UserX className="h-3.5 w-3.5 text-amber-700" />
                </Box>
                <Box className="min-w-0">
                  <Text as="p" className="text-[10px] font-bold text-amber-700 uppercase tracking-widest leading-none mb-0.5">No Trainer</Text>
                  <Text as="p" className="text-[11px] text-amber-600">Click to assign</Text>
                </Box>
              </Box>
              <Box className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shrink-0 transition-colors shadow-sm">
                <UserPlus className="h-3 w-3" />
                Assign
              </Box>
            </Box>
          )}

          {/* Meeting link block */}
          {training.meeting_released ? (
            <Box className="flex items-center gap-3 bg-indigo-50 ring-1 ring-indigo-200 rounded-xl px-3.5 py-3">
              <Box className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 shadow-sm">
                <Link2 className="h-3.5 w-3.5 text-white" />
              </Box>
              <Box className="min-w-0 flex-1">
                <Text as="p" className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest leading-none mb-0.5">Meeting Link</Text>
                <Text as="p" className="text-sm font-semibold text-indigo-900">Released to participants</Text>
              </Box>
              <Box className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 shadow-sm" />
            </Box>
          ) : training.meeting_url ? (
            <Box className="flex items-center gap-3 bg-amber-50 ring-1 ring-amber-200 rounded-xl px-3.5 py-3">
              <Box className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shrink-0 shadow-sm">
                <LinkIcon className="h-3.5 w-3.5 text-white" />
              </Box>
              <Box className="min-w-0 flex-1">
                <Text as="p" className="text-[10px] font-bold text-amber-700 uppercase tracking-widest leading-none mb-0.5">Meeting Link</Text>
                <Text as="p" className="text-sm font-semibold text-amber-900">Set · Not yet released</Text>
              </Box>
              <Box className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            </Box>
          ) : (
            <Box className="flex items-center gap-3 bg-slate-50 ring-1 ring-slate-200 rounded-xl px-3.5 py-3">
              <Box className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                <LinkIcon className="h-3.5 w-3.5 text-slate-500" />
              </Box>
              <Box className="min-w-0 flex-1">
                <Text as="p" className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">Meeting Link</Text>
                <Text as="p" className="text-sm font-medium text-slate-500">Not configured</Text>
              </Box>
              <Box className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
            </Box>
          )}

        </Box>

        {/* Footer */}
        <Box className="pt-3 border-t border-slate-100">
          <Button
            size="sm"
            className="w-full h-9 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold border-0 rounded-xl gap-1.5"
          >
            Manage Training <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </Box>

      </Box>
    </Card>
  );
}

export function TrainingsList() {
  const { token } = useAuth();
  const router = useRouter();
  const [trainings, setTrainings] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState(null);

  const pathname = usePathname();

  // Keying on `pathname` (not just `token`) forces a refetch every time the
  // admin navigates back to this list — e.g. via the "Courses" <Link> from a
  // training's detail page after reassigning a trainer. Without it, Next.js's
  // client-side route cache can restore this component without remounting it,
  // so a mount-only fetch would never see the update.
  useEffect(() => {
    if (!token) return;
    fetchAdminTrainings({ token })
      .then((data) => setTrainings(data.trainings || []))
      .catch((err) => setError(err.message));
  }, [token, pathname]);

  if (error) {
    return (
      <Card className="p-6 rounded-2xl border-0 bg-red-50 shadow-sm">
        <Text as="p" className="text-red-600 text-sm">Failed to load trainings: {error}</Text>
      </Card>
    );
  }

  if (!trainings) {
    return (
      <Box className="space-y-6">
        <Box className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </Box>
        <Box className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </Box>
      </Box>
    );
  }

  const unassigned = trainings.filter((t) => !t.trainer_assigned).length;
  const statusCounts = trainings.reduce((acc, t) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});
  const filtered = trainings.filter((t) => {
    const q = search.toLowerCase();
    const matchesSearch = t.title.toLowerCase().includes(q) || t.code.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const STATUS_TABS = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "active", label: "Active" },
    { key: "ongoing", label: "Ongoing" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  return (
    <Box className="space-y-6">
      {/* Stat cards */}
      <Box className="grid grid-cols-3 gap-4">
        <StatCard label="Total Trainings"   value={trainings.length}              icon={LayoutGrid}
          bg="bg-indigo-50"  border="border border-indigo-100"  iconBg="bg-indigo-100"  iconCls="text-indigo-600"  valueCls="text-indigo-900"  labelCls="text-indigo-500" />
        <StatCard label="Trainer Assigned"  value={trainings.length - unassigned} icon={UserCheck}
          bg="bg-emerald-50" border="border border-emerald-100" iconBg="bg-emerald-100" iconCls="text-emerald-600" valueCls="text-emerald-900" labelCls="text-emerald-600" />
        <StatCard label="Awaiting Trainer"  value={unassigned}                    icon={UserX}
          bg="bg-amber-50"   border="border border-amber-100"   iconBg="bg-amber-100"   iconCls="text-amber-600"   valueCls="text-amber-900"   labelCls="text-amber-600" />
      </Box>

      {/* Search */}
      <Box className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by training ID or title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-11 text-sm bg-slate-200/60 border-slate-300/70 rounded-xl focus-visible:ring-indigo-400/50"
        />
      </Box>

      {/* Status filter pills */}
      <Box className="flex flex-wrap items-center gap-2">
        {STATUS_TABS.map((tab) => {
          const count = tab.key === "all" ? trainings.length : (statusCounts[tab.key] || 0);
          const activeTab = statusFilter === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setStatusFilter(tab.key)}
              className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                activeTab
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {tab.label}
              <Text
                as="span"
                className={`rounded-full px-1.5 text-[10px] font-bold ${
                  activeTab ? "bg-white/25 text-white" : "bg-white text-slate-500"
                }`}
              >
                {count}
              </Text>
            </button>
          );
        })}
      </Box>

      <Box className="flex items-center justify-between">
        <Text as="p" className="text-xs text-slate-400">
          {filtered.length} of {trainings.length} training{trainings.length !== 1 ? "s" : ""}
          {statusFilter !== "all" ? ` · ${STATUS_TABS.find((t) => t.key === statusFilter)?.label}` : ""}
        </Text>
      </Box>

      {filtered.length === 0 ? (
        <Card className="p-14 text-center rounded-2xl border border-slate-200/80 shadow-sm bg-white">
          <Box className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-7 w-7 text-slate-400" />
          </Box>
          <Text as="p" className="text-sm font-semibold text-slate-600">
            {search || statusFilter !== "all" ? "No trainings match your filters" : "No trainings yet"}
          </Text>
        </Card>
      ) : (
        <Box className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((t) => (
            <TrainingCard key={t.id} training={t} onClick={() => router.push(`/admin/courses/${t.id}`)} />
          ))}
        </Box>
      )}
    </Box>
  );
}
