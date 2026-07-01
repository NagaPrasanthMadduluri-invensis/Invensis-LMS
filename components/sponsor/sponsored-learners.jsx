"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchSponsoredLearners } from "@/services/api/sponsor/sponsor-api";

function initialsOf(name = "") {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p.charAt(0).toUpperCase())
      .join("") || "L"
  );
}

function TableSkeleton() {
  return (
    <Box className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-md" />
      ))}
    </Box>
  );
}

export function SponsoredLearners() {
  const { token, user } = useAuth();
  const [learners, setLearners] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !user) return;

    fetchSponsoredLearners({ token })
      .then((res) => setLearners(res.learners ?? []))
      .catch((err) => {
        if (err?.pending) setPending(true);
        else setError(err.message);
      });
  }, [token, user]);

  if (error) {
    return (
      <Card className="p-6">
        <Text as="p" className="text-red-600">Failed to load learners: {error}</Text>
      </Card>
    );
  }

  if (!learners && !pending) return <TableSkeleton />;

  const rows = learners ?? [];

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Box className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
            <Users className="h-6 w-6 text-amber-600" />
          </Box>
          <Text as="h3" className="text-sm font-semibold">No sponsored learners yet</Text>
          <Text as="p" className="text-xs text-muted-foreground mt-1 max-w-sm">
            {pending
              ? "Learners you sponsor will be listed here once this becomes available."
              : "When you purchase a course for someone, they'll appear here."}
          </Text>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Learner</TableHead>
              <TableHead>Training</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Enrolled</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((l) => (
              <TableRow key={l.id}>
                <TableCell>
                  <Box className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-amber-100 text-amber-700 text-xs">
                        {initialsOf(l.name)}
                      </AvatarFallback>
                    </Avatar>
                    <Box>
                      <Text as="p" className="text-sm font-medium">{l.name}</Text>
                      <Text as="span" className="text-[11px] text-muted-foreground">{l.email}</Text>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Text as="p" className="text-sm">{l.training_title || l.training_code || "—"}</Text>
                  {l.training_code && l.training_title && (
                    <Text as="span" className="text-[11px] text-muted-foreground">{l.training_code}</Text>
                  )}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={l.status === "confirmed" || l.status === "active"
                      ? "bg-emerald-100 text-emerald-700 text-[10px]"
                      : "bg-gray-200 text-gray-600 text-[10px]"}
                  >
                    {l.status || "—"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-xs text-muted-foreground">
                  {l.enrolled_at ? new Date(l.enrolled_at).toLocaleDateString() : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
