"use client";

import { useEffect, useState, useCallback } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Video, Link2, File, ExternalLink, FolderOpen } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchCourseResources } from "@/services/api/learner/learner-api";
import { PremiumCard } from "@/components/ui/wave-card";

const TYPE_CONFIG = {
  brochure: { icon: FileText, badgeStyle: { backgroundColor: "rgba(124,58,237,0.08)", color: "#A78BFA" }, label: "Brochure" },
  pdf:      { icon: FileText, badgeStyle: { backgroundColor: "rgba(244,63,94,0.08)",  color: "#F87171"  }, label: "PDF"      },
  video:    { icon: Video,    badgeStyle: { backgroundColor: "rgba(124,58,237,0.08)", color: "#A78BFA"  }, label: "Video"    },
  link:     { icon: Link2,    badgeStyle: { backgroundColor: "#c8c8c8",               color: "#555555"  }, label: "Link"     },
  document: { icon: File,     badgeStyle: { backgroundColor: "rgba(245,158,11,0.1)",  color: "#F59E0B"  }, label: "Document" },
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
      <PremiumCard className="border">
        <CardHeader className="py-3 px-4">
          <Skeleton className="h-4 w-32" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0 space-y-2">
          <Skeleton className="h-12 rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
          <Skeleton className="h-12 rounded-lg" style={{ backgroundColor: "rgba(0,0,0,0.06)" }} />
        </CardContent>
      </PremiumCard>
    );
  }

  if (resources.length === 0) return null;

  return (
    <PremiumCard className="border overflow-hidden">
      <CardHeader className="py-3 px-4 flex-row items-center gap-2 space-y-0" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
        <Box className="w-1 h-4 rounded-full mr-0.5" style={{ background: "linear-gradient(180deg, #EFBD5F, #EC7D50)" }} />
        <FolderOpen className="h-4 w-4" style={{ color: "#666666" }} />
        <CardTitle className="text-sm font-semibold">Course Resources</CardTitle>
        <Badge className="text-[10px] ml-auto border-0" style={{ backgroundColor: "rgba(239,189,95,0.1)", color: "#EFBD5F" }}>
          {resources.length}
        </Badge>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <Box className="space-y-1 pt-1">
          {resources.map((r) => {
            const cfg  = TYPE_CONFIG[r.type] || TYPE_CONFIG.document;
            const Icon = cfg.icon;
            return (
              <Box
                key={r.id}
                className="flex items-center gap-3 py-3 px-2 rounded-lg transition-colors"
                style={{ backgroundColor: "transparent" }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.06)"}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <Box className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: "rgba(0,0,0,0.06)" }}>
                  <Icon className="h-4 w-4" style={{ color: "#666666" }} />
                </Box>
                <Box className="flex-1 min-w-0">
                  <Text as="p" className="text-sm font-medium truncate">{r.title}</Text>
                  {r.description && (
                    <Text as="span" className="text-[11px] line-clamp-1" style={{ color: "#444444" }}>
                      {r.description}
                    </Text>
                  )}
                </Box>
                <Badge className="text-[9px] border-0 shrink-0 capitalize font-semibold" style={cfg.badgeStyle}>
                  {cfg.label}
                </Badge>
                <Button
                  size="sm"
                  className="h-7 text-xs gap-1 shrink-0 font-medium"
                  style={{ backgroundColor: "transparent", border: "1px solid rgba(0,0,0,0.1)", color: "#555555" }}
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
    </PremiumCard>
  );
}
