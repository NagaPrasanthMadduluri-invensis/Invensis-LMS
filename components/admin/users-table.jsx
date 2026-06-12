"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";

const SAMPLE_USERS = [
  { id: 1, name: "Arjun Sharma",    email: "arjun.sharma@email.com",   role: "Learner",   status: "Active",   joined: "12 Jan 2025", courses: 3 },
  { id: 2, name: "Priya Nair",      email: "priya.nair@corp.com",       role: "Learner",   status: "Active",   joined: "18 Jan 2025", courses: 5 },
  { id: 3, name: "Rohit Mehta",     email: "rohit.mehta@gmail.com",     role: "Learner",   status: "Inactive", joined: "02 Feb 2025", courses: 1 },
  { id: 4, name: "Sneha Kapoor",    email: "sneha.kapoor@tech.in",      role: "Learner",   status: "Active",   joined: "14 Feb 2025", courses: 4 },
  { id: 5, name: "Vikram Joshi",    email: "vikram.joshi@infosys.com",  role: "Learner",   status: "Active",   joined: "20 Feb 2025", courses: 2 },
  { id: 6, name: "Ananya Reddy",    email: "ananya.reddy@hcl.com",      role: "Learner",   status: "Active",   joined: "05 Mar 2025", courses: 6 },
  { id: 7, name: "Suresh Babu",     email: "suresh.babu@wipro.com",     role: "Learner",   status: "Inactive", joined: "11 Mar 2025", courses: 0 },
  { id: 8, name: "Kavita Rao",      email: "kavita.rao@tcs.com",        role: "Learner",   status: "Active",   joined: "22 Mar 2025", courses: 3 },
  { id: 9, name: "Amit Kulkarni",   email: "amit.k@accenture.com",      role: "Learner",   status: "Active",   joined: "01 Apr 2025", courses: 2 },
  { id: 10, name: "Divya Menon",    email: "divya.menon@ibm.com",       role: "Learner",   status: "Active",   joined: "08 Apr 2025", courses: 4 },
  { id: 11, name: "Kiran Patel",    email: "kiran.patel@cognizant.com", role: "Learner",   status: "Active",   joined: "15 Apr 2025", courses: 1 },
  { id: 12, name: "Meera Singh",    email: "meera.singh@deloitte.com",  role: "Learner",   status: "Inactive", joined: "22 Apr 2025", courses: 2 },
];

function getInitials(name) {
  return name.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-teal-100 text-teal-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
];

export function UsersTable() {
  const [search, setSearch] = useState("");

  const filtered = SAMPLE_USERS.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  const activeCount   = SAMPLE_USERS.filter((u) => u.status === "Active").length;
  const inactiveCount = SAMPLE_USERS.length - activeCount;

  return (
    <Box className="space-y-4">
      {/* Stats */}
      <Box className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Users", value: SAMPLE_USERS.length, bg: "bg-indigo-200",  val: "text-indigo-900"  },
          { label: "Active",      value: activeCount,          bg: "bg-emerald-200", val: "text-emerald-900" },
          { label: "Inactive",    value: inactiveCount,        bg: "bg-slate-200",   val: "text-slate-800"   },
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
          placeholder="Search by name, email or role..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-10 text-sm bg-white border-slate-400 focus-visible:ring-indigo-400"
        />
      </Box>

      {/* Table */}
      <Card className="border border-slate-100 shadow-sm bg-white rounded-xl overflow-hidden">
        <CardHeader className="py-3 px-4 flex-row items-center justify-between space-y-0 border-b border-slate-100">
          <Box className="flex items-center gap-2">
            <Box className="w-1 h-4 rounded-full bg-indigo-500" />
            <CardTitle className="text-sm font-semibold text-slate-800">
              All Users
              <Badge variant="secondary" className="ml-2 text-[10px] bg-indigo-100 text-indigo-700 border-0">
                {SAMPLE_USERS.length} total
              </Badge>
            </CardTitle>
          </Box>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          {filtered.length === 0 ? (
            <Box className="py-12 text-center">
              <Users className="h-8 w-8 mx-auto text-slate-300 mb-2" />
              <Text as="p" className="text-sm text-slate-500">No users match your search</Text>
            </Box>
          ) : (
            <Box className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50 border-b border-slate-100">
                    <TableHead className="text-xs font-semibold text-slate-600 pl-4">User</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Email</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Role</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 text-center">Courses</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600">Joined</TableHead>
                    <TableHead className="text-xs font-semibold text-slate-600 pr-4">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((u, i) => (
                    <TableRow key={u.id} className="text-xs border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <TableCell className="pl-4">
                        <Box className="flex items-center gap-2.5">
                          <Box className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${AVATAR_COLORS[i % AVATAR_COLORS.length]}`}>
                            {getInitials(u.name)}
                          </Box>
                          <Text as="span" className="font-medium text-slate-800">{u.name}</Text>
                        </Box>
                      </TableCell>
                      <TableCell className="text-slate-500">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-[10px] border-0 bg-slate-100 text-slate-600">{u.role}</Badge>
                      </TableCell>
                      <TableCell className="text-center text-slate-700 font-medium">{u.courses}</TableCell>
                      <TableCell className="text-slate-400">{u.joined}</TableCell>
                      <TableCell className="pr-4">
                        <Badge variant="secondary" className={`text-[10px] border-0 ${u.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {u.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
