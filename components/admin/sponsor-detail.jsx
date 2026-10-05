"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Mail, Building2, Users, CheckCircle2, FileText, Calendar } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchSponsorDetail } from "@/services/api/admin/admin-api";
import { ParticipantLink, TrainingLink } from "@/components/admin/entity-links";
import { formatDate } from "@/lib/datetime";

function getInitials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "S";
}

function Stat({ icon: Icon, value, label }) {
  return (
    <Card className="p-4 rounded-2xl border border-slate-200/80 shadow-sm">
      <Box className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-slate-400 shrink-0" />
        <Text as="span" className="text-xl font-bold text-slate-800 leading-none">{value}</Text>
      </Box>
      <Text as="p" className="text-[11px] text-slate-500 mt-1.5">{label}</Text>
    </Card>
  );
}

const STATUS_STYLE = {
  confirmed: "bg-emerald-50 text-emerald-700",
  completed: "bg-sky-50 text-sky-700",
  cancelled: "bg-slate-100 text-slate-500",
  failed: "bg-rose-50 text-rose-600",
};

export function SponsorDetail({ userId }) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !userId) return;
    setError(null);
    fetchSponsorDetail({ token, userId })
      .then(setData)
      .catch((e) => setError(e.message));
  }, [token, userId]);

  if (error) {
    return (
      <Card className="p-6 rounded-2xl border-0 bg-red-50 shadow-sm">
        <Text as="p" className="text-red-600 text-sm">Failed to load sponsor: {error}</Text>
      </Card>
    );
  }
  if (!data) {
    return (
      <Box className="space-y-5">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Box className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </Box>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </Box>
    );
  }

  const s = data.sponsor || {};
  const summary = data.summary || {};
  const learners = data.learners || [];
  const outstanding = summary.outstanding_amount
    ? `${summary.currency_code || ""} ${summary.outstanding_amount}`.trim()
    : "—";

  return (
    <Box className="space-y-5">
      {/* Profile */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <Box className="bg-gradient-to-r from-violet-50 via-purple-50 to-violet-50 border-b border-violet-100 px-7 py-7">
          <Box className="flex items-center gap-5">
            <Box className="h-16 w-16 rounded-2xl bg-violet-600 flex items-center justify-center text-2xl font-bold text-white shrink-0 shadow-sm">
              {getInitials(s.name)}
            </Box>
            <Box className="min-w-0">
              <Box className="flex items-center gap-2.5 flex-wrap">
                <Text as="h2" className="text-xl font-bold text-slate-900">{s.name}</Text>
                <Badge className="border-0 bg-amber-50 text-amber-700 ring-1 ring-amber-200 text-[11px] font-semibold px-2.5 py-0.5 capitalize">{s.role || "sponsor"}</Badge>
                {!s.account_active && (
                  <Badge className="border-0 bg-slate-100 text-slate-600 ring-1 ring-slate-200 text-[11px] font-semibold px-2.5 py-0.5">Inactive</Badge>
                )}
              </Box>
              <Box className="flex items-center gap-1.5 mt-1">
                <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <Text as="p" className="text-sm text-slate-500 truncate">{s.email}</Text>
              </Box>
              {s.company_name && (
                <Box className="flex items-center gap-1.5 mt-1">
                  <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <Text as="p" className="text-sm text-slate-500 truncate">{s.company_name}</Text>
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Card>

      {/* Summary */}
      <Box className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={Users} value={summary.learners_count ?? 0} label="Learners sponsored" />
        <Stat icon={CheckCircle2} value={summary.active_count ?? 0} label="Active" />
        <Stat icon={FileText} value={summary.invoices_count ?? 0} label="Invoices" />
        <Stat icon={FileText} value={outstanding} label="Outstanding" />
      </Box>

      {/* Sponsored learners */}
      <Card className="p-0 overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm">
        <Box className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <Users className="h-4 w-4 text-slate-400" />
          <Text as="h3" className="text-sm font-bold text-slate-800">Sponsored learners</Text>
          <Badge className="border-0 bg-violet-50 text-violet-600 text-[11px] font-semibold ml-1">{learners.length}</Badge>
        </Box>
        {learners.length === 0 ? (
          <Box className="px-5 py-8 text-center">
            <Text as="p" className="text-sm text-slate-500">No sponsored learners.</Text>
          </Box>
        ) : (
          <Box className="divide-y divide-slate-100">
            {learners.map((l) => (
              <Box key={l.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                <Box className="min-w-0">
                  <ParticipantLink id={l.participant_id} className="text-sm font-semibold text-slate-800">
                    {l.name}
                  </ParticipantLink>
                  <Text as="p" className="text-xs text-slate-400 truncate">{l.email}</Text>
                </Box>
                <Box className="text-right min-w-0">
                  <TrainingLink id={l.training_id} className="text-xs font-mono font-semibold text-slate-700">
                    {l.training_code}
                  </TrainingLink>
                  <Box className="flex items-center justify-end gap-1.5 mt-0.5">
                    <Calendar className="h-3 w-3 text-slate-300 shrink-0" />
                    <Text as="span" className="text-[11px] text-slate-400">{formatDate(l.start_date)}</Text>
                    <Badge className={`border-0 text-[10px] font-semibold capitalize ${STATUS_STYLE[l.status] || "bg-slate-100 text-slate-600"}`}>{l.status}</Badge>
                  </Box>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Card>
    </Box>
  );
}
