"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, UserPlus, GraduationCap, Pencil, Eye } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchTrainers } from "@/services/api/admin/admin-api";
import { TrainerFormDialog } from "@/components/admin/trainer-form-dialog";

function initialsOf(name = "") {
  return (
    name.trim().split(/\s+/).slice(0, 2).map((p) => p.charAt(0).toUpperCase()).join("") || "T"
  );
}

function ListSkeleton() {
  return (
    <Box className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-md" />
      ))}
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
    fetchTrainers({ token })
      .then((d) => setTrainers(d.trainers || []))
      .catch((e) => setError(e.message));
  }, [token]);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <Card className="p-6 border-red-100 bg-red-50">
        <Text as="p" className="text-red-600 text-sm">Failed to load trainers: {error}</Text>
      </Card>
    );
  }

  const rows = (trainers || []).filter((t) => {
    const q = search.toLowerCase();
    return t.name?.toLowerCase().includes(q) || t.email?.toLowerCase().includes(q);
  });

  return (
    <Box className="space-y-4">
      <Box className="flex items-center justify-between gap-3 flex-wrap">
        <Box className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search trainers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 text-sm bg-white"
          />
        </Box>
        <Button onClick={() => setCreateOpen(true)}>
          <UserPlus className="h-4 w-4 mr-1.5" /> New Trainer
        </Button>
      </Box>

      <Text as="p" className="text-xs text-slate-400">
        Only active (assignable) trainers are listed.
      </Text>

      {!trainers ? (
        <ListSkeleton />
      ) : rows.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center border-0 shadow-sm">
          <Box className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
            <GraduationCap className="h-6 w-6 text-indigo-600" />
          </Box>
          <Text as="h3" className="text-sm font-semibold">
            {search ? "No trainers match your search" : "No trainers yet"}
          </Text>
          <Text as="p" className="text-xs text-muted-foreground mt-1">
            Onboard a trainer to make them assignable to trainings.
          </Text>
        </Card>
      ) : (
        <Card className="p-0 border-0 shadow-sm overflow-hidden">
          <Box className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trainer</TableHead>
                  <TableHead>Experience</TableHead>
                  <TableHead>Rate</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>
                      <Box className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs">
                            {initialsOf(t.name)}
                          </AvatarFallback>
                        </Avatar>
                        <Box>
                          <Text as="p" className="text-sm font-medium text-slate-800">{t.name}</Text>
                          <Text as="span" className="text-[11px] text-muted-foreground">{t.email}</Text>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell className="text-sm text-slate-600">{t.experience || "—"}</TableCell>
                    <TableCell className="text-sm text-slate-600">{t.rate != null ? t.rate : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Box className="flex items-center justify-end gap-1.5">
                        <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditTrainer(t)}>
                          <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                        </Button>
                        <Button asChild size="sm" variant="outline" className="h-8 px-2">
                          <Link href={`/admin/trainers/${t.id}`}>
                            <Eye className="h-3.5 w-3.5 mr-1" /> View
                          </Link>
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </Card>
      )}

      <TrainerFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        token={token}
        mode="create"
        onSaved={load}
      />
      <TrainerFormDialog
        open={!!editTrainer}
        onOpenChange={(v) => !v && setEditTrainer(null)}
        token={token}
        mode="edit"
        trainer={editTrainer}
        onSaved={load}
      />
    </Box>
  );
}
