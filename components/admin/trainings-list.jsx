"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrainerLink } from "@/components/admin/entity-links";
import { Button } from "@/components/ui/button";
import {
  Calendar, Users, Clock, UserCheck, UserX, UserPlus,
  ChevronRight, BookOpen, LayoutGrid, Link2, LinkIcon,
  UploadCloud, Globe, Timer,
} from "lucide-react";
import { ImportResourcesDialog } from "@/components/admin/import-resources-dialog";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { formatDate as fmtDate } from "@/lib/datetime";
import { fetchAdminTrainings } from "@/services/api/admin/admin-api";
import { regionForTimezone } from "@/lib/region";
import { useTrainingFilters, statusBadge } from "@/components/shared/training-filters";

const MODE_LABEL = {
  virtual: "Live Virtual", in_person: "In Person", hybrid: "Hybrid", one_to_one: "1-to-1",
};

// Training dates print exactly as the API sent them — see `lib/datetime`.
const formatDate = (d) => fmtDate(d);

function StatCard({ label, value, icon: Icon, bg, border, iconBg, iconCls, valueCls, labelCls }) {
  return (
    <Card className={`rounded-2xl ${border} shadow-sm ${bg} px-5 py-4`}>
      <Box className="flex items-center gap-3">
        <Box className={`w-11 h-11 ${iconBg} rounded-xl flex items-center justify-center shrink-0`}>
          <Icon className={`h-5 w-5 ${iconCls}`} />
        </Box>
        <Box className="min-w-0">
          <Text as="p" className={`text-2xl font-bold ${valueCls} leading-none`}>{value}</Text>
          <Text as="p" className={`text-xs ${labelCls} font-medium mt-1`}>{label}</Text>
        </Box>
      </Box>
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
  const statusCfg = statusBadge(training);
  const hasTrainer = training.trainer_assigned;

  return (
    <Card
      className="rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer bg-surface overflow-hidden group flex flex-col"
      onClick={onClick}
    >
      <Box className="p-5 flex flex-col flex-1 gap-4">

        {/* Row 1: Training ID + schedule event code + Status.
            The event code is the CMS's own identifier for the schedule
            ("INL000055") — the same value printed on a certificate as its
            Course Identifier. It is shown next to the Training ID so an admin
            can match a training here against the schedule in the CMS without
            opening it. Older/manually created schedules have none, and the
            chip is then omitted rather than shown empty. */}
        <Box className="flex items-center justify-between gap-2">
          <Box className="flex min-w-0 items-center gap-1.5">
            <Text as="span" className="shrink-0 text-[11px] font-mono font-bold text-primary bg-primary-subtle ring-1 ring-primary-border px-2.5 py-1 rounded-lg tracking-wide">
              {training.code}
            </Text>
            {training.event_code && (
              <Text
                as="span"
                title={`Schedule event code · ${training.event_code}`}
                className="shrink-0 text-[11px] font-mono font-bold text-foreground-muted bg-surface-hover ring-1 ring-border px-2.5 py-1 rounded-lg tracking-wide"
              >
                {training.event_code}
              </Text>
            )}
          </Box>
          <Box className="flex shrink-0 items-center gap-1.5">
            {training.due_for_update && (
              <Badge className="text-[10px] font-semibold border-0 bg-warning-subtle text-warning-subtle-foreground ring-1 ring-warning-border">Due for Update</Badge>
            )}
            <Badge className={`text-[10px] font-semibold border-0 ${statusCfg.badge}`}>{statusCfg.label}</Badge>
          </Box>
        </Box>

        {/* Title */}
        <Text as="h3" className="text-base font-bold text-foreground leading-snug line-clamp-2 min-h-[2.75rem] break-words hyphens-none group-hover:text-primary transition-colors">
          {training.title}
        </Text>

        {/* Metadata pills */}
        <Box className="flex flex-wrap gap-2">
          <Box className="flex items-center gap-2 bg-surface-hover border border-slate-200/70 rounded-xl px-3 py-2">
            <Calendar className="h-3.5 w-3.5 text-foreground-subtle shrink-0" />
            <Text as="span" className="text-xs font-medium text-foreground-muted leading-none">{formatDate(training.start_date)}</Text>
          </Box>
          <Box className="flex items-center gap-2 bg-surface-hover border border-slate-200/70 rounded-xl px-3 py-2">
            <Clock className="h-3.5 w-3.5 text-foreground-subtle shrink-0" />
            <Text as="span" className="text-xs font-medium text-foreground-muted leading-none">
              {MODE_LABEL[training.delivery_mode] || training.delivery_mode}
              {training.duration_hours != null && ` · ${training.duration_hours}h`}
            </Text>
          </Box>
          <Box className="flex items-center gap-2 bg-surface-hover border border-slate-200/70 rounded-xl px-3 py-2">
            <Users className="h-3.5 w-3.5 text-foreground-subtle shrink-0" />
            <Text as="span" className="text-xs font-medium text-foreground-muted leading-none">{training.enrolled_count}/{training.capacity} seats</Text>
          </Box>
          {training.hours_per_day != null && (
            <Box className="flex items-center gap-2 bg-info-subtle border border-info-border rounded-xl px-3 py-2" title="Session length per day">
              <Timer className="h-3.5 w-3.5 text-info shrink-0" />
              <Text as="span" className="text-xs font-medium text-info-subtle-foreground leading-none">{training.hours_per_day}hrs</Text>
            </Box>
          )}
          {(() => {
            const region = regionForTimezone(training.timezone);
            return region ? (
              <Box className="flex items-center gap-2 bg-info-subtle border border-info-border rounded-xl px-3 py-2" title={`Region · ${training.timezone}`}>
                <Globe className="h-3.5 w-3.5 text-info shrink-0" />
                <Text as="span" className="text-xs font-medium text-info-subtle-foreground leading-none">{region.label}</Text>
              </Box>
            ) : null;
          })()}
          {training.setup_pending_count > 0 && (
            <Box
              className="flex items-center gap-2 bg-warning-subtle border border-warning-border rounded-xl px-3 py-2"
              title="Enrolled learners who haven't set up their account yet"
            >
              <UserX className="h-3.5 w-3.5 text-warning shrink-0" />
              <Text as="span" className="text-xs font-medium text-warning-subtle-foreground leading-none">{training.setup_pending_count} setup pending</Text>
            </Box>
          )}
        </Box>

        {/* Info blocks — trainer + meeting link */}
        <Box className="flex-1 flex flex-col gap-2.5">

          {/* Trainer block */}
          {hasTrainer ? (
            <Box className="flex items-center gap-3 bg-success-subtle ring-1 ring-success-border rounded-xl px-3.5 py-3">
              <Box className="w-8 h-8 rounded-full bg-success flex items-center justify-center shrink-0 shadow-sm">
                <Text as="span" className="text-[11px] font-bold text-success-foreground leading-none">{initialsOf(training.trainer_name)}</Text>
              </Box>
              <Box className="min-w-0 flex-1">
                <Text as="p" className="text-[10px] font-bold text-success uppercase tracking-widest leading-none mb-0.5">Trainer</Text>
                <TrainerLink id={training.trainer_id} className="block text-sm font-semibold text-success-subtle-foreground truncate">{training.trainer_name}</TrainerLink>
              </Box>
              <UserCheck className="h-4 w-4 text-success shrink-0" />
            </Box>
          ) : (
            <Box
              className="flex items-center justify-between gap-3 bg-warning-subtle ring-1 ring-warning-border rounded-xl px-3.5 py-3 hover:bg-warning-subtle transition-colors"
              onClick={(e) => { e.stopPropagation(); onClick(); }}
            >
              <Box className="flex items-center gap-3 min-w-0">
                <Box className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center shrink-0">
                  <UserX className="h-3.5 w-3.5 text-warning-subtle-foreground" />
                </Box>
                <Box className="min-w-0">
                  <Text as="p" className="text-[10px] font-bold text-warning-subtle-foreground uppercase tracking-widest leading-none mb-0.5">No Trainer</Text>
                  <Text as="p" className="text-[11px] text-warning">Click to assign</Text>
                </Box>
              </Box>
              <Box className="flex items-center gap-1 bg-error hover:bg-error text-error-foreground text-[11px] font-bold px-3 py-1.5 rounded-lg shrink-0 transition-colors shadow-sm">
                <UserPlus className="h-3 w-3" />
                Assign
              </Box>
            </Box>
          )}

          {/* Meeting link block */}
          {training.meeting_released ? (
            <Box className="flex items-center gap-3 bg-primary-subtle ring-1 ring-primary-border rounded-xl px-3.5 py-3">
              <Box className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm">
                <Link2 className="h-3.5 w-3.5 text-primary-foreground" />
              </Box>
              <Box className="min-w-0 flex-1">
                <Text as="p" className="text-[10px] font-bold text-primary uppercase tracking-widest leading-none mb-0.5">Meeting Link</Text>
                <Text as="p" className="text-sm font-semibold text-primary">Released to participants</Text>
              </Box>
              <Box className="w-2 h-2 rounded-full bg-violet-500 shrink-0 shadow-sm" />
            </Box>
          ) : training.meeting_url ? (
            <Box className="flex items-center gap-3 bg-warning-subtle ring-1 ring-warning-border rounded-xl px-3.5 py-3">
              <Box className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shrink-0 shadow-sm">
                <LinkIcon className="h-3.5 w-3.5 text-warning-foreground" />
              </Box>
              <Box className="min-w-0 flex-1">
                <Text as="p" className="text-[10px] font-bold text-warning-subtle-foreground uppercase tracking-widest leading-none mb-0.5">Meeting Link</Text>
                <Text as="p" className="text-sm font-semibold text-warning-subtle-foreground">Set · Not yet released</Text>
              </Box>
              <Box className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            </Box>
          ) : (
            <Box className="flex items-center gap-3 bg-surface-hover ring-1 ring-border rounded-xl px-3.5 py-3">
              <Box className="w-8 h-8 rounded-full bg-surface-muted flex items-center justify-center shrink-0">
                <LinkIcon className="h-3.5 w-3.5 text-foreground-muted" />
              </Box>
              <Box className="min-w-0 flex-1">
                <Text as="p" className="text-[10px] font-bold text-foreground-subtle uppercase tracking-widest leading-none mb-0.5">Meeting Link</Text>
                <Text as="p" className="text-sm font-medium text-foreground-muted">Not configured</Text>
              </Box>
              <Box className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
            </Box>
          )}

        </Box>

        {/* Footer */}
        <Box className="pt-3 border-t border-border">
          <Button
            size="sm"
            className="w-full h-9 bg-primary text-primary-foreground hover:bg-primary-hover text-xs font-semibold rounded-xl border-0 gap-1.5"
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
  const [importOpen, setImportOpen] = useState(false);
  const [error, setError] = useState(null);

  const { filtered, bar } = useTrainingFilters(trainings, {
    initialStatus: "active",
    searchPlaceholder: "Search by training ID, event code or title...",
  });

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
      <Card className="p-6 rounded-2xl border-0 bg-error-subtle shadow-sm">
        <Text as="p" className="text-error text-sm">Failed to load trainings: {error}</Text>
      </Card>
    );
  }

  if (!trainings) {
    return (
      <Box className="space-y-6">
        <Box className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
        </Box>
        <Box className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
        </Box>
      </Box>
    );
  }

  const unassigned = trainings.filter((t) => !t.trainer_assigned).length;

  return (
    <Box className="space-y-6">
      {/* Bulk actions */}
      <Box className="flex justify-end">
        <Button variant="outline" onClick={() => setImportOpen(true)}
          className="h-9 gap-1.5 border-border text-foreground hover:bg-surface-muted">
          <UploadCloud className="h-4 w-4" /> Import resources (CSV)
        </Button>
      </Box>
      <ImportResourcesDialog open={importOpen} onOpenChange={setImportOpen} />

      {/* Stat cards */}
      <Box className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Trainings"   value={trainings.length}              icon={LayoutGrid}
          bg="bg-primary-subtle"  border="border border-primary-border"  iconBg="bg-primary-subtle"  iconCls="text-primary"  valueCls="text-primary"  labelCls="text-primary" />
        <StatCard label="Trainer Assigned"  value={trainings.length - unassigned} icon={UserCheck}
          bg="bg-success-subtle" border="border border-success-border" iconBg="bg-success-subtle" iconCls="text-success" valueCls="text-success-subtle-foreground" labelCls="text-success" />
        <StatCard label="Awaiting Trainer"  value={unassigned}                    icon={UserX}
          bg="bg-warning-subtle"   border="border border-warning-border"   iconBg="bg-warning-subtle"   iconCls="text-warning"   valueCls="text-warning-subtle-foreground"   labelCls="text-warning" />
      </Box>

      {bar}

      {filtered.length === 0 ? (
        <Card className="p-14 text-center rounded-2xl border border-slate-200/80 shadow-sm bg-surface">
          <Box className="w-14 h-14 rounded-2xl bg-surface-muted flex items-center justify-center mx-auto mb-4">
            <BookOpen className="h-7 w-7 text-foreground-subtle" />
          </Box>
          <Text as="p" className="text-sm font-semibold text-foreground-muted">
            {trainings.length === 0 ? "No trainings yet" : "No trainings match your filters"}
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
