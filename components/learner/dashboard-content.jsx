"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Award,
  Bookmark,
  CreditCard,
  CircleDollarSign,
  BookMarked,
  ArrowRight,
  Play,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchDashboard } from "@/services/api/learner/learner-api";
import { PremiumCard } from "@/components/ui/wave-card";

const MOCK_DATA = {
  enrolled_courses: [
    { enrollment_id: 1, course: { name: "PMP Certification Training" }, status: "active", progress_percentage: 68 },
    { enrollment_id: 2, course: { name: "ITIL 4 Foundation" }, status: "active", progress_percentage: 35 },
    { enrollment_id: 3, course: { name: "Six Sigma Green Belt" }, status: "active", progress_percentage: 12 },
  ],
  pending_payments: [
    { order_id: 101, course_name: "PRINCE2 Practitioner", order_number: "ORD-2024-0101", currency_code: "INR", pending_amount: "29,999" },
    { order_id: 102, course_name: "PMI-ACP Certification", order_number: "ORD-2024-0102", currency_code: "INR", pending_amount: "44,999" },
  ],
  bookmarks: [
    { id: 1, course: { name: "Scrum Master (CSM)" }, lesson: { title: "Sprint Planning Deep Dive" } },
    { id: 2, course: { name: "CAPM Certification" }, lesson: { title: "Project Integration Management" } },
    { id: 3, course: { name: "Lean Six Sigma Black Belt" }, lesson: { title: "DMAIC Methodology" } },
  ],
  certificates: [
    { id: 1, course_name: "PMP Certification Training", certificate_number: "CERT-PMP-2024-001", issued_at: "2024-03-15T00:00:00Z" },
    { id: 2, course_name: "ITIL Foundation", certificate_number: "CERT-ITIL-2024-002", issued_at: "2024-01-20T00:00:00Z" },
  ],
  suggested_courses: [
    { id: 10, name: "CAPM Certification Training", category: "Project Management" },
    { id: 11, name: "AWS Cloud Practitioner", category: "Cloud Computing" },
    { id: 12, name: "Lean Six Sigma Black Belt", category: "Quality Management" },
    { id: 13, name: "PRINCE2 Agile", category: "Agile Management" },
  ],
};

const STAT_CONFIG = [
  { key: "enrolled",  label: "Enrolled Courses",  icon: BookOpen,   accent: "#7C3AED", iconColor: "text-violet-400",  sub: "courses active"   },
  { key: "certs",     label: "Certificates",       icon: Award,      accent: "#10B981", iconColor: "text-emerald-400", sub: "earned"           },
  { key: "bookmarks", label: "Bookmarks",          icon: Bookmark,   accent: "#F59E0B", iconColor: "text-amber-400",   sub: "saved lessons"    },
  { key: "payments",  label: "Pending Payments",   icon: CreditCard, accent: "#F43F5E", iconColor: "text-rose-400",    sub: "need attention"   },
  { key: "suggested", label: "Suggested",          icon: BookMarked, accent: "#7C3AED", iconColor: "text-violet-400",  sub: "recommended"      },
];

function SectionCard({ title, action, children }) {
  return (
    <PremiumCard className="overflow-hidden">
      <Box className="flex items-center justify-between py-3 px-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
        <Box className="flex items-center gap-2.5">
          <Box className="w-1 h-4 rounded-full" style={{ background: "linear-gradient(180deg, #EFBD5F, #EC7D50)" }} />
          <Text as="span" className="text-sm font-semibold">{title}</Text>
        </Box>
        {action && (
          <Text as="span" className="text-xs font-medium cursor-pointer hover:underline flex items-center gap-0.5" style={{ color: "#EFBD5F" }}>
            {action} <ArrowRight className="h-3 w-3" />
          </Text>
        )}
      </Box>
      {children}
    </PremiumCard>
  );
}

function DashboardSkeleton() {
  return (
    <Box className="space-y-6">
      <Skeleton className="h-28 w-full rounded-2xl" style={{ backgroundColor: "#cccccc" }} />
      <Box className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" style={{ backgroundColor: "#cccccc" }} />)}
      </Box>
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-xl" style={{ backgroundColor: "#cccccc" }} />
        <Skeleton className="h-64 rounded-xl" style={{ backgroundColor: "#cccccc" }} />
      </Box>
    </Box>
  );
}

