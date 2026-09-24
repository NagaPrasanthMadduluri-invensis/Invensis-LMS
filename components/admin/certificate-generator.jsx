"use client";

/*
 * Admin certificate generator.
 *
 * Two distinct actions, deliberately not merged into one button:
 *   Generate — create the certificate record (code + activity id).
 *   Release  — make it visible to the learner. Until this, the learner sees
 *              nothing at all.
 *
 * Both work on the whole training or on a selected subset of learners, so an
 * admin can withhold one person without blocking the rest.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Award, BadgeCheck, Clock, Download, RefreshCw, AlertCircle,
  Pencil, Undo2, Users, Loader2,
} from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
// start/end dates are wall-clock (`date` columns) -> formatDate.
// last_downloaded_at is a real instant (timestamptz) -> formatInstantDate.
import { formatDate, formatInstantDate } from "@/lib/datetime";
import {
  fetchCertifiableTrainings, fetchTrainingCertificates, generateCertificates,
  releaseCertificates, revokeCertificate, updateCertificate, setTrainingPdus,
} from "@/services/api/admin/admin-api";

// PDUs are chosen, not typed: the business awards between 8 and 60 and a
// mistyped figure on a certificate is a compliance problem.
const PDU_OPTIONS = Array.from({ length: 53 }, (_, i) => i + 8);

/* ── Stat tile ── */
function Stat({ icon: Icon, value, label, tone }) {
  return (
    <Box className={`rounded-xl px-4 py-3 ring-1 ${tone}`}>
      <Box className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" />
        <Text as="span" className="text-lg font-bold leading-none">{value}</Text>
      </Box>
      <Text as="p" className="text-[11px] mt-1 opacity-80">{label}</Text>
    </Box>
  );
}

/* ── Certified / non-certified, from the course catalog's course_type ── */
function CertificationBadge({ courseType }) {
  if (courseType === "certification") {
    return (
      <Badge className="border-0 bg-emerald-50 text-emerald-700 text-[11px] font-semibold gap-1">
        <BadgeCheck className="h-3 w-3" /> Certification course · PMI logo prints
      </Badge>
    );
  }
  if (courseType) {
    return <Badge className="border-0 bg-slate-100 text-slate-600 text-[11px] font-semibold">Non-certification course</Badge>;
  }
  // Not in the course catalog. Say so rather than guess either way.
  return <Badge className="border-0 bg-amber-50 text-amber-700 text-[11px] font-semibold">Course type not set in catalog</Badge>;
}

