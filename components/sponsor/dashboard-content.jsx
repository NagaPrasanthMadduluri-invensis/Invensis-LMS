"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserCheck, Receipt, CircleDollarSign } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchSponsorDashboard,
  fetchSponsoredLearners,
  fetchSponsorInvoices,
} from "@/services/api/sponsor/sponsor-api";

const PREVIEW_LIMIT = 5;

function initialsOf(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join("") || "L"
  );
}

function DashboardSkeleton() {
  return (
    <Box className="space-y-5">
      <Skeleton className="h-20 w-full rounded-lg" />
      <Box className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </Box>
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </Box>
    </Box>
  );
}

export function SponsorDashboardContent() {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [learners, setLearners] = useState(null);
  const [invoices, setInvoices] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !user) return;

    // Fetch summary + preview lists in parallel. The list calls degrade
    // gracefully to empty previews if they fail — the summary drives the page.
    fetchSponsorDashboard({ token })
      .then((res) => setData(res))
      .catch((err) => setError(err.message));

    fetchSponsoredLearners({ token })
      .then((res) => setLearners(res.learners ?? []))
      .catch(() => setLearners([]));

    fetchSponsorInvoices({ token })
      .then((res) => setInvoices(res.invoices ?? []))
      .catch(() => setInvoices([]));
  }, [token, user]);

  if (error) {
    return (
      <Card className="p-6">
        <Text as="p" className="text-red-600">Failed to load dashboard: {error}</Text>
      </Card>
    );
  }

  if (!data) return <DashboardSkeleton />;

  const {
    learners_count = null,
    active_count = null,
    invoices_count = null,
    outstanding_amount = null,
    currency_code = "",
  } = data ?? {};

  const fmt = (v) => (v === null || v === undefined ? "—" : String(v));
  const fmtMoney = (v) =>
    v === null || v === undefined ? "—" : `${currency_code} ${v}`.trim();

  const stats = [
    { label: "My Learners", value: fmt(learners_count), icon: Users, color: "bg-amber-100 text-amber-600" },
    { label: "Active", value: fmt(active_count), icon: UserCheck, color: "bg-emerald-100 text-emerald-600" },
    { label: "Invoices", value: fmt(invoices_count), icon: Receipt, color: "bg-violet-100 text-violet-600" },
    { label: "Outstanding", value: fmtMoney(outstanding_amount), icon: CircleDollarSign, color: "bg-red-100 text-red-600" },
  ];

  const learnerPreview = (learners ?? []).slice(0, PREVIEW_LIMIT);
  const invoicePreview = (invoices ?? []).slice(0, PREVIEW_LIMIT);

  return (
    <Box className="space-y-5">
      {/* ── Welcome Banner ── */}
      <Card className="bg-gradient-to-br from-amber-500/5 to-orange-500/5">
        <CardContent className="flex items-center gap-4 flex-wrap py-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-gradient-to-br from-amber-500 to-orange-600 text-white font-bold">
              {user?.initials || "S"}
            </AvatarFallback>
          </Avatar>
          <Box className="flex-1 min-w-[180px]">
            <Text as="h3" className="text-base font-bold">
              Welcome back, {user?.name || "Sponsor"}!
            </Text>
            <Text as="p" className="text-xs text-muted-foreground">
              Manage the learners you sponsor and review your invoices &amp; receipts.
            </Text>
          </Box>
          <Button asChild size="sm" className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
            <Link href="/sponsor/learners">View Learners</Link>
          </Button>
        </CardContent>
      </Card>

      {/* ── Stat Cards ── */}
      <Box className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-4">
            <Box className="flex items-start gap-3">
              <Box className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </Box>
              <Box>
                <Text as="h2" className="text-2xl leading-none">{s.value}</Text>
                <Text as="span" className="text-[11px] text-muted-foreground">{s.label}</Text>
              </Box>
            </Box>
          </Card>
        ))}
      </Box>

      {/* ── Sponsored Learners + Invoices preview ── */}
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* My Learners */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
            <CardTitle className="text-sm font-semibold">My Learners</CardTitle>
            <Link href="/sponsor/learners" className="text-xs text-amber-600 font-medium hover:underline">
              View All →
            </Link>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {learners === null ? (
              <Box className="space-y-2 py-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full rounded-md" />
                ))}
              </Box>
            ) : learnerPreview.length === 0 ? (
              <Text as="p" className="text-sm text-muted-foreground py-4 text-center">
                No sponsored learners yet.
              </Text>
            ) : (
              <Box className="divide-y">
                {learnerPreview.map((l) => (
                  <Box key={l.id} className="flex items-center gap-3 py-2.5">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">
                        {initialsOf(l.name)}
                      </AvatarFallback>
                    </Avatar>
                    <Box className="min-w-0 flex-1">
                      <Text as="p" className="text-sm font-medium truncate">{l.name}</Text>
                      <Text as="span" className="text-[11px] text-muted-foreground truncate block">
                        {l.training_title || l.training_code || l.email}
                      </Text>
                    </Box>
                    <Badge
                      variant="secondary"
                      className={l.status === "confirmed" || l.status === "active"
                        ? "bg-emerald-100 text-emerald-700 text-[10px] shrink-0"
                        : "bg-gray-200 text-gray-600 text-[10px] shrink-0"}
                    >
                      {l.status || "—"}
                    </Badge>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
            <CardTitle className="text-sm font-semibold">Recent Invoices</CardTitle>
            <Link href="/sponsor/invoices" className="text-xs text-amber-600 font-medium hover:underline">
              View All →
            </Link>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            {invoices === null ? (
              <Box className="space-y-2 py-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full rounded-md" />
                ))}
              </Box>
            ) : invoicePreview.length === 0 ? (
              <Text as="p" className="text-sm text-muted-foreground py-4 text-center">
                No invoices yet.
              </Text>
            ) : (
              <Box className="divide-y">
                {invoicePreview.map((inv) => (
                  <Box key={inv.id} className="flex items-center gap-3 py-2.5">
                    <Box className="w-9 h-9 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center shrink-0">
                      <Receipt className="h-4 w-4" />
                    </Box>
                    <Box className="min-w-0 flex-1">
                      <Text as="p" className="text-sm font-medium truncate">
                        {inv.order_number || inv.id}
                      </Text>
                      <Text as="span" className="text-[11px] text-muted-foreground truncate block">
                        {inv.course_name || "—"}
                      </Text>
                    </Box>
                    <Badge
                      variant="secondary"
                      className={inv.status === "paid"
                        ? "bg-emerald-100 text-emerald-700 text-[10px] shrink-0"
                        : "bg-red-100 text-red-700 text-[10px] shrink-0"}
                    >
                      {inv.status || "—"}
                    </Badge>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
