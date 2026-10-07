"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, Users, X, BookOpen, UserCheck, UserX, Mail, Calendar, Briefcase, MapPin, LogIn, Building2, ChevronRight as RowChevron,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { formatInstantDate } from "@/lib/datetime";
import { fetchParticipants, resendParticipantSetupEmail } from "@/services/api/admin/admin-api";
import { SponsorLink } from "@/components/admin/entity-links";
import { ResendSetupButton } from "@/components/admin/resend-setup-button";
import { DataPagination } from "@/components/shared/data-pagination";
import { pageCount } from "@/lib/pagination";
import { lastLoginLabel, lastLoginTitle, hasNeverLoggedIn } from "@/lib/last-login";

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-cyan-100 text-cyan-700",
  "bg-pink-100 text-pink-700",
];

function getInitials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "U";
}

function avatarColor(id = "") {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// `created_at` is a real instant — shown on the reader's clock.
const formatJoined = (iso) => formatInstantDate(iso, { day: "2-digit" });

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

// Fifty rows a page — a denser working set for the admin directory.
const PAGE_LIMIT = 50;

const STATUS_LABEL = {
  active: "Active",
  inactive: "Inactive",
  setup_pending: "Setup pending",
};

export function UsersTable() {
  const { token } = useAuth();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [status, setStatus] = useState("");       // "" | active | inactive | setup_pending
  const [joinedFrom, setJoinedFrom] = useState("");
  const [joinedTo, setJoinedTo] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  // Filter dropdown options persist across reloads (backend returns the full
  // distinct lists regardless of the active filters).
  const [filterOptions, setFilterOptions] = useState({ locations: [], job_titles: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    const handle = setTimeout(() => {
      fetchParticipants({ token, search, location, jobTitle, status, joinedFrom, joinedTo, page, limit: PAGE_LIMIT })
        .then((res) => {
          setData(res);
          if (res?.filters) setFilterOptions(res.filters);
        })
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(handle);
  }, [token, search, location, jobTitle, status, joinedFrom, joinedTo, page]);

  const hasFilters = !!(search || location || jobTitle || status || joinedFrom || joinedTo);
  const users = data?.participants || [];
  const total = data?.total || 0;
  const totalPages = pageCount(total, PAGE_LIMIT);

  /* Figures for the stat cards come from the API's `summary`, which is computed
     over the whole filtered set. Deriving them from `users` would describe only
     the ten rows on screen — "Active: 7" out of five hundred. Older responses
     predate `summary`, so fall back to the page rather than render nothing. */
  const summary = data?.summary;
  const activeCount = summary?.active ?? users.filter((u) => u.account_active).length;
  const inactiveCount = summary?.inactive ?? users.length - activeCount;
  const totalEnrolments = summary?.total_enrolments ?? users.reduce((s, u) => s + (u.enrolment_count || 0), 0);

  /* A filter can shrink the result set under the page you are on — searching
     while on page 30 would otherwise fetch a page that no longer exists and
     show an empty table. Snap back into range and refetch. */
  useEffect(() => {
    if (!loading && page > totalPages) setPage(totalPages);
  }, [loading, page, totalPages]);

  if (error) {
    return (
      <Card className="p-6 rounded-2xl border-0 bg-error-subtle shadow-sm">
        <Text as="p" className="text-error text-sm">Failed to load users: {error}</Text>
      </Card>
    );
  }

  return (
    <Box className="space-y-5">

      {/* Stat cards */}
      <Box className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Users"      value={total}           icon={Users}     bg="bg-primary-subtle"  border="border border-primary-border"  iconBg="bg-primary-subtle"  iconCls="text-primary"  valueCls="text-primary"  labelCls="text-primary" />
        <StatCard label="Active"           value={activeCount}     icon={UserCheck} bg="bg-success-subtle" border="border border-success-border" iconBg="bg-success-subtle" iconCls="text-success" valueCls="text-success-subtle-foreground" labelCls="text-success" />
        <StatCard label="Inactive"         value={inactiveCount}   icon={UserX}     bg="bg-surface-hover"   border="border border-border"   iconBg="bg-surface-muted"   iconCls="text-foreground-muted"   valueCls="text-foreground"   labelCls="text-foreground-muted" />
        <StatCard label="Total Enrolments" value={totalEnrolments} icon={BookOpen}  bg="bg-primary-subtle"  border="border border-primary-border"  iconBg="bg-primary-subtle"  iconCls="text-primary"  valueCls="text-primary"  labelCls="text-primary" />
      </Box>

      {/* Search toolbar */}
      <Box className="flex items-center gap-3 flex-wrap">
        <Box className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-subtle" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            autoComplete="off"
            className="pl-10 pr-9 h-11 text-sm bg-slate-100/60 border-slate-300/70 rounded-xl focus-visible:ring-focus"
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground-subtle hover:text-foreground-muted transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </Box>

        {/* Location filter */}
        <Select
          value={location || "__all__"}
          onValueChange={(v) => { setLocation(v === "__all__" ? "" : v); setPage(1); }}
        >
          <SelectTrigger className="h-11 w-[190px] bg-slate-100/60 border-slate-300/70 rounded-xl text-sm text-foreground">
            <MapPin className="h-4 w-4 text-foreground-subtle shrink-0" />
            <SelectValue placeholder="All locations" className="truncate">
              {(v) => (!v || v === "__all__" ? "All locations" : v)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All locations</SelectItem>
            {filterOptions.locations.map((loc) => (
              <SelectItem key={loc} value={loc}>{loc}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Job role filter */}
        <Select
          value={jobTitle || "__all__"}
          onValueChange={(v) => { setJobTitle(v === "__all__" ? "" : v); setPage(1); }}
        >
          <SelectTrigger className="h-11 w-[190px] bg-slate-100/60 border-slate-300/70 rounded-xl text-sm text-foreground">
            <Briefcase className="h-4 w-4 text-foreground-subtle shrink-0" />
            <SelectValue placeholder="All job titles" className="truncate">
              {(v) => (!v || v === "__all__" ? "All job titles" : v)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All job titles</SelectItem>
            {filterOptions.job_titles.map((jt) => (
              <SelectItem key={jt} value={jt}>{jt}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Account status filter (covers active / inactive / setup pending) */}
        <Select
          value={status || "__all__"}
          onValueChange={(v) => { setStatus(v === "__all__" ? "" : v); setPage(1); }}
        >
          <SelectTrigger className="h-11 w-[180px] bg-slate-100/60 border-slate-300/70 rounded-xl text-sm text-foreground">
            <UserCheck className="h-4 w-4 text-foreground-subtle shrink-0" />
            <SelectValue placeholder="All statuses" className="truncate">
              {(v) => (!v || v === "__all__" ? "All statuses" : STATUS_LABEL[v] || v)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all__">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="setup_pending">Setup pending</SelectItem>
          </SelectContent>
        </Select>

        {/* Joined (account-creation) date range */}
        <Box className="flex items-center gap-1.5 h-11 px-3 bg-slate-100/60 border border-slate-300/70 rounded-xl">
          <Calendar className="h-4 w-4 text-foreground-subtle shrink-0" />
          <Input
            type="date"
            value={joinedFrom}
            max={joinedTo || undefined}
            onChange={(e) => { setJoinedFrom(e.target.value); setPage(1); }}
            className="h-8 w-[140px] border-0 bg-transparent p-0 text-sm text-foreground focus-visible:ring-0"
            title="Joined from"
          />
          <Text as="span" className="text-foreground-subtle text-xs">–</Text>
          <Input
            type="date"
            value={joinedTo}
            min={joinedFrom || undefined}
            onChange={(e) => { setJoinedTo(e.target.value); setPage(1); }}
            className="h-8 w-[140px] border-0 bg-transparent p-0 text-sm text-foreground focus-visible:ring-0"
            title="Joined to"
          />
        </Box>

        {hasFilters && (
          <Button
            variant="ghost" size="sm"
            onClick={() => { setSearch(""); setLocation(""); setJobTitle(""); setStatus(""); setJoinedFrom(""); setJoinedTo(""); setPage(1); }}
            className="h-11 px-3 text-xs text-foreground-muted hover:text-foreground shrink-0"
          >
            <X className="h-3.5 w-3.5 mr-1" /> Clear
          </Button>
        )}
        {hasFilters && !loading && (
          <Text as="span" className="text-xs text-foreground-subtle shrink-0">
            {total} match{total !== 1 ? "es" : ""}
          </Text>
        )}
      </Box>

      {/* Table card */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">

        {/* Card header */}
        <Box className="px-5 py-4 border-b border-border flex items-center justify-between gap-3">
          <Box className="flex items-center gap-2.5">
            <Box className="w-8 h-8 rounded-lg bg-primary-subtle flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </Box>
            <Text as="h3" className="text-sm font-bold text-foreground">All Users</Text>
            <Badge className="border-0 bg-primary-subtle text-primary text-[11px] font-semibold ml-0.5">
              {total} total
            </Badge>
          </Box>
        </Box>

        {loading ? (
          <Box className="py-20 text-center">
            <Text as="p" className="text-sm text-foreground-subtle">Loading users...</Text>
          </Box>
        ) : users.length === 0 ? (
          <Box className="py-20 text-center">
            <Box className="w-12 h-12 rounded-2xl bg-surface-muted flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-foreground-subtle" />
            </Box>
            <Text as="p" className="text-sm font-medium text-foreground-muted">
              {hasFilters ? "No users match your filters" : "No users yet"}
            </Text>
            {hasFilters && <Text as="p" className="text-xs text-foreground-subtle mt-1">Try adjusting your search or filters</Text>}
            {hasFilters && (
              <Button variant="ghost" size="sm"
                onClick={() => { setSearch(""); setLocation(""); setJobTitle(""); setPage(1); }}
                className="mt-3 text-primary hover:text-primary text-xs">
                Clear filters
              </Button>
            )}
          </Box>
        ) : (
          <>
            {/* `table-fixed` + explicit column widths: under the default `auto`
                layout a long email or job title sets the table's intrinsic
                width and the remaining columns collapse to their minimum. Here
                the header owns the widths and overlong values ellipsise inside
                their own column. Job Title and Joined fold away on narrower
                screens rather than every column being cramped at once. */}
            <Table className="table-fixed min-w-[1070px] md:min-w-[1230px] lg:min-w-[1410px] xl:min-w-[1750px]">
              <TableHeader>
                <TableRow className="bg-surface-hover hover:bg-surface-hover border-b border-border">
                  <TableHead className="text-[11px] font-bold text-foreground-subtle uppercase tracking-wider py-3 pl-5 w-[240px]">User</TableHead>
                  <TableHead className="text-[11px] font-bold text-foreground-subtle uppercase tracking-wider py-3 w-[260px]">Email</TableHead>
                  <TableHead className="text-[11px] font-bold text-foreground-subtle uppercase tracking-wider py-3 hidden lg:table-cell w-[180px]">Job Title</TableHead>
                  <TableHead className="text-[11px] font-bold text-foreground-subtle uppercase tracking-wider py-3 hidden md:table-cell w-[160px]">Location</TableHead>
                  <TableHead className="text-[11px] font-bold text-foreground-subtle uppercase tracking-wider py-3 w-[150px]">Last Login</TableHead>
                  <TableHead className="text-[11px] font-bold text-foreground-subtle uppercase tracking-wider py-3 text-center w-[120px]">Enrolments</TableHead>
                  <TableHead className="text-[11px] font-bold text-foreground-subtle uppercase tracking-wider py-3 hidden xl:table-cell w-[200px]">Sponsor</TableHead>
                  <TableHead className="text-[11px] font-bold text-foreground-subtle uppercase tracking-wider py-3 hidden xl:table-cell w-[160px]">Agent</TableHead>
                  <TableHead className="text-[11px] font-bold text-foreground-subtle uppercase tracking-wider py-3 hidden xl:table-cell w-[140px]">Joined</TableHead>
                  <TableHead className="text-[11px] font-bold text-foreground-subtle uppercase tracking-wider py-3 w-[150px]">Status</TableHead>
                  <TableHead className="py-3 pr-5 w-[150px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => {
                  const setupPending = u.account_active && !u.has_password;
                  return (
                    <TableRow
                      key={u.id}
                      onClick={() => router.push(`/admin/users/${u.id}`)}
                      className="group cursor-pointer hover:bg-violet-50/40 border-b border-border last:border-0 transition-colors"
                    >

                      {/* User */}
                      <TableCell className="py-4 pl-5">
                        <Box className="flex items-center gap-3">
                          <Box className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${avatarColor(u.id)}`}>
                            {getInitials(u.name)}
                          </Box>
                          <Text as="p" title={u.name} className="min-w-0 truncate text-sm font-semibold text-foreground leading-tight">{u.name}</Text>
                        </Box>
                      </TableCell>

                      {/* Email */}
                      <TableCell className="py-4">
                        <Box className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-foreground-subtle shrink-0" />
                          <Text as="span" title={u.email} className="min-w-0 truncate text-sm text-foreground-muted">{u.email}</Text>
                        </Box>
                      </TableCell>

                      {/* Job title */}
                      <TableCell className="py-4 hidden lg:table-cell">
                        <Box className="flex items-center gap-1.5">
                          <Briefcase className="h-3.5 w-3.5 text-foreground-subtle shrink-0" />
                          <Text as="span" title={u.job_title || ""} className="min-w-0 truncate text-sm text-foreground-muted">{u.job_title || "—"}</Text>
                        </Box>
                      </TableCell>

                      {/* Location */}
                      <TableCell className="py-4 hidden md:table-cell">
                        <Box className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-foreground-subtle shrink-0" />
                          <Text as="span" title={u.location || ""} className="min-w-0 truncate text-sm text-foreground-muted">{u.location || "—"}</Text>
                        </Box>
                      </TableCell>

                      {/* Last login — "Never" is a real answer here, not missing
                          data: the account exists but has not been signed into. */}
                      <TableCell className="py-4">
                        <Box className="flex items-center gap-1.5">
                          <LogIn className="h-3.5 w-3.5 shrink-0 text-foreground-subtle" />
                          <Text as="span" title={lastLoginTitle(u.last_login_at)}
                            className={`min-w-0 truncate text-sm ${hasNeverLoggedIn(u.last_login_at) ? "italic text-foreground-subtle" : "text-foreground-muted"}`}>
                            {lastLoginLabel(u.last_login_at)}
                          </Text>
                        </Box>
                      </TableCell>

                      {/* Enrolments */}
                      <TableCell className="py-4 text-center">
                        <Box className="inline-flex items-center gap-1.5 bg-primary-subtle text-primary text-sm font-bold px-2.5 py-1 rounded-lg ring-1 ring-primary-border">
                          <BookOpen className="h-3.5 w-3.5" />
                          {u.enrolment_count}
                        </Box>
                      </TableCell>

                      {/* Sponsor — who paid for the seat. Blank for a
                          self-funded learner: there is no third party to name,
                          and inventing a dash would read as missing data. */}
                      <TableCell className="py-4 hidden xl:table-cell">
                        {u.sponsor_name ? (
                          <Box className="flex items-center gap-1.5">
                            <Building2 className="h-3.5 w-3.5 shrink-0 text-foreground-subtle" />
                            <SponsorLink userId={u.sponsor_user_id} className="min-w-0 truncate text-sm text-foreground-muted">
                              <Box as="span" title={u.sponsor_email || u.sponsor_name} className="truncate">{u.sponsor_name}</Box>
                            </SponsorLink>
                          </Box>
                        ) : (
                          <Text as="span" className="text-sm text-foreground-subtle">&nbsp;</Text>
                        )}
                      </TableCell>

                      {/* Agent — the CRM sales agent on the learner's order. */}
                      <TableCell className="py-4 hidden xl:table-cell">
                        {u.agent ? (
                          <Box className="flex items-center gap-1.5">
                            <UserCheck className="h-3.5 w-3.5 shrink-0 text-foreground-subtle" />
                            <Text as="span" title={u.agent}
                              className="min-w-0 truncate text-sm text-foreground-muted">{u.agent}</Text>
                          </Box>
                        ) : (
                          <Text as="span" className="text-sm text-foreground-subtle">&nbsp;</Text>
                        )}
                      </TableCell>

                      {/* Joined */}
                      <TableCell className="py-4 hidden xl:table-cell">
                        <Box className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-foreground-subtle shrink-0" />
                          <Text as="span" className="min-w-0 truncate text-sm text-foreground-muted">{formatJoined(u.created_at)}</Text>
                        </Box>
                      </TableCell>

                      {/* Status */}
                      <TableCell className="py-4">
                        <Badge className={`max-w-full border-0 text-xs font-semibold px-2.5 py-0.5 ${
                          !u.account_active
                            ? "bg-surface-muted text-foreground-muted ring-1 ring-border"
                            : setupPending
                            ? "bg-warning-subtle text-warning-subtle-foreground ring-1 ring-warning-border"
                            : "bg-success-subtle text-success-subtle-foreground ring-1 ring-success-border"
                        }`}>
                          {!u.account_active ? "● Inactive" : setupPending ? "● Setup pending" : "● Active"}
                        </Badge>
                      </TableCell>

                      {/* Actions + row affordance */}
                      <TableCell className="py-4 pr-5 text-right">
                        <Box className="flex items-center gap-2 justify-end">
                          {setupPending && (
                            <ResendSetupButton
                              label="Resend"
                              onResend={() => resendParticipantSetupEmail({ token, participantId: u.id })}
                            />
                          )}
                          <RowChevron className="h-4 w-4 text-foreground-subtle shrink-0 group-hover:text-primary transition-colors" />
                        </Box>
                      </TableCell>

                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <DataPagination
              page={page}
              perPage={PAGE_LIMIT}
              total={total}
              onPageChange={setPage}
              siblings={2}
            />
          </>
        )}
      </Card>
    </Box>
  );
}
