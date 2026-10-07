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
import { formatDate as fmtDate } from "@/lib/datetime";

const STATUS_CONFIG = {
  pending:   { label: "Pending",   color: "bg-warning-subtle text-warning-subtle-foreground" },
  active:    { label: "Active",    color: "bg-success-subtle text-success-subtle-foreground" },
  ongoing:   { label: "Ongoing",   color: "bg-info-subtle text-info-subtle-foreground" },
  scheduled: { label: "Scheduled", color: "bg-info-subtle text-info-subtle-foreground" },
  completed: { label: "Completed", color: "bg-surface-muted text-foreground-muted" },
  cancelled: { label: "Cancelled", color: "bg-error-subtle text-error" },
  postponed: { label: "Postponed", color: "bg-warning-subtle text-warning-subtle-foreground" },
  suspended: { label: "Suspended", color: "bg-error-subtle text-error-subtle-foreground" },
};

// Training dates print exactly as the API sent them — see `lib/datetime`.
const formatDate = (d) => fmtDate(d);

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
    <Box className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
      <Text as="h3" className="text-sm font-bold text-foreground">{title}</Text>
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
          bg="bg-info-subtle" border="border border-info-border"
          iconBg="bg-info-subtle" iconCls="text-info"
          valueCls="text-info-subtle-foreground" labelCls="text-info"
        />
        <StatCard
          label="Active / Ongoing"
          value={trainings ? activeCount : "—"}
          icon={CalendarDays}
          bg="bg-success-subtle" border="border border-success-border"
          iconBg="bg-success-subtle" iconCls="text-success"
          valueCls="text-success-subtle-foreground" labelCls="text-success"
        />
        <StatCard
          label="Avg. Feedback Score"
          value="—"
          icon={Star}
          bg="bg-warning-subtle" border="border border-warning-border"
          iconBg="bg-warning-subtle" iconCls="text-warning"
          valueCls="text-warning-subtle-foreground" labelCls="text-warning"
        />
      </Box>

      {/* Assigned trainings list */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <SectionHeader
          title="My Assigned Trainings"
          action={
            <Link href="/trainer/sessions"
              className="text-xs text-info font-semibold hover:text-info-subtle-foreground flex items-center gap-0.5">
              Manage Sessions <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          }
        />

        {error && (
          <Box className="px-5 py-4">
            <Text as="p" className="text-sm text-error">Failed to load trainings: {error}</Text>
          </Box>
        )}

        {!trainings && !error && (
          <Box className="divide-y divide-border">
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
            <Box className="w-12 h-12 rounded-2xl bg-info-subtle flex items-center justify-center mx-auto mb-3">
              <BookOpen className="h-6 w-6 text-info" />
            </Box>
            <Text as="p" className="text-sm font-medium text-foreground-muted">No trainings assigned yet.</Text>
            <Text as="p" className="text-xs text-foreground-subtle mt-1">
              Your admin will assign you to a training — it will appear here automatically.
            </Text>
          </Box>
        )}

        {trainings && trainings.length > 0 && (
          <Box className="divide-y divide-border">
            {trainings.map((t) => {
              const statusCfg = STATUS_CONFIG[t.status] || STATUS_CONFIG.active;
              return (
                <Box key={t.id} className="flex items-center gap-3 px-5 py-4 hover:bg-slate-50/60 transition-colors">
                  <Box className="w-9 h-9 rounded-xl bg-info-subtle flex items-center justify-center shrink-0">
                    <Hash className="h-4 w-4 text-info" />
                  </Box>
                  <Box className="flex-1 min-w-0">
                    <Text as="p" className="text-sm font-semibold text-foreground truncate">{t.title}</Text>
                    <Box className="flex items-center gap-2 mt-0.5">
                      <Text as="span" className="text-[11px] font-mono font-bold text-info bg-info-subtle ring-1 ring-info-border px-1.5 py-0.5 rounded">
                        {t.code}
                      </Text>
                      <Text as="span" className="text-[11px] text-foreground-subtle">
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
