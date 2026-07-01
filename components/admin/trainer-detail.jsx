"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Mail, Briefcase, BadgeDollarSign, Pencil, History, GraduationCap } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchTrainerDetail } from "@/services/api/admin/admin-api";
import { TrainerFormDialog } from "@/components/admin/trainer-form-dialog";

function initialsOf(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join("") || "T";
}

function Fact({ icon: Icon, label, value }) {
  return (
    <Box className="flex items-start gap-3">
      <Box className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50">
        <Icon className="h-4 w-4 text-indigo-500" />
      </Box>
      <Box className="min-w-0">
        <Text as="p" className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{label}</Text>
        <Text as="p" className="text-sm font-semibold text-slate-800 leading-tight mt-0.5 break-all">{value}</Text>
      </Box>
    </Box>
  );
}

export function TrainerDetail({ trainerId }) {
  const { token } = useAuth();
  const [trainer, setTrainer] = useState(null);
  const [error, setError] = useState(null);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(() => {
    if (!token) return;
    fetchTrainerDetail({ token, trainerId }).then(setTrainer).catch((e) => setError(e.message));
  }, [token, trainerId]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <Card className="p-6 rounded-2xl border-0 bg-red-50">
        <Text as="p" className="text-red-600 text-sm">Failed to load trainer: {error}</Text>
      </Card>
    );
  }

  if (!trainer) {
    return (
      <Box className="space-y-5">
        <Skeleton className="h-52 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </Box>
    );
  }

  const assignments = trainer.assignments || [];

  return (
    <Box className="space-y-5">
      {/* Profile hero */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <Box className="bg-gradient-to-r from-indigo-50 via-purple-50 to-violet-50 border-b border-indigo-100 px-7 py-7">
          <Box className="flex items-start justify-between gap-4 flex-wrap">
            <Box className="flex items-center gap-5">
              <Avatar className="h-16 w-16 ring-2 ring-indigo-200 shrink-0">
                <AvatarFallback className="bg-indigo-600 text-white font-bold text-2xl">
                  {initialsOf(trainer.name)}
                </AvatarFallback>
              </Avatar>
              <Box>
                <Box className="flex items-center gap-2.5 flex-wrap">
                  <Text as="h2" className="text-xl font-bold text-slate-900">{trainer.name}</Text>
                  <Badge className={`border-0 text-[11px] font-semibold px-2.5 py-0.5 ${trainer.is_active ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200" : "bg-red-100 text-red-600 ring-1 ring-red-200"}`}>
                    {trainer.is_active ? "● Active" : "● Inactive"}
                  </Badge>
                </Box>
                <Text as="p" className="text-sm text-slate-500 mt-1">{trainer.email}</Text>
              </Box>
            </Box>
            <Button
              variant="outline"
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-100 bg-white shrink-0"
              onClick={() => setEditOpen(true)}
            >
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit Profile
            </Button>
          </Box>
        </Box>

        <Box className="p-6">
          <Box className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Fact icon={Briefcase} label="Experience" value={trainer.experience || "—"} />
            <Fact icon={BadgeDollarSign} label="Rate" value={trainer.rate != null ? `₹${trainer.rate}` : "—"} />
            <Fact icon={Mail} label="Email" value={trainer.email} />
          </Box>
          {trainer.bio && (
            <>
              <Separator className="my-5" />
              <Box>
                <Text as="p" className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">About</Text>
                <Text as="p" className="text-sm text-slate-600 leading-relaxed">{trainer.bio}</Text>
              </Box>
            </>
          )}
        </Box>
      </Card>

      {/* Assignment history */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <Box className="px-6 py-4 border-b border-slate-100 flex items-center gap-2.5">
          <Box className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <History className="h-4 w-4 text-indigo-500" />
          </Box>
          <Text as="h3" className="text-sm font-bold text-slate-800">Assignment History</Text>
          <Badge className="border-0 bg-indigo-50 text-indigo-600 text-[11px] font-semibold ml-1">{assignments.length}</Badge>
        </Box>

        {assignments.length === 0 ? (
          <Box className="py-16 text-center">
            <Box className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="h-6 w-6 text-slate-400" />
            </Box>
            <Text as="p" className="text-sm font-medium text-slate-500">No assignments yet.</Text>
          </Box>
        ) : (
          <Box className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-200/60">
                  <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3">Training</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3">Assigned</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3">Removed</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3">State</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((a, i) => (
                  <TableRow key={`${a.training_id}-${i}`} className="hover:bg-slate-50/70 border-b border-slate-100 last:border-0">
                    <TableCell className="py-3.5">
                      <Text as="p" className="text-sm font-semibold text-slate-800">{a.title || "—"}</Text>
                      <Text as="span" className="text-[11px] text-slate-400 font-mono">{a.code}</Text>
                    </TableCell>
                    <TableCell className="py-3.5 text-xs text-slate-500">
                      {a.assigned_at ? new Date(a.assigned_at).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="py-3.5 text-xs text-slate-500">
                      {a.removed_at ? new Date(a.removed_at).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="py-3.5">
                      <Badge className={`border-0 text-[10px] font-semibold ${a.active ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-slate-100 text-slate-500"}`}>
                        {a.active ? "Active" : "Past"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>

      <TrainerFormDialog open={editOpen} onOpenChange={setEditOpen} token={token} mode="edit" trainer={trainer} onSaved={load} />
    </Box>
  );
}
