"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search, UserPlus, GraduationCap, Pencil, Eye, MapPin, Target, Award,
  Users, UserCheck, Wifi, X, Clock,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchTrainers } from "@/services/api/admin/admin-api";
import { TrainerFormDialog } from "@/components/admin/trainer-form-dialog";

const ALL = "__all__";

function initialsOf(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join("") || "T";
}

const AVATAR_COLORS = [
  "bg-indigo-500", "bg-violet-500", "bg-blue-500", "bg-cyan-500",
  "bg-emerald-500", "bg-teal-500", "bg-rose-500", "bg-pink-500",
];

function avatarColor(name = "") {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// Pull the leading integer out of a free-text experience string ("12 years" → 12).
function parseYears(exp) {
  if (exp == null) return null;
  const m = String(exp).match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

const EXPERIENCE_RANGES = [
  { value: "0-5", label: "Under 5 years", test: (y) => y != null && y < 5 },
  { value: "5-10", label: "5 – 10 years", test: (y) => y != null && y >= 5 && y < 10 },
  { value: "10+", label: "10+ years", test: (y) => y != null && y >= 10 },
];

function certTitles(trainer) {
  return (Array.isArray(trainer.certificates) ? trainer.certificates : []).map((c) => c?.title ?? c).filter(Boolean);
}

/* ── Stat card ── */
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

/* ── Filter dropdown. base-ui's Select.Value renders the raw value by default, so
   we pass a function child to resolve the value → its human label. ── */
function FilterSelect({ icon: Icon, value, onChange, allLabel, options, width = "w-[184px]" }) {
  const labelFor = (v) => {
    if (v == null || v === ALL) return allLabel;
    const found = options.find((o) => (o.value ?? o) === v);
    return found ? (found.label ?? found) : v;
  };
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={`h-11 ${width} bg-white border-slate-300/70 rounded-xl text-sm shadow-sm text-slate-700`}>
        <Icon className="h-4 w-4 text-slate-400 shrink-0" />
        <SelectValue placeholder={allLabel} className="truncate">
          {(v) => labelFor(v)}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        <SelectItem value={ALL}>{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/* ── Tag list cell (specializations / certifications) ── */
function TagCell({ items, tone, icon: Icon }) {
  if (!items || items.length === 0) return <Text as="span" className="text-xs text-slate-300">—</Text>;
  const shown = items.slice(0, 2);
  const extra = items.length - shown.length;
  const toneCls = tone === "amber"
    ? "bg-amber-50 text-amber-700 ring-amber-200"
    : "bg-violet-50 text-violet-700 ring-violet-200";
  return (
    <Box className="flex flex-wrap gap-1">
      {shown.map((s) => (
        <Badge key={s} className={`border-0 ring-1 text-[10px] font-semibold px-2 py-0.5 ${toneCls}`}>
          {Icon && <Icon className="h-2.5 w-2.5 mr-1 shrink-0" />}{s}
        </Badge>
      ))}
      {extra > 0 && (
        <Badge className="border-0 bg-slate-100 text-slate-500 text-[10px] font-semibold px-1.5 py-0.5">+{extra}</Badge>
      )}
    </Box>
  );
}

/* ── Trainer row ── */
function TrainerRow({ trainer, onEdit }) {
  const active = trainer.is_active !== false;
  const specs = Array.isArray(trainer.specializations) ? trainer.specializations : [];
  const certs = certTitles(trainer);

  return (
    <TableRow className="hover:bg-slate-50/70 border-b border-slate-100 last:border-0 transition-colors">
      {/* Trainer */}
      <TableCell className="py-3.5 pl-5">
        <Box className="flex items-center gap-3">
          <Avatar className="h-10 w-10 shrink-0 ring-2 ring-white shadow-sm">
            <AvatarFallback className={`${avatarColor(trainer.name)} text-white text-sm font-bold`}>
              {initialsOf(trainer.name)}
            </AvatarFallback>
          </Avatar>
          <Box className="min-w-0">
            <Box className="flex items-center gap-2 flex-wrap">
              <Text as="p" className="text-sm font-semibold text-slate-900 leading-tight">{trainer.name}</Text>
              <Badge className={`border-0 text-[10px] font-semibold px-2 py-0.5 ${active ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-red-50 text-red-600 ring-1 ring-red-200"}`}>
                {active ? "Active" : "Inactive"}
              </Badge>
              {trainer.is_remote && (
                <Badge className="border-0 text-[10px] font-semibold px-2 py-0.5 bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                  <Wifi className="h-2.5 w-2.5 mr-1" /> Remote
                </Badge>
              )}
            </Box>
            <Text as="span" className="text-xs text-slate-400">{trainer.email}</Text>
          </Box>
        </Box>
      </TableCell>

      {/* Specializations */}
      <TableCell className="py-3.5 hidden lg:table-cell align-middle">
        <TagCell items={specs} tone="violet" />
      </TableCell>

      {/* Certifications */}
      <TableCell className="py-3.5 hidden xl:table-cell align-middle">
        <TagCell items={certs} tone="amber" icon={Award} />
      </TableCell>

      {/* Location */}
      <TableCell className="py-3.5 hidden md:table-cell align-middle">
        <Box className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <Text as="span" className="text-xs text-slate-500">{trainer.location || "—"}</Text>
        </Box>
      </TableCell>

      {/* Experience */}
      <TableCell className="py-3.5 hidden sm:table-cell align-middle">
        <Box className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <Text as="span" className="text-xs text-slate-500 whitespace-nowrap">{trainer.experience || "—"}</Text>
        </Box>
      </TableCell>

      {/* Actions */}
      <TableCell className="py-3.5 pr-5 text-right">
        <Box className="flex items-center gap-2 justify-end">
          <button
            className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-orange-100 hover:bg-orange-200 text-orange-700 text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0 whitespace-nowrap"
            onClick={() => onEdit(trainer)}
          >
            <Pencil className="h-3.5 w-3.5 shrink-0" /> Edit
          </button>
          <Link href={`/admin/trainers/${trainer.id}`}
            className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors shrink-0 whitespace-nowrap">
            <Eye className="h-3.5 w-3.5 shrink-0" /> <Text as="span" className="text-white leading-none">View</Text>
          </Link>
        </Box>
      </TableCell>
    </TableRow>
  );
}

export function TrainersList() {
  const { token } = useAuth();
  const [trainers, setTrainers] = useState(null);
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTrainer, setEditTrainer] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [spec, setSpec] = useState(ALL);
  const [cert, setCert] = useState(ALL);
  const [loc, setLoc] = useState(ALL);
  const [exp, setExp] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [remoteOnly, setRemoteOnly] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    fetchTrainers({ token, includeInactive: true })
      .then((d) => setTrainers(d.trainers || []))
      .catch((e) => setError(e.message));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const all = trainers || [];

  // Distinct filter options derived from the loaded trainers.
  const { specOptions, certOptions, locOptions } = useMemo(() => {
    const s = new Set(), c = new Set(), l = new Set();
    for (const t of all) {
      (t.specializations || []).forEach((x) => x && s.add(x));
      certTitles(t).forEach((x) => c.add(x));
      if (t.location) l.add(t.location);
    }
    const sorted = (set) => [...set].sort((a, b) => a.localeCompare(b));
    return { specOptions: sorted(s), certOptions: sorted(c), locOptions: sorted(l) };
  }, [all]);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((t) => {
      if (q && !(t.name?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q))) return false;
      if (spec !== ALL && !(t.specializations || []).includes(spec)) return false;
      if (cert !== ALL && !certTitles(t).includes(cert)) return false;
      if (loc !== ALL && t.location !== loc) return false;
      if (exp !== ALL) {
        const range = EXPERIENCE_RANGES.find((r) => r.value === exp);
        if (!range || !range.test(parseYears(t.experience))) return false;
      }
      if (remoteOnly && !t.is_remote) return false;
      if (status === "active" && t.is_active === false) return false;
      if (status === "inactive" && t.is_active !== false) return false;
      return true;
    });
  }, [all, search, spec, cert, loc, exp, remoteOnly, status]);

  const activeCount = all.filter((t) => t.is_active !== false).length;
  const remoteCount = all.filter((t) => t.is_remote).length;
  const hasFilters = !!(search || spec !== ALL || cert !== ALL || loc !== ALL || exp !== ALL || status !== ALL || remoteOnly);

  function clearFilters() {
    setSearch(""); setSpec(ALL); setCert(ALL); setLoc(ALL); setExp(ALL); setStatus(ALL); setRemoteOnly(false);
  }

  if (error) {
    return (
      <Card className="p-6 rounded-2xl border-0 bg-red-50 shadow-sm">
        <Text as="p" className="text-red-600 text-sm">Failed to load trainers: {error}</Text>
      </Card>
    );
  }

  const thBase = "text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3";

  return (
    <Box className="space-y-5">
      {/* Stat cards */}
      <Box className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Trainers" value={trainers ? all.length : "—"} icon={Users}    bg="bg-indigo-50"  border="border border-indigo-100"  iconBg="bg-indigo-100"  iconCls="text-indigo-600"  valueCls="text-indigo-900"  labelCls="text-indigo-500" />
        <StatCard label="Active"          value={trainers ? activeCount : "—"} icon={UserCheck} bg="bg-emerald-50" border="border border-emerald-100" iconBg="bg-emerald-100" iconCls="text-emerald-600" valueCls="text-emerald-900" labelCls="text-emerald-600" />
        <StatCard label="Remote-enabled"  value={trainers ? remoteCount : "—"} icon={Wifi}     bg="bg-blue-50"    border="border border-blue-100"    iconBg="bg-blue-100"    iconCls="text-blue-600"    valueCls="text-blue-900"    labelCls="text-blue-500" />
        <StatCard label="Specializations" value={trainers ? specOptions.length : "—"} icon={Target} bg="bg-violet-50" border="border border-violet-100" iconBg="bg-violet-100" iconCls="text-violet-600" valueCls="text-violet-900" labelCls="text-violet-500" />
      </Box>

      {/* Toolbar */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-3">
        <Box className="flex items-center gap-3 flex-wrap">
          <Box className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-9 h-11 text-sm bg-slate-100/60 border-slate-300/70 rounded-xl focus-visible:ring-indigo-400/50"
            />
            {search && (
              <button onClick={() => setSearch("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="h-4 w-4" />
              </button>
            )}
          </Box>
          <Button
            onClick={() => setCreateOpen(true)}
            className="h-11 px-5 bg-indigo-600 hover:bg-indigo-700 text-white border-0 rounded-xl shadow-sm shrink-0"
          >
            <UserPlus className="h-4 w-4 mr-2" /> New Trainer
          </Button>
        </Box>

        {/* Filters */}
        <Box className="flex items-center gap-2.5 flex-wrap">
          <FilterSelect icon={Target}    value={spec}   onChange={setSpec}   allLabel="All specializations" options={specOptions} width="w-[196px]" />
          <FilterSelect icon={Award}     value={cert}   onChange={setCert}   allLabel="All certifications"  options={certOptions} width="w-[188px]" />
          <FilterSelect icon={MapPin}    value={loc}    onChange={setLoc}    allLabel="All locations"       options={locOptions}  width="w-[180px]" />
          <FilterSelect icon={Clock}     value={exp}    onChange={setExp}    allLabel="Any experience"      options={EXPERIENCE_RANGES} width="w-[172px]" />
          <FilterSelect icon={UserCheck} value={status} onChange={setStatus} allLabel="Any status"
            options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} width="w-[152px]" />

          <button
            type="button"
            onClick={() => setRemoteOnly((v) => !v)}
            className={`inline-flex items-center gap-1.5 h-11 px-3.5 rounded-xl text-sm font-medium shadow-sm border transition-all shrink-0 ${
              remoteOnly
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-300/70 hover:border-blue-300 hover:text-blue-600"
            }`}
          >
            <Wifi className="h-4 w-4" /> Remote only
          </button>

          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}
              className="h-11 px-3 text-xs text-slate-500 hover:text-slate-700 shrink-0">
              <X className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
          )}
          <Box className="ml-auto shrink-0">
            <Text as="span" className="text-xs text-slate-400">
              {trainers ? `${rows.length} of ${all.length}` : ""}
            </Text>
          </Box>
        </Box>
      </Card>

      {/* Table */}
      {!trainers ? (
        <Card className="rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Box key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <Box className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-40" />
                <Skeleton className="h-3 w-52" />
              </Box>
              <Skeleton className="h-8 w-32" />
            </Box>
          ))}
        </Card>
      ) : rows.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-slate-200/80 shadow-sm bg-white">
          <Box className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
            <GraduationCap className="h-7 w-7 text-indigo-400" />
          </Box>
          <Text as="h3" className="text-sm font-bold text-slate-700">
            {all.length === 0 ? "No trainers yet" : "No trainers match your filters"}
          </Text>
          <Text as="p" className="text-xs text-slate-400 mt-1 max-w-[240px]">
            {all.length === 0 ? "Onboard a trainer to make them assignable to trainings." : "Try adjusting or clearing your filters."}
          </Text>
          {all.length === 0 ? (
            <Button onClick={() => setCreateOpen(true)} className="mt-4 h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm border-0 rounded-xl">
              Add First Trainer
            </Button>
          ) : hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="mt-3 text-indigo-600 hover:text-indigo-700 text-xs">
              Clear filters
            </Button>
          )}
        </Card>
      ) : (
        <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <Box className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100">
                  <TableHead className={`${thBase} pl-5`}>Trainer</TableHead>
                  <TableHead className={`${thBase} hidden lg:table-cell`}>Specializations</TableHead>
                  <TableHead className={`${thBase} hidden xl:table-cell`}>Certifications</TableHead>
                  <TableHead className={`${thBase} hidden md:table-cell`}>Location</TableHead>
                  <TableHead className={`${thBase} hidden sm:table-cell`}>Experience</TableHead>
                  <TableHead className={`${thBase} pr-5 text-right`}>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((t) => <TrainerRow key={t.id} trainer={t} onEdit={setEditTrainer} />)}
              </TableBody>
            </Table>
          </Box>
        </Card>
      )}

      <TrainerFormDialog open={createOpen} onOpenChange={setCreateOpen} token={token} mode="create" onSaved={load} />
      <TrainerFormDialog open={!!editTrainer} onOpenChange={(v) => !v && setEditTrainer(null)} token={token} mode="edit" trainer={editTrainer} onSaved={load} />
    </Box>
  );
}
