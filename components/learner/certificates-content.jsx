"use client";

import { CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Clock, Download, Share2 } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { PremiumCard } from "@/components/ui/wave-card";

const CERTS = [
  {
    id: 1,
    name:        "PMP Certification Training",
    certNumber:  "CERT-PMP-2024-001",
    issued:      "15 Mar 2024",
    validity:    "Lifetime",
    status:      "Earned",
    initial:     "P",
    bannerGrad:  "linear-gradient(178.73deg, #4F2183 -26.7%, #090909 126.7%)",
    progress:    null,
  },
  {
    id: 2,
    name:        "ITIL 4 Foundation",
    certNumber:  "CERT-ITIL-2024-002",
    issued:      "20 Jan 2024",
    validity:    "3 years",
    status:      "Earned",
    initial:     "I",
    bannerGrad:  "linear-gradient(178.73deg, #065F46 -26.7%, #064E3B 126.7%)",
    progress:    null,
  },
  {
    id: 3,
    name:        "Certified ScrumMaster",
    certNumber:  "CERT-CSM-PENDING",
    issued:      null,
    validity:    null,
    status:      "In Progress",
    initial:     "C",
    bannerGrad:  "linear-gradient(178.73deg, #78350F -26.7%, #451A03 126.7%)",
    progress:    12,
  },
];

const STATUS_CONFIG = {
  Earned:       { bg: "rgba(16,185,129,0.12)", color: "#059669" },
  "In Progress":{ bg: "rgba(239,189,95,0.15)", color: "#B45309" },
};

function CertCard({ cert }) {
  const statusCfg   = STATUS_CONFIG[cert.status] || STATUS_CONFIG["In Progress"];
  const isEarned     = cert.status === "Earned";
  const isInProgress = cert.status === "In Progress";

  return (
    <PremiumCard className="overflow-hidden flex flex-col">

      {/* ── Banner ── */}
      <Box
        className="relative h-32 flex items-end p-4 overflow-hidden shrink-0"
        style={{ background: cert.bannerGrad, color: "white" }}
      >
        {/* Watermark initial */}
        <Text
          as="span"
          className="absolute -bottom-4 -right-2 font-black text-white/20 select-none pointer-events-none leading-none"
          style={{ fontSize: "7rem" }}
        >
          {cert.initial}
        </Text>

        {/* Status badge */}
        <Box className="absolute top-3 right-3 z-10">
          <Badge
            className="text-[10px] font-semibold border-0"
            style={{ backgroundColor: statusCfg.bg, color: statusCfg.color }}
          >
            {isEarned ? "✓ Earned" : cert.status}
          </Badge>
        </Box>

        {/* Award icon */}
        <Box
          className="relative z-10 w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)" }}
        >
          <Award style={{ width: "20px", height: "20px", color: "white" }} />
        </Box>
      </Box>

      {/* ── Body ── */}
      <CardContent className="p-4 flex flex-col gap-3 flex-1">

        {/* Name */}
        <Text as="p" className="text-sm font-bold leading-snug" style={{ color: "#111111" }}>
          {cert.name}
        </Text>

        {/* Meta rows */}
        <Box className="space-y-1.5">
          <Box className="flex items-center justify-between">
            <Text as="span" className="text-[11px]" style={{ color: "#555555" }}>Cert No.</Text>
            <Text as="span" className="text-[11px] font-semibold font-mono" style={{ color: "#333333" }}>
              {cert.certNumber}
            </Text>
          </Box>

          {cert.issued ? (
            <Box className="flex items-center justify-between">
              <Text as="span" className="text-[11px]" style={{ color: "#555555" }}>Issued</Text>
              <Text as="span" className="text-[11px] font-semibold" style={{ color: "#333333" }}>
                {cert.issued}
              </Text>
            </Box>
          ) : null}

          {cert.validity ? (
            <Box className="flex items-center justify-between">
              <Text as="span" className="text-[11px]" style={{ color: "#555555" }}>Valid</Text>
              <Text as="span" className="text-[11px] font-semibold" style={{ color: "#333333" }}>
                {cert.validity}
              </Text>
            </Box>
          ) : null}
        </Box>

        {/* Progress bar for in-progress cert */}
        {isInProgress && cert.progress !== null && (
          <Box>
            <Box className="flex items-center justify-between mb-1">
              <Text as="span" className="text-[11px]" style={{ color: "#555555" }}>Course Progress</Text>
              <Text as="span" className="text-[11px] font-bold" style={{ color: "#EFBD5F" }}>
                {cert.progress}%
              </Text>
            </Box>
            <Box
              className="h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: "rgba(0,0,0,0.12)" }}
            >
              <Box
                className="h-full rounded-full"
                style={{
                  width: `${cert.progress}%`,
                  background: "linear-gradient(90deg, #EFBD5F, #EC7D50)",
                }}
              />
            </Box>
          </Box>
        )}

        {/* Action buttons */}
        {isEarned ? (
          <Box className="flex gap-2 mt-auto pt-1">
            <Button
              size="sm"
              className="flex-1 h-8 text-xs font-semibold border-0 text-[#1a0a00] flex items-center gap-1.5"
              style={{ background: "linear-gradient(135deg, #EFBD5F, #EC7D50)" }}
            >
              <Download style={{ width: "13px", height: "13px" }} />
              Download
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs font-semibold flex items-center gap-1.5"
              style={{ borderColor: "rgba(0,0,0,0.2)", color: "#333333" }}
            >
              <Share2 style={{ width: "13px", height: "13px" }} />
              Share
            </Button>
          </Box>
        ) : (
          <Box className="flex items-center gap-1.5 mt-auto pt-1">
            <Clock style={{ width: "13px", height: "13px", color: "#B45309" }} />
            <Text as="span" className="text-[11px] font-medium" style={{ color: "#B45309" }}>
              Complete course to earn this certificate
            </Text>
          </Box>
        )}
      </CardContent>
    </PremiumCard>
  );
}

