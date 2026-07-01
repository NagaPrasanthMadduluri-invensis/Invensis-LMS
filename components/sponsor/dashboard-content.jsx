"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserCheck, Receipt, CircleDollarSign } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchSponsorDashboard } from "@/services/api/sponsor/sponsor-api";

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
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !user) return;

    fetchSponsorDashboard({ token })
      .then((res) => setData(res))
      .catch((err) => {
        // Backend endpoint not shipped yet → render the shell with placeholders.
        if (err?.pending) setPending(true);
        else setError(err.message);
      });
  }, [token, user]);

  if (error) {
    return (
      <Card className="p-6">
        <Text as="p" className="text-red-600">Failed to load dashboard: {error}</Text>
      </Card>
    );
  }

  // Show skeleton only while a live request is genuinely in flight.
  if (!data && !pending) return <DashboardSkeleton />;

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
    { label: "Invoices", value: fmt(invoices_count), icon: Receipt, color: "bg-indigo-100 text-indigo-600" },
    { label: "Outstanding", value: fmtMoney(outstanding_amount), icon: CircleDollarSign, color: "bg-red-100 text-red-600" },
  ];

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
            <CardTitle className="text-sm font-semibold">My Learners</CardTitle>
            <Link href="/sponsor/learners" className="text-xs text-amber-600 font-medium hover:underline">
              View All →
            </Link>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <Text as="p" className="text-sm text-muted-foreground py-4 text-center">
              {pending ? "Sponsored-learner data will appear here once available." : "No sponsored learners yet."}
            </Text>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
            <CardTitle className="text-sm font-semibold">Recent Invoices</CardTitle>
            <Link href="/sponsor/invoices" className="text-xs text-amber-600 font-medium hover:underline">
              View All →
            </Link>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <Text as="p" className="text-sm text-muted-foreground py-4 text-center">
              {pending ? "Invoices & receipts will appear here once available." : "No invoices yet."}
            </Text>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
