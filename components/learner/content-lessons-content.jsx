"use client";

import { useState } from "react";
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  CheckCircle2,
  Video,
  FileText,
  ClipboardList,
  BookOpen,
  Lock,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { PremiumCard } from "@/components/ui/wave-card";

const MOCK_LESSONS = [
  { id: 1, title: "Project Initiation Fundamentals", course: "PMP Prep",  type: "Video",      duration: "24 min", status: "Completed"   },
  { id: 2, title: "Work Breakdown Structure",        course: "PMP Prep",  type: "PDF",        duration: "12 min", status: "Completed"   },
  { id: 3, title: "Scope Management",               course: "PMP Prep",  type: "Video",      duration: "31 min", status: "In Progress" },
  { id: 4, title: "Service Value System",           course: "ITIL 4",    type: "Video",      duration: "28 min", status: "Completed"   },
  { id: 5, title: "Incident Management",            course: "ITIL 4",    type: "Quiz",       duration: "15 min", status: "Completed"   },
  { id: 6, title: "Change Control",                 course: "ITIL 4",    type: "PDF",        duration: "18 min", status: "In Progress" },
  { id: 7, title: "Sprint Planning",                course: "CSM",       type: "Video",      duration: "22 min", status: "Locked"      },
  { id: 8, title: "Daily Standup Practices",        course: "CSM",       type: "Video",      duration: "19 min", status: "Locked"      },
];

const STAT_CONFIG = [
  { label: "Total Lessons",  value: 48, icon: Play,         accent: "#7C3AED" },
  { label: "Completed",      value: 31, icon: CheckCircle2, accent: "#10B981" },
  { label: "Videos",         value: 22, icon: Video,        accent: "#F59E0B" },
  { label: "Documents",      value: 14, icon: FileText,     accent: "#F43F5E" },
];

const TYPE_ICON = {
  Video:      { icon: Video,         color: "#7C3AED" },
  PDF:        { icon: FileText,      color: "#F43F5E" },
  Quiz:       { icon: ClipboardList, color: "#F59E0B" },
  Assignment: { icon: BookOpen,      color: "#10B981" },
};

const STATUS_CONFIG = {
  Completed:   { label: "Completed",   bg: "rgba(16,185,129,0.12)",  color: "#059669" },
  "In Progress":{ label: "In Progress", bg: "rgba(239,189,95,0.15)", color: "#B45309" },
  Locked:      { label: "Locked",      bg: "rgba(0,0,0,0.08)",       color: "#777777" },
};

const COURSES = ["All Courses", "PMP Prep", "ITIL 4", "CSM"];
const TYPES   = ["All Types", "Video", "PDF", "Quiz", "Assignment"];

