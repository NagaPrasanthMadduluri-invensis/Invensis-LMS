"use client";

/*
 * Admin › Certificates — real data. Lists COMPLETED trainings and their
 * certificate-issuance status (issued vs eligible), sourced from
 * GET /admin/certificates. Certificates are issued per learner when they submit
 * the post-training survey, so "issued < eligible" means some completers haven't
 * claimed theirs yet.
 */

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Award, Users, CheckCircle2, CalendarDays, GraduationCap, Video, MapPin, AlertCircle,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchAdminCertificates } from "@/services/api/admin/admin-api";

const MODE_LABEL = {
  virtual: "Virtual",
  in_person: "In-person",
  hybrid: "Hybrid",
  one_to_one: "One-to-one",
};
const BUCKET_LABEL = {
  direct_online: "Direct online",
  corporate: "Corporate",
  one_to_one_coaching: "1:1 coaching",
};

const STATUS = {
  complete: { label: "All issued", cls: "bg-emerald-100 text-emerald-700" },
  partial: { label: "Partly issued", cls: "bg-amber-100 text-amber-700" },
  pending: { label: "Pending", cls: "bg-rose-100 text-rose-700" },
  none: { label: "No completions", cls: "bg-slate-100 text-slate-500" },
};

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return String(iso);
  }
}

function ListSkeleton() {
  return (
    <Box className="space-y-4">
      <Box className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </Box>
      <Box className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
      </Box>
    </Box>
  );
}

const ICON_COLORS = [
  "bg-amber-500", "bg-indigo-500", "bg-emerald-500",
  "bg-violet-500", "bg-teal-500", "bg-blue-500", "bg-rose-500", "bg-slate-500",
];

function CertTrainingCard({ t, index }) {
  const st = STATUS[t.status] ?? STATUS.none;
  const pct = t.eligible > 0 ? Math.min(100, Math.round((t.issued / t.eligible) * 100)) : 0;
  return (
    <Card className="border border-slate-100 shadow-sm bg-white rounded-xl overflow-hidden hover:shadow-md hover:border-slate-200 transition-all">
      <CardContent className="p-4">
        <Box className="flex items-start justify-between mb-3">
          <Box className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ICON_COLORS[index % ICON_COLORS.length]}`}>
            <Award className="h-5 w-5 text-white" />
          </Box>
          <Badge variant="secondary" className={`text-[10px] border-0 ${st.cls}`}>{st.label}</Badge>
        </Box>

        <Text as="p" className="text-sm font-semibold text-slate-800 leading-snug">{t.title}</Text>
        <Text as="span" className="text-[11px] text-slate-400 block mt-0.5">{t.code}</Text>

        <Box className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
          <Box className="flex items-center gap-1">
            <Video className="h-3 w-3" /> {MODE_LABEL[t.delivery_mode] ?? t.delivery_mode}
          </Box>
          <Box className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {BUCKET_LABEL[t.bucket] ?? t.bucket}
          </Box>
          <Box className="flex items-center gap-1">
            <CalendarDays className="h-3 w-3" /> {fmtDate(t.start_date)} – {fmtDate(t.end_date)}
          </Box>
        </Box>

        <Box className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
          <GraduationCap className="h-3 w-3" /> {t.trainer_name || "Unassigned"}
          <Text as="span" className="mx-1 text-slate-300">·</Text>
          <Users className="h-3 w-3" /> {t.participants} enrolled
        </Box>

        {/* Issuance progress */}
        <Box className="mt-3">
          <Box className="flex items-center justify-between text-xs">
            <Text as="span" className="font-semibold text-slate-700">
              {t.issued} / {t.eligible} certificates issued
            </Text>
            {t.status === "complete" && t.eligible > 0 && (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            )}
          </Box>
          <Box className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <Box
              className={`h-full rounded-full ${t.status === "complete" ? "bg-emerald-500" : t.status === "partial" ? "bg-amber-500" : "bg-slate-300"}`}
              style={{ width: `${pct}%` }}
            />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export function CertificatesList() {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    fetchAdminCertificates({ token })
      .then((d) => { setData(d); setError(null); })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading || (!data && !error)) return <ListSkeleton />;

  if (error) {
    return (
      <Card className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 flex items-center gap-2">
        <AlertCircle className="h-4 w-4" /> {error}
      </Card>
    );
  }

  const { summary, trainings } = data;
  const rate = Math.round((summary.issuance_rate ?? 0) * 100);
  const tiles = [
    { label: "Completed trainings", value: summary.completed_trainings, bg: "bg-orange-200", val: "text-orange-900" },
    { label: "Certificates issued", value: summary.certificates_issued, bg: "bg-indigo-200", val: "text-indigo-900" },
    { label: "Eligible learners", value: summary.eligible, bg: "bg-sky-200", val: "text-sky-900" },
    { label: "Issuance rate", value: `${rate}%`, bg: "bg-emerald-200", val: "text-emerald-900" },
  ];

  return (
    <Box className="space-y-4">
      <Box className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((s) => (
          <Card key={s.label} className={`p-4 border-0 shadow-sm rounded-xl ${s.bg}`}>
            <Text as="h3" className={`text-2xl font-bold ${s.val}`}>{s.value}</Text>
            <Text as="span" className="text-xs text-slate-500">{s.label}</Text>
          </Card>
        ))}
      </Box>

      {trainings.length === 0 ? (
        <Card className="rounded-xl border border-slate-100 bg-white p-10 text-center">
          <Award className="mx-auto h-8 w-8 text-slate-300" />
          <Text as="p" className="mt-2 text-sm font-medium text-slate-600">No completed trainings yet</Text>
          <Text as="span" className="text-xs text-slate-400">
            Certificates appear here once a training is marked completed and learners are certified.
          </Text>
        </Card>
      ) : (
        <Box className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {trainings.map((t, i) => <CertTrainingCard key={t.id} t={t} index={i} />)}
        </Box>
      )}
    </Box>
  );
}
