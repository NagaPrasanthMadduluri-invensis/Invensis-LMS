"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Users, CheckCircle2 } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";

const SAMPLE_CERTS = [
  { id: 1, title: "PMP® Certification",         course: "PMP Certification Training",     issued: 312, template: "Gold",    accredited: true  },
  { id: 2, title: "CAPM® Certification",        course: "CAPM Certification Training",    issued: 198, template: "Silver",  accredited: true  },
  { id: 3, title: "Agile Scrum Master",         course: "Agile & Scrum Training",         issued: 445, template: "Blue",    accredited: false },
  { id: 4, title: "Six Sigma Green Belt",       course: "Six Sigma Green Belt",           issued: 134, template: "Green",   accredited: true  },
  { id: 5, title: "ITIL® 4 Foundation",         course: "ITIL 4 Foundation Training",     issued: 89,  template: "Purple",  accredited: true  },
  { id: 6, title: "PRINCE2® Foundation",        course: "PRINCE2 Foundation Training",    issued: 67,  template: "Silver",  accredited: true  },
  { id: 7, title: "DevOps Foundation",          course: "DevOps Foundation Training",     issued: 156, template: "Blue",    accredited: false },
  { id: 8, title: "Cyber Security Essentials",  course: "Cyber Security Training",        issued: 0,   template: "Gold",    accredited: false },
];

const TEMPLATE_COLORS = {
  Gold:   "bg-amber-100 text-amber-700",
  Silver: "bg-slate-100 text-slate-600",
  Blue:   "bg-blue-100 text-blue-700",
  Green:  "bg-emerald-100 text-emerald-700",
  Purple: "bg-violet-100 text-violet-700",
};

const ICON_COLORS = [
  "bg-amber-500", "bg-slate-500", "bg-indigo-500",
  "bg-emerald-500", "bg-violet-500", "bg-teal-500", "bg-blue-500", "bg-rose-500",
];

export function CertificatesList() {
  return (
    <Box className="space-y-4">
      <Box className="grid grid-cols-3 gap-3">
        {[
          { label: "Certificate Types", value: SAMPLE_CERTS.length,                                           bg: "bg-orange-200",     val: "text-orange-900"   },
          { label: "Total Issued",       value: SAMPLE_CERTS.reduce((s, c) => s + c.issued, 0),               bg: "bg-indigo-200",  val: "text-indigo-900"  },
          { label: "Accredited",         value: SAMPLE_CERTS.filter((c) => c.accredited).length,              bg: "bg-emerald-200", val: "text-emerald-900" },
        ].map((s) => (
          <Card key={s.label} className={`p-4 border-0 shadow-sm rounded-xl ${s.bg}`}>
            <Text as="h3" className={`text-2xl font-bold ${s.val}`}>{s.value}</Text>
            <Text as="span" className="text-xs text-slate-500">{s.label}</Text>
          </Card>
        ))}
      </Box>

      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {SAMPLE_CERTS.map((c, i) => (
          <Card key={c.id} className="border border-slate-100 shadow-sm bg-white rounded-xl overflow-hidden hover:shadow-md hover:border-slate-200 transition-all">
            <CardContent className="p-4">
              <Box className="flex items-start justify-between mb-3">
                <Box className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ICON_COLORS[i % ICON_COLORS.length]}`}>
                  <Award className="h-5 w-5 text-white" />
                </Box>
                {c.accredited && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                )}
              </Box>
              <Text as="p" className="text-sm font-semibold text-slate-800 mb-0.5 leading-snug">{c.title}</Text>
              <Text as="span" className="text-[11px] text-slate-400 block mb-3">{c.course}</Text>
              <Box className="flex items-center justify-between">
                <Box className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-slate-400" />
                  <Text as="span" className="text-xs text-slate-600 font-medium">{c.issued} issued</Text>
                </Box>
                <Badge variant="secondary" className={`text-[10px] border-0 ${TEMPLATE_COLORS[c.template] || "bg-slate-100 text-slate-600"}`}>
                  {c.template}
                </Badge>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