export function ContentLessonsContent() {
  const [courseFilter, setCourseFilter] = useState("All Courses");
  const [typeFilter,   setTypeFilter]   = useState("All Types");

  const filtered = MOCK_LESSONS.filter((l) => {
    const matchCourse = courseFilter === "All Courses" || l.course === courseFilter;
    const matchType   = typeFilter   === "All Types"   || l.type   === typeFilter;
    return matchCourse && matchType;
  });

  return (
    <Box className="space-y-5">

      {/* ── Stat Cards ── */}
      <Box className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STAT_CONFIG.map(({ label, value, icon: Icon, accent }) => (
          <PremiumCard
            key={label}
            className="hover:scale-[1.02] transition-all duration-200 overflow-hidden cursor-pointer"
            style={{ borderTop: `2px solid ${accent}` }}
          >
            <CardContent className="p-4">
              <Box className="flex items-center justify-between mb-3">
                <Box
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${accent}20` }}
                >
                  <Icon style={{ width: "18px", height: "18px", color: accent }} />
                </Box>
              </Box>
              <Text as="h2" className="text-3xl font-[800] leading-none mb-1.5">
                {value}
              </Text>
              <Text as="span" className="text-xs font-[500] block leading-tight" style={{ color: "#444444" }}>
                {label}
              </Text>
            </CardContent>
          </PremiumCard>
        ))}
      </Box>

      {/* ── Filter Bar ── */}
      <Box className="flex items-center gap-3 flex-wrap">
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="h-8 rounded-lg px-2.5 text-sm outline-none cursor-pointer"
          style={{
            background: "transparent",
            border: "1px solid #D4D4D4",
            color: "#111111",
          }}
        >
          {COURSES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="h-8 rounded-lg px-2.5 text-sm outline-none cursor-pointer"
          style={{
            background: "transparent",
            border: "1px solid #D4D4D4",
            color: "#111111",
          }}
        >
          {TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <Text as="span" className="text-xs ml-auto" style={{ color: "#555555" }}>
          {filtered.length} lesson{filtered.length !== 1 ? "s" : ""}
        </Text>
      </Box>

      {/* ── Lessons List ── */}
      <PremiumCard>
        <CardHeader className="pb-0 pt-4 px-4">
          <Box className="flex items-center gap-2.5">
            <Box
              className="w-1 h-4 rounded-full shrink-0"
              style={{ background: "linear-gradient(180deg, #EFBD5F, #EC7D50)" }}
            />
            <CardTitle className="text-sm font-semibold" style={{ color: "#111111" }}>
              All Lessons
            </CardTitle>
            <Badge
              className="ml-1 text-[10px] font-semibold border-0"
              style={{ background: "rgba(0,0,0,0.08)", color: "#444444" }}
            >
              {filtered.length}
            </Badge>
          </Box>
        </CardHeader>

        <CardContent className="p-3 space-y-2 mt-2">
          {filtered.length === 0 ? (
            <Text as="p" className="text-sm py-6 text-center" style={{ color: "#555555" }}>
              No lessons match the selected filters.
            </Text>
          ) : (
            filtered.map((lesson) => {
              const typeConfig   = TYPE_ICON[lesson.type]   || TYPE_ICON.Video;
              const statusConfig = STATUS_CONFIG[lesson.status] || STATUS_CONFIG.Locked;
              const TypeIcon     = typeConfig.icon;

              return (
                <Box
                  key={lesson.id}
                  className="flex items-center gap-3 rounded-xl p-3 transition-colors cursor-pointer"
                  style={{
                    backgroundColor: "rgba(0,0,0,0.04)",
                    border: "1px solid rgba(0,0,0,0.08)",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.06)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.04)"; }}
                >
                  {/* Type icon */}
                  <Box
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${typeConfig.color}18` }}
                  >
                    {lesson.status === "Locked" ? (
                      <Lock style={{ width: "16px", height: "16px", color: "#999999" }} />
                    ) : (
                      <TypeIcon style={{ width: "16px", height: "16px", color: typeConfig.color }} />
                    )}
                  </Box>

                  {/* Title + course */}
                  <Box className="flex-1 min-w-0">
                    <Text
                      as="p"
                      className="text-sm font-semibold leading-tight truncate"
                      style={{ color: lesson.status === "Locked" ? "#999999" : "#111111" }}
                    >
                      {lesson.title}
                    </Text>
                    <Text as="span" className="text-[11px]" style={{ color: "#555555" }}>
                      {lesson.course}
                    </Text>
                  </Box>

                  {/* Duration */}
                  <Text
                    as="span"
                    className="text-[11px] shrink-0 hidden sm:block"
                    style={{ color: "#555555" }}
                  >
                    {lesson.duration}
                  </Text>

                  {/* Type badge */}
                  <Badge
                    className="text-[10px] font-semibold border-0 shrink-0 hidden md:inline-flex"
                    style={{ backgroundColor: `${typeConfig.color}18`, color: typeConfig.color }}
                  >
                    {lesson.type}
                  </Badge>

                  {/* Status badge */}
                  <Badge
                    className="text-[10px] font-semibold border-0 shrink-0"
                    style={{ backgroundColor: statusConfig.bg, color: statusConfig.color }}
                  >
                    {statusConfig.label}
                  </Badge>
                </Box>
              );
            })
          )}
        </CardContent>
      </PremiumCard>
    </Box>
  );
}
