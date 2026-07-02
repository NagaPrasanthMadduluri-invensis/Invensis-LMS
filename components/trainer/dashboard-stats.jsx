"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ClipboardCheck, Star, BookOpen, ChevronRight, Hash } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchMyTrainings } from "@/services/api/trainer/trainer-api";
import Link from "next/link";

const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "bg-amber-100 text-amber-700" },
  active:    { label: "Active",    color: "bg-emerald-100 text-emerald-700" },
  ongoing:   { label: "Ongoing",   color: "bg-blue-100 text-blue-700" },
  scheduled: { label: "Scheduled", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", color: "bg-slate-100 text-slate-600" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-600" },
};

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function StatCard({ label, value, icon: Icon, bg, border, iconBg, iconCls, valueCls, labelCls }) {
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

function SectionHeader({ title, action }) {
  return (
    <Box className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
      <Text as="h3" className="text-sm font-bold text-slate-800">{title}</Text>
      {action}
    </Box>
  );
}

export function TrainerDashboardStats() {
  const { token, user } = useAuth();
  const [trainings, setTrainings] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !user) return;
    fetchMyTrainings({ token })
      .then((d) => setTrainings(d.trainings || []))
      .catch((e) => setError(e.message));
  }, [token, user]);

  const activeCount = trainings ? trainings.filter((t) => t.status === "active" || t.status === "ongoing").length : 0;
  const totalCount = trainings ? trainings.length : 0;

  return (
    <Box className="space-y-6">
      {/* Stat cards */}
      <Box className="grid gap-4 grid-cols-1 sm:grid-cols-3">
        <StatCard
          label="Assigned Trainings"
          value={trainings ? totalCount : "—"}
          icon={BookOpen}
          bg="bg-teal-50" border="border border-teal-100"
          iconBg="bg-teal-100" iconCls="text-teal-600"
          valueCls="text-teal-900" labelCls="text-teal-500"
        />
        <StatCard
          label="Active / Ongoing"
          value={trainings ? activeCount : "—"}
          icon={CalendarDays}
          bg="bg-emerald-50" border="border border-emerald-100"
          iconBg="bg-emerald-100" iconCls="text-emerald-600"
          valueCls="text-emerald-900" labelCls="text-emerald-600"
        />
        <StatCard
          label="Avg. Feedback Score"
          value="—"
          icon={Star}
          bg="bg-amber-50" border="border border-amber-100"
          iconBg="bg-amber-100" iconCls="text-amber-600"
          valueCls="text-amber-900" labelCls="text-amber-600"
        />
      </Box>

      {/* Assigned trainings list */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <SectionHeader
          title="My Assigned Trainings"
          action={
            <Link href="/trainer/sessions"
              className="text-xs text-teal-600 font-semibold hover:text-teal-800 flex items-center gap-0.5">
              Manage Sessions <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          }
        />

        {error && (
          <Box className="px-5 py-4">
            <Text as="p" className="text-sm text-red-500">Failed to load trainings: {error}</Text>
          </Box>
        )}

        {!trainings && !error && (
          <Box className="divide-y divide-slate-100">
            {Array.from({ length: 2 }).map((_, i) => (
              <Box key={i} className="flex items-center gap-3 px-5 py-4">
                <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
                <Box className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-48" />
                  <Skeleton className="h-2.5 w-32" />
                </Box>
                <Skeleton className="h-5 w-16 rounded-full" />
              </Box>
            ))}
          </Box>
        )}

        {trainings && trainings.length === 0 && (
          <Box className="py-16 text-center">
            <Box className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center mx-auto mb-3">
              <BookOpen className="h-6 w-6 text-teal-400" />
            </Box>
            <Text as="p" className="text-sm font-medium text-slate-500">No trainings assigned yet.</Text>
            <Text as="p" className="text-xs text-slate-400 mt-1">
              Your admin will assign you to a training — it will appear here automatically.
            </Text>
          </Box>
        )}

        {trainings && trainings.length > 0 && (
          <Box className="divide-y divide-slate-100">
            {trainings.map((t) => {
              const statusCfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.active;
              return (
                <Box key={t.id} className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50/60 transition-colors">
                  <Box className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                    <Hash className="h-4 w-4 text-teal-600" />
                  </Box>
                  <Box className="flex-1 min-w-0">
                    <Text as="p" className="text-sm font-semibold text-slate-800 truncate">{t.title}</Text>
                    <Box className="flex items-center gap-2 mt-0.5">
                      <Text as="span" className="text-[11px] font-mono font-bold text-teal-600 bg-teal-50 ring-1 ring-teal-200 px-1.5 py-0.5 rounded">
                        {t.code}
                      </Text>
                      <Text as="span" className="text-[11px] text-slate-400">
                        {formatDate(t.start_date)} – {formatDate(t.end_date)}
                      </Text>
                    </Box>
                  </Box>
                  <Badge className={`border-0 text-[10px] font-semibold shrink-0 ${statusCfg.color}`}>
                    {statusCfg.label}
                  </Badge>
                </Box>
              );
            })}
          </Box>
        )}
      </Card>
    </Box>
  );
}
