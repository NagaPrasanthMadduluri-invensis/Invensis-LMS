"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen, IndianRupee, CreditCard, Ticket, Award } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchAdminDashboard, fetchOrders } from "@/services/api/admin/admin-api";

const ICON_MAP = { Users, BookOpen, IndianRupee, CreditCard, Ticket, Award };

const CARD_PALETTE = [
  { bg: "bg-indigo-200",  icon: "bg-indigo-300 text-indigo-700",  val: "text-indigo-900"  },
  { bg: "bg-emerald-200", icon: "bg-emerald-300 text-emerald-700", val: "text-emerald-900" },
  { bg: "bg-violet-200",  icon: "bg-violet-300 text-violet-700",   val: "text-violet-900"  },
  { bg: "bg-orange-200",     icon: "bg-orange-300 text-orange-700",         val: "text-orange-900"     },
  { bg: "bg-teal-200",    icon: "bg-teal-300 text-teal-700",       val: "text-teal-900"    },
  { bg: "bg-rose-200",    icon: "bg-rose-300 text-rose-700",       val: "text-rose-900"    },
];

const AVATAR_COLORS = [
  "bg-indigo-500/30 text-indigo-300",
  "bg-teal-500/30 text-teal-300",
  "bg-violet-500/30 text-violet-300",
  "bg-emerald-500/30 text-emerald-300",
  "bg-rose-500/30 text-rose-300",
];

function getInitials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "?";
}

function DashboardSkeleton() {
  return (
    <Box className="space-y-6">
      <Box className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl bg-white/10" />
        ))}
      </Box>
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Skeleton className="h-64 rounded-xl bg-white/10" />
        <Skeleton className="h-64 rounded-xl bg-white/10" />
      </Box>
    </Box>
  );
}

export function AdminDashboardContent() {
  const { token } = useAuth();
  const [data,   setData]   = useState(null);
  const [orders, setOrders] = useState([]);
  const [error,  setError]  = useState(null);

  useEffect(() => {
    if (!token) return;
    fetchAdminDashboard({ token })
      .then(setData)
      .catch((err) => setError(err.message));
    fetchOrders({ token, page: 1, limit: 5 })
      .then((res) => setOrders(res?.orders ?? res?.data ?? []))
      .catch(() => {});
  }, [token]);

  if (error) {
    return (
      <Box className="p-4 rounded-xl bg-red-500/20 border border-red-500/30">
        <Text as="p" className="text-red-300 text-sm">Failed to load dashboard: {error}</Text>
      </Box>
    );
  }

  if (!data) return <DashboardSkeleton />;

  const { stats = [], recent_users = [] } = data;
  const recent_orders = data.recent_orders?.length ? data.recent_orders : orders;

  return (
    <Box className="space-y-6">

      {/* ── Stat Cards ── */}
      <Box className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s, i) => {
          const Icon  = ICON_MAP[s.icon];
          const theme = CARD_PALETTE[i % CARD_PALETTE.length];
          return (
            <Card key={s.label} className={`p-4 border-0 shadow-sm rounded-xl ${theme.bg}`}>
              <Box className="flex items-start justify-between">
                <Box>
                  <Text as="span" className="text-[11px] font-medium text-slate-500 leading-tight block">{s.label}</Text>
                  <Text as="h2" className={`text-3xl font-bold leading-none mt-1 ${theme.val}`}>{s.value}</Text>
                  {s.sub && <Text as="span" className="block text-[10px] mt-1 text-slate-400">{s.sub}</Text>}
                </Box>
                <Box className={`p-2 rounded-xl shrink-0 ${theme.icon}`}>
                  {Icon && <Icon className="h-5 w-5" />}
                </Box>
              </Box>
            </Card>
          );
        })}
      </Box>

      {/* ── Recent Users + Recent Orders ── */}
      <Box className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Recent Users */}
        <Box className="rounded-xl overflow-hidden bg-slate-700">
          <Box className="flex items-center justify-between py-3 px-4 border-b border-white/10">
            <Text as="h3" className="text-sm font-semibold text-white">Recent Users</Text>
            <Link href="/admin/users" className="text-xs text-indigo-300 font-medium hover:text-indigo-200">View All →</Link>
          </Box>
          <Box className="px-4 pb-2 pt-0 divide-y divide-white/5">
            {recent_users.length === 0 ? (
              <Text as="p" className="text-sm text-slate-400 py-6 text-center">No recent users</Text>
            ) : (
              recent_users.map((u, i) => (
                <Box key={u.email} className="flex items-center justify-between py-2.5 hover:bg-white/5 -mx-4 px-4 transition-colors">
                  <Box className="flex items-center gap-2.5">
                    <Box className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                      {getInitials(u.name)}
                    </Box>
                    <Box>
                      <Text as="p" className="text-xs font-semibold text-white">{u.name}</Text>
                      <Text as="span" className="text-[11px] text-slate-400">{u.email} · {u.role}</Text>
                    </Box>
                  </Box>
                  <Box className="text-right shrink-0">
                    <Badge variant="secondary" className={`text-[10px] border-0 ${u.status === "Active" ? "bg-emerald-500/20 text-emerald-300" : "bg-amber-500/20 text-amber-300"}`}>
                      {u.status}
                    </Badge>
                    <Text as="span" className="block text-[10px] text-slate-500 mt-0.5">{u.joined}</Text>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>

        {/* Recent Orders */}
        <Box className="rounded-xl overflow-hidden bg-slate-600">
          <Box className="flex items-center justify-between py-3 px-4 border-b border-white/10">
            <Text as="h3" className="text-sm font-semibold text-white">Recent Orders</Text>
            <Link href="/admin/orders" className="text-xs text-indigo-300 font-medium hover:text-indigo-200">View All →</Link>
          </Box>
          <Box className="px-4 pb-2 pt-0 divide-y divide-white/5">
            {recent_orders.length === 0 ? (
              <Text as="p" className="text-sm text-slate-400 py-6 text-center">No recent orders</Text>
            ) : (
              recent_orders.map((o) => {
                const id     = o.order_id ?? o.id ?? "—";
                const user   = o.name ?? o.user ?? "—";
                const course = o.course_name ?? o.course ?? "—";
                const status = o.payment_status ?? o.status ?? "—";
                const amount = o.amount ?? "";
                const isPaid = status === "paid" || status === "Paid";
                return (
                  <Box key={id} className="flex items-center justify-between py-2.5 hover:bg-white/5 -mx-4 px-4 transition-colors">
                    <Box className="min-w-0 flex-1">
                      <Text as="p" className="text-xs font-semibold font-mono text-indigo-300 truncate">{id}</Text>
                      <Text as="span" className="text-[11px] text-slate-400 truncate block">{user} · {course}</Text>
                    </Box>
                    <Box className="text-right shrink-0 ml-3">
                      {amount && <Text as="span" className="text-sm font-bold text-white block">{amount}</Text>}
                      <Badge variant="secondary" className={`text-[10px] border-0 ${isPaid ? "bg-emerald-500/20 text-emerald-300" : status === "pending" ? "bg-amber-500/20 text-amber-300" : "bg-red-500/20 text-red-300"}`}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </Badge>
                    </Box>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>

      </Box>
    </Box>
  );
}
