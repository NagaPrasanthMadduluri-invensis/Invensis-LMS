"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Users, CheckCircle2, XCircle } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";

const SAMPLE_ADDONS = [
  { id: 1, name: "Live Virtual Classroom",   desc: "Instructor-led online sessions with real-time interaction.",          price: 4999,  subscribers: 320, category: "Learning",  active: true  },
  { id: 2, name: "1-on-1 Mentoring",         desc: "Personalised sessions with certified industry mentors.",              price: 2499,  subscribers: 148, category: "Mentoring", active: true  },
  { id: 3, name: "Practice Exam Bundle",     desc: "Access to 5 full-length mock exams per course.",                      price: 999,   subscribers: 512, category: "Practice",  active: true  },
  { id: 4, name: "Study Material Pack",      desc: "Downloadable PDFs, cheat sheets, and reference guides.",             price: 499,   subscribers: 430, category: "Material",  active: true  },
  { id: 5, name: "Job Placement Assistance", desc: "Resume review, interview prep, and job portal access.",               price: 1999,  subscribers: 89,  category: "Career",    active: true  },
  { id: 6, name: "Corporate Group Training", desc: "Custom batch training for enterprise teams (min. 10 seats).",         price: 29999, subscribers: 34,  category: "Corporate", active: true  },
  { id: 7, name: "Extended Access (1 Year)", desc: "Extend course and material access by 12 months.",                    price: 799,   subscribers: 210, category: "Access",    active: true  },
  { id: 8, name: "Project Guidance",         desc: "Expert guidance on capstone and real-world projects.",                price: 1499,  subscribers: 0,   category: "Guidance",  active: false },
];

const CAT_COLORS = {
  Learning:  "bg-indigo-100 text-indigo-700",
  Mentoring: "bg-violet-100 text-violet-700",
  Practice:  "bg-teal-100 text-teal-700",
  Material:  "bg-amber-100 text-amber-700",
  Career:    "bg-emerald-100 text-emerald-700",
  Corporate: "bg-rose-100 text-rose-700",
  Access:    "bg-blue-100 text-blue-700",
  Guidance:  "bg-slate-100 text-slate-600",
};

const ICON_BG = [
  "bg-indigo-500","bg-violet-500","bg-teal-500","bg-amber-500",
  "bg-emerald-500","bg-rose-500","bg-blue-500","bg-slate-400",
];

export function AddonsList() {
  const totalRevenue = SAMPLE_ADDONS.reduce((s, a) => s + a.price * a.subscribers, 0);

  return (
    <Box className="space-y-4">
      <Box className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Add-ons",   value: SAMPLE_ADDONS.length,                                          bg: "bg-indigo-200",  val: "text-indigo-900"  },
          { label: "Total Purchases", value: SAMPLE_ADDONS.reduce((s, a) => s + a.subscribers, 0),          bg: "bg-emerald-200", val: "text-emerald-900" },
          { label: "Est. Revenue",    value: `₹${(totalRevenue / 100000).toFixed(1)}L`,                     bg: "bg-orange-200",     val: "text-orange-900"   },
        ].map((s) => (
          <Card key={s.label} className={`p-4 border-0 shadow-sm rounded-xl ${s.bg}`}>
            <Text as="h3" className={`text-2xl font-bold ${s.val}`}>{s.value}</Text>
            <Text as="span" className="text-xs text-slate-500">{s.label}</Text>
          </Card>
        ))}
      </Box>

      <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {SAMPLE_ADDONS.map((a, i) => (
          <Card key={a.id} className="border border-slate-100 shadow-sm bg-white rounded-xl overflow-hidden hover:shadow-md transition-all">
            <CardContent className="p-4">
              <Box className="flex items-start justify-between mb-3">
                <Box className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${ICON_BG[i % ICON_BG.length]}`}>
                  <Package className="h-5 w-5 text-white" />
                </Box>
                {a.active
                  ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  : <XCircle className="h-4 w-4 text-slate-300 shrink-0 mt-0.5" />
                }
              </Box>
              <Text as="p" className="text-sm font-semibold text-slate-800 mb-1 leading-snug">{a.name}</Text>
              <Text as="span" className="text-[11px] text-slate-400 block mb-3 leading-relaxed">{a.desc}</Text>
              <Box className="flex items-center justify-between">
                <Text as="span" className="text-sm font-bold text-slate-800">₹{a.price.toLocaleString("en-IN")}</Text>
                <Badge variant="secondary" className={`text-[10px] border-0 ${CAT_COLORS[a.category] || "bg-slate-100 text-slate-600"}`}>
                  {a.category}
                </Badge>
              </Box>
              <Box className="flex items-center gap-1 mt-2">
                <Users className="h-3 w-3 text-slate-400" />
                <Text as="span" className="text-xs text-slate-500">{a.subscribers} purchased</Text>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
}
