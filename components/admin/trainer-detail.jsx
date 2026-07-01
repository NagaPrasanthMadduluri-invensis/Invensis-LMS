"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Mail, Briefcase, BadgeDollarSign, Pencil, History } from "lucide-react";
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
    <Box className="flex items-start gap-2.5">
      <Box className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
        <Icon className="h-4 w-4 text-slate-500" />
      </Box>
      <Box className="min-w-0">
        <Text as="p" className="text-[11px] uppercase tracking-wide text-slate-400">{label}</Text>
        <Text as="p" className="text-sm font-semibold text-slate-800 leading-tight mt-0.5">{value}</Text>
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
    fetchTrainerDetail({ token, trainerId })
      .then(setTrainer)
      .catch((e) => setError(e.message));
  }, [token, trainerId]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <Card className="p-6 border-red-100 bg-red-50">
        <Text as="p" className="text-red-600 text-sm">Failed to load trainer: {error}</Text>
      </Card>
    );
  }

  if (!trainer) {
    return (
      <Box className="space-y-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </Box>
    );
  }

  const assignments = trainer.assignments || [];

  return (
    <Box className="space-y-5">
      <Card className="p-6 border-0 shadow-sm rounded-xl">
        <Box className="flex items-start justify-between gap-3 flex-wrap">
          <Box className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-lg">
                {initialsOf(trainer.name)}
              </AvatarFallback>
            </Avatar>
            <Box>
              <Box className="flex items-center gap-2">
                <Text as="h2" className="text-lg font-bold text-slate-800">{trainer.name}</Text>
                <Badge className={`border-0 text-[10px] ${trainer.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                  {trainer.is_active ? "Active" : "Inactive"}
                </Badge>
              </Box>
              <Text as="p" className="text-sm text-slate-500">{trainer.email}</Text>
            </Box>
          </Box>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
          </Button>
        </Box>

        <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-5">
          <Fact icon={Briefcase} label="Experience" value={trainer.experience || "—"} />
          <Fact icon={BadgeDollarSign} label="Rate" value={trainer.rate != null ? String(trainer.rate) : "—"} />
          <Fact icon={Mail} label="Email" value={trainer.email} />
        </Box>

        {trainer.bio && (
          <Box className="mt-4 rounded-lg bg-slate-50 px-4 py-3">
            <Text as="p" className="text-[11px] uppercase tracking-wide text-slate-400 mb-1">Bio</Text>
            <Text as="p" className="text-sm text-slate-700">{trainer.bio}</Text>
          </Box>
        )}
      </Card>

      <Card className="p-5 border-0 shadow-sm rounded-xl">
        <Box className="flex items-center gap-2 mb-3">
          <History className="h-4 w-4 text-slate-500" />
          <Text as="h3" className="text-sm font-semibold text-slate-700">Assignment History</Text>
          <Badge className="border-0 bg-slate-100 text-slate-600 text-[11px]">{assignments.length}</Badge>
        </Box>
        {assignments.length === 0 ? (
          <Box className="rounded-lg border border-dashed border-slate-200 py-8 text-center">
            <Text as="p" className="text-sm text-slate-500">No assignments yet.</Text>
          </Box>
        ) : (
          <Box className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Training</TableHead>
                  <TableHead>Assigned</TableHead>
                  <TableHead>Removed</TableHead>
                  <TableHead>State</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.map((a, i) => (
                  <TableRow key={`${a.training_id}-${i}`}>
                    <TableCell>
                      <Text as="p" className="text-sm font-medium text-slate-800">{a.title || "—"}</Text>
                      <Text as="span" className="text-[11px] text-muted-foreground">{a.code}</Text>
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {a.assigned_at ? new Date(a.assigned_at).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600">
                      {a.removed_at ? new Date(a.removed_at).toLocaleString() : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge className={`border-0 text-[10px] ${a.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
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

      <TrainerFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        token={token}
        mode="edit"
        trainer={trainer}
        onSaved={load}
      />
    </Box>
  );
}
