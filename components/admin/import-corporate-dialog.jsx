"use client";

import { useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle2, Download, X, Loader2 } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { bulkImportCorporate } from "@/services/api/admin/admin-api";

const FIELDS = ["name", "email", "communication_email", "phone", "company", "country", "city", "industry", "job_title", "role", "training_code", "sponsor_email"];
const TEMPLATE_ROWS = [
  ["Acme Corp", "sponsor@acme.com", "billing@acme.com", "+1 555 0100", "Acme Inc", "United States", "Austin", "Technology", "", "sponsor", "", ""],
  ["Jane Doe", "jane@acme.com", "", "+1 555 0101", "Acme Inc", "United States", "Austin", "Technology", "Engineer", "learner", "TRN-2026-0001", "sponsor@acme.com"],
];

const normKey = (h) => String(h ?? "").trim().toLowerCase().replace(/\s+/g, "_");
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(e ?? "").trim());

async function downloadTemplate() {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet([FIELDS, ...TEMPLATE_ROWS]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Import");
  XLSX.writeFile(wb, "corporate-import-template.xlsx");
}

function Stat({ label, value, tone = "primary" }) {
  const tones = {
    primary: "bg-primary-subtle text-primary",
    success: "bg-success-subtle text-success-subtle-foreground",
    warning: "bg-warning-subtle text-warning-subtle-foreground",
    error: "bg-error-subtle text-error-subtle-foreground",
  };
  return (
    <Box className={`rounded-xl px-3 py-2 ${tones[tone]}`}>
      <Text as="p" className="text-lg font-bold leading-none tabular-nums">{value}</Text>
      <Text as="p" className="text-[11px] font-medium mt-1">{label}</Text>
    </Box>
  );
}

export function ImportCorporateDialog({ open, onOpenChange, onImported }) {
  const { token } = useAuth();
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState(null);
  const [parseError, setParseError] = useState("");
  const [preview, setPreview] = useState(null); // dry-run result
  const [result, setResult] = useState(null);   // real-run result
  const [sendEmails, setSendEmails] = useState(true);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);

  function reset() {
    setFileName(""); setRows(null); setParseError(""); setPreview(null); setResult(null);
    setSendEmails(true); setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function pickFile(file) {
    if (!file) return;
    setFileName(file.name); setParseError(""); setPreview(null); setResult(null); setRows(null);
    setBusy(true);
    try {
      const XLSX = await import("xlsx");
      const wb = XLSX.read(await file.arrayBuffer(), { type: "array" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });
      const mapped = raw.map((r, i) => {
        const o = { _row: i + 2 }; // +2: header row + 1-based
        const lower = {};
        for (const k of Object.keys(r)) lower[normKey(k)] = r[k];
        for (const f of FIELDS) o[f] = (lower[f] ?? "").toString().trim();
        const role = o.role.toLowerCase();
        o._ok = (role === "sponsor" || role === "learner") && validEmail(o.email);
        return o;
      }).filter((o) => o.email || o.name || o.role); // drop fully-blank rows
      if (mapped.length === 0) { setParseError("No data rows found in the first sheet."); setBusy(false); return; }
      setRows(mapped);
      // Auto preview (server-side dry run) against the database.
      const res = await bulkImportCorporate({ token, rows: mapped.map(stripMeta), dryRun: true });
      setPreview(res);
    } catch (e) {
      setParseError(e.message || "Could not read the file.");
    } finally {
      setBusy(false);
    }
  }

  const stripMeta = ({ _row, _ok, ...r }) => r;

  async function confirmImport() {
    if (!rows?.length) return;
    setBusy(true);
    try {
      const res = await bulkImportCorporate({ token, rows: rows.map(stripMeta), dryRun: false, sendSetupEmails: sendEmails });
      setResult(res);
      onImported?.();
    } catch (e) {
      setParseError(e.message || "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  const sponsors = rows ? rows.filter((r) => r.role.toLowerCase() === "sponsor").length : 0;
  const learners = rows ? rows.filter((r) => r.role.toLowerCase() === "learner").length : 0;
  const summary = result || preview;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) { onOpenChange(o); if (!o) reset(); } }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">Import sponsors &amp; learners (Excel)</DialogTitle>
          <DialogDescription>
            One row per person. Columns:
            <Box as="span" className="font-mono text-xs"> name, email, communication_email, phone, company, country, city, industry, job_title, role, training_code, sponsor_email</Box>.
            Sponsors are created first, then learners (linked via <Box as="span" className="font-mono text-xs">sponsor_email</Box>).
          </DialogDescription>
        </DialogHeader>

        {result ? (
          /* ── Final result ── */
          <Box className="space-y-3 py-1">
            <Box className="flex items-center gap-2.5 rounded-xl bg-success-subtle border border-success-border px-4 py-3">
              <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
              <Text as="p" className="text-sm text-success-subtle-foreground font-semibold">Import complete.</Text>
            </Box>
            <ResultGrid r={result} />
            <IssueLists r={result} />
          </Box>
        ) : (
          <Box className="space-y-4 py-1">
            {!rows ? (
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-8 cursor-pointer hover:bg-surface-hover transition-colors">
                {busy ? <Loader2 className="h-7 w-7 text-foreground-subtle animate-spin" /> : <UploadCloud className="h-7 w-7 text-foreground-subtle" />}
                <Text as="span" className="text-sm text-foreground-muted">{busy ? "Reading…" : "Click to choose an .xlsx / .csv file"}</Text>
                <Text as="span" className="text-[11px] text-foreground-subtle">Up to 2000 rows</Text>
                <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0])} />
              </label>
            ) : (
              <Box className="space-y-3">
                <Box className="flex items-center gap-2 px-3 py-2 border border-border rounded-lg bg-surface-hover">
                  <FileSpreadsheet className="h-4 w-4 text-foreground-subtle shrink-0" />
                  <Text as="span" className="text-xs text-foreground flex-1 truncate">{fileName}</Text>
                  <Badge className="border-0 bg-primary-subtle text-primary text-[11px]">{sponsors} sponsors</Badge>
                  <Badge className="border-0 bg-primary-subtle text-primary text-[11px]">{learners} learners</Badge>
                  <button type="button" onClick={reset} className="text-foreground-subtle hover:text-foreground-muted shrink-0"><X className="h-3.5 w-3.5" /></button>
                </Box>

                {/* Preview (server dry-run) */}
                {busy && !preview ? (
                  <Box className="flex items-center gap-2 text-foreground-muted text-sm py-3"><Loader2 className="h-4 w-4 animate-spin" /> Validating against the database…</Box>
                ) : preview ? (
                  <Box className="space-y-3">
                    <Text as="p" className="text-xs font-semibold text-foreground-muted">Preview — what will happen (nothing saved yet):</Text>
                    <ResultGrid r={preview} />
                    <IssueLists r={preview} />
                  </Box>
                ) : null}

                {/* Send-emails choice */}
                <Box className="rounded-xl border border-border px-4 py-3 space-y-2">
                  <Text as="p" className="text-xs font-semibold text-foreground">Account-setup emails</Text>
                  <Box className="flex gap-4">
                    {[["Send setup emails", true], ["Don't send", false]].map(([label, val]) => (
                      <label key={label} className="flex items-center gap-2 text-sm text-foreground-muted cursor-pointer">
                        <input type="radio" name="send-emails" checked={sendEmails === val} onChange={() => setSendEmails(val)} className="accent-primary" />
                        {label}
                      </label>
                    ))}
                  </Box>
                </Box>
              </Box>
            )}

            {parseError && (
              <Box className="flex items-center gap-1.5 text-error">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <Text as="span" className="text-xs">{parseError}</Text>
              </Box>
            )}
          </Box>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" size="sm" onClick={downloadTemplate} className="text-foreground-muted hover:text-foreground">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Download template
          </Button>
          <Box className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { onOpenChange(false); reset(); }} disabled={busy}>
              {result ? "Close" : "Cancel"}
            </Button>
            {!result && (
              <Button size="sm" onClick={confirmImport} disabled={busy || !preview}
                className="bg-primary hover:bg-primary-hover text-primary-foreground">
                {busy ? "Importing…" : "Confirm import"}
              </Button>
            )}
          </Box>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ResultGrid({ r }) {
  return (
    <Box className="grid grid-cols-3 sm:grid-cols-5 gap-2">
      <Stat label="Sponsors +" value={r.sponsors_created} tone="primary" />
      <Stat label="Learners +" value={r.learners_created} tone="primary" />
      <Stat label="Updated" value={r.sponsors_updated + r.learners_updated} tone="success" />
      <Stat label="Enrolled" value={r.enrolled} tone="success" />
      <Stat label="Failed" value={r.failed?.length || 0} tone={r.failed?.length ? "error" : "primary"} />
    </Box>
  );
}

function IssueLists({ r }) {
  return (
    <>
      {r.failed?.length > 0 && (
        <Box className="rounded-xl border border-error-border overflow-hidden">
          <Box className="bg-error-subtle px-4 py-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-error shrink-0" />
            <Text as="p" className="text-xs font-semibold text-error-subtle-foreground">{r.failed.length} row(s) skipped</Text>
          </Box>
          <Box className="max-h-40 overflow-y-auto divide-y divide-border">
            {r.failed.map((f, i) => (
              <Box key={i} className="px-4 py-2 flex items-center justify-between gap-3 text-xs">
                <Text as="span" className="text-foreground-muted truncate">Row {f.row}: {f.name || f.email || "—"}</Text>
                <Text as="span" className="text-error shrink-0">{f.error}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      )}
      {r.warnings?.length > 0 && (
        <Box className="rounded-xl border border-warning-border overflow-hidden">
          <Box className="bg-warning-subtle px-4 py-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-warning shrink-0" />
            <Text as="p" className="text-xs font-semibold text-warning-subtle-foreground">{r.warnings.length} warning(s)</Text>
          </Box>
          <Box className="max-h-32 overflow-y-auto divide-y divide-border">
            {r.warnings.map((w, i) => (
              <Box key={i} className="px-4 py-2 flex items-center justify-between gap-3 text-xs">
                <Text as="span" className="text-foreground-muted truncate">Row {w.row}: {w.name || w.email || "—"}</Text>
                <Text as="span" className="text-warning-subtle-foreground shrink-0">{w.warning}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </>
  );
}
