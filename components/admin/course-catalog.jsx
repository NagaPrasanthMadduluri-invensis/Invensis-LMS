"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Library, RefreshCw, Search, ChevronRight, Award, Clock, AlertCircle, Inbox,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchCourses, syncCourses } from "@/services/api/admin/course-resources-api";
import { instantValue } from "@/lib/datetime";

// `last_synced_at` is a real instant — its age is measured against real "now".
function timeAgo(iso) {
  const at = instantValue(iso, null);
  if (at === null) return "never";
  const s = Math.floor((Date.now() - at) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function CourseCatalog() {
  const { token } = useAuth();
  const [courses, setCourses] = useState(null);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [notice, setNotice] = useState(null);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    try {
      const data = await fetchCourses({ token });
      setCourses(data.courses || []);
    } catch (e) {
      setError(e.message);
      setCourses([]);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  async function handleSync() {
    setSyncing(true); setNotice(null); setError(null);
    try {
      const res = await syncCourses({ token });
      setNotice(`Synced ${res.synced} course${res.synced === 1 ? "" : "s"} — ${res.created} new, ${res.updated} updated.`);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setSyncing(false);
    }
  }

  const filtered = useMemo(() => {
    if (!courses) return [];
    const term = q.trim().toLowerCase();
    if (!term) return courses;
    return courses.filter((c) =>
      c.name?.toLowerCase().includes(term) ||
      c.slug?.toLowerCase().includes(term) ||
      c.category?.name?.toLowerCase().includes(term)
    );
  }, [courses, q]);

  return (
    <Box className="space-y-5">
      {/* Toolbar */}
      <Box className="flex flex-wrap items-center gap-3">
        <Box className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search courses…" className="h-10 pl-9 text-sm" />
        </Box>
        <Button onClick={handleSync} disabled={syncing}
          className="h-10 px-4 bg-violet-600 hover:bg-violet-700 text-white border-0 rounded-lg text-sm font-semibold">
          <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Syncing…" : "Sync from CMS"}
        </Button>
      </Box>

      {notice && (
        <Box className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-2.5">
          <Text as="p" className="text-xs text-emerald-700">{notice}</Text>
        </Box>
      )}
      {error && (
        <Box className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-100 px-4 py-2.5">
          <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
          <Text as="p" className="text-xs text-red-600">{error}</Text>
        </Box>
      )}

      {courses == null ? (
        <Box className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </Box>
      ) : courses.length === 0 ? (
        <Card className="flex flex-col items-center justify-center px-6 py-14 text-center rounded-2xl border border-slate-200/80 shadow-sm">
          <Box className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100">
            <Inbox className="h-7 w-7 text-violet-600" />
          </Box>
          <Text as="h2" className="mt-4 text-lg font-bold text-slate-800">No courses yet</Text>
          <Text as="p" className="mt-1.5 max-w-md text-sm text-slate-500">
            Click <b>Sync from CMS</b> to import the course catalogue. You can then upload predefined resources per course.
          </Text>
        </Card>
      ) : (
        <Box className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <Link key={c.id} href={`/admin/course-catalog/${c.slug}`} className="block">
            <Card
              className="group h-full p-0 overflow-hidden cursor-pointer rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-violet-200 transition-all">
              <Box className="p-4 space-y-3">
                <Box className="flex items-start justify-between gap-2">
                  <Box className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                    <Library className="h-5 w-5 text-violet-600" />
                  </Box>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-violet-500 transition-colors" />
                </Box>
                <Box>
                  <Text as="h3" className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{c.name}</Text>
                  {c.category?.name && (
                    <Text as="span" className="text-[11px] text-slate-400">{c.category.name}</Text>
                  )}
                </Box>
                <Box className="flex flex-wrap items-center gap-2">
                  {c.certification_included && (
                    <Badge className="border-0 bg-amber-50 text-amber-700 text-[10px] font-medium">
                      <Award className="h-3 w-3 mr-1" /> Certification
                    </Badge>
                  )}
                  {c.duration_hours != null && (
                    <Badge className="border-0 bg-slate-100 text-slate-600 text-[10px] font-medium">
                      <Clock className="h-3 w-3 mr-1" /> {c.duration_hours}h
                    </Badge>
                  )}
                </Box>
              </Box>
            </Card>
            </Link>
          ))}
        </Box>
      )}

      {courses?.length > 0 && (
        <Text as="p" className="text-[11px] text-slate-400">
          {filtered.length} of {courses.length} courses · last synced {timeAgo(courses[0]?.last_synced_at)}
        </Text>
      )}
    </Box>
  );
}
