"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Calendar,
  Users,
  Clock,
  UserCheck,
  UserX,
  ChevronRight,
  Hash,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchAdminTrainings } from "@/services/api/admin/admin-api";

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700" },
  active: { label: "Active", color: "bg-emerald-100 text-emerald-700" },
  ongoing: { label: "Ongoing", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", color: "bg-slate-100 text-slate-600" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-600" },
};

const MODE_LABEL = {
  virtual: "Live Virtual",
  in_person: "In Person",
  hybrid: "Hybrid",
  one_to_one: "1-to-1",
};

function formatDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function CardSkeleton() {
  return (
    <Card className="p-0 overflow-hidden rounded-xl border-0 shadow-sm">
      <Skeleton className="h-10 w-full" />
      <Box className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-8 w-full" />
      </Box>
    </Card>
  );
}

function TrainingCard({ training, onClick }) {
  const statusCfg = STATUS_CONFIG[training.status] || STATUS_CONFIG.active;

  return (
    <Card
      className="p-0 overflow-hidden group hover:shadow-lg transition-all duration-200 cursor-pointer rounded-xl border-0 shadow-sm"
      onClick={onClick}
    >
      {/* Header — Training ID prominent */}
      <Box className="flex items-center justify-between bg-gradient-to-r from-slate-700 to-slate-900 px-4 py-2.5">
        <Box className="flex items-center gap-1.5">
          <Hash className="h-3.5 w-3.5 text-white/70" />
          <Text as="span" className="text-xs font-semibold tracking-wide text-white">
            {training.code}
          </Text>
        </Box>
        <Badge className={`text-[10px] border-0 ${statusCfg.color}`}>{statusCfg.label}</Badge>
      </Box>

      {/* Body */}
      <Box className="p-4 space-y-3">
        <Text as="h3" className="text-sm font-semibold text-slate-900 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {training.title}
        </Text>

        <Box className="grid grid-cols-2 gap-x-3 gap-y-1.5">
          <Box className="flex items-center gap-1.5">
            <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
            <Text as="span" className="text-[11px] text-slate-500">{formatDate(training.start_date)}</Text>
          </Box>
          <Box className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-slate-400 shrink-0" />
            <Text as="span" className="text-[11px] text-slate-500">{MODE_LABEL[training.delivery_mode] || training.delivery_mode}</Text>
          </Box>
          <Box className="flex items-center gap-1.5">
            <Users className="w-3 h-3 text-slate-400 shrink-0" />
            <Text as="span" className="text-[11px] text-slate-500">{training.enrolled_count} / {training.capacity} enrolled</Text>
          </Box>
          <Box className="flex items-center gap-1.5">
            {training.duration_hours != null && (
              <>
                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                <Text as="span" className="text-[11px] text-slate-500">{training.duration_hours} hrs</Text>
              </>
            )}
          </Box>
        </Box>

        {/* Trainer status — highlight when none assigned */}
        {training.trainer_assigned ? (
          <Box className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5">
            <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <Text as="span" className="text-[11px] font-medium text-emerald-700 truncate">
              {training.trainer_name}
            </Text>
          </Box>
        ) : (
          <Box className="flex items-center gap-1.5 rounded-lg bg-amber-50 ring-1 ring-amber-200 px-2.5 py-1.5">
            <UserX className="h-3.5 w-3.5 text-amber-600 shrink-0" />
            <Text as="span" className="text-[11px] font-semibold text-amber-700">
              No trainer assigned
            </Text>
          </Box>
        )}

        <Box className="flex items-center justify-end pt-1 border-t border-slate-100">
          <Button size="sm" className="text-xs h-7 px-3 border-0 text-white bg-gradient-to-r from-slate-700 to-slate-900 hover:opacity-90">
            Manage
            <ChevronRight className="h-3 w-3 ml-1" />
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
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetchAdminTrainings({ token })
      .then((data) => setTrainings(data.trainings || []))
      .catch((err) => setError(err.message));
  }, [token]);

  if (error) {
    return (
      <Card className="p-6 border-red-100 bg-red-50">
        <Text as="p" className="text-red-600 text-sm">Failed to load trainings: {error}</Text>
      </Card>
    );
  }

  if (!trainings) {
    return (
      <Box className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
      </Box>
    );
  }

  const unassigned = trainings.filter((t) => !t.trainer_assigned).length;

  const filtered = trainings.filter((t) => {
    const q = search.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.code.toLowerCase().includes(q);
  });

  return (
    <Box className="space-y-4">
      {/* Stat cards */}
      <Box className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Trainings", value: trainings.length, bg: "bg-indigo-200", val: "text-indigo-900" },
          { label: "Trainer Assigned", value: trainings.length - unassigned, bg: "bg-emerald-200", val: "text-emerald-900" },
          { label: "Awaiting Trainer", value: unassigned, bg: "bg-amber-200", val: "text-amber-900" },
        ].map((s) => (
          <Card key={s.label} className={`p-4 border-0 shadow-sm rounded-xl ${s.bg}`}>
            <Text as="span" className="text-[11px] font-medium text-slate-600 block">{s.label}</Text>
            <Text as="h3" className={`text-3xl font-bold leading-none mt-1 ${s.val}`}>{s.value}</Text>
          </Card>
        ))}
      </Box>

      {/* Search */}
      <Box className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by Training ID or title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 text-sm bg-white border-slate-300 focus-visible:ring-indigo-400"
        />
      </Box>

      <Text as="p" className="text-xs text-slate-400">
        Showing {filtered.length} of {trainings.length} training{trainings.length !== 1 ? "s" : ""}
      </Text>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center border-0 shadow-sm bg-white rounded-xl">
          <Text as="p" className="text-sm font-medium text-slate-600">
            {search ? "No trainings match your search" : "No trainings yet"}
          </Text>
        </Card>
      ) : (
        <Box className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((t) => (
            <TrainingCard key={t.id} training={t} onClick={() => router.push(`/admin/courses/${t.id}`)} />
          ))}
        </Box>
      )}
    </Box>
  );
}
