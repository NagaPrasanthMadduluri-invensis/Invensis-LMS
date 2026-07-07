"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Search, Users, X, BookOpen, UserCheck, UserX, Mail, Calendar,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";

const SAMPLE_USERS = [
  { id: 1,  name: "Arjun Sharma",   email: "arjun.sharma@email.com",   role: "Learner", status: "Active",   joined: "12 Jan 2025", courses: 3 },
  { id: 2,  name: "Priya Nair",     email: "priya.nair@corp.com",       role: "Learner", status: "Active",   joined: "18 Jan 2025", courses: 5 },
  { id: 3,  name: "Rohit Mehta",    email: "rohit.mehta@gmail.com",     role: "Learner", status: "Inactive", joined: "02 Feb 2025", courses: 1 },
  { id: 4,  name: "Sneha Kapoor",   email: "sneha.kapoor@tech.in",      role: "Learner", status: "Active",   joined: "14 Feb 2025", courses: 4 },
  { id: 5,  name: "Vikram Joshi",   email: "vikram.joshi@infosys.com",  role: "Learner", status: "Active",   joined: "20 Feb 2025", courses: 2 },
  { id: 6,  name: "Ananya Reddy",   email: "ananya.reddy@hcl.com",      role: "Learner", status: "Active",   joined: "05 Mar 2025", courses: 6 },
  { id: 7,  name: "Suresh Babu",    email: "suresh.babu@wipro.com",     role: "Learner", status: "Inactive", joined: "11 Mar 2025", courses: 0 },
  { id: 8,  name: "Kavita Rao",     email: "kavita.rao@tcs.com",        role: "Learner", status: "Active",   joined: "22 Mar 2025", courses: 3 },
  { id: 9,  name: "Amit Kulkarni",  email: "amit.k@accenture.com",      role: "Learner", status: "Active",   joined: "01 Apr 2025", courses: 2 },
  { id: 10, name: "Divya Menon",    email: "divya.menon@ibm.com",       role: "Learner", status: "Active",   joined: "08 Apr 2025", courses: 4 },
  { id: 11, name: "Kiran Patel",    email: "kiran.patel@cognizant.com", role: "Learner", status: "Active",   joined: "15 Apr 2025", courses: 1 },
  { id: 12, name: "Meera Singh",    email: "meera.singh@deloitte.com",  role: "Learner", status: "Inactive", joined: "22 Apr 2025", courses: 2 },
];

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-violet-100 text-violet-700",
  "bg-teal-100 text-teal-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-cyan-100 text-cyan-700",
  "bg-pink-100 text-pink-700",
];

function getInitials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function avatarColor(id) {
  return AVATAR_COLORS[(id - 1) % AVATAR_COLORS.length];
}

