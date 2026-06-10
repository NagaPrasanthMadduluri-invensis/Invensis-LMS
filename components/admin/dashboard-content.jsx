"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users,
  BookOpen,
  IndianRupee,
  CreditCard,
  Ticket,
  Award,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchAdminDashboard } from "@/services/api/admin/admin-api";

const ICON_MAP = {
  Users,
  BookOpen,
  IndianRupee,
  CreditCard,
  Ticket,
  Award,
};

function DashboardSkeleton() {
  return (
    <Box className="space-y-5">
      <Box className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </Box>
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-56 rounded-lg" />
        <Skeleton className="h-56 rounded-lg" />
      </Box>
    </Box>
  );
}

export function AdminDashboardContent() {
  const { token } = useAuth();
  const [data, setData]   = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetchAdminDashboard({ token })
      .then(setData)
      .catch((err) => setError(err.message));
  }, [token]);

  if (error) {
    return (
      <Card className="p-6">
        <Text as="p" className="text-red-600">Failed to load dashboard: {error}</Text>
      </Card>
    );
  }

  if (!data) return <DashboardSkeleton />;

  const { stats = [], recent_users = [], recent_orders = [] } = data;

  return (
    <Box className="space-y-5">
      {/* Stat Cards */}
      <Box className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s) => {
          const Icon = ICON_MAP[s.icon];
          return (
            <Card key={s.label} className="p-4">
              <Box className="flex items-start gap-3">
                <Box className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
                  {Icon && <Icon className="h-5 w-5" />}
                </Box>
                <Box>
                  <Text as="h2" className="text-2xl leading-none">{s.value}</Text>
                  <Text as="span" className="text-[11px] text-muted-foreground">{s.label}</Text>
                  {s.sub && (
                    <Text as="span" className={`block text-[10px] ${s.subColor || "text-muted-foreground"}`}>
                      {s.sub}
                    </Text>
                  )}
                </Box>
              </Box>
            </Card>
          );
        })}
      </Box>

      {/* Recent Users + Recent Orders */}
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
            <CardTitle className="text-sm font-semibold">Recent Users</CardTitle>
            <Text as="span" className="text-xs text-indigo-500 font-medium cursor-pointer hover:underline">
              View All →
            </Text>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <Box className="divide-y">
              {recent_users.map((u) => (
                <Box key={u.email} className="flex items-center justify-between py-2.5">
                  <Box>
                    <Text as="p" className="text-sm font-semibold">{u.name}</Text>
                    <Text as="span" className="text-[11px] text-muted-foreground">
                      {u.email} · {u.role}
                    </Text>
                  </Box>
                  <Box className="text-right">
                    <Badge
                      variant="secondary"
                      className={`text-[10px] ${u.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}
                    >
                      {u.status}
                    </Badge>
                    <Text as="span" className="block text-[10px] text-muted-foreground mt-0.5">
                      {u.joined}
                    </Text>
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
            <CardTitle className="text-sm font-semibold">Recent Orders</CardTitle>
            <Text as="span" className="text-xs text-indigo-500 font-medium cursor-pointer hover:underline">
              View All →
            </Text>
          </CardHeader>
          <CardContent className="px-4 pb-4 pt-0">
            <Box className="divide-y">
              {recent_orders.map((o) => (
                <Box key={o.id} className="flex items-center justify-between py-2.5">
                  <Box>
                    <Text as="p" className="text-sm font-semibold">{o.id}</Text>
                    <Text as="span" className="text-[11px] text-muted-foreground">
                      {o.user} · {o.course}
                    </Text>
                  </Box>
                  <Box className="text-right">
                    <Text as="span" className="text-sm font-bold">{o.amount}</Text>
                    <Badge
                      variant="secondary"
                      className={`ml-2 text-[10px] ${o.status === "paid" || o.status === "Paid" ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                    >
                      {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                    </Badge>
                  </Box>
                </Box>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
