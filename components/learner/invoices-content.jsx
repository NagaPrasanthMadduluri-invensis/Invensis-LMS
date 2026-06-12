"use client";

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CircleDollarSign, Clock, Receipt, Download } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { PremiumCard } from "@/components/ui/wave-card";

const STATS = [
  {
    label: "Total Paid",
    value: "₹1,04,997",
    icon: CircleDollarSign,
    accent: "#10B981",
    sub: "all time",
  },
  {
    label: "Pending",
    value: "₹44,999",
    icon: Clock,
    accent: "#EFBD5F",
    sub: "awaiting payment",
  },
  {
    label: "Invoices",
    value: "5",
    icon: Receipt,
    accent: "#7C3AED",
    sub: "total records",
  },
];

const INVOICES = [
  {
    id: 1,
    number: "INV-2024-0001",
    course: "PMP Certification Prep",
    date: "10 Jan 2024",
    amount: "₹49,999",
    status: "Paid",
  },
  {
    id: 2,
    number: "INV-2024-0002",
    course: "ITIL 4 Foundation",
    date: "20 Feb 2024",
    amount: "₹34,999",
    status: "Paid",
  },
  {
    id: 3,
    number: "INV-2024-0003",
    course: "Certified ScrumMaster",
    date: "05 Mar 2024",
    amount: "₹19,999",
    status: "Paid",
  },
  {
    id: 4,
    number: "INV-2024-0004",
    course: "Six Sigma Green Belt",
    date: "15 Nov 2023",
    amount: "—",
    status: "Refunded",
  },
  {
    id: 5,
    number: "INV-2024-0005",
    course: "PRINCE2 Practitioner",
    date: "Pending",
    amount: "₹44,999",
    status: "Pending",
  },
];

function StatusBadge({ status }) {
  const map = {
    Paid:     { backgroundColor: "rgba(16,185,129,0.12)",  color: "#059669" },
    Pending:  { backgroundColor: "rgba(239,189,95,0.15)",  color: "#B45309" },
    Refunded: { backgroundColor: "rgba(0,0,0,0.07)",       color: "#555555" },
  };
  return (
    <Badge className="text-[11px] font-semibold border-0" style={map[status] || map.Refunded}>
      {status}
    </Badge>
  );
}

export function InvoicesContent() {
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
                  <s.icon style={{ width: "20px", height: "20px", color: s.accent }} />
                </Box>
                <Text
                  as="span"
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ color: s.accent, backgroundColor: `${s.accent}15` }}
                >
                  {s.sub}
                </Text>
              </Box>
              <Text as="h2" className="text-2xl font-[800] leading-none mb-1">
                {s.value}
              </Text>
              <Text as="span" className="text-xs font-[500]" style={{ color: "#444444" }}>
                {s.label}
              </Text>
            </CardContent>
          </PremiumCard>
        ))}
      </Box>

      {/* ── Transaction History Table ── */}
      <PremiumCard className="overflow-hidden">
        <CardHeader className="py-4 px-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
          <Box className="flex items-center gap-2.5">
            <Box
              className="w-1 h-4 rounded-full"
              style={{ background: "linear-gradient(180deg, #EFBD5F, #EC7D50)" }}
            />
            <CardTitle className="text-sm font-semibold">Transaction History</CardTitle>
          </Box>
        </CardHeader>
        <CardContent className="p-0">
          {/* Header row */}
          <Box
            className="hidden md:grid grid-cols-[1.5fr_2fr_1fr_1fr_1fr_auto] gap-3 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide"
            style={{ color: "#555555", borderBottom: "1px solid rgba(0,0,0,0.06)" }}
          >
            <Text as="span">Invoice #</Text>
            <Text as="span">Course</Text>
            <Text as="span">Date</Text>
            <Text as="span">Amount</Text>
            <Text as="span">Status</Text>
            <Text as="span">Action</Text>
          </Box>

          {/* Rows */}
          <Box className="divide-y" style={{ borderColor: "rgba(0,0,0,0.05)" }}>
            {INVOICES.map((inv) => (
              <Box
                key={inv.id}
                className="grid grid-cols-1 md:grid-cols-[1.5fr_2fr_1fr_1fr_1fr_auto] gap-3 items-center px-5 py-3.5 transition-colors"
                style={{ backgroundColor: "rgba(0,0,0,0)" }}
                onMouseEnter={(ev) => (ev.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)")}
                onMouseLeave={(ev) => (ev.currentTarget.style.backgroundColor = "rgba(0,0,0,0)")}
              >
                <Text as="span" className="text-xs font-mono font-semibold" style={{ color: "#444444" }}>
                  {inv.number}
                </Text>
                <Text as="p" className="text-sm font-semibold" style={{ color: "#111111" }}>
                  {inv.course}
                </Text>
                <Text as="span" className="text-xs" style={{ color: "#555555" }}>
                  {inv.date}
                </Text>
                <Text as="span" className="text-sm font-semibold" style={{ color: "#111111" }}>
                  {inv.amount}
                </Text>
                <StatusBadge status={inv.status} />
                {inv.status !== "Pending" ? (
                  <Button
                    size="sm"
                    className="h-7 w-7 p-0 rounded-lg border-0 text-[#1a0a00]"
                    style={{ background: "linear-gradient(135deg, #EFBD5F, #EC7D50)" }}
                    aria-label="Download invoice"
                  >
                    <Download style={{ width: "14px", height: "14px" }} />
                  </Button>
                ) : (
                  <Box className="h-7 w-7" />
                )}
              </Box>
            ))}
          </Box>
        </CardContent>
      </PremiumCard>
    </Box>
  );
}
