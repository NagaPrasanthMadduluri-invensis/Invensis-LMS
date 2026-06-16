"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { HeadphonesIcon, Search, X } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";

const SAMPLE_TICKETS = [
  { id: "TKT-001", user: "Arjun Sharma",   subject: "Unable to access course materials",        category: "Access",    priority: "High",   status: "Open",        created: "10 Jun 2025" },
  { id: "TKT-002", user: "Priya Nair",     subject: "Certificate not generated after exam",     category: "Certificate", priority: "High",  status: "In Progress", created: "09 Jun 2025" },
  { id: "TKT-003", user: "Rohit Mehta",    subject: "Payment deducted but enrollment failed",   category: "Payment",   priority: "Urgent", status: "Open",        created: "08 Jun 2025" },
  { id: "TKT-004", user: "Sneha Kapoor",   subject: "Video not loading in lesson 3",            category: "Technical", priority: "Medium", status: "Resolved",    created: "07 Jun 2025" },
  { id: "TKT-005", user: "Vikram Joshi",   subject: "Wrong exam score displayed",               category: "Assessment", priority: "Medium", status: "In Progress", created: "06 Jun 2025" },
  { id: "TKT-006", user: "Ananya Reddy",   subject: "Request for course extension",             category: "Access",    priority: "Low",    status: "Resolved",    created: "05 Jun 2025" },
  { id: "TKT-007", user: "Suresh Babu",    subject: "Invoice not received after payment",       category: "Billing",   priority: "High",   status: "Open",        created: "04 Jun 2025" },
  { id: "TKT-008", user: "Kavita Rao",     subject: "Mentor session not scheduled",             category: "Mentoring", priority: "Medium", status: "Resolved",    created: "03 Jun 2025" },
  { id: "TKT-009", user: "Amit Kulkarni",  subject: "Corporate batch seats not reflecting",     category: "Corporate", priority: "Urgent", status: "Open",        created: "02 Jun 2025" },
  { id: "TKT-010", user: "Divya Menon",    subject: "Download link for study material broken",  category: "Technical", priority: "Low",    status: "Resolved",    created: "01 Jun 2025" },
];

const STATUS_STYLE = {
  "Open":        "bg-red-100 text-red-700",
  "In Progress": "bg-amber-100 text-amber-700",
  "Resolved":    "bg-emerald-100 text-emerald-700",
};

const PRIORITY_STYLE = {
  "Urgent": "bg-red-100 text-red-700",
  "High":   "bg-rose-100 text-rose-600",
  "Medium": "bg-amber-100 text-amber-700",
  "Low":    "bg-slate-100 text-slate-500",
};

export function TicketsTable() {
  const [search, setSearch] = useState("");

  const filtered = SAMPLE_TICKETS.filter((t) =>
    t.user.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase())
  );

  const open       = SAMPLE_TICKETS.filter((t) => t.status === "Open").length;
  const inProgress = SAMPLE_TICKETS.filter((t) => t.status === "In Progress").length;
  const resolved   = SAMPLE_TICKETS.filter((t) => t.status === "Resolved").length;

  return (
    <Box className="space-y-4">
      <Box className="grid grid-cols-4 gap-3">
        {[
          { label: "Total",       value: SAMPLE_TICKETS.length, bg: "bg-indigo-200",  val: "text-indigo-900"  },
          { label: "Open",        value: open,                  bg: "bg-red-200",     val: "text-red-900"     },
          { label: "In Progress", value: inProgress,            bg: "bg-orange-200",     val: "text-orange-900"   },
          { label: "Resolved",    value: resolved,              bg: "bg-emerald-200", val: "text-emerald-900" },
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
          placeholder="Search by user, subject or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 pr-9 h-10 text-sm bg-white border-slate-400 focus-visible:ring-indigo-400"
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
            <Box className="w-1 h-4 rounded-full bg-teal-500" />
            <CardTitle className="text-sm font-semibold text-slate-800">Support Tickets</CardTitle>
          </Box>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Box className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100">
                  <TableHead className="text-xs font-semibold text-slate-600 pl-4">Ticket ID</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">User</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Subject</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Category</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Priority</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600">Created</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-600 pr-4">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow key={t.id} className="text-xs border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <TableCell className="pl-4 font-mono font-semibold text-indigo-600">{t.id}</TableCell>
                    <TableCell className="font-medium text-slate-800">{t.user}</TableCell>
                    <TableCell className="max-w-[220px]">
                      <Text as="p" className="text-xs text-slate-600 truncate">{t.subject}</Text>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] border-0 bg-slate-100 text-slate-600">{t.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`text-[10px] border-0 ${PRIORITY_STYLE[t.priority]}`}>{t.priority}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-400">{t.created}</TableCell>
                    <TableCell className="pr-4">
                      <Badge variant="secondary" className={`text-[10px] border-0 ${STATUS_STYLE[t.status]}`}>{t.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