export function CertificatesContent() {
  const earned     = CERTS.filter((c) => c.status === "Earned").length;
  const inProgress = CERTS.filter((c) => c.status === "In Progress").length;

  return (
    <Box className="space-y-5">

      {/* ── Stat Cards ── */}
      <Box className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md">
        <PremiumCard
          className="hover:scale-[1.02] transition-all duration-200 overflow-hidden cursor-pointer"
          style={{ borderTop: "2px solid #10B981" }}
        >
          <CardContent className="p-4">
            <Box className="flex items-center justify-between mb-3">
              <Box
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "rgba(16,185,129,0.15)" }}
              >
                <Award style={{ width: "18px", height: "18px", color: "#10B981" }} />
              </Box>
            </Box>
            <Text as="h2" className="text-3xl font-[800] leading-none mb-1.5">
              {earned}
            </Text>
            <Text as="span" className="text-xs font-[500] block leading-tight" style={{ color: "#444444" }}>
              Earned
            </Text>
          </CardContent>
        </PremiumCard>

        <PremiumCard
          className="hover:scale-[1.02] transition-all duration-200 overflow-hidden cursor-pointer"
          style={{ borderTop: "2px solid #F59E0B" }}
        >
          <CardContent className="p-4">
            <Box className="flex items-center justify-between mb-3">
              <Box
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: "rgba(245,158,11,0.15)" }}
              >
                <Clock style={{ width: "18px", height: "18px", color: "#F59E0B" }} />
              </Box>
            </Box>
            <Text as="h2" className="text-3xl font-[800] leading-none mb-1.5">
              {inProgress}
            </Text>
            <Text as="span" className="text-xs font-[500] block leading-tight" style={{ color: "#444444" }}>
              Pending
            </Text>
          </CardContent>
        </PremiumCard>
      </Box>

      {/* ── Certificate Cards Grid ── */}
      <Box className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CERTS.map((cert) => (
          <CertCard key={cert.id} cert={cert} />
        ))}
      </Box>
    </Box>
  );
}
