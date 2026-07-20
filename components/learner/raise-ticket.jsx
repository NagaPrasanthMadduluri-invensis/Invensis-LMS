"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "@/components/ui/accordion";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  HelpCircle, KeyRound, Mail, Clock, ExternalLink, Send, AlertCircle, Info,
  CalendarClock, CalendarX2, Award, CalendarOff, MessageCircle, BookOpen, Check,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchMyTrainings, createTicket } from "@/services/api/learner/learner-api";
import { TICKET_CATEGORIES, CATEGORY_META, PRIORITY_META } from "@/lib/ticket-meta";

const CATEGORY_ICON = {
  reschedule_training: CalendarClock,
  cancel_training: CalendarX2,
  certificate_issue: Award,
  training_missed: CalendarOff,
  other: MessageCircle,
};

const FAQS = [
  {
    icon: KeyRound,
    q: "How do I change my password?",
    a: (
      <>
        You can reset your password anytime from your{" "}
        <Link href="/profile" className="text-violet-600 font-medium hover:underline">Profile &rsaquo; Security</Link>{" "}
        settings. No ticket needed.
      </>
    ),
  },
  {
    icon: Mail,
    q: "How do I update my email or profile details?",
    a: (
      <>
        Your name, contact details and other information can be edited on your{" "}
        <Link href="/profile" className="text-violet-600 font-medium hover:underline">Profile</Link>{" "}
        page. Email changes to your login are handled there too.
      </>
    ),
  },
  {
    icon: Clock,
    q: "I can't log in or access the LMS",
    a: (
      <>
        Access to the LMS is usually provisioned <strong>within ~15 minutes</strong> of your
        enrolment or account setup. If it&apos;s been longer than that, raise a ticket under{" "}
        <em>&ldquo;Something else&rdquo;</em> and we&apos;ll look into it right away.
      </>
    ),
  },
];

function StepBadge({ n }) {
  return (
    <Box className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white text-[11px] font-bold shrink-0">
      {n}
    </Box>
  );
}

