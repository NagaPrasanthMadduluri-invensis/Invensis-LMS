"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Building2, Bell, Shield, Globe } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";

const SECTIONS = [
  { key: "general",       label: "General",       icon: Building2, color: "bg-violet-500"  },
  { key: "notifications", label: "Notifications", icon: Bell,      color: "bg-amber-500"   },
  { key: "security",      label: "Security",      icon: Shield,    color: "bg-rose-500"    },
  { key: "platform",      label: "Platform",      icon: Globe,     color: "bg-teal-500"    },
];

export function AdminSettings() {
  const [active, setActive] = useState("general");
  const [saved,  setSaved]  = useState(false);

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Box className="flex gap-5 flex-col lg:flex-row">
      {/* Sidebar nav */}
      <Box className="lg:w-44 shrink-0">
        <Card className="border border-slate-100 shadow-sm bg-white rounded-xl overflow-hidden p-1">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setActive(s.key)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left transition-colors text-sm ${
                active === s.key
                  ? "bg-violet-50 text-violet-700 font-semibold"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Box className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${active === s.key ? s.color : "bg-slate-100"}`}>
                <s.icon className={`h-3.5 w-3.5 ${active === s.key ? "text-white" : "text-slate-400"}`} />
              </Box>
              {s.label}
            </button>
          ))}
        </Card>
      </Box>

      {/* Content */}
      <Box className="flex-1">
        {active === "general" && (
          <Card className="border border-slate-100 shadow-sm bg-white rounded-xl overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-slate-100">
              <Box className="flex items-center gap-2">
                <Box className="w-1 h-4 rounded-full bg-violet-500" />
                <CardTitle className="text-sm font-semibold text-slate-800">General Settings</CardTitle>
              </Box>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {[
                { id: "org",     label: "Organisation Name", value: "Invensis Learning Pvt. Ltd." },
                { id: "email",   label: "Support Email",     value: "support@invensislearning.com" },
                { id: "phone",   label: "Support Phone",     value: "+91 80 4110 4800"             },
                { id: "website", label: "Website URL",       value: "https://www.invensislearning.com" },
                { id: "timezone",label: "Timezone",          value: "Asia/Kolkata (IST)"            },
              ].map((f) => (
                <Box key={f.id} className="space-y-1.5">
                  <Label htmlFor={f.id} className="text-xs font-medium text-slate-700">{f.label}</Label>
                  <Input id={f.id} defaultValue={f.value} className="h-9 text-sm border-slate-200 focus-visible:ring-violet-400" />
                </Box>
              ))}
              <Button onClick={handleSave} className="h-9 px-5 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg">
                {saved ? "Saved ✓" : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        )}

        {active === "notifications" && (
          <Card className="border border-slate-100 shadow-sm bg-white rounded-xl overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-slate-100">
              <Box className="flex items-center gap-2">
                <Box className="w-1 h-4 rounded-full bg-amber-500" />
                <CardTitle className="text-sm font-semibold text-slate-800">Notification Preferences</CardTitle>
              </Box>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {[
                { id: "n1", label: "New user registrations",         defaultChecked: true  },
                { id: "n2", label: "Order placed / payment received", defaultChecked: true  },
                { id: "n3", label: "New support ticket raised",       defaultChecked: true  },
                { id: "n4", label: "Certificate issued",              defaultChecked: false },
                { id: "n5", label: "Corporate seat limit reached",    defaultChecked: true  },
                { id: "n6", label: "Daily summary digest",            defaultChecked: false },
              ].map((n) => (
                <Box key={n.id} className="flex items-center justify-between py-1">
                  <Label htmlFor={n.id} className="text-sm text-slate-700 cursor-pointer">{n.label}</Label>
                  <Switch id={n.id} defaultChecked={n.defaultChecked} />
                </Box>
              ))}
              <Button onClick={handleSave} className="h-9 px-5 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg">
                {saved ? "Saved ✓" : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        )}

        {active === "security" && (
          <Card className="border border-slate-100 shadow-sm bg-white rounded-xl overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-slate-100">
              <Box className="flex items-center gap-2">
                <Box className="w-1 h-4 rounded-full bg-rose-500" />
                <CardTitle className="text-sm font-semibold text-slate-800">Security Settings</CardTitle>
              </Box>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {[
                { id: "s1", label: "Require 2-factor authentication for admins", defaultChecked: true  },
                { id: "s2", label: "Auto-logout after 30 minutes of inactivity",  defaultChecked: true  },
                { id: "s3", label: "Log all admin activity",                       defaultChecked: true  },
                { id: "s4", label: "Restrict login to whitelisted IPs",            defaultChecked: false },
              ].map((s) => (
                <Box key={s.id} className="flex items-center justify-between py-1">
                  <Label htmlFor={s.id} className="text-sm text-slate-700 cursor-pointer">{s.label}</Label>
                  <Switch id={s.id} defaultChecked={s.defaultChecked} />
                </Box>
              ))}
              <Box className="space-y-1.5 pt-2">
                <Label className="text-xs font-medium text-slate-700">Password Policy (min length)</Label>
                <Input defaultValue="8" type="number" className="h-9 text-sm w-28 border-slate-200 focus-visible:ring-violet-400" />
              </Box>
              <Button onClick={handleSave} className="h-9 px-5 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg">
                {saved ? "Saved ✓" : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        )}

        {active === "platform" && (
          <Card className="border border-slate-100 shadow-sm bg-white rounded-xl overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-slate-100">
              <Box className="flex items-center gap-2">
                <Box className="w-1 h-4 rounded-full bg-teal-500" />
                <CardTitle className="text-sm font-semibold text-slate-800">Platform Settings</CardTitle>
              </Box>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              {[
                { id: "p1", label: "Allow learner self-registration",      defaultChecked: true  },
                { id: "p2", label: "Show course catalog publicly",          defaultChecked: true  },
                { id: "p3", label: "Enable discussion forums",              defaultChecked: false },
                { id: "p4", label: "Show instructor profiles",              defaultChecked: true  },
                { id: "p5", label: "Enable downloadable certificates",      defaultChecked: true  },
                { id: "p6", label: "Maintenance mode",                      defaultChecked: false },
              ].map((p) => (
                <Box key={p.id} className="flex items-center justify-between py-1">
                  <Label htmlFor={p.id} className="text-sm text-slate-700 cursor-pointer">{p.label}</Label>
                  <Switch id={p.id} defaultChecked={p.defaultChecked} />
                </Box>
              ))}
              <Button onClick={handleSave} className="h-9 px-5 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg">
                {saved ? "Saved ✓" : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}
