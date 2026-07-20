"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Mail, Briefcase, BadgeDollarSign, MapPin, Target, Pencil, GraduationCap, Star,
  BookOpen, CheckCircle2, Clock, PlayCircle, XCircle, Calendar, Hash, Video, Users2, ThumbsUp,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchTrainerDetail } from "@/services/api/admin/admin-api";
import { TrainerFormDialog } from "@/components/admin/trainer-form-dialog";

function initialsOf(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join("") || "T";
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
  completed:   { label: "Completed",   badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200", icon: CheckCircle2 },
  ongoing:     { label: "In progress", badge: "bg-blue-50 text-blue-700 ring-1 ring-blue-200",          icon: PlayCircle },
  upcoming:    { label: "Upcoming",    badge: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",    icon: Clock },
  cancelled:   { label: "Cancelled",   badge: "bg-slate-100 text-slate-600 ring-1 ring-slate-200",      icon: XCircle },
};

const SECTIONS = [
  { key: "completed", title: "Completed trainings", accent: "text-emerald-500", cats: ["completed"] },
  { key: "ongoing",   title: "In progress",         accent: "text-blue-500",    cats: ["ongoing"] },
  { key: "upcoming",  title: "Upcoming trainings",  accent: "text-violet-500",  cats: ["upcoming"] },
  { key: "cancelled", title: "Cancelled",           accent: "text-slate-400",   cats: ["cancelled"] },
];

/* ── Read-only star rating ── */
function StarRating({ value = 0, size = "h-4 w-4" }) {
  return (
    <Box className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`${size} ${n <= Math.round(value) ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"}`}
        />
      ))}
    </Box>
  );
}

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

function RatingMetric({ label, value }) {
  return (
    <Box className="flex-1 min-w-[120px]">
      <Text as="p" className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{label}</Text>
      <Box className="flex items-center gap-2 mt-1">
        <StarRating value={value || 0} size="h-3.5 w-3.5" />
        <Text as="span" className="text-sm font-bold text-slate-800">{value != null ? value.toFixed(1) : "—"}</Text>
      </Box>
    </Box>
  );
}

function TrainingCard({ a }) {
  const meta = CATEGORY_META[a.category] || CATEGORY_META.upcoming;
  const StatusIcon = meta.icon;
  return (
    <Card className="rounded-2xl border border-slate-200/80 shadow-sm p-4 hover:border-violet-200 hover:shadow-md transition-all">
      <Box className="flex items-start justify-between gap-3">
        <Box className="min-w-0">
          <Text as="p" className="text-sm font-semibold text-slate-800 leading-snug">{a.title}</Text>
          <Box className="flex items-center gap-1.5 mt-1">
            <Hash className="h-3 w-3 text-slate-400 shrink-0" />
            <Text as="span" className="text-xs text-slate-500 font-mono">{a.code}</Text>
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
          <Text as="span" className="text-xs text-slate-600">{formatRange(a.start_date, a.end_date)}</Text>
        </Box>
        {a.delivery_mode && (
          <Box className="flex items-center gap-1.5">
            <Video className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <Text as="span" className="text-xs text-slate-600 capitalize">{a.delivery_mode.replace(/_/g, " ")}</Text>
          </Box>
        )}
        {a.bucket && (
          <Box className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <Text as="span" className="text-xs text-slate-600 uppercase">{a.bucket}</Text>
          </Box>
        )}
        <Box className="flex items-center gap-1.5">
          <Users2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <Text as="span" className="text-xs text-slate-600">
            {a.enrolled_count ?? 0}{a.capacity ? ` / ${a.capacity}` : ""} seats
          </Text>
        </Box>
      </Box>

      <Box className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
        {a.reviews > 0 ? (
          <Box className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 text-[11px] font-semibold px-2 py-0.5 rounded-lg ring-1 ring-amber-200">
            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
            {a.trainer_rating != null ? a.trainer_rating.toFixed(1) : "—"}
            <Text as="span" className="font-normal opacity-70">· {a.reviews} review{a.reviews !== 1 ? "s" : ""}</Text>
          </Box>
        ) : (
          <Text as="span" className="text-[11px] text-slate-400">No feedback yet</Text>
        )}
        {!a.active && (
          <Box className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-500 text-[11px] font-medium px-2 py-0.5 rounded-lg ring-1 ring-slate-200">
            Unassigned {a.removed_at ? `· ${formatDate(a.removed_at)}` : ""}
          </Box>
        )}
      </Box>
    </Card>
  );
}