/* ── Edit dialog: correct an issued certificate ── */
function EditCertificateDialog({ cert, token, onClose, onSaved }) {
  const [form, setForm] = useState({ learner_name: "", certificate_code: "", course_identifier: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cert) return;
    setError(null);
    setForm({
      learner_name: cert.learner_name ?? "",
      certificate_code: cert.certificate_code ?? "",
      course_identifier: cert.course_identifier ?? "",
    });
  }, [cert]);

  if (!cert) return null;

  async function save() {
    setSaving(true); setError(null);
    try {
      const data = {};
      // Emptying the name box clears the override → the participant record's
      // name prints again.
      const name = form.learner_name.trim();
      if (name !== (cert.learner_name ?? "")) data.learner_name = name === "" ? null : name;
      const code = form.certificate_code.trim();
      if (code && code !== cert.certificate_code) data.certificate_code = code;
      const ident = form.course_identifier.trim();
      if (ident !== (cert.course_identifier ?? "")) data.course_identifier = ident === "" ? null : ident;

      if (Object.keys(data).length === 0) { onClose(); return; }
      await updateCertificate({ token, certificateId: cert.certificate_id, data });
      onSaved();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base flex items-center gap-2">
            <Pencil className="h-4 w-4" /> Edit certificate
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 mt-0.5">
            Course name and session dates come from the training and cannot be changed here.
          </DialogDescription>
        </DialogHeader>
        <Box className="px-6 py-5 space-y-4">
          <Box className="space-y-1.5">
            <Label className="text-xs">Learner name</Label>
            <Input value={form.learner_name} onChange={(e) => setForm({ ...form, learner_name: e.target.value })} className="h-9 text-sm" />
            <Text as="p" className="text-[11px] text-slate-400">
              From the participant record: {cert.source_learner_name || "—"}. Clear the box to restore it.
            </Text>
          </Box>
          <Box className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Box className="space-y-1.5">
              <Label className="text-xs">Certificate ID</Label>
              <Input value={form.certificate_code} onChange={(e) => setForm({ ...form, certificate_code: e.target.value })} className="h-9 text-sm font-mono" />
              <Text as="p" className="text-[11px] text-slate-400">Must be unique.</Text>
            </Box>
            <Box className="space-y-1.5">
              <Label className="text-xs">Course Identifier</Label>
              <Input value={form.course_identifier} onChange={(e) => setForm({ ...form, course_identifier: e.target.value })} className="h-9 text-sm font-mono" />
              <Text as="p" className="text-[11px] text-slate-400">The schedule / event code.</Text>
            </Box>
          </Box>
          <Box className="rounded-lg bg-slate-50 px-3 py-2.5 space-y-0.5">
            <Text as="p" className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Fixed by the training</Text>
            <Text as="p" className="text-xs text-slate-600">{cert.course_title}</Text>
            <Text as="p" className="text-[11px] text-slate-400">
              Training ID {cert.training_id} · {formatDate(cert.start_date)} – {formatDate(cert.end_date)}
              {cert.pdus != null ? ` · ${cert.pdus} PDUs` : ""}
              {cert.pdu_claim_code ? ` · Claim ${cert.pdu_claim_code}` : ""}
            </Text>
          </Box>
          {error && (
            <Box className="flex items-start gap-1.5 text-red-600">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <Text as="span" className="text-xs">{error}</Text>
            </Box>
          )}
        </Box>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button size="sm" onClick={save} disabled={saving} className="bg-violet-600 hover:bg-violet-700 text-white">
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function CertificateGenerator() {
  const { token } = useAuth();
  const [trainings, setTrainings] = useState([]);
  const [trainingRef, setTrainingRef] = useState("");
  const [detail, setDetail] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [editing, setEditing] = useState(null);
  const [pduForm, setPduForm] = useState({ pdus: "", code: "", mode: "" });

  useEffect(() => {
    if (!token) return;
    fetchCertifiableTrainings({ token })
      .then((r) => setTrainings(r.trainings || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoadingList(false));
  }, [token]);

  const loadDetail = useCallback(async (ref) => {
    if (!ref) { setDetail(null); return; }
    setLoadingDetail(true); setError(null);
    try {
      const d = await fetchTrainingCertificates({ token, trainingRef: ref });
      setDetail(d);
      setPduForm({
        pdus: d.training.pdus != null ? String(d.training.pdus) : "",
        code: d.training.pdu_claim_code ?? "",
        mode: d.training.certificate_mode ?? "",
      });
      setSelected(new Set());
    } catch (e) {
      setError(e.message); setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, [token]);

  useEffect(() => { loadDetail(trainingRef); }, [trainingRef, loadDetail]);

  const options = useMemo(
    () => trainings.map((t) => ({
      value: t.code,
      label: `${t.code} — ${t.title}`,
      keywords: `${t.title} ${t.code}`,
    })),
    [trainings]
  );

  async function run(label, fn) {
    setBusy(label); setError(null);
    try { await fn(); await loadDetail(trainingRef); }
    catch (e) { setError(e.message); }
    finally { setBusy(null); }
  }

  const ids = selected.size ? [...selected] : undefined;
  const rows = detail?.certificates ?? [];
  const s = detail?.summary;

  function toggle(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  return (
    <Box className="space-y-5">
      {/* Picker */}
      <Card className="p-5">
        <Box className="flex flex-wrap items-end gap-3">
          <Box className="min-w-[280px] flex-1 space-y-1.5">
            <Label className="text-xs font-semibold text-slate-600">Completed training</Label>
            <Combobox
              value={trainingRef}
              onChange={setTrainingRef}
              options={options}
              placeholder={loadingList ? "Loading…" : "Select a completed training"}
              searchPlaceholder="Search by code or title..."
              emptyText="No completed trainings."
              loading={loadingList}
            />
          </Box>
          {trainingRef && (
            <Button variant="outline" size="sm" onClick={() => loadDetail(trainingRef)} disabled={loadingDetail} className="h-10 gap-1.5">
              <RefreshCw className={`h-3.5 w-3.5 ${loadingDetail ? "animate-spin" : ""}`} /> Refresh
            </Button>
          )}
        </Box>
        <Text as="p" className="text-[11px] text-slate-400 mt-2">
          Only completed trainings can issue certificates. Learners see nothing until you release.
        </Text>
      </Card>

      {error && (
        <Card className="p-4 flex items-start gap-2 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <Text as="p" className="text-sm text-red-700">{error}</Text>
        </Card>
      )}

      {loadingDetail && !detail && (
        <Box className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}</Box>
      )}

      {!trainingRef && !loadingList && (
        <Card className="flex flex-col items-center justify-center gap-2 py-16 text-center">
          <Award className="h-8 w-8 text-slate-300" />
          <Text as="p" className="text-sm text-slate-500">Pick a completed training to manage its certificates.</Text>
        </Card>
      )}

      {detail && (
        <>
          {/* Header + stats */}
          <Card className="p-5 space-y-4">
            <Box className="flex flex-wrap items-start justify-between gap-3">
              <Box className="min-w-0">
                <Box className="flex flex-wrap items-center gap-2">
                  <Text as="span" className="font-mono text-[11px] font-bold text-violet-600">{detail.training.code}</Text>
                  <CertificationBadge courseType={detail.training.course_type} />
                </Box>
                <Text as="h2" className="text-base font-bold text-slate-800 mt-1">{detail.training.title}</Text>
                <Text as="p" className="text-xs text-slate-500 mt-0.5">
                  {formatDate(detail.training.start_date)} – {formatDate(detail.training.end_date)}
                  {" · via "}{detail.training.mode_of_training}
                  {detail.training.course_identifier ? ` · Course Identifier ${detail.training.course_identifier}` : ""}
                </Text>
              </Box>
              <Box className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => run("gen", () => generateCertificates({ token, trainingRef, enrolmentIds: ids }))}
                  disabled={!!busy || s.not_generated === 0}
                  className="gap-1.5 bg-slate-800 hover:bg-slate-900 text-white disabled:opacity-40"
                >
                  {busy === "gen" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Award className="h-3.5 w-3.5" />}
                  Generate{selected.size ? ` (${selected.size})` : s.not_generated ? ` (${s.not_generated})` : ""}
                </Button>
                <Button
                  size="sm"
                  onClick={() => run("rel", () => releaseCertificates({ token, trainingRef, enrolmentIds: ids }))}
                  disabled={!!busy || s.pending_release === 0}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-40"
                >
                  {busy === "rel" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BadgeCheck className="h-3.5 w-3.5" />}
                  Release{selected.size ? ` (${selected.size})` : s.pending_release ? ` (${s.pending_release})` : ""}
                </Button>
              </Box>
            </Box>

            {/* PDUs apply to the whole cohort, so they're set once here rather
                than per learner. Certificates already generated are updated too. */}
            <Box className="rounded-xl bg-slate-50 ring-1 ring-slate-200 px-4 py-3">
              <Box className="flex flex-wrap items-end gap-3">
                <Box className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-600">PDUs <Text as="span" className="font-normal text-slate-400">(optional)</Text></Label>
                  <select
                    value={pduForm.pdus}
                    onChange={(e) => setPduForm({ ...pduForm, pdus: e.target.value })}
                    className="h-9 w-28 rounded-lg border border-slate-300 bg-white px-2 text-sm outline-none focus:border-violet-400"
                  >
                    <option value="">None</option>
                    {PDU_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </Box>
                <Box className="space-y-1.5 min-w-[180px]">
                  <Label className="text-xs font-semibold text-slate-600">PDU claim code <Text as="span" className="font-normal text-slate-400">(optional)</Text></Label>
                  <Input
                    value={pduForm.code}
                    onChange={(e) => setPduForm({ ...pduForm, code: e.target.value })}
                    placeholder="4177YUOV3T"
                    className="h-9 text-sm font-mono"
                  />
                </Box>
                <Box className="space-y-1.5 min-w-[190px]">
                  <Label className="text-xs font-semibold text-slate-600">Mode of training</Label>
                  <select
                    value={pduForm.mode}
                    onChange={(e) => setPduForm({ ...pduForm, mode: e.target.value })}
                    className="h-9 w-full rounded-lg border border-slate-300 bg-white px-2 text-sm outline-none focus:border-violet-400"
                  >
                    <option value="">From delivery mode ({detail.training.mode_of_training})</option>
                    {(detail.training.certificate_mode_options ?? []).map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </Box>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9"
                  /* All three fields are optional — most trainings are not
                     PMI-accredited and award no PDUs — so saving is never
                     blocked on them. Blank values are sent as null, which is
                     how a value entered by mistake gets removed. */
                  disabled={!!busy}
                  onClick={() => run("pdu", () => setTrainingPdus({
                    token, trainingRef,
                    pdus: pduForm.pdus,
                    pduClaimCode: pduForm.code,
                    certificateMode: pduForm.mode,
                  }))}
                >
                  {busy === "pdu" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save PDUs"}
                </Button>
                <Text as="p" className="text-[11px] text-slate-400 flex-1 min-w-[200px]">
                  PDUs and claim code are required before generating. All three apply to every certificate on this training, including ones already generated. Mode is what prints after &ldquo;which took place on &hellip;, via&rdquo;.
                </Text>
              </Box>
            </Box>

            <Box className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
              <Stat icon={Users}        value={s.eligible}        label="Eligible learners" tone="bg-slate-50 text-slate-700 ring-slate-200" />
              <Stat icon={Award}        value={s.generated}       label="Generated"         tone="bg-violet-50 text-violet-700 ring-violet-200" />
              <Stat icon={BadgeCheck}   value={s.released}        label="Released"          tone="bg-emerald-50 text-emerald-700 ring-emerald-200" />
              <Stat icon={Clock}        value={s.pending_release} label="Awaiting release"  tone="bg-amber-50 text-amber-700 ring-amber-200" />
              <Stat icon={AlertCircle}  value={s.not_generated}   label="Not generated"     tone="bg-rose-50 text-rose-700 ring-rose-200" />
              <Stat icon={Download}     value={s.total_downloads} label={`Downloads · ${s.downloaded} learner${s.downloaded === 1 ? "" : "s"}`} tone="bg-sky-50 text-sky-700 ring-sky-200" />
            </Box>
          </Card>

          {/* Learner rows */}
          <Card className="p-0 overflow-hidden">
            <Box className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
              <Text as="h3" className="text-sm font-bold text-slate-800">Learners</Text>
              <Text as="span" className="text-[11px] text-slate-400">
                {selected.size ? `${selected.size} selected — actions apply to these only` : "No selection — actions apply to all"}
              </Text>
            </Box>
            <Box className="overflow-x-auto">
              <Box as="table" className="w-full border-collapse text-sm min-w-[900px]">
                <Box as="thead">
                  <Box as="tr" className="border-b border-slate-100 bg-slate-50/70">
                    <Box as="th" className="w-10 px-4 py-3" />
                    {["Learner", "Certificate ID", "Status", "Downloads", "PDUs", "Prints as", ""].map((h) => (
                      <Box as="th" key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500">{h}</Box>
                    ))}
                  </Box>
                </Box>
                <Box as="tbody">
                  {rows.map((c) => (
                    <Box as="tr" key={c.enrolment_id} className="border-b border-slate-50 hover:bg-slate-50/60">
                      <Box as="td" className="px-4 py-3">
                        <Checkbox checked={selected.has(c.enrolment_id)} onCheckedChange={() => toggle(c.enrolment_id)} />
                      </Box>
                      <Box as="td" className="px-4 py-3">
                        <Text as="p" className="font-medium text-slate-800">{c.learner_name}</Text>
                        <Text as="span" className="text-[11px] text-slate-400">{c.email}</Text>
                      </Box>
                      <Box as="td" className="px-4 py-3">
                        {c.generated
                          ? <Text as="span" className="font-mono text-xs text-slate-700">{c.certificate_code}</Text>
                          : <Text as="span" className="text-xs text-slate-400">Not generated</Text>}
                      </Box>
                      <Box as="td" className="px-4 py-3">
                        {!c.generated && <Badge className="border-0 bg-slate-100 text-slate-600 text-[10px]">Pending</Badge>}
                        {c.generated && !c.released && <Badge className="border-0 bg-amber-100 text-amber-700 text-[10px]">Awaiting release</Badge>}
                        {c.released && (
                          <Box>
                            <Badge className="border-0 bg-emerald-100 text-emerald-700 text-[10px]">Released</Badge>
                            <Text as="p" className="text-[10px] text-slate-400 mt-0.5">by {c.released_by || "—"}</Text>
                          </Box>
                        )}
                      </Box>
                      <Box as="td" className="px-4 py-3">
                        <Text as="span" className={`text-sm font-semibold ${c.download_count ? "text-sky-700" : "text-slate-400"}`}>
                          {c.download_count}
                        </Text>
                        {c.last_downloaded_at && (
                          <Text as="p" className="text-[10px] text-slate-400">{formatInstantDate(c.last_downloaded_at)}</Text>
                        )}
                      </Box>
                      <Box as="td" className="px-4 py-3">
                        {c.pdus != null
                          ? <Box>
                              <Text as="p" className="text-sm font-semibold text-slate-700">{c.pdus}</Text>
                              <Text as="span" className="text-[10px] font-mono text-slate-400">{c.pdu_claim_code || "—"}</Text>
                            </Box>
                          : <Text as="span" className="text-xs text-slate-400">—</Text>}
                      </Box>
                      <Box as="td" className="px-4 py-3">
                        <Text as="p" className="text-xs text-slate-600">{c.course_title}</Text>
                        <Text as="span" className="text-[10px] text-slate-400">
                          {formatDate(c.start_date)} – {formatDate(c.end_date)}
                        </Text>
                      </Box>
                      <Box as="td" className="px-4 py-3">
                        <Box className="flex items-center justify-end gap-1.5">
                          {c.generated && (
                            <Button variant="outline" size="sm" className="h-8 px-2.5 gap-1 text-xs" onClick={() => setEditing(c)}>
                              <Pencil className="h-3 w-3" /> Edit
                            </Button>
                          )}
                          {c.released && (
                            <Button
                              variant="outline" size="sm"
                              className="h-8 px-2.5 gap-1 text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                              disabled={!!busy}
                              onClick={() => run(`rev-${c.certificate_id}`, () => revokeCertificate({ token, certificateId: c.certificate_id }))}
                            >
                              <Undo2 className="h-3 w-3" /> Revoke
                            </Button>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  ))}
                  {rows.length === 0 && (
                    <Box as="tr">
                      <Box as="td" colSpan={8} className="px-4 py-10 text-center">
                        <Text as="p" className="text-sm text-slate-500">No eligible learners on this training.</Text>
                      </Box>
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>
          </Card>
        </>
      )}

      <EditCertificateDialog
        cert={editing}
        token={token}
        onClose={() => setEditing(null)}
        onSaved={() => loadDetail(trainingRef)}
      />
    </Box>
  );
}
