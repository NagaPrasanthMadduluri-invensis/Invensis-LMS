"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  FolderOpen, FileText, Video, FileArchive, FileSpreadsheet, Presentation,
  Image as ImageIcon, Link2, File, Download, AlertCircle,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchMyTrainingResources } from "@/services/api/learner/learner-api";

const TYPE_ICON = {
  video: Video, pdf: FileText, zip: FileArchive, word: FileText,
  excel: FileSpreadsheet, ppt: Presentation, image: ImageIcon, link: Link2, other: File,
};
const TYPE_BADGE = {
  video: "bg-purple-100 text-purple-700", pdf: "bg-red-100 text-red-700",
  zip: "bg-amber-100 text-amber-700", word: "bg-blue-100 text-blue-700",
  excel: "bg-emerald-100 text-emerald-700", ppt: "bg-orange-100 text-orange-700",
  image: "bg-pink-100 text-pink-700", link: "bg-slate-100 text-slate-600",
  other: "bg-violet-100 text-violet-700",
};

function formatBytes(n) {
  if (n == null) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function ResourceRow({ r }) {
  const Icon = TYPE_ICON[r.type] || File;
  return (
    <Box className="flex items-center gap-3 py-3 px-3 rounded-lg hover:bg-slate-50">
      <Box className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
        <Icon className="h-4 w-4 text-violet-600" />
      </Box>
      <Box className="flex-1 min-w-0">
        <Box className="flex items-center gap-2">
          <Text as="p" className="text-sm font-medium text-slate-800 truncate">{r.title}</Text>
          <Badge className={`text-[9px] border-0 shrink-0 capitalize ${TYPE_BADGE[r.type] || TYPE_BADGE.other}`}>{r.type}</Badge>
        </Box>
        {(r.description || r.file_name || r.file_size != null) && (
          <Box className="flex items-center gap-2 mt-0.5">
            {r.description
              ? <Text as="span" className="text-[11px] text-slate-400 truncate">{r.description}</Text>
              : <>
                  {r.file_name && <Text as="span" className="text-[11px] text-slate-400 truncate">{r.file_name}</Text>}
                  {r.file_size != null && <Text as="span" className="text-[11px] text-slate-400 shrink-0">· {formatBytes(r.file_size)}</Text>}
                </>}
          </Box>
        )}
      </Box>
      {r.url && (
        <Button size="sm" variant="outline"
          render={<a href={r.url} target="_blank" rel="noopener noreferrer" />}
          className="h-8 px-3 border-slate-200 text-slate-600 hover:border-violet-300 hover:text-violet-600 rounded-lg text-xs shrink-0">
          {r.is_link ? <Link2 className="h-3.5 w-3.5 mr-1" /> : <Download className="h-3.5 w-3.5 mr-1" />}
          {r.is_link ? "Open" : "Download"}
        </Button>
      )}
    </Box>
  );
}

function Group({ label, items }) {
  if (!items.length) return null;
  return (
    <Box className="space-y-1">
      <Text as="p" className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold px-3 pt-1">{label}</Text>
      <Box className="divide-y divide-slate-100">
        {items.map((r) => <ResourceRow key={r.id} r={r} />)}
      </Box>
    </Box>
  );
}

/**
 * Read-only resources for the enrolled learner: the course's predefined
 * courseware plus this run's supplementary material. Renders nothing while
 * loading returns empty, so it never shows an empty shell if there's nothing yet.
 */
export function TrainingResources({ trainingRef }) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !trainingRef) return;
    setError(null);
    fetchMyTrainingResources({ token, trainingRef })
      .then(setData)
      .catch((e) => setError(e));
  }, [token, trainingRef]);

  // Silent on the not-enrolled edge case — the page already handles enrolment.
  if (error?.status === 403) return null;

  if (!data && !error) {
    return <Skeleton className="h-40 w-full rounded-2xl" />;
  }

  const predefined = data?.predefined || [];
  const supplementary = data?.supplementary || [];
  const total = predefined.length + supplementary.length;

  return (
    <Card className="p-0 overflow-hidden rounded-2xl border border-slate-200/80 shadow-sm">
      <Box className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
        <Box className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
          <FolderOpen className="h-4 w-4 text-violet-500" />
        </Box>
        <Text as="h3" className="text-sm font-bold text-slate-800">Resources</Text>
        <Badge className="border-0 bg-violet-50 text-violet-600 text-[11px] font-semibold">{total}</Badge>
      </Box>
      <Box className="p-4">
        {error ? (
          <Box className="flex items-center gap-1.5 text-red-600 px-2 py-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <Text as="span" className="text-xs">Couldn&apos;t load resources: {error.message}</Text>
          </Box>
        ) : total === 0 ? (
          <Box className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
            <Box className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <FolderOpen className="h-5 w-5 text-slate-400" />
            </Box>
            <Text as="p" className="text-sm font-medium text-slate-500">No resources shared yet</Text>
            <Text as="p" className="text-xs text-slate-400 mt-1">Your trainer or admin will add courseware here.</Text>
          </Box>
        ) : (
          <Box className="space-y-4">
            <Group label="Course materials" items={predefined} />
            <Group label="Session materials" items={supplementary} />
          </Box>
        )}
      </Box>
    </Card>
  );
}
