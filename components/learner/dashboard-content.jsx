"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchDashboard } from "@/services/api/learner/learner-api";

function DashboardSkeleton() {
  return (
    <Box className="space-y-5">
      <Skeleton className="h-20 w-full rounded-lg" />
      <Box className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
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
      <Card className="p-6">
        <Text as="p" className="text-red-600">Failed to load dashboard: {error}</Text>
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

  // Build stat cards from real data
  const stats = [
    { label: "Enrolled Courses", value: String(enrolled_courses.length), icon: BookOpen, color: "bg-violet-100 text-violet-600" },
    { label: "Certificates", value: String(certificates.length), icon: Award, color: "bg-emerald-100 text-emerald-600" },
    { label: "Bookmarks", value: String(bookmarks.length), icon: Bookmark, color: "bg-teal-100 text-teal-600" },
    { label: "Pending Payments", value: String(pending_payments.length), icon: CreditCard, color: "bg-red-100 text-red-600" },
    { label: "Suggested", value: String(suggested_courses.length), icon: BookMarked, color: "bg-blue-100 text-blue-600" },
  ];

  return (
    <Box className="space-y-5">
      {/* ── Welcome Banner ── */}
      <Card className="bg-gradient-to-br from-indigo-500/5 to-purple-500/5">
        <CardContent className="flex items-center gap-4 flex-wrap py-4">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
              {user?.initials || "U"}
            </AvatarFallback>
          </Avatar>
          <Box className="flex-1 min-w-[180px]">
            <Text as="h3" className="text-base font-bold">
              Welcome back, {user?.firstName || "Learner"}!
            </Text>
            <Text as="p" className="text-xs text-muted-foreground">
              You have {enrolled_courses.length} enrolled course{enrolled_courses.length !== 1 ? "s" : ""},
              {" "}{pending_payments.length} pending payment{pending_payments.length !== 1 ? "s" : ""},
              {" "}and {bookmarks.length} bookmark{bookmarks.length !== 1 ? "s" : ""}.
            </Text>
          </Box>
          <Button size="sm" className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white">
            Browse Courses
          </Button>
        </CardContent>
      </Card>

      {/* ── Stat Cards ── */}
      <Box className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
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

      {/* ── Enrolled Courses + Pending Payments ── */}
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Enrolled Courses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
            <CardTitle className="text-sm font-semibold">Enrolled Courses</CardTitle>
            <Text as="span" className="text-xs text-indigo-500 font-medium cursor-pointer hover:underline">
              View All →
            </Text>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-0 divide-y">
            {enrolled_courses.length === 0 ? (
              <Text as="p" className="text-sm text-muted-foreground py-4 text-center">No enrolled courses yet.</Text>
            ) : (
              enrolled_courses.map((c) => (
                <Box key={c.enrollment_id} className="py-2.5">
                  <Box className="flex justify-between items-start">
                    <Box>
                      <Text as="p" className="text-sm font-semibold">{c.course.name}</Text>
                      <Text as="span" className="text-[11px] text-muted-foreground">
                        {c.status === "active" ? "In Progress" : c.status}
                      </Text>
                    </Box>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${c.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-200 text-gray-600"}`}
                    >
                      {c.status}
                    </Badge>
                  </Box>
                  <Box className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-1.5">
                    <Box
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-600"
                      role="progressbar"
                      aria-valuenow={c.progress_percentage}
                      style={{ width: `${c.progress_percentage}%` }}
                    />
                  </Box>
                  <Text as="span" className="text-[11px] text-muted-foreground">
                    {Math.round(c.progress_percentage)}% complete
                  </Text>
                </Box>
              ))
            )}
          </CardContent>
        </Card>

        {/* Pending Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
            <CardTitle className="text-sm font-semibold">Pending Payments</CardTitle>
            {pending_payments.length > 0 && (
              <Badge variant="destructive" className="text-[10px]">
                {pending_payments.length} item{pending_payments.length !== 1 ? "s" : ""}
              </Badge>
            )}
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-1.5">
            {pending_payments.length === 0 ? (
              <Text as="p" className="text-sm text-muted-foreground py-4 text-center">No pending payments.</Text>
            ) : (
              pending_payments.map((p) => (
                <Box key={p.order_id} className="flex items-center gap-3 p-2.5 rounded-lg bg-red-50">
                  <CircleDollarSign className="h-5 w-5 shrink-0 text-red-500" />
                  <Box className="flex-1 min-w-0">
                    <Text as="p" className="text-[13px] font-semibold truncate">{p.course_name}</Text>
                    <Text as="span" className="text-[11px] text-muted-foreground">
                      {p.order_number} · {p.currency_code} {p.pending_amount}
                    </Text>
                  </Box>
                  <Button size="sm" variant="destructive" className="shrink-0 text-xs h-7 px-3">
                    Pay Now
                  </Button>
                </Box>
              ))
            )}
          </CardContent>
        </Card>
      </Box>

      {/* ── Bookmarks + Suggested Courses ── */}
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Bookmarks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
            <CardTitle className="text-sm font-semibold">Bookmarks</CardTitle>
            <Text as="span" className="text-xs text-indigo-500 font-medium cursor-pointer hover:underline">
              View All →
            </Text>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-0 divide-y">
            {bookmarks.length === 0 ? (
              <Text as="p" className="text-sm text-muted-foreground py-4 text-center">No bookmarks yet.</Text>
            ) : (
              bookmarks.map((b) => (
                <Box key={b.id} className="flex gap-3 items-center py-2.5">
                  <Box className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
                    <Bookmark className="h-4 w-4 text-teal-600" />
                  </Box>
                  <Box className="flex-1 min-w-0">
                    <Text as="p" className="text-sm font-semibold truncate">{b.course.name}</Text>
                    <Text as="span" className="text-[11px] text-muted-foreground truncate">
                      {b.lesson?.title || "Course bookmark"}
                    </Text>
                  </Box>
                </Box>
              ))
            )}
          </CardContent>
        </Card>

        {/* Suggested Courses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
            <CardTitle className="text-sm font-semibold">Suggested For You</CardTitle>
            <Text as="span" className="text-xs text-indigo-500 font-medium cursor-pointer hover:underline">
              Browse All →
            </Text>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-0 divide-y">
            {suggested_courses.length === 0 ? (
              <Text as="p" className="text-sm text-muted-foreground py-4 text-center">No suggestions available.</Text>
            ) : (
              suggested_courses.map((c) => (
                <Box key={c.id} className="flex gap-3 items-center py-2.5">
                  <Box className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-200/50 to-purple-200/50 flex items-center justify-center shrink-0">
                    <BookMarked className="h-4 w-4 text-indigo-600" />
                  </Box>
                  <Box className="flex-1 min-w-0">
                    <Text as="p" className="text-sm font-semibold truncate">{c.name}</Text>
                    <Text as="span" className="text-[11px] text-muted-foreground">
                      {c.category || "Course"}
                    </Text>
                  </Box>
                  <Button size="sm" variant="outline" className="shrink-0 text-xs h-7 px-3">
                    View
                  </Button>
                </Box>
              ))
            )}
          </CardContent>
        </Card>
      </Box>

      {/* ── Certificates ── */}
      {certificates.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
            <CardTitle className="text-sm font-semibold">Certificates</CardTitle>
            <Text as="span" className="text-xs text-indigo-500 font-medium cursor-pointer hover:underline">
              View All →
            </Text>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0 space-y-0 divide-y">
            {certificates.map((cert) => (
              <Box key={cert.id} className="flex gap-3 items-center py-2.5">
                <Box className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <Award className="h-4 w-4 text-emerald-600" />
                </Box>
                <Box className="flex-1 min-w-0">
                  <Text as="p" className="text-sm font-semibold truncate">{cert.course_name}</Text>
                  <Text as="span" className="text-[11px] text-muted-foreground">
                    {cert.certificate_number} · Issued {new Date(cert.issued_at).toLocaleDateString()}
                  </Text>
                </Box>
                <Button size="sm" variant="outline" className="shrink-0 text-xs h-7 px-3">
                  Download
                </Button>
              </Box>
            ))}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