export function TrainerDetail({ trainerId }) {
  const { token } = useAuth();
  const [trainer, setTrainer] = useState(null);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    fetchTrainerDetail({ token, trainerId }).then(setTrainer).catch((e) => setError(e.message));
  }, [token, trainerId]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <Card className="p-6 rounded-2xl border-0 bg-red-50">
        <Text as="p" className="text-red-600 text-sm">Failed to load trainer: {error}</Text>
      </Card>
    );
  }

  if (!trainer) {
    return (
      <Box className="space-y-5">
        <Skeleton className="h-52 w-full rounded-2xl" />
        <Box className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </Box>
        <Skeleton className="h-72 w-full rounded-2xl" />
      </Box>
    );
  }

  const assignments = trainer.assignments || [];
  const rating = trainer.rating || {};
  const summary = trainer.summary || {};
  const hasRatings = (rating.reviews || 0) > 0;

  return (
    <Box className="space-y-5">
      {/* Profile hero */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <Box className="bg-gradient-to-r from-violet-50 via-purple-50 to-violet-50 border-b border-violet-100 px-7 py-7">
          <Box className="flex items-start justify-between gap-4 flex-wrap">
            <Box className="flex items-center gap-5">
              <Avatar className="h-16 w-16 ring-2 ring-violet-200 shrink-0">
                <AvatarFallback className="bg-violet-600 text-white font-bold text-2xl">
                  {initialsOf(trainer.name)}
                </AvatarFallback>
              </Avatar>
              <Box>
                <Box className="flex items-center gap-2.5 flex-wrap">
                  <Text as="h2" className="text-xl font-bold text-slate-900">{trainer.name}</Text>
                  <Badge className={`border-0 text-[11px] font-semibold px-2.5 py-0.5 ${trainer.is_active ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200" : "bg-red-100 text-red-600 ring-1 ring-red-200"}`}>
                    {trainer.is_active ? "● Active" : "● Inactive"}
                  </Badge>
                </Box>
                <Text as="p" className="text-sm text-slate-500 mt-1">{trainer.email}</Text>
                {/* Overall rating inline */}
                <Box className="flex items-center gap-2 mt-2">
                  {hasRatings ? (
                    <>
                      <StarRating value={rating.trainer_rating || 0} />
                      <Text as="span" className="text-sm font-bold text-slate-800">{(rating.trainer_rating ?? 0).toFixed(1)}</Text>
                      <Text as="span" className="text-xs text-slate-400">· {rating.reviews} review{rating.reviews !== 1 ? "s" : ""}</Text>
                    </>
                  ) : (
                    <Text as="span" className="text-xs text-slate-400 inline-flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-slate-300 fill-slate-200" /> No ratings yet
                    </Text>
                  )}
                </Box>
              </Box>
            </Box>
            <Button
              variant="outline"
              className="border-violet-200 text-violet-700 hover:bg-violet-100 bg-white shrink-0"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit Profile
            </Button>
          </Box>
        </Box>

        <Box className="p-6">
          <Box className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Fact icon={Briefcase} label="Experience" value={trainer.experience || "—"} />
            <Fact icon={BadgeDollarSign} label="Rate" value={trainer.rate != null ? `₹${trainer.rate}` : "—"} />
            <Fact icon={MapPin} label="Location" value={trainer.location || "—"} />
          </Box>

          <Separator className="my-5" />
          <Box>
            <Box className="flex items-center gap-1.5 mb-2.5">
              <Target className="h-3.5 w-3.5 text-violet-500" />
              <Text as="p" className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Subject Excellence</Text>
            </Box>
            {Array.isArray(trainer.specializations) && trainer.specializations.length > 0 ? (
              <Box className="flex flex-wrap gap-1.5">
                {trainer.specializations.map((s) => (
                  <Badge key={s} className="border-0 bg-violet-50 text-violet-700 ring-1 ring-violet-200 text-xs font-semibold px-2.5 py-1">
                    {s}
                  </Badge>
                ))}
              </Box>
            ) : (
              <Text as="p" className="text-sm text-slate-400">No specializations set.</Text>
            )}
          </Box>

          {trainer.bio && (
            <>
              <Separator className="my-5" />
              <Box>
                <Text as="p" className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">About</Text>
                <Text as="p" className="text-sm text-slate-600 leading-relaxed">{trainer.bio}</Text>
              </Box>
            </>
          )}
        </Box>
      </Card>

      {/* Summary stats */}
      <Box className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard icon={GraduationCap} value={summary.total ?? 0}              label="Total Trainings" bg="bg-slate-50"    border="border border-slate-200"   iconBg="bg-slate-100"   iconCls="text-slate-500"   valueCls="text-slate-800"   labelCls="text-slate-500" />
        <StatCard icon={CheckCircle2}  value={summary.completed ?? 0}          label="Completed"       bg="bg-emerald-50"  border="border border-emerald-100" iconBg="bg-emerald-100" iconCls="text-emerald-600" valueCls="text-emerald-900" labelCls="text-emerald-600" />
        <StatCard icon={Clock}         value={summary.upcoming ?? 0}           label="Upcoming"        bg="bg-violet-50"   border="border border-violet-100"  iconBg="bg-violet-100"  iconCls="text-violet-600"  valueCls="text-violet-900"  labelCls="text-violet-500" />
        <StatCard icon={PlayCircle}    value={summary.ongoing ?? 0}            label="In Progress"     bg="bg-blue-50"     border="border border-blue-100"    iconBg="bg-blue-100"    iconCls="text-blue-600"    valueCls="text-blue-900"    labelCls="text-blue-500" />
        <StatCard icon={Users2}        value={summary.total_participants ?? 0} label="Participants"    bg="bg-violet-50"   border="border border-violet-100"  iconBg="bg-violet-100"  iconCls="text-violet-600"  valueCls="text-violet-900"  labelCls="text-violet-500" />
      </Box>

      {/* Ratings & feedback */}
      {hasRatings && (
        <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <Box className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
            <Box className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
              <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
            </Box>
            <Text as="h3" className="text-sm font-bold text-slate-800">Ratings &amp; Feedback</Text>
            <Badge className="border-0 bg-amber-50 text-amber-600 text-[11px] font-semibold ml-1">{rating.reviews} review{rating.reviews !== 1 ? "s" : ""}</Badge>
          </Box>
          <Box className="p-6 flex flex-wrap gap-6 items-center">
            <RatingMetric label="Trainer" value={rating.trainer_rating} />
            <RatingMetric label="Overall" value={rating.overall_rating} />
            <RatingMetric label="Content" value={rating.content_rating} />
            {rating.recommend_pct != null && (
              <Box className="flex-1 min-w-[120px]">
                <Text as="p" className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Would Recommend</Text>
                <Box className="flex items-center gap-1.5 mt-1">
                  <ThumbsUp className="h-3.5 w-3.5 text-emerald-500" />
                  <Text as="span" className="text-sm font-bold text-slate-800">{rating.recommend_pct}%</Text>
                </Box>
              </Box>
            )}
          </Box>
        </Card>
      )}

      {/* Trainings */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <Box className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
          <Box className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
            <GraduationCap className="h-4 w-4 text-violet-500" />
          </Box>
          <Text as="h3" className="text-sm font-bold text-slate-800">Trainings</Text>
          <Badge className="border-0 bg-violet-50 text-violet-600 text-[11px] font-semibold ml-1">{assignments.length}</Badge>
        </Box>

        {assignments.length === 0 ? (
          <Box className="py-20 text-center">
            <Box className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="h-6 w-6 text-slate-400" />
            </Box>
            <Text as="p" className="text-sm font-medium text-slate-500">No trainings assigned yet.</Text>
          </Box>
        ) : (
          <Box className="p-6 space-y-6">
            {SECTIONS.map((section) => {
              const items = assignments.filter((a) => section.cats.includes(a.category));
              if (items.length === 0) return null;
              return (
                <Box key={section.key} className="space-y-3">
                  <Box className="flex items-center gap-2">
                    <Text as="h4" className={`text-[11px] font-bold uppercase tracking-wider ${section.accent}`}>{section.title}</Text>
                    <Badge className="border-0 bg-slate-100 text-slate-500 text-[10px] font-semibold">{items.length}</Badge>
                  </Box>
                  <Box className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    {items.map((a, i) => <TrainingCard key={`${a.training_id}-${i}`} a={a} />)}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Card>

      <TrainerFormDialog open={editOpen} onOpenChange={setEditOpen} token={token} mode="edit" trainer={trainer} onSaved={load} />
    </Box>
  );
}
