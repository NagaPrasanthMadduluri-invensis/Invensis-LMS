"use client";

import { useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, BookOpen, Video, FileText, Trash2, ExternalLink } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { PremiumCard } from "@/components/ui/wave-card";

const STATS = [
  {
    label: "Total Bookmarks",
    value: 6,
    icon: Bookmark,
    accent: "#EFBD5F",
    sub: "saved items",
  },
  {
    label: "Courses",
    value: 3,
    icon: BookOpen,
    accent: "#7C3AED",
    sub: "unique courses",
  },
];

const INITIAL_BOOKMARKS = [
  {
    id: 1,
    lesson: "Project Initiation Fundamentals",
    course: "PMP Certification Prep",
    date: "12 Jan 2024",
    type: "Video",
  },
  {
    id: 2,
    lesson: "Work Breakdown Structure",
    course: "PMP Certification Prep",
    date: "14 Jan 2024",
    type: "PDF",
  },
  {
    id: 3,
    lesson: "Sprint Planning Deep Dive",
    course: "Certified ScrumMaster",
    date: "08 Mar 2024",
    type: "Video",
  },
  {
    id: 4,
    lesson: "Service Value System Overview",
    course: "ITIL 4 Foundation",
    date: "22 Feb 2024",
    type: "Video",
  },
  {
    id: 5,
    lesson: "DMAIC Methodology",
    course: "Six Sigma Green Belt",
    date: "18 Nov 2023",
    type: "PDF",
  },
  {
    id: 6,
    lesson: "Agile Retrospectives",
    course: "Certified ScrumMaster",
    date: "10 Mar 2024",
    type: "Video",
  },
];

function LessonTypeIcon({ type }) {
  const Icon = type === "PDF" ? FileText : Video;
  const color = type === "PDF" ? "#EC7D50" : "#7C3AED";
  const bg = type === "PDF" ? "rgba(236,125,80,0.12)" : "rgba(124,58,237,0.1)";
  return (
    <Box
      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
      style={{ backgroundColor: bg }}
    >
      <Icon style={{ width: "18px", height: "18px", color }} />
    </Box>
  );
}

function RemoveButton({ onRemove }) {
  const [hovered, setHovered] = useState(false);
  return (
    <Button
      size="sm"
      variant="ghost"
      className="h-8 w-8 p-0 rounded-lg"
      style={{ color: hovered ? "#EF4444" : "#999999", transition: "color 0.15s" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onRemove}
      aria-label="Remove bookmark"
    >
      <Trash2 style={{ width: "15px", height: "15px" }} />
    </Button>
  );
}

export function BookmarksContent() {
  const [bookmarks, setBookmarks] = useState(INITIAL_BOOKMARKS);

  function handleRemove(id) {
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  }

  return (
    <Box className="space-y-5">
      {/* ── Stat Cards ── */}
      <Box className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {STATS.map((s) => (
          <PremiumCard
            key={s.label}
            className="overflow-hidden"
            style={{ borderTop: `2px solid ${s.accent}` }}
          >
            <CardContent className="p-5">
              <Box className="flex items-center justify-between mb-3">
                <Box
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: `${s.accent}18` }}
                >
                  <s.icon style={{ width: "20px", height: "20px", color: s.accent }} />
                </Box>
                <Text
                  as="span"
                  className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                  style={{ color: s.accent, backgroundColor: `${s.accent}15` }}
                >
                  {s.sub}
                </Text>
              </Box>
              <Text as="h2" className="text-3xl font-[800] leading-none mb-1">
                {bookmarks.length > 0 && s.label === "Total Bookmarks" ? bookmarks.length : s.value}
              </Text>
              <Text as="span" className="text-xs font-[500]" style={{ color: "#444444" }}>
                {s.label}
              </Text>
            </CardContent>
          </PremiumCard>
        ))}
      </Box>

      {/* ── Saved Lessons ── */}
      <PremiumCard className="overflow-hidden">
        <CardHeader className="py-4 px-5" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
          <Box className="flex items-center gap-2.5">
            <Box
              className="w-1 h-4 rounded-full"
              style={{ background: "linear-gradient(180deg, #EFBD5F, #EC7D50)" }}
            />
            <CardTitle className="text-sm font-semibold">Saved Lessons</CardTitle>
          </Box>
        </CardHeader>
        <CardContent className="p-3 space-y-2">
          {bookmarks.length === 0 ? (
            <Box className="py-10 text-center">
              <Bookmark className="mx-auto mb-3 opacity-30" style={{ width: "32px", height: "32px" }} />
              <Text as="p" className="text-sm" style={{ color: "#444444" }}>
                No bookmarks yet. Bookmark lessons while studying to find them here.
              </Text>
            </Box>
          ) : (
            bookmarks.map((b) => (
              <Box
                key={b.id}
                className="flex items-center gap-3 rounded-xl px-4 py-3 transition-colors"
                style={{ backgroundColor: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)" }}
                onMouseEnter={(ev) => (ev.currentTarget.style.backgroundColor = "rgba(0,0,0,0.06)")}
                onMouseLeave={(ev) => (ev.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)")}
              >
                <LessonTypeIcon type={b.type} />

                <Box className="flex-1 min-w-0">
                  <Text as="p" className="text-sm font-semibold leading-tight truncate" style={{ color: "#111111" }}>
                    {b.lesson}
                  </Text>
                  <Text as="span" className="text-[11px] truncate block mt-0.5" style={{ color: "#555555" }}>
                    {b.course}
                  </Text>
                  <Text as="span" className="text-[10px] mt-0.5 block" style={{ color: "#777777" }}>
                    Bookmarked: {b.date}
                  </Text>
                </Box>

                <Box className="flex items-center gap-2 shrink-0">
                  <Button
                    size="sm"
                    className="h-7 px-3 text-xs font-semibold border-0 text-[#1a0a00] flex items-center gap-1"
                    style={{ background: "linear-gradient(135deg, #EFBD5F, #EC7D50)" }}
                  >
                    <ExternalLink style={{ width: "12px", height: "12px" }} />
                    Go to Lesson
                  </Button>
                  <RemoveButton onRemove={() => handleRemove(b.id)} />
                </Box>
              </Box>
            ))
          )}
        </CardContent>
      </PremiumCard>
    </Box>
  );
}
