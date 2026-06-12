"use client";

import { useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, CheckCircle2, XCircle } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { PremiumCard } from "@/components/ui/wave-card";

const STATS = [
  {
    label: "Active",
    value: 3,
    icon: BookOpen,
    accent: "#7C3AED",
    iconColor: "#7C3AED",
    sub: "enrollments",
  },
  {
    label: "Completed",
    value: 1,
    icon: CheckCircle2,
    accent: "#10B981",
    iconColor: "#10B981",
    sub: "courses done",
  },
  {
    label: "Expired",
    value: 0,
    icon: XCircle,
    accent: "#F43F5E",
    iconColor: "#F43F5E",
    sub: "enrollments",
  },
];

const ENROLLMENTS = [
  {
    id: 1,
    course: "PMP Certification Prep",
    enrolledDate: "10 Jan 2024",
    expiryDate: "10 Jan 2025",
    paymentStatus: "Paid",
    courseStatus: "Active",
  },
  {
    id: 2,
    course: "ITIL 4 Foundation",
    enrolledDate: "20 Feb 2024",
    expiryDate: "20 Feb 2025",
    paymentStatus: "Paid",
    courseStatus: "Active",
  },
  {
    id: 3,
    course: "Certified ScrumMaster",
    enrolledDate: "05 Mar 2024",
    expiryDate: "05 Mar 2025",
    paymentStatus: "Paid",
    courseStatus: "Active",
  },
  {
    id: 4,
    course: "Six Sigma Green Belt",
    enrolledDate: "15 Nov 2023",
    expiryDate: "15 Nov 2024",
    paymentStatus: "Paid",
    courseStatus: "Completed",
  },
];

function PaymentBadge({ status }) {
  const styles =
    status === "Paid"
      ? { backgroundColor: "rgba(16,185,129,0.12)", color: "#059669" }
      : { backgroundColor: "rgba(239,189,95,0.15)", color: "#B45309" };
  return (
    <Badge className="text-[11px] font-semibold border-0" style={styles}>
      {status}
    </Badge>
  );
}

function StatusBadge({ status }) {
  const styles =
    status === "Active"
      ? { backgroundColor: "rgba(124,58,237,0.1)", color: "#7C3AED" }
      : { backgroundColor: "rgba(16,185,129,0.1)", color: "#059669" };
  return (
    <Badge className="text-[11px] font-semibold border-0" style={styles}>
      {status}
    </Badge>
  );
}

export function EnrollmentsContent() {
  return (
    <Box className="space-y-5">
      {/* ── Stat Cards ── */}
      <Box className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STATS.map((s) => (
          <PremiumCard
            key={s.label}
            className="overflow-hidden"
            style={{ borderTop: `2px solid ${s.accent}` }}
          >
            <CardContent className="p-5">
              <Box className="flex items-center justify-between mb-3">
                <Box
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${s.accent}18` }}
                >
                  <s.icon style={{ width: "20px", height: "20px", color: s.iconColor }} />
                </Box>
                <Text
                  as="span"
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ color: s.accent, backgroundColor: `${s.accent}15` }}
                >
                  {s.sub}
                </Text>
              </Box>
              <Text as="h2" className="text-3xl font-[800] leading-none mb-1">
                {s.value}
              </Text>
              <Text as="span" className="text-xs font-[500]" style={{ color: "#444444" }}>
                {s.label}
              </Text>
            </CardContent>
          </PremiumCard>
        ))}
      </Box>

      {/* ── Enrollments Table ── */}
      <PremiumCard className="overflow-hidden">
        <CardHeader className="py-4 px-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
          <Box className="flex items-center gap-2.5">
            <Box
              className="w-1 h-4 rounded-full"
              style={{ background: "linear-gradient(180deg, #EFBD5F, #EC7D50)" }}
            />
            <CardTitle className="text-sm font-semibold">My Enrollments</CardTitle>
          </Box>
        </CardHeader>
        <CardContent className="p-0">
          {/* Header row */}
          <Box
            className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-3 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: "#555555", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
          >
            <Text as="span">Course</Text>
            <Text as="span">Enrolled</Text>
            <Text as="span">Expires</Text>
            <Text as="span">Payment</Text>
            <Text as="span">Status</Text>
            <Text as="span">Action</Text>
          </Box>

          {/* Rows */}
          <Box className="divide-y" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
            {ENROLLMENTS.map((e) => (
              <Box
                key={e.id}
                className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-3 items-center px-5 py-3.5 transition-colors"
                style={{ backgroundColor: "rgba(0,0,0,0)" }}
                onMouseEnter={(ev) => (ev.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)")}
                onMouseLeave={(ev) => (ev.currentTarget.style.backgroundColor = "rgba(0,0,0,0)")}
              >
                <Text as="p" className="text-sm font-semibold" style={{ color: "#111111" }}>
                  {e.course}
                </Text>
                <Text as="span" className="text-xs" style={{ color: "#555555" }}>
                  {e.enrolledDate}
                </Text>
                <Text as="span" className="text-xs" style={{ color: "#555555" }}>
                  {e.expiryDate}
                </Text>
                <PaymentBadge status={e.paymentStatus} />
                <StatusBadge status={e.courseStatus} />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 px-3 text-xs font-semibold rounded-lg bg-transparent"
                  style={{ border: "1px solid rgba(0,0,0,0.15)", color: "#111111" }}
                >
                  View Course
                </Button>
              </Box>
            ))}
          </Box>
        </CardContent>
      </PremiumCard>
    </Box>
  );
}
