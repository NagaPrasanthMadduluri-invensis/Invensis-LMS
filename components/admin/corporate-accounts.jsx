"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building2, Users, BookOpen, Search, X } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";

const SAMPLE_ACCOUNTS = [
  { id: 1, company: "Infosys Ltd.",        contact: "Rajesh Kumar",    email: "rajesh.kumar@infosys.com",    seats: 50, used: 38, courses: 4, status: "Active",   since: "Mar 2024" },
  { id: 2, company: "Wipro Technologies",  contact: "Anita Desai",     email: "anita.desai@wipro.com",       seats: 30, used: 22, courses: 3, status: "Active",   since: "Jun 2024" },
  { id: 3, company: "TCS",                 contact: "Sunil Verma",     email: "sunil.v@tcs.com",             seats: 80, used: 75, courses: 6, status: "Active",   since: "Jan 2024" },
  { id: 4, company: "HCL Technologies",    contact: "Meena Pillai",    email: "m.pillai@hcl.com",            seats: 20, used: 8,  courses: 2, status: "Inactive", since: "Sep 2024" },
  { id: 5, company: "Accenture India",     contact: "Ravi Shankar",    email: "ravi.s@accenture.com",        seats: 100, used: 91, courses: 7, status: "Active",  since: "Nov 2023" },
  { id: 6, company: "Cognizant",           contact: "Divya Thomas",    email: "d.thomas@cognizant.com",      seats: 40, used: 29, courses: 3, status: "Active",   since: "Apr 2024" },
];

const COMPANY_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
];

export function CorporateAccounts() {
  const [search, setSearch] = useState("");

  const filtered = SAMPLE_ACCOUNTS.filter((a) =>
    a.company.toLowerCase().includes(search.toLowerCase()) ||
    a.contact.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box className="space-y-4">
      {/* Stats */}
      <Box className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Accounts", value: SAMPLE_ACCOUNTS.length,                                      bg: "bg-violet-200",  val: "text-violet-900"  },
          { label: "Active",         value: SAMPLE_ACCOUNTS.filter((a) => a.status === "Active").length, bg: "bg-emerald-200", val: "text-emerald-900" },
          { label: "Total Seats",    value: SAMPLE_ACCOUNTS.reduce((s, a) => s + a.seats, 0),            bg: "bg-violet-200",  val: "text-violet-900"  },
        ].map((s) => (
          <Card key={s.label} className={`p-4 border-0 shadow-sm rounded-xl ${s.bg}`}>
            <Text as="h3" className={`text-2xl font-bold ${s.val}`}>{s.value}</Text>
            <Text as="span" className="text-xs text-slate-500">{s.label}</Text>
          </Card>
        ))}
      </Box>

      {/* Search */}
      <Box className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
        <Input
          placeholder="Search by company or contact name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-9 h-10 text-sm bg-white border-slate-400 focus-visible:ring-violet-400"
        />
        {search && (
          <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </Box>

      <Card className="border border-slate-100 shadow-sm bg-white rounded-xl overflow-hidden">
        <CardHeader className="py-3 px-4 flex-row items-center justify-between space-y-0 border-b border-slate-100">
          <Box className="flex items-center gap-2">
            <Box className="w-1 h-4 rounded-full bg-violet-500" />
            <CardTitle className="text-sm font-semibold text-slate-800">Corporate Clients</CardTitle>
          </Box>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          <Box className="space-y-3 pt-3">
            {filtered.map((a, i) => {
              const pct = Math.round((a.used / a.seats) * 100);
              return (
                <Box key={a.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-violet-200 hover:shadow-sm transition-all">
                  <Box className="flex items-center gap-3">
                    <Box className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 ${COMPANY_COLORS[i % COMPANY_COLORS.length]}`}>
                      {a.company[0]}
                    </Box>
                    <Box>
                      <Text as="p" className="text-sm font-semibold text-slate-800">{a.company}</Text>
                      <Text as="span" className="text-[11px] text-slate-400">{a.contact} · {a.email}</Text>
                    </Box>
                  </Box>
                  <Box className="flex items-center gap-4 text-right">
                    <Box className="hidden sm:block">
                      <Box className="flex items-center gap-1 justify-end mb-1">
                        <Users className="h-3 w-3 text-slate-400" />
                        <Text as="span" className="text-xs text-slate-600 font-medium">{a.used}/{a.seats}</Text>
                      </Box>
                      <Box className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <Box className={`h-full rounded-full ${pct > 80 ? "bg-rose-500" : "bg-violet-400"}`} style={{ width: `${pct}%` }} />
                      </Box>
                    </Box>
                    <Box className="hidden md:flex items-center gap-1">
                      <BookOpen className="h-3 w-3 text-slate-400" />
                      <Text as="span" className="text-xs text-slate-500">{a.courses} courses</Text>
                    </Box>
                    <Text as="span" className="text-[11px] text-slate-400">{a.since}</Text>
                    <Badge variant="secondary" className={`text-[10px] border-0 ${a.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {a.status}
                    </Badge>
                  </Box>
                </Box>
              );
            })}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
