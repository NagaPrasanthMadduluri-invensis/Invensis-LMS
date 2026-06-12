"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ShieldCheck } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";

const ROLES = [
  {
    id: 1, role: "Super Admin", color: "bg-rose-100 text-rose-700", bg: "bg-rose-200", val: "text-rose-900", users: 2,
    perms: { dashboard: true, users: true, courses: true, orders: true, certificates: true, settings: true, reports: true },
  },
  {
    id: 2, role: "Admin", color: "bg-indigo-100 text-indigo-700", bg: "bg-indigo-200", val: "text-indigo-900", users: 5,
    perms: { dashboard: true, users: true, courses: true, orders: true, certificates: true, settings: false, reports: true },
  },
  {
    id: 3, role: "Content Manager", color: "bg-violet-100 text-violet-700", bg: "bg-violet-200", val: "text-violet-900", users: 8,
    perms: { dashboard: true, users: false, courses: true, orders: false, certificates: true, settings: false, reports: false },
  },
  {
    id: 4, role: "Support Agent", color: "bg-teal-100 text-teal-700", bg: "bg-teal-200", val: "text-teal-900", users: 12,
    perms: { dashboard: true, users: true, courses: false, orders: true, certificates: false, settings: false, reports: false },
  },
  {
    id: 5, role: "Billing Manager", color: "bg-emerald-100 text-emerald-700", bg: "bg-emerald-200", val: "text-emerald-900", users: 3,
    perms: { dashboard: true, users: false, courses: false, orders: true, certificates: false, settings: false, reports: true },
  },
];

const PERM_KEYS = ["dashboard", "users", "courses", "orders", "certificates", "settings", "reports"];

export function AccessControlList() {
  return (
    <Box className="space-y-4">
      <Box className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {ROLES.map((r) => (
          <Card key={r.id} className={`p-4 border-0 shadow-sm rounded-xl ${r.bg}`}>
            <Box className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${r.color}`}>
              <ShieldCheck className="h-4 w-4" />
            </Box>
            <Text as="p" className={`text-sm font-semibold leading-tight ${r.val}`}>{r.role}</Text>
            <Text as="span" className="text-xs text-slate-500">{r.users} member{r.users !== 1 ? "s" : ""}</Text>
          </Card>
        ))}
      </Box>

      <Card className="border border-slate-100 shadow-sm bg-white rounded-xl overflow-hidden">
        <CardHeader className="py-3 px-4 border-b border-slate-100">
          <Box className="flex items-center gap-2">
            <Box className="w-1 h-4 rounded-full bg-indigo-500" />
            <CardTitle className="text-sm font-semibold text-slate-800">Role Permissions Matrix</CardTitle>
          </Box>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Box className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left pl-4 py-2.5 text-slate-600 font-semibold w-40">Role</th>
                  {PERM_KEYS.map((k) => (
                    <th key={k} className="text-center py-2.5 px-3 text-slate-600 font-semibold capitalize">{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROLES.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="pl-4 py-3">
                      <Box className="flex items-center gap-2">
                        <Badge variant="secondary" className={`text-[10px] border-0 ${r.color}`}>{r.role}</Badge>
                      </Box>
                    </td>
                    {PERM_KEYS.map((k) => (
                      <td key={k} className="text-center py-3 px-3">
                        {r.perms[k]
                          ? <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                          : <XCircle className="h-4 w-4 text-slate-200 mx-auto" />
                        }
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
