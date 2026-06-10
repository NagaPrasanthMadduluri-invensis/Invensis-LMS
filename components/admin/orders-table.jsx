"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Users,
  BookOpen,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchOrders } from "@/services/api/admin/admin-api";

const STATUS_STYLE = {
  paid:    "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100  text-amber-700",
  failed:  "bg-red-100    text-red-700",
  refunded:"bg-gray-100   text-gray-600",
};

const EVENT_STYLE = {
  "order.paid":     "bg-emerald-50 text-emerald-600",
  "order.pending":  "bg-amber-50   text-amber-600",
  "order.failed":   "bg-red-50     text-red-600",
  "order.refunded": "bg-gray-50    text-gray-500",
};

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card className="p-4">
      <Box className="flex items-center gap-3">
        <Box className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="h-4 w-4" />
        </Box>
        <Box>
          <Text as="h3" className="text-lg leading-none font-semibold">{value}</Text>
          <Text as="span" className="text-[11px] text-muted-foreground">{label}</Text>
        </Box>
      </Box>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <Box className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded" />
      ))}
    </Box>
  );
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: true,
  });
}

export function OrdersTable() {
  const { token } = useAuth();

  const [data,    setData]    = useState(null);
  const [page,    setPage]    = useState(1);
  const [search,  setSearch]  = useState("");
  const [status,  setStatus]  = useState("all");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const searchTimer = useRef(null);

  const load = useCallback(async (opts = {}) => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const result = await fetchOrders({
        token,
        page:   opts.page   ?? page,
        search: opts.search ?? search,
        status: opts.status === "all" ? "" : (opts.status ?? (status === "all" ? "" : status)),
      });
      setData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, page, search, status]);

  useEffect(() => { load(); }, [load]);

  function handleSearch(val) {
    setSearch(val);
    setPage(1);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => load({ search: val, page: 1 }), 400);
  }

  function handleStatus(val) {
    setStatus(val);
    setPage(1);
    load({ status: val, page: 1 });
  }

  function goPage(p) {
    setPage(p);
    load({ page: p });
  }

  const orders   = data?.orders  ?? [];
  const total    = data?.total   ?? 0;
  const limit    = data?.limit   ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  // Derived stats from current page
  const paidCount     = orders.filter((o) => o.payment_status === "paid").length;
  const pendingCount  = orders.filter((o) => o.payment_status === "pending").length;
  const uniqueCourses = new Set(orders.map((o) => o.course_name)).size;

  return (
    <Box className="space-y-5">
      {/* ── Stats Row ── */}
      {data && (
        <Box className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={CreditCard}   label="Total Orders"      value={total}         color="bg-indigo-100 text-indigo-600" />
          <StatCard icon={TrendingUp}   label="Paid (this page)"  value={paidCount}     color="bg-emerald-100 text-emerald-600" />
          <StatCard icon={RefreshCw}    label="Pending"           value={pendingCount}  color="bg-amber-100 text-amber-600" />
          <StatCard icon={BookOpen}     label="Unique Courses"    value={uniqueCourses} color="bg-blue-100 text-blue-600" />
        </Box>
      )}

      {/* ── Table Card ── */}
      <Card>
        <CardHeader className="py-3 px-4 flex-row items-center justify-between space-y-0 flex-wrap gap-2">
          <CardTitle className="text-sm font-semibold">
            Orders
            {data && (
              <Badge variant="secondary" className="ml-2 text-[10px]">{total} total</Badge>
            )}
          </CardTitle>

          {/* Filters */}
          <Box className="flex items-center gap-2 flex-wrap">
            <Box className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search name, email, course…"
                className="h-8 pl-8 text-xs w-52"
              />
            </Box>

            <Select value={status} onValueChange={handleStatus}>
              <SelectTrigger className="h-8 text-xs w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all"      className="text-xs">All Status</SelectItem>
                <SelectItem value="paid"     className="text-xs">Paid</SelectItem>
                <SelectItem value="pending"  className="text-xs">Pending</SelectItem>
                <SelectItem value="failed"   className="text-xs">Failed</SelectItem>
                <SelectItem value="refunded" className="text-xs">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" size="icon" className="h-8 w-8"
              onClick={() => load()} disabled={loading}>
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </Box>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          {error ? (
            <Box className="px-4 py-8 text-center">
              <Text as="p" className="text-red-600 text-sm">{error}</Text>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => load()}>
                Retry
              </Button>
            </Box>
          ) : !data ? (
            <Box className="px-4 pb-4"><TableSkeleton /></Box>
          ) : orders.length === 0 ? (
            <Box className="px-4 py-10 text-center">
              <CreditCard className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <Text as="p" className="text-sm text-muted-foreground">No orders found</Text>
            </Box>
          ) : (
            <Box className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs pl-4">Order ID</TableHead>
                    <TableHead className="text-xs">Customer</TableHead>
                    <TableHead className="text-xs">Course</TableHead>
                    <TableHead className="text-xs text-center">Participants</TableHead>
                    <TableHead className="text-xs">Ordered At</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs pr-4">Last Event</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.order_id} className="text-xs">
                      <TableCell className="pl-4 font-mono font-medium text-indigo-600 whitespace-nowrap">
                        {order.order_id}
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Text as="p" className="text-xs font-medium capitalize">{order.name}</Text>
                          <Text as="span" className="text-[11px] text-muted-foreground">{order.email}</Text>
                          {order.company && (
                            <Text as="span" className="text-[11px] text-muted-foreground block">{order.company}</Text>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell className="max-w-[180px]">
                        <Text as="p" className="text-xs truncate">{order.course_name}</Text>
                      </TableCell>
                      <TableCell className="text-center">
                        <Box className="flex items-center justify-center gap-1">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <Text as="span">{order.participants}</Text>
                        </Box>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(order.ordered_at)}
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] border-0 capitalize ${STATUS_STYLE[order.payment_status] ?? "bg-gray-100 text-gray-600"}`}>
                          {order.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="pr-4">
                        <Badge className={`text-[10px] border-0 ${EVENT_STYLE[order.last_event] ?? "bg-gray-50 text-gray-500"}`}>
                          {order.last_event}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}

          {/* Pagination */}
          {data && totalPages > 1 && (
            <Box className="flex items-center justify-between px-4 py-3 border-t">
              <Text as="span" className="text-xs text-muted-foreground">
                Page {page} of {totalPages} · {total} orders
              </Text>
              <Box className="flex items-center gap-1">
                <Button variant="outline" size="icon" className="h-7 w-7"
                  disabled={page <= 1 || loading} onClick={() => goPage(page - 1)}>
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-7 w-7"
                  disabled={page >= totalPages || loading} onClick={() => goPage(page + 1)}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Box>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
