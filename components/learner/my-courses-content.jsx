"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Clock,
  Calendar,
  CalendarDays,
  Globe,
  Users,
  Hourglass,
  Video,
  MapPin,
  Layers,
  UserRound,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchTrainingDetail } from "@/services/api/learner/learner-api";

// Until an enrolled-trainings list endpoint exists, the page shows the seeded
// training. Swap this for a real id/code source (route param, list endpoint).
const SEEDED_TRAINING_REF = "TRN-2026-0001";

const MODE_CONFIG = {
  virtual: { label: "Live Virtual", icon: Video, color: "bg-blue-100 text-blue-600" },
  in_person: { label: "In Person", icon: MapPin, color: "bg-emerald-100 text-emerald-600" },
  hybrid: { label: "Hybrid", icon: Layers, color: "bg-violet-100 text-violet-600" },
  one_to_one: { label: "1-to-1 Coaching", icon: UserRound, color: "bg-amber-100 text-amber-600" },
};

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-amber-100 text-amber-700" },
  active: { label: "Active", color: "bg-emerald-100 text-emerald-700" },
  ongoing: { label: "Ongoing", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Completed", color: "bg-gray-100 text-gray-700" },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
};

const BATCH_LABEL = {
  weekday: "Weekday batch",
  weekend: "Weekend batch",
  combined: "Combined batch",
};

function formatDate(dateStr) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// "09:00:00" → "9:00 AM"
function formatTime(timeStr) {
  if (!timeStr) return "—";
  const [h, m] = timeStr.split(":");
  const date = new Date();
  date.setHours(Number(h), Number(m), 0, 0);
  return date.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit", hour12: true });
}

function Fact({ icon: Icon, label, children }) {
  return (
    <Box className="flex items-start gap-2.5">
      <Box className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
        <Icon className="h-4 w-4 text-indigo-500" />
      </Box>
      <Box className="min-w-0">
        <Text as="p" className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {label}
        </Text>
        <Text as="p" className="text-sm font-semibold leading-tight mt-0.5">
          {children}
        </Text>
      </Box>
    </Box>
  );
}

function ScheduleSkeleton() {
  return (
    <Card className="p-0 overflow-hidden">
      <Skeleton className="h-28 w-full" />
      <Box className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Box key={i} className="flex items-center gap-2.5">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Box className="space-y-1.5">
              <Skeleton className="h-2.5 w-16" />
              <Skeleton className="h-3.5 w-24" />
            </Box>
          </Box>
        ))}
      </Box>
    </Card>
  );
}

function ScheduleCard({ training }) {
  const mode = MODE_CONFIG[training.delivery_mode] || MODE_CONFIG.virtual;
  const statusCfg = STATUS_CONFIG[training.status] || STATUS_CONFIG.active;
  const ModeIcon = mode.icon;
  const sessionDates = Array.isArray(training.session_dates) ? training.session_dates : [];

  return (
    <Card className="p-0 overflow-hidden">
      {/* Header band */}
      <Box className="relative bg-gradient-to-br from-indigo-500 to-purple-600 p-6 text-white">
        <Box className="flex flex-wrap items-start justify-between gap-3">
          <Box className="min-w-0">
            <Text as="span" className="text-[11px] font-medium tracking-wide text-white/70">
              {training.training_id}
            </Text>
            <Text as="h2" className="text-xl font-semibold leading-tight mt-0.5">
              {training.title}
            </Text>
          </Box>
          <Box className="flex shrink-0 gap-1.5">
            <Badge className={`border-0 text-[11px] ${statusCfg.color}`}>{statusCfg.label}</Badge>
            <Badge className={`border-0 text-[11px] ${mode.color}`}>
              <ModeIcon className="h-3 w-3 mr-1" />
              {mode.label}
            </Badge>
          </Box>
        </Box>
      </Box>

      {/* Facts grid */}
      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-6">
        <Fact icon={Calendar} label="Training Dates">
          {formatDate(training.start_date)} – {formatDate(training.end_date)}
        </Fact>
        <Fact icon={Clock} label="Daily Timing">
          {formatTime(training.start_time)} – {formatTime(training.end_time)}
        </Fact>
        <Fact icon={Globe} label="Timezone">
          {training.timezone || "—"}
        </Fact>
        <Fact icon={Hourglass} label="Duration">
          {training.duration_hours != null ? `${training.duration_hours} hours` : "—"}
        </Fact>
        <Fact icon={Users} label="Capacity">
          {training.enrolled_count ?? 0} / {training.capacity ?? "—"} seats
        </Fact>
        <Fact icon={Video} label="Delivery Mode">
          {mode.label}
        </Fact>
        {training.batch_type && (
          <Fact icon={CalendarDays} label="Batch">
            {BATCH_LABEL[training.batch_type] || training.batch_type}
          </Fact>
        )}
        {training.trainer?.name && (
          <Fact icon={UserRound} label="Trainer">
            {training.trainer.name}
          </Fact>
        )}
      </Box>

      {/* Session dates */}
      {sessionDates.length > 0 && (
        <Box className="border-t px-6 py-4">
          <Box className="flex items-center gap-1.5 mb-2.5">
            <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
            <Text as="span" className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {sessionDates.length} Session{sessionDates.length !== 1 ? "s" : ""}
            </Text>
          </Box>
          <Box className="flex flex-wrap gap-2">
            {sessionDates.map((d, i) => (
              <Badge key={d} className="border border-indigo-100 bg-indigo-50 text-indigo-600">
                Day {i + 1} · {formatDate(d)}
              </Badge>
            ))}
          </Box>
        </Box>
      )}
    </Card>
  );
}

export function MyCoursesContent() {
  const { user, token } = useAuth();
  const [training, setTraining] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !user) return;

    fetchTrainingDetail({ token, trainingRef: SEEDED_TRAINING_REF })
      .then((data) => setTraining(data))
      .catch((err) => setError(err.message));
  }, [token, user]);

  if (error) {
    return (
      <Card className="p-6">
        <Text as="p" className="text-red-600">
          Failed to load training schedule: {error}
        </Text>
      </Card>
    );
  }

  if (!training) {
    return <ScheduleSkeleton />;
  }

  return (
    <Box className="space-y-4">
      <ScheduleCard training={training} />
    </Box>
  );
}