function StatCard({ label, value, icon: Icon, bg, border, iconBg, iconCls, valueCls, labelCls }) {
  return (
    <Card className={`rounded-2xl ${border} shadow-sm ${bg} p-5`}>
      <Box className="flex items-start justify-between mb-3">
        <Box className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${iconCls}`} />
        </Box>
        <Text as="p" className={`text-3xl font-bold ${valueCls} leading-none`}>{value}</Text>
      </Box>
      <Text as="p" className={`text-xs ${labelCls} font-medium`}>{label}</Text>
    </Card>
  );
}

export function UsersTable() {
  const [search, setSearch] = useState("");

  const filtered = SAMPLE_USERS.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount   = SAMPLE_USERS.filter((u) => u.status === "Active").length;
  const inactiveCount = SAMPLE_USERS.length - activeCount;
  const totalCourses  = SAMPLE_USERS.reduce((s, u) => s + u.courses, 0);

  return (
    <Box className="space-y-5">

      {/* Stat cards */}
      <Box className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Users"    value={SAMPLE_USERS.length} icon={Users}     bg="bg-indigo-50"  border="border border-indigo-100"  iconBg="bg-indigo-100"  iconCls="text-indigo-600"  valueCls="text-indigo-900"  labelCls="text-indigo-500" />
        <StatCard label="Active"         value={activeCount}          icon={UserCheck} bg="bg-emerald-50" border="border border-emerald-100" iconBg="bg-emerald-100" iconCls="text-emerald-600" valueCls="text-emerald-900" labelCls="text-emerald-600" />
        <StatCard label="Inactive"       value={inactiveCount}        icon={UserX}     bg="bg-slate-50"   border="border border-slate-200"   iconBg="bg-slate-100"   iconCls="text-slate-500"   valueCls="text-slate-700"   labelCls="text-slate-500" />
        <StatCard label="Total Enrolments" value={totalCourses}       icon={BookOpen}  bg="bg-violet-50"  border="border border-violet-100"  iconBg="bg-violet-100"  iconCls="text-violet-600"  valueCls="text-violet-900"  labelCls="text-violet-500" />
      </Box>

      {/* Search + filter toolbar */}
      <Box className="flex items-center gap-3 flex-wrap">
        <Box className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by name, email or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            className="pl-10 pr-9 h-11 text-sm bg-slate-100/60 border-slate-300/70 rounded-xl focus-visible:ring-indigo-400/50"
          />
          {search && (
            <button onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="h-4 w-4" />
            </button>
          )}
        </Box>
        {search && (
          <Text as="span" className="text-xs text-slate-400 shrink-0">
            {filtered.length} of {SAMPLE_USERS.length} users
          </Text>
        )}
      </Box>

      {/* Table card */}
      <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">

        {/* Card header */}
        <Box className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <Box className="flex items-center gap-2.5">
            <Box className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
              <Users className="h-4 w-4 text-indigo-500" />
            </Box>
            <Text as="h3" className="text-sm font-bold text-slate-800">All Users</Text>
            <Badge className="border-0 bg-indigo-50 text-indigo-600 text-[11px] font-semibold ml-0.5">
              {SAMPLE_USERS.length} total
            </Badge>
          </Box>
        </Box>

        {filtered.length === 0 ? (
          <Box className="py-20 text-center">
            <Box className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
              <Users className="h-6 w-6 text-slate-400" />
            </Box>
            <Text as="p" className="text-sm font-medium text-slate-500">No users match your search</Text>
            <Text as="p" className="text-xs text-slate-400 mt-1">Try a different name or email</Text>
            <Button variant="ghost" size="sm" onClick={() => setSearch("")}
              className="mt-3 text-indigo-600 hover:text-indigo-700 text-xs">
              Clear search
            </Button>
          </Box>
        ) : (
          <Box className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100">
                  <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3 pl-5">User</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3">Email</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3">Role</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3 text-center">Courses</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3">Joined</TableHead>
                  <TableHead className="text-[11px] font-bold text-slate-400 uppercase tracking-wider py-3 pr-5">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id} className="hover:bg-slate-50/70 border-b border-slate-100 last:border-0 transition-colors">

                    {/* User */}
                    <TableCell className="py-4 pl-5">
                      <Box className="flex items-center gap-3">
                        <Box className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${avatarColor(u.id)}`}>
                          {getInitials(u.name)}
                        </Box>
                        <Text as="p" className="text-sm font-semibold text-slate-700 leading-tight">{u.name}</Text>
                      </Box>
                    </TableCell>

                    {/* Email */}
                    <TableCell className="py-4">
                      <Box className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <Text as="span" className="text-sm text-slate-600">{u.email}</Text>
                      </Box>
                    </TableCell>

                    {/* Role */}
                    <TableCell className="py-4">
                      <Badge className="border-0 bg-indigo-50 text-indigo-700 text-xs font-semibold ring-1 ring-indigo-200 px-2.5 py-0.5">
                        {u.role}
                      </Badge>
                    </TableCell>

                    {/* Courses */}
                    <TableCell className="py-4 text-center">
                      <Box className="inline-flex items-center gap-1.5 bg-violet-50 text-violet-700 text-sm font-bold px-2.5 py-1 rounded-lg ring-1 ring-violet-200">
                        <BookOpen className="h-3.5 w-3.5" />
                        {u.courses}
                      </Box>
                    </TableCell>

                    {/* Joined */}
                    <TableCell className="py-4">
                      <Box className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <Text as="span" className="text-sm text-slate-600">{u.joined}</Text>
                      </Box>
                    </TableCell>

                    {/* Status */}
                    <TableCell className="py-4 pr-5">
                      <Badge className={`border-0 text-xs font-semibold px-2.5 py-0.5 ${
                        u.status === "Active"
                          ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                          : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                      }`}>
                        {u.status === "Active" ? "● Active" : "● Inactive"}
                      </Badge>
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Card>
    </Box>
  );
}