export function RaiseTicket() {
  const { token } = useAuth();
  const router = useRouter();

  const [trainings, setTrainings] = useState(null);
  const [category, setCategory] = useState("");
  const [trainingId, setTrainingId] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    fetchMyTrainings({ token })
      .then((res) => setTrainings(res.trainings || res || []))
      .catch(() => setTrainings([]));
  }, [token]);

  const selectedCat = CATEGORY_META[category];
  const needsTraining = !!selectedCat?.needsTraining;
  const autoPriority = selectedCat ? PRIORITY_META[selectedCat.priority] : null;
  const selectedTraining = (trainings || []).find((t) => t.id === trainingId) || null;

  const canSubmit =
    category &&
    subject.trim().length >= 3 &&
    description.trim().length >= 10 &&
    (!needsTraining || trainingId);

  async function submit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await createTicket({
        token,
        data: {
          category,
          subject: subject.trim(),
          description: description.trim(),
          ...(needsTraining ? { training_id: trainingId } : {}),
        },
      });
      router.push("/tickets");
    } catch (e) {
      setError(e.message);
      setSubmitting(false);
    }
  }

  return (
    <Box className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* ── Main form ── */}
      <Card className="lg:col-span-2 rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <Box className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <Text as="h2" className="text-base font-bold text-slate-800">New support request</Text>
          <Text as="p" className="text-xs text-slate-400 mt-0.5">Tell us what you need help with — it takes less than a minute.</Text>
        </Box>

        <Box className="p-6 space-y-7">
          {/* Step 1 — category */}
          <Box className="space-y-3">
            <Box className="flex items-center gap-2">
              <StepBadge n={1} />
              <Text as="label" className="text-sm font-bold text-slate-700">What is this about?</Text>
            </Box>
            <Box className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {TICKET_CATEGORIES.map((c) => {
                const Icon = CATEGORY_ICON[c.key] || MessageCircle;
                const active = category === c.key;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => { setCategory(c.key); setTrainingId(""); }}
                    className={`group relative flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                      active
                        ? "border-violet-500 bg-violet-50/60 ring-2 ring-violet-200"
                        : "border-slate-200 bg-white hover:border-violet-300 hover:bg-slate-50"
                    }`}
                  >
                    <Box className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-violet-100 group-hover:text-violet-600"}`}>
                      <Icon className="h-4 w-4" />
                    </Box>
                    <Box className="min-w-0">
                      <Text as="p" className={`text-sm font-semibold ${active ? "text-violet-700" : "text-slate-700"}`}>{c.label}</Text>
                      <Text as="p" className="text-[11px] text-slate-400 leading-snug mt-0.5">{c.hint}</Text>
                    </Box>
                    {active && (
                      <Box className="absolute top-2.5 right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-white">
                        <Check className="h-2.5 w-2.5" />
                      </Box>
                    )}
                  </button>
                );
              })}
            </Box>
          </Box>

          {/* Step 2 — training (conditional) */}
          {needsTraining && (
            <Box className="space-y-3">
              <Box className="flex items-center gap-2">
                <StepBadge n={2} />
                <Text as="label" className="text-sm font-bold text-slate-700">Which training?</Text>
                <Badge className="border-0 bg-rose-50 text-rose-600 text-[10px] font-semibold">Required</Badge>
              </Box>
              {trainings === null ? (
                <Box className="h-11 rounded-xl bg-slate-100 animate-pulse" />
              ) : trainings.length === 0 ? (
                <Box className="flex items-center gap-2 rounded-xl bg-amber-50 ring-1 ring-amber-200 px-3.5 py-3">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
                  <Text as="span" className="text-xs text-amber-700">You have no enrolments yet, so this category isn&apos;t available.</Text>
                </Box>
              ) : (
                <>
                  <Select value={trainingId} onValueChange={setTrainingId}>
                    <SelectTrigger className="h-11 bg-white border-slate-200 rounded-xl text-sm">
                      <SelectValue placeholder="Select your training ID / course" />
                    </SelectTrigger>
                    <SelectContent>
                      {trainings.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.code} · {t.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedTraining && (
                    <Box className="flex items-center gap-2.5 rounded-xl bg-violet-50/60 ring-1 ring-violet-100 px-3.5 py-2.5">
                      <BookOpen className="h-4 w-4 text-violet-500 shrink-0" />
                      <Text as="span" className="text-xs font-mono font-bold text-violet-700">{selectedTraining.code}</Text>
                      <Text as="span" className="text-xs text-slate-600 truncate">{selectedTraining.title}</Text>
                    </Box>
                  )}
                </>
              )}
            </Box>
          )}

          {/* Step 3 — details */}
          <Box className="space-y-4">
            <Box className="flex items-center gap-2">
              <StepBadge n={needsTraining ? 3 : 2} />
              <Text as="label" className="text-sm font-bold text-slate-700">Describe your request</Text>
            </Box>

            <Box className="space-y-1.5">
              <Box className="flex items-center justify-between">
                <Text as="span" className="text-xs font-semibold text-slate-600">Subject</Text>
                <Text as="span" className="text-[10px] text-slate-400 tabular-nums">{subject.length}/160</Text>
              </Box>
              <Input
                placeholder="Briefly summarise your request"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={160}
                className="h-11 bg-white border-slate-200 rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-violet-400/40 focus-visible:border-violet-300"
              />
            </Box>

            <Box className="space-y-1.5">
              <Box className="flex items-center justify-between">
                <Text as="span" className="text-xs font-semibold text-slate-600">Details</Text>
                <Text as="span" className="text-[10px] text-slate-400 tabular-nums">{description.length}/4000</Text>
              </Box>
              <Textarea
                placeholder="Tell us what happened and what you need. Include dates or reference numbers where helpful."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                maxLength={4000}
                className="bg-white border-slate-200 rounded-xl text-sm focus-visible:ring-2 focus-visible:ring-violet-400/40 focus-visible:border-violet-300 resize-none"
              />
            </Box>
          </Box>

          {/* Auto priority note */}
          {autoPriority && (
            <Box className="flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5">
              <Info className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <Text as="span" className="text-xs text-slate-500">Priority is set automatically for this category:</Text>
              <Badge className={`border-0 text-[10px] font-semibold ${autoPriority.badge}`}>{autoPriority.label}</Badge>
            </Box>
          )}

          {error && (
            <Box className="flex items-center gap-2 rounded-xl bg-red-50 ring-1 ring-red-100 px-3.5 py-3">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
              <Text as="span" className="text-xs text-red-600">{error}</Text>
            </Box>
          )}
        </Box>

        {/* Sticky footer actions */}
        <Box className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-6 py-4">
          <Text as="span" className="text-[11px] text-slate-400 hidden sm:block">
            {canSubmit ? "Ready to submit" : "Complete the required fields to continue"}
          </Text>
          <Box className="flex items-center gap-3 ml-auto">
            <Button
              render={<Link href="/tickets" />}
              variant="outline"
              className="h-10 px-4 rounded-xl border-slate-200 text-slate-600"
            >
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={!canSubmit || submitting}
              className="h-10 px-5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white gap-1.5"
            >
              {submitting ? "Submitting..." : <><Send className="h-4 w-4" /> Submit ticket</>}
            </Button>
          </Box>
        </Box>
      </Card>

      {/* ── Help aside ── */}
      <Box className="lg:sticky lg:top-6 space-y-4">
        <Card className="rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <Box className="px-5 py-4 border-b border-slate-100 flex items-center gap-2.5">
            <Box className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center">
              <HelpCircle className="h-4 w-4 text-violet-500" />
            </Box>
            <Box>
              <Text as="h3" className="text-sm font-bold text-slate-800">Quick answers</Text>
              <Text as="p" className="text-[11px] text-slate-400">These may solve it without a ticket</Text>
            </Box>
          </Box>
          <Box className="p-3">
            <Accordion className="w-full">
              {FAQS.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="px-2">
                  <AccordionTrigger className="text-slate-700 hover:no-underline">
                    <Box className="flex items-center gap-2.5">
                      <f.icon className="h-4 w-4 text-violet-400 shrink-0" />
                      <Text as="span" className="text-[13px] font-semibold text-slate-700 text-left">{f.q}</Text>
                    </Box>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Text as="p" className="text-xs text-slate-500 leading-relaxed pl-7 pr-2 pb-1">{f.a}</Text>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Box>
        </Card>

        <Card className="rounded-2xl border border-violet-100 bg-violet-50/50 shadow-sm p-4">
          <Box className="flex items-start gap-2.5">
            <ExternalLink className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
            <Text as="p" className="text-xs text-slate-600 leading-relaxed">
              Manage your password, email and profile details on your{" "}
              <Link href="/profile" className="text-violet-600 font-semibold hover:underline">Profile</Link>{" "}
              page — no ticket required.
            </Text>
          </Box>
        </Card>
      </Box>
    </Box>
  );
}
