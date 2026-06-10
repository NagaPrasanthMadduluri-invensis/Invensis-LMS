"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Video, Link2, File, ExternalLink, FolderOpen } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchCourseResources } from "@/services/api/learner/learner-api";

const TYPE_CONFIG = {
  brochure: { icon: FileText, badge: "bg-blue-100 text-blue-700",   label: "Brochure" },
  pdf:      { icon: FileText, badge: "bg-red-100 text-red-700",    label: "PDF"      },
  video:    { icon: Video,    badge: "bg-purple-100 text-purple-700", label: "Video"  },
  link:     { icon: Link2,    badge: "bg-gray-100 text-gray-600",   label: "Link"     },
  document: { icon: File,     badge: "bg-orange-100 text-orange-700", label: "Document"},
};

export function LearnerCourseResources({ courseId }) {
  const { token } = useAuth();
  const [resources, setResources] = useState(null);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const data = await fetchCourseResources({ token, courseId });
      setResources(data.resources || []);
    } catch {
      setResources([]);
    }
  }, [token, courseId]);

  useEffect(() => { load(); }, [load]);

  if (!resources) {
    return (
      <Card>
        <CardHeader className="py-3 px-4">
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0 space-y-2">
          <Skeleton className="h-12 rounded-lg" />
          <Skeleton className="h-12 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (resources.length === 0) return null;

  return (
    <Card>
      <CardHeader className="py-3 px-4 flex-row items-center gap-2 space-y-0">
        <FolderOpen className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm font-semibold">Course Resources</CardTitle>
        <Badge variant="secondary" className="text-[10px] ml-auto">{resources.length}</Badge>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <Box className="divide-y">
          {resources.map((r) => {
            const cfg  = TYPE_CONFIG[r.type] || TYPE_CONFIG.document;
            const Icon = cfg.icon;
            return (
              <Box key={r.id} className="flex items-center gap-3 py-3 group">
                <Box className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </Box>
                <Box className="flex-1 min-w-0">
                  <Text as="p" className="text-sm font-medium truncate">{r.title}</Text>
                  {r.description && (
                    <Text as="span" className="text-[11px] text-muted-foreground line-clamp-1">
                      {r.description}
                    </Text>
                  )}
                </Box>
                <Badge className={`text-[9px] border-0 shrink-0 capitalize ${cfg.badge}`}>
                  {cfg.label}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1 shrink-0"
                  onClick={() => window.open(r.url, "_blank")}
                >
                  <ExternalLink className="h-3 w-3" />
                  Open
                </Button>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}
