"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PenTool, HelpCircle, Clock, Search } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";

const SAMPLE_ASSESSMENTS = [
  { id: 1, title: "PMP Foundation Quiz",           course: "PMP Certification",       questions: 25, duration: 30, passing: 70, attempts: 142, status: "Active"   },
  { id: 2, title: "CAPM Practice Exam",             course: "CAPM Certification",      questions: 50, duration: 60, passing: 75, attempts: 98,  status: "Active"   },
  { id: 3, title: "Agile & Scrum Assessment",       course: "Agile Scrum Master",      questions: 30, duration: 40, passing: 65, attempts: 210, status: "Active"   },
  { id: 4, title: "Six Sigma Green Belt Test",      course: "Six Sigma Green Belt",    questions: 40, duration: 50, passing: 80, attempts: 76,  status: "Active"   },
  { id: 5, title: "ITIL 4 Foundation Mock",         course: "ITIL 4 Foundation",       questions: 40, duration: 60, passing: 65, attempts: 54,  status: "Active"   },
  { id: 6, title: "Prince2 Pre-Assessment",         course: "PRINCE2 Foundation",      questions: 20, duration: 25, passing: 60, attempts: 33,  status: "Draft"    },
  { id: 7, title: "DevOps Fundamentals Quiz",       course: "DevOps Foundation",       questions: 30, duration: 35, passing: 70, attempts: 88,  status: "Active"   },
  { id: 8, title: "Cyber Security Basics",          course: "Cyber Security Essentials", questions: 35, duration: 45, passing: 75, attempts: 0, status: "Draft"    },
];

export function AssessmentsList() {
  const [search, setSearch] = useState("");

  const filtered = SAMPLE_ASSESSMENTS.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.course.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box className="space-y-4">
      <Box className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Assessments", value: SAMPLE_ASSESSMENTS.length,                                      bg: "bg-violet-200",  val: "text-violet-900"  },
          { label: "Active",            value: SAMPLE_ASSESSMENTS.filter((a) => a.status === "Active").length, bg: "bg-emerald-200", val: "text-emerald-900" },
          { label: "Total Attempts",    value: SAMPLE_ASSESSMENTS.reduce((s, a) => s + a.attempts, 0),         bg: "bg-teal-200",    val: "text-teal-900"    },
        ].map((s) => (
          <Card key={s.label} className={`p-4 border-0 shadow-sm rounded-xl ${s.bg}`}>
            <Text as="h3" className={`text-2xl font-bold ${s.val}`}>{s.value}</Text>
            <Text as="span" className="text-xs text-slate-500">{s.label}</Text>
          </Card>
        ))}
      </Box>

      <Box className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input placeholder="Search assessments…" value={search} onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 text-sm bg-white border-indigo-400 focus-visible:ring-indigo-400" />
      </Box>

      <Card className="border border-slate-100 shadow-sm bg-white rounded-xl overflow-hidden">
        <CardHeader className="py-3 px-4 flex-row items-center justify-between space-y-0 border-b border-slate-100">
          <Box className="flex items-center gap-2">
            <Box className="w-1 h-4 rounded-full bg-violet-500" />
            <CardTitle className="text-sm font-semibold text-slate-800">All Assessments</CardTitle>
          </Box>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-3">
          <Box className="space-y-2">
            {filtered.map((a) => (
              <Box key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-violet-200 hover:shadow-sm transition-all">
                <Box className="flex items-center gap-3">
                  <Box className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
                    <PenTool className="h-4 w-4 text-violet-600" />
                  </Box>
                  <Box>
                    <Text as="p" className="text-sm font-semibold text-slate-800">{a.title}</Text>
                    <Text as="span" className="text-[11px] text-slate-400">{a.course}</Text>
                  </Box>
                </Box>
                <Box className="flex items-center gap-4 shrink-0">
                  <Box className="hidden sm:flex items-center gap-1">
                    <HelpCircle className="h-3 w-3 text-slate-400" />
                    <Text as="span" className="text-xs text-slate-500">{a.questions}Q</Text>
                  </Box>
                  <Box className="hidden sm:flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <Text as="span" className="text-xs text-slate-500">{a.duration}m</Text>
                  </Box>
                  <Text as="span" className="text-xs text-slate-500 hidden md:block">Pass: {a.passing}%</Text>
                  <Text as="span" className="text-xs font-medium text-slate-700">{a.attempts} attempts</Text>
                  <Badge variant="secondary" className={`text-[10px] border-0 ${a.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-600"}`}>
                    {a.status}
                  </Badge>
                </Box>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
