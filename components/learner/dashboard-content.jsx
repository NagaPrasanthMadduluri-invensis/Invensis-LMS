"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen, Award, Bookmark, CreditCard, BookMarked,
  CircleDollarSign, ChevronRight, Download, Sparkles,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchDashboard } from "@/services/api/learner/learner-api";

function DashboardSkeleton() {
  return (
    <Box className="space-y-6">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Box className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </Box>
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </Box>
    </Box>
  );
}

function StatCard({ label, value, icon: Icon, bg, border, iconBg, iconCls, valueCls, labelCls }) {
  return (
    <Card className={`rounded-2xl ${border} shadow-sm ${bg} p-5`}>
      <Box className="flex items-start justify-between mb-3">
        <Box className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${iconCls}`} />
        </Box>
        <Text as="p" className={`text-3xl font-bold ${valueCls} leading-none`}>{value}</Text>
      </Box>
      <Text as="p" className={`text-xs ${labelCls} font-medium`}>{label}</Text>
    </Card>
  );
}

function SectionHeader({ title, action }) {
  return (
    <Box className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
      <Text as="h3" className="text-sm font-bold text-slate-800">{title}</Text>
      {action}
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
      .then(setData)
      .catch((err) => setError(err.message));
  }, [token, user]);

  if (error) {
    return (
      <Card className="p-6 rounded-2xl border-0 bg-red-50">
        <Text as="p" className="text-red-600 text-sm">Failed to load dashboard: {error}</Text>
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

  return (
    <Box className="space-y-6">

      {/* ── Welcome banner ── */}
      <Card className="rounded-2xl border border-indigo-100 overflow-hidden shadow-sm">
        <Box className="bg-gradient-to-r from-indigo-50 via-purple-50 to-violet-50 px-6 py-5 flex items-center gap-5 flex-wrap">
          <Avatar className="h-14 w-14 ring-2 ring-indigo-200 shrink-0 shadow-sm">
            <AvatarFallback className="bg-indigo-600 text-white font-bold text-xl">
              {user?.initials || user?.firstName?.[0] || "L"}
            </AvatarFallback>
          </Avatar>
          <Box className="flex-1 min-w-[180px]">
            <Text as="h2" className="text-lg font-bold text-slate-800 leading-tight">
              Welcome back, {user?.firstName || "Learner"}!
            </Text>
            <Text as="p" className="text-xs text-slate-500 mt-1">
              {enrolled_courses.length} enrolled course{enrolled_courses.length !== 1 ? "s" : ""}
              {pending_payments.length > 0 && ` · ${pending_payments.length} pending payment${pending_payments.length !== 1 ? "s" : ""}`}
              {bookmarks.length > 0 && ` · ${bookmarks.length} bookmark${bookmarks.length !== 1 ? "s" : ""}`}
            </Text>
          </Box>
          <Button className="h-9 px-5 bg-indigo-600 hover:bg-indigo-700 text-white border-0 rounded-xl shadow-sm shrink-0 text-sm font-semibold">
            Browse Courses <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Box>
      </Card>

      {/* ── Stat cards ── */}
      <Box className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Enrolled Courses" value={enrolled_courses.length} icon={BookOpen}
          bg="bg-indigo-50"  border="border border-indigo-100"  iconBg="bg-indigo-100"  iconCls="text-indigo-600"  valueCls="text-indigo-900"  labelCls="text-indigo-500" />
        <StatCard label="Certificates" value={certificates.length} icon={Award}
          bg="bg-emerald-50" border="border border-emerald-100" iconBg="bg-emerald-100" iconCls="text-emerald-600" valueCls="text-emerald-900" labelCls="text-emerald-600" />
        <StatCard label="Bookmarks" value={bookmarks.length} icon={Bookmark}
          bg="bg-teal-50"    border="border border-teal-100"    iconBg="bg-teal-100"    iconCls="text-teal-600"    valueCls="text-teal-900"    labelCls="text-teal-600" />
        <StatCard label="Pending Payments" value={pending_payments.length} icon={CreditCard}
          bg="bg-red-50"     border="border border-red-100"     iconBg="bg-red-100"     iconCls="text-red-500"     valueCls="text-red-900"     labelCls="text-red-500" />
        <StatCard label="Suggested" value={suggested_courses.length} icon={Sparkles}
          bg="bg-violet-50"  border="border border-violet-100"  iconBg="bg-violet-100"  iconCls="text-violet-600"  valueCls="text-violet-900"  labelCls="text-violet-500" />
      </Box>

      {/* ── Enrolled Courses + Pending Payments ── */}
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Enrolled courses */}
        <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <SectionHeader title="Enrolled Courses"
            action={<Text as="span" className="text-xs text-indigo-500 font-semibold cursor-pointer hover:text-indigo-700">View All →</Text>}
          />
          <Box className="divide-y divide-slate-100/80">
            {enrolled_courses.length === 0 ? (
              <Box className="py-12 text-center">
                <Box className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="h-5 w-5 text-slate-400" />
                </Box>
                <Text as="p" className="text-sm text-slate-400">No enrolled courses yet.</Text>
              </Box>
            ) : enrolled_courses.map((c) => (
              <Box key={c.enrollment_id} className="px-5 py-4 hover:bg-slate-50/60 transition-colors">
                <Box className="flex items-start justify-between gap-3 mb-2.5">
                  <Box className="min-w-0">
                    <Text as="p" className="text-sm font-semibold text-slate-900 leading-tight">{c.course.name}</Text>
                    <Text as="span" className="text-[11px] text-slate-400 mt-0.5">
                      {c.status === "active" ? "In Progress" : c.status}
                    </Text>
                  </Box>
                  <Badge className={`border-0 text-[10px] font-semibold shrink-0 ${c.status === "active" ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-slate-100 text-slate-500"}`}>
                    {c.status === "active" ? "Active" : c.status}
                  </Badge>
                </Box>
                <Box className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <Box className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                    style={{ width: `${c.progress_percentage}%` }} />
                </Box>
                <Text as="span" className="text-[11px] text-slate-400 mt-1">{Math.round(c.progress_percentage)}% complete</Text>
              </Box>
            ))}
          </Box>
        </Card>

        {/* Pending Payments */}
        <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <SectionHeader title="Pending Payments"
            action={pending_payments.length > 0 && (
              <Badge className="border-0 bg-red-100 text-red-600 ring-1 ring-red-200 text-[10px] font-bold">
                {pending_payments.length} due
              </Badge>
            )}
          />
          <Box className="divide-y divide-slate-100/80">
            {pending_payments.length === 0 ? (
              <Box className="py-12 text-center">
                <Box className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                  <CreditCard className="h-5 w-5 text-emerald-500" />
                </Box>
                <Text as="p" className="text-sm text-slate-400">No pending payments.</Text>
              </Box>
            ) : pending_payments.map((p) => (
              <Box key={p.order_id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-red-50/40 transition-colors">
                <Box className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                  <CircleDollarSign className="h-4 w-4 text-red-500" />
                </Box>
                <Box className="flex-1 min-w-0">
                  <Text as="p" className="text-sm font-semibold text-slate-800 truncate">{p.course_name}</Text>
                  <Text as="span" className="text-[11px] text-slate-400">{p.order_number} · {p.currency_code} {p.pending_amount}</Text>
                </Box>
                <Button size="sm" className="h-7 px-3 bg-red-500 hover:bg-red-600 text-white border-0 text-xs font-semibold rounded-lg shrink-0">
                  Pay Now
                </Button>
              </Box>
            ))}
          </Box>
        </Card>
      </Box>

      {/* ── Bookmarks + Suggested ── */}
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Bookmarks */}
        <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <SectionHeader title="Bookmarks"
            action={<Text as="span" className="text-xs text-indigo-500 font-semibold cursor-pointer hover:text-indigo-700">View All →</Text>}
          />
          <Box className="divide-y divide-slate-100/80">
            {bookmarks.length === 0 ? (
              <Box className="py-12 text-center">
                <Box className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center mx-auto mb-3">
                  <Bookmark className="h-5 w-5 text-teal-400" />
                </Box>
                <Text as="p" className="text-sm text-slate-400">No bookmarks yet.</Text>
              </Box>
            ) : bookmarks.map((b) => (
              <Box key={b.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                <Box className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center shrink-0">
                  <Bookmark className="h-4 w-4 text-teal-600" />
                </Box>
                <Box className="flex-1 min-w-0">
                  <Text as="p" className="text-sm font-semibold text-slate-800 truncate">{b.course.name}</Text>
                  <Text as="span" className="text-[11px] text-slate-400 truncate">{b.lesson?.title || "Course bookmark"}</Text>
                </Box>
              </Box>
            ))}
          </Box>
        </Card>

        {/* Suggested courses */}
        <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <SectionHeader title="Suggested For You"
            action={<Text as="span" className="text-xs text-indigo-500 font-semibold cursor-pointer hover:text-indigo-700">Browse All →</Text>}
          />
          <Box className="divide-y divide-slate-100/80">
            {suggested_courses.length === 0 ? (
              <Box className="py-12 text-center">
                <Box className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="h-5 w-5 text-violet-400" />
                </Box>
                <Text as="p" className="text-sm text-slate-400">No suggestions available.</Text>
              </Box>
            ) : suggested_courses.map((c) => (
              <Box key={c.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                <Box className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
                  <BookMarked className="h-4 w-4 text-violet-600" />
                </Box>
                <Box className="flex-1 min-w-0">
                  <Text as="p" className="text-sm font-semibold text-slate-800 truncate">{c.name}</Text>
                  <Text as="span" className="text-[11px] text-slate-400">{c.category || "Course"}</Text>
                </Box>
                <Button size="sm" variant="outline" className="h-7 px-3 text-xs border-slate-200 text-slate-600 hover:border-indigo-300 hover:text-indigo-600 rounded-lg shrink-0">
                  View
                </Button>
              </Box>
            ))}
          </Box>
        </Card>
      </Box>

      {/* ── Certificates ── */}
      {certificates.length > 0 && (
        <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <SectionHeader title="My Certificates"
            action={<Text as="span" className="text-xs text-indigo-500 font-semibold cursor-pointer hover:text-indigo-700">View All →</Text>}
          />
          <Box className="divide-y divide-slate-100/80">
            {certificates.map((cert) => (
              <Box key={cert.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors">
                <Box className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                  <Award className="h-4 w-4 text-emerald-600" />
                </Box>
                <Box className="flex-1 min-w-0">
                  <Text as="p" className="text-sm font-semibold text-slate-800 truncate">{cert.course_name}</Text>
                  <Text as="span" className="text-[11px] text-slate-400">
                    {cert.certificate_number} · Issued {new Date(cert.issued_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </Text>
                </Box>
                <Button size="sm" variant="outline" className="h-7 px-3 text-xs border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-600 rounded-lg shrink-0 gap-1.5">
                  <Download className="h-3 w-3" /> Download
                </Button>
              </Box>
            ))}
          </Box>
        </Card>
      )}

    </Box>
  );
}