export function DashboardContent() {
  const { user, token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !user) return;
    fetchDashboard({ token, userId: user.id })
      .then((api) => {
        setData({
          enrolled_courses:  api.enrolled_courses?.length  ? api.enrolled_courses  : MOCK_DATA.enrolled_courses,
          pending_payments:  api.pending_payments?.length  ? api.pending_payments  : MOCK_DATA.pending_payments,
          bookmarks:         api.bookmarks?.length         ? api.bookmarks         : MOCK_DATA.bookmarks,
          certificates:      api.certificates?.length      ? api.certificates      : MOCK_DATA.certificates,
          suggested_courses: api.suggested_courses?.length ? api.suggested_courses : MOCK_DATA.suggested_courses,
        });
      })
      .catch(() => setData(MOCK_DATA));
  }, [token, user]);

  if (error) {
    return (
      <Card className="p-6 border-l-4 border-l-destructive border-0 shadow-md">
        <Text as="p" className="text-destructive text-sm">Failed to load dashboard: {error}</Text>
      </Card>
    );
  }

  if (!data) return <DashboardSkeleton />;

  const {
    enrolled_courses = [],
    pending_payments = [],
    bookmarks = [],
    certificates = [],
    suggested_courses = [],
  } = data;

  const statValues = {
    enrolled: enrolled_courses.length,
    certs: certificates.length,
    bookmarks: bookmarks.length,
    payments: pending_payments.length,
    suggested: suggested_courses.length,
  };

  return (
    <Box className="space-y-5">

      {/* ── Welcome Banner ── */}
      <Box
        className="rounded-2xl p-6 relative overflow-hidden flex items-center gap-5 flex-wrap"
        style={{ background: "linear-gradient(178.73deg, #4F2183 -26.7%, #090909 126.7%)", border: "1px solid #2A1A45", color: "white" }}
      >
        <Box className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
        <Box className="absolute -bottom-10 -right-10 w-48 h-48 rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(79,33,131,0.4) 0%, transparent 70%)" }} />
        <Avatar className="h-14 w-14 ring-2 ring-purple-500/30 relative z-10 shrink-0">
          <AvatarFallback style={{ background: "linear-gradient(135deg, #6D28D9, #4F2183)" }} className="text-white font-bold text-lg">
            {user?.initials || "U"}
          </AvatarFallback>
        </Avatar>
        <Box className="flex-1 min-w-[160px] relative z-10">
          <Text as="h3" className="text-lg font-[700] text-white leading-tight">
            Welcome back, {user?.firstName || "Learner"}!
          </Text>
          <Box className="flex items-center gap-4 mt-2 flex-wrap">
            <Text as="span" className="text-xs flex items-center gap-1.5 font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>
              <BookOpen className="h-3 w-3 text-violet-400" /> {enrolled_courses.length} Enrolled
            </Text>
            <Text as="span" className="text-xs flex items-center gap-1.5 font-medium" style={{ color: "rgba(255,255,255,0.75)" }}>
              <Award className="h-3 w-3 text-amber-400" /> {certificates.length} Certificates
            </Text>
            <Box className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full" style={{ background: "rgba(239,189,95,0.1)", border: "1px solid rgba(239,189,95,0.3)" }}>
              <Box className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <Text as="span" className="text-[10px] font-semibold" style={{ background: "linear-gradient(135deg, #EFBD5F, #EC7D50)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Active Learner
              </Text>
            </Box>
          </Box>
        </Box>
        <Button size="sm" className="relative z-10 font-semibold shrink-0 border-0 text-[#1a0a00]" style={{ background: "linear-gradient(135deg, #EFBD5F, #EC7D50)" }}>
          Browse Courses
        </Button>
      </Box>

      {/* ── Continue Learning Hero ── */}
      {(() => {
        const inProgress = enrolled_courses.find(c => c.progress_percentage > 0 && c.progress_percentage < 100) || enrolled_courses[0];
        if (!inProgress) return null;
        return (
          <PremiumCard className="overflow-hidden">
            <CardContent className="p-5">
              <Box className="flex items-center gap-2 mb-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
                <Box className="w-1 h-4 rounded-full" style={{ background: "linear-gradient(180deg, #EFBD5F, #EC7D50)" }} />
                <Text as="span" className="text-sm font-semibold">Continue Learning</Text>
              </Box>
              <Box className="flex items-center gap-4 flex-wrap">
                <Box className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 text-white text-2xl font-black" style={{ background: "linear-gradient(178.73deg, #4F2183 -26.7%, #090909 126.7%)" }}>
                  {inProgress.course.name.charAt(0)}
                </Box>
                <Box className="flex-1 min-w-[160px]">
                  <Text as="p" className="text-sm font-semibold mb-0.5">{inProgress.course.name}</Text>
                  <Box className="flex items-center gap-2 mb-2">
                    <Box className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(0,0,0,0.12)" }}>
                      <Box className="h-full rounded-full" style={{ width: `${inProgress.progress_percentage}%`, background: "linear-gradient(90deg, #7C3AED, #EFBD5F)" }} />
                    </Box>
                    <Text as="span" className="text-[11px] font-bold shrink-0">{Math.round(inProgress.progress_percentage)}%</Text>
                  </Box>
                  <Text as="span" className="text-[11px]" style={{ color: "#444444" }}>
                    {100 - Math.round(inProgress.progress_percentage)}% remaining to complete
                  </Text>
                </Box>
                <Button size="sm" className="shrink-0 font-semibold border-0 text-[#1a0a00] flex items-center gap-1.5" style={{ background: "linear-gradient(135deg, #EFBD5F, #EC7D50)" }}>
                  <Play className="h-3.5 w-3.5" /> Resume Course
                </Button>
              </Box>
            </CardContent>
          </PremiumCard>
        );
      })()}

      {/* ── Stat Cards ── */}
      <Box className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {STAT_CONFIG.map((s) => (
          <PremiumCard
            key={s.key}
            className="hover:scale-[1.02] transition-all duration-200 overflow-hidden cursor-pointer"
            style={{ borderTop: `2px solid ${s.accent}` }}
          >
            <CardContent className="p-4">
              <Box className="flex items-center justify-between mb-3">
                <Box className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.accent}20` }}>
                  <s.icon className={`${s.iconColor}`} style={{ width: "18px", height: "18px" }} />
                </Box>
                <Text as="span" className="text-[10px] font-medium px-1.5 py-0.5 rounded" style={{ color: s.accent, backgroundColor: `${s.accent}15` }}>{s.sub}</Text>
              </Box>
              <Text as="h2" className="text-3xl font-[800] leading-none mb-1.5">{statValues[s.key]}</Text>
              <Text as="span" className="text-xs font-[500] block leading-tight" style={{ color: "#444444" }}>{s.label}</Text>
            </CardContent>
          </PremiumCard>
        ))}
      </Box>

      {/* ── Enrolled Courses + Pending Payments ── */}
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <SectionCard title="Enrolled Courses" action="View All">
          <CardContent className="p-3 space-y-2">
            {enrolled_courses.length === 0 ? (
              <Text as="p" className="text-sm py-6 text-center" style={{ color: "#444444" }}>No enrolled courses yet.</Text>
            ) : enrolled_courses.map((c) => (
              <Box key={c.enrollment_id} className="flex gap-3 items-start rounded-xl p-3 transition-colors" style={{ backgroundColor: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
                <Box className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm" style={{ background: "linear-gradient(178.73deg, #4F2183 -26.7%, #1A0A30 126.7%)" }}>
                  {c.course.name.charAt(0)}
                </Box>
                <Box className="flex-1 min-w-0">
                  <Box className="flex items-start justify-between gap-2 mb-2">
                    <Text as="p" className="text-sm font-semibold leading-tight truncate">{c.course.name}</Text>
                    <Badge className={`text-[10px] border-0 shrink-0 font-semibold ${c.status === "active" ? "text-emerald-600" : "text-violet-600"}`} style={{ backgroundColor: c.status === "active" ? "rgba(16,185,129,0.12)" : "rgba(124,58,237,0.1)", color: c.status === "active" ? "#059669" : "#7C3AED" }}>
                      {c.status === "active" ? "Active" : "Done"}
                    </Badge>
                  </Box>
                  <Box className="flex items-center justify-between mb-1.5">
                    <Text as="span" className="text-[10px]" style={{ color: "#555555" }}>Progress</Text>
                    <Text as="span" className="text-[10px] font-bold" style={{ color: "#EFBD5F" }}>{Math.round(c.progress_percentage)}%</Text>
                  </Box>
                  <Box className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(0,0,0,0.12)" }}>
                    <Box
                      className="h-full rounded-full"
                      role="progressbar"
                      aria-valuenow={c.progress_percentage}
                      style={{ width: `${c.progress_percentage}%`, background: "linear-gradient(90deg, #7C3AED, #EFBD5F)" }}
                    />
                  </Box>
                </Box>
              </Box>
            ))}
          </CardContent>
        </SectionCard>

        <SectionCard title="Pending Payments">
          <CardContent className="p-3 space-y-2">
            {pending_payments.length === 0 ? (
              <Box className="py-6 text-center">
                <Box className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mx-auto mb-2">
                  <CreditCard className="h-5 w-5 text-white" />
                </Box>
                <Text as="p" className="text-sm" style={{ color: "#444444" }}>All payments are clear!</Text>
              </Box>
            ) : pending_payments.map((p) => (
              <Box key={p.order_id} className="flex items-center gap-3 rounded-xl p-3 transition-colors" style={{ backgroundColor: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
                <Box className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #F59E0B, #EC7D50)" }}>
                  <CircleDollarSign className="h-5 w-5 text-white" />
                </Box>
                <Box className="flex-1 min-w-0">
                  <Text as="p" className="text-sm font-semibold truncate">{p.course_name}</Text>
                  <Text as="span" className="text-[11px]" style={{ color: "#555555" }}>
                    {p.order_number} · {p.currency_code} {p.pending_amount}
                  </Text>
                </Box>
                <Button size="sm" className="shrink-0 text-xs h-7 px-3 font-semibold border-0 text-[#1a0a00]" style={{ background: "linear-gradient(135deg, #EFBD5F, #EC7D50)" }}>
                  Pay Now
                </Button>
              </Box>
            ))}
          </CardContent>
        </SectionCard>
      </Box>

      {/* ── Bookmarks + Suggested Courses ── */}
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <SectionCard title="Bookmarks" action="View All">
          <CardContent className="p-3 space-y-2">
            {bookmarks.length === 0 ? (
              <Text as="p" className="text-sm py-6 text-center" style={{ color: "#444444" }}>No bookmarks yet.</Text>
            ) : bookmarks.map((b) => (
              <Box key={b.id} className="flex gap-3 items-center rounded-xl p-3 transition-colors" style={{ backgroundColor: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
                <Box className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #F59E0B, #EC7D50)" }}>
                  <Bookmark className="h-5 w-5 text-white" />
                </Box>
                <Box className="flex-1 min-w-0">
                  <Text as="p" className="text-sm font-semibold truncate">{b.course.name}</Text>
                  <Text as="span" className="text-[11px] truncate block" style={{ color: "#444444" }}>
                    {b.lesson?.title || "Course bookmark"}
                  </Text>
                </Box>
              </Box>
            ))}
          </CardContent>
        </SectionCard>

        <SectionCard title="Suggested For You" action="Browse All">
          <CardContent className="p-3 space-y-2">
            {suggested_courses.length === 0 ? (
              <Text as="p" className="text-sm py-6 text-center" style={{ color: "#444444" }}>No suggestions available.</Text>
            ) : suggested_courses.map((c) => (
              <Box key={c.id} className="flex gap-3 items-center rounded-xl p-3 transition-colors" style={{ backgroundColor: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
                <Box className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: "linear-gradient(178.73deg, #4F2183 -26.7%, #1A0A30 126.7%)" }}>
                  <BookMarked className="h-5 w-5 text-white" />
                </Box>
                <Box className="flex-1 min-w-0">
                  <Text as="p" className="text-sm font-semibold truncate">{c.name}</Text>
                  <Text as="span" className="text-[11px]" style={{ color: "#444444" }}>{c.category || "Course"}</Text>
                </Box>
                <Button size="sm" className="shrink-0 text-xs h-7 px-3 font-semibold border-0 text-[#1a0a00]" style={{ background: "linear-gradient(135deg, #EFBD5F, #EC7D50)" }}>
                  View
                </Button>
              </Box>
            ))}
          </CardContent>
        </SectionCard>
      </Box>

      {/* ── Certificates ── */}
      {certificates.length > 0 && (
        <SectionCard title="My Certificates" action="View All">
          <CardContent className="p-3 space-y-2">
            {certificates.map((cert) => (
              <Box key={cert.id} className="flex gap-3 items-center rounded-xl p-3 transition-colors" style={{ backgroundColor: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)" }}>
                <Box className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0">
                  <Award className="h-5 w-5 text-white" />
                </Box>
                <Box className="flex-1 min-w-0">
                  <Text as="p" className="text-sm font-semibold truncate">{cert.course_name}</Text>
                  <Text as="span" className="text-[11px]" style={{ color: "#444444" }}>
                    {cert.certificate_number} · {new Date(cert.issued_at).toLocaleDateString()}
                  </Text>
                </Box>
                <Button size="sm" className="shrink-0 text-xs h-7 px-3 font-semibold text-emerald-700 border border-emerald-300 bg-transparent hover:bg-emerald-50 transition-colors">
                  Download
                </Button>
              </Box>
            ))}
          </CardContent>
        </SectionCard>
      )}
    </Box>
  );
}
