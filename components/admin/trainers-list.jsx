"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, UserPlus, GraduationCap, Pencil, Eye } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchTrainers } from "@/services/api/admin/admin-api";
import { TrainerFormDialog } from "@/components/admin/trainer-form-dialog";

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

function TrainerRow({ trainer, onEdit }) {
  return (
    <Box className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/60 transition-colors">
      <Avatar className="h-10 w-10 shrink-0 ring-2 ring-white shadow-sm">
        <AvatarFallback className={`${avatarColor(trainer.name)} text-white text-sm font-bold`}>
          {initialsOf(trainer.name)}
        </AvatarFallback>
      </Avatar>

      <Box className="flex-1 min-w-0">
        <Box className="flex items-center gap-2 flex-wrap">
          <Text as="p" className="text-sm font-semibold text-slate-900 leading-tight">{trainer.name}</Text>
          <Badge className={`border-0 text-[10px] font-semibold px-2 py-0.5 ${trainer.is_active !== false ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-red-50 text-red-600 ring-1 ring-red-200"}`}>
            {trainer.is_active !== false ? "Active" : "Inactive"}
          </Badge>
        </Box>
        <Text as="span" className="text-xs text-slate-400">{trainer.email}</Text>
      </Box>

      <Box className="hidden sm:block min-w-[100px]">
        <Text as="p" className="text-xs text-slate-500">{trainer.experience || "—"}</Text>
      </Box>

      <Box className="hidden md:block min-w-[80px]">
        <Text as="p" className="text-xs text-slate-500">{trainer.rate != null ? `₹${trainer.rate}` : "—"}</Text>
      </Box>

      <Box className="flex items-center gap-2 shrink-0">
        <Button
          size="icon" variant="ghost"
          className="h-8 w-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
          onClick={() => onEdit(trainer)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Link href={`/admin/trainers/${trainer.id}`}
          className="inline-flex items-center gap-1.5 h-8 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors">
          <Eye className="h-3.5 w-3.5 shrink-0" />
          <Text as="span" className="leading-none text-white">View</Text>
        </Link>
      </Box>
    </Box>
  );
}

function RowSkeleton() {
  return (
    <Box className="flex items-center gap-4 px-5 py-4">
      <Skeleton className="h-10 w-10 rounded-full shrink-0" />
      <Box className="flex-1 space-y-1.5">
        <Skeleton className="h-3.5 w-36" />
        <Skeleton className="h-3 w-48" />
      </Box>
      <Skeleton className="h-3 w-24 hidden sm:block" />
      <Skeleton className="h-8 w-20" />
    </Box>
  );
}

export function TrainersList() {
  const { token } = useAuth();
  const [trainers, setTrainers] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTrainer, setEditTrainer] = useState(null);

  const load = useCallback(() => {
    if (!token) return;
    setError(null);
    fetchTrainers({ token }).then((d) => setTrainers(d.trainers || [])).catch((e) => setError(e.message));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <Card className="p-6 rounded-2xl border-0 bg-red-50 shadow-sm">
        <Text as="p" className="text-red-600 text-sm">Failed to load trainers: {error}</Text>
      </Card>
    );
  }

  const rows = (trainers || []).filter((t) => {
    const q = search.toLowerCase();
    return t.name?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q);
  });

  return (
    <Box className="space-y-5">
      {/* Toolbar */}
      <Box className="flex items-center gap-3 flex-wrap">
        <Box className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 text-sm bg-slate-200/60 border-slate-300/70 rounded-xl focus-visible:ring-indigo-400/50"
          />
        </Box>
        <Button
          onClick={() => setCreateOpen(true)}
          className="h-11 px-5 bg-indigo-600 hover:bg-indigo-700 text-white border-0 rounded-xl shadow-sm shrink-0"
        >
          <UserPlus className="h-4 w-4 mr-2" /> New Trainer
        </Button>
      </Box>

      {/* Table card */}
      {!trainers ? (
        <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
          {Array.from({ length: 5 }).map((_, i) => <RowSkeleton key={i} />)}
        </Card>
      ) : rows.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 text-center rounded-2xl border border-slate-200/80 shadow-sm bg-white">
          <Box className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center mb-4">
            <GraduationCap className="h-7 w-7 text-indigo-400" />
          </Box>
          <Text as="h3" className="text-sm font-bold text-slate-700">
            {search ? "No trainers match your search" : "No trainers yet"}
          </Text>
          <Text as="p" className="text-xs text-slate-400 mt-1 max-w-[200px]">
            Onboard a trainer to make them assignable to trainings.
          </Text>
          {!search && (
            <Button onClick={() => setCreateOpen(true)} className="mt-4 h-9 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-sm border-0 rounded-xl">
              Add First Trainer
            </Button>
          )}
        </Card>
      ) : (
        <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          {/* Header */}
          <Box className="flex items-center gap-4 px-5 py-3 bg-slate-50 border-b border-slate-100">
            <Box className="w-10 shrink-0" />
            <Text as="span" className="flex-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Trainer</Text>
            <Text as="span" className="hidden sm:block min-w-[100px] text-[11px] font-bold text-slate-400 uppercase tracking-wider">Experience</Text>
            <Text as="span" className="hidden md:block min-w-[80px] text-[11px] font-bold text-slate-400 uppercase tracking-wider">Rate</Text>
            <Box className="w-32 shrink-0" />
          </Box>
          <Box className="divide-y divide-slate-100/80">
            {rows.map((t) => <TrainerRow key={t.id} trainer={t} onEdit={setEditTrainer} />)}
          </Box>
        </Card>
      )}

      <TrainerFormDialog open={createOpen} onOpenChange={setCreateOpen} token={token} mode="create" onSaved={load} />
      <TrainerFormDialog open={!!editTrainer} onOpenChange={(v) => !v && setEditTrainer(null)} token={token} mode="edit" trainer={editTrainer} onSaved={load} />
    </Box>
  );
}
