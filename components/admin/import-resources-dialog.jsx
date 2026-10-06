"use client";

import { useRef, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, FileText, AlertCircle, CheckCircle2, Download, X } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { parseCsv } from "@/lib/csv";
import { bulkImportResources } from "@/services/api/admin/admin-api";

const TEMPLATE = [
  "training_code,title,url,description,is_active",
  "TRN-2026-0001,Participant workbook,https://example.com/workbook.pdf,Pre-read for day 1,true",
].join("\n");

const parseBool = (v) => {
  const s = (v ?? "").trim().toLowerCase();
  if (s === "") return undefined;
  return !["false", "0", "no", "n"].includes(s);
};

const looksValidUrl = (u) => {
  try { const p = new URL(String(u)); return p.protocol === "http:" || p.protocol === "https:"; }
  catch { return false; }
};

function downloadTemplate() {
  const blob = new Blob([TEMPLATE], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "supplementary-resources-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function ImportResourcesDialog({ open, onOpenChange, onImported }) {
  const { token } = useAuth();
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState(null);     // parsed+mapped rows
  const [parseError, setParseError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // { created, failed }
  const inputRef = useRef(null);

  function reset() {
    setFileName(""); setRows(null); setParseError(""); setResult(null); setSubmitting(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function pickFile(file) {
    if (!file) return;
    setFileName(file.name); setParseError(""); setResult(null);
    try {
      const { headers, rows: parsed } = parseCsv(await file.text());
      if (!headers.includes("training_code") || !headers.includes("title") || !headers.includes("url")) {
        setRows(null);
        setParseError("CSV must have at least these columns: training_code, title, url.");
        return;
      }
      const mapped = parsed.map((r, i) => {
        const row = {
          training_code: r.training_code || "",
          title: r.title || "",
          url: r.url || "",
          description: r.description || undefined,
          is_active: parseBool(r.is_active),
          _row: i + 1,
          _ok: !!r.training_code && !!r.title && looksValidUrl(r.url),
        };
        return row;
      });
      setRows(mapped);
    } catch (e) {
      setRows(null);
      setParseError(e.message || "Could not read the file.");
    }
  }

  async function submit() {
    if (!rows?.length) return;
    setSubmitting(true);
    try {
      const resources = rows.map(({ _row, _ok, ...r }) => r);
      const res = await bulkImportResources({ token, resources });
      setResult(res);
      if (res.created > 0) onImported?.();
    } catch (e) {
      setParseError(e.message || "Import failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const invalidCount = rows ? rows.filter((r) => !r._ok).length : 0;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!submitting) { onOpenChange(o); if (!o) reset(); } }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">Import supplementary resources (CSV)</DialogTitle>
          <DialogDescription>
            Each row adds an external-link resource to a training by its code. Columns:
            <Box as="span" className="font-mono text-xs"> training_code, title, url, description, is_active</Box>.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <Box className="space-y-3 py-1">
            <Box className="flex items-center gap-2.5 rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
              <Text as="p" className="text-sm text-emerald-800 font-semibold">
                Imported {result.created} resource{result.created === 1 ? "" : "s"}.
              </Text>
            </Box>
            {result.failed?.length > 0 && (
              <Box className="rounded-xl border border-amber-200 overflow-hidden">
                <Box className="bg-amber-50 px-4 py-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
                  <Text as="p" className="text-xs font-semibold text-amber-800">{result.failed.length} row(s) skipped</Text>
                </Box>
                <Box className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                  {result.failed.map((f, i) => (
                    <Box key={i} className="px-4 py-2 flex items-center justify-between gap-3 text-xs">
                      <Text as="span" className="text-slate-600 truncate">Row {f.row}: {f.title || f.training_code || "—"}</Text>
                      <Text as="span" className="text-rose-600 shrink-0">{f.error}</Text>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        ) : (
          <Box className="space-y-4 py-1">
            {!rows ? (
              <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-slate-200 rounded-xl py-8 cursor-pointer hover:bg-slate-50 transition-colors">
                <UploadCloud className="h-7 w-7 text-slate-400" />
                <Text as="span" className="text-sm text-slate-600">Click to choose a .csv file</Text>
                <Text as="span" className="text-[11px] text-slate-400">Up to 500 rows</Text>
                <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden"
                  onChange={(e) => pickFile(e.target.files?.[0])} />
              </label>
            ) : (
              <Box className="space-y-3">
                <Box className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-slate-50">
                  <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                  <Text as="span" className="text-xs text-slate-700 flex-1 truncate">{fileName}</Text>
                  <Badge className="border-0 bg-violet-50 text-violet-700 text-[11px]">{rows.length} rows</Badge>
                  {invalidCount > 0 && <Badge className="border-0 bg-amber-50 text-amber-700 text-[11px]">{invalidCount} need attention</Badge>}
                  <button type="button" onClick={reset} className="text-slate-400 hover:text-slate-600 shrink-0"><X className="h-3.5 w-3.5" /></button>
                </Box>
                {/* Preview (first 8) */}
                <Box className="rounded-xl border border-slate-200 overflow-hidden">
                  <Box as="table" className="w-full text-xs">
                    <Box as="thead">
                      <Box as="tr" className="bg-slate-50 text-slate-500">
                        {["Training", "Title", "URL", ""].map((h) => (
                          <Box as="th" key={h} className="text-left font-semibold px-3 py-2">{h}</Box>
                        ))}
                      </Box>
                    </Box>
                    <Box as="tbody">
                      {rows.slice(0, 8).map((r) => (
                        <Box as="tr" key={r._row} className="border-t border-slate-100">
                          <Box as="td" className="px-3 py-1.5 font-mono text-slate-700">{r.training_code || "—"}</Box>
                          <Box as="td" className="px-3 py-1.5 text-slate-700 max-w-[180px] truncate">{r.title || "—"}</Box>
                          <Box as="td" className="px-3 py-1.5 text-slate-500 max-w-[200px] truncate">{r.url || "—"}</Box>
                          <Box as="td" className="px-3 py-1.5">
                            {r._ok
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              : <AlertCircle className="h-3.5 w-3.5 text-amber-500" />}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                  {rows.length > 8 && (
                    <Box className="px-3 py-1.5 bg-slate-50 text-[11px] text-slate-400">+ {rows.length - 8} more…</Box>
                  )}
                </Box>
                <Text as="p" className="text-[11px] text-slate-400">
                  Rows flagged with a warning (missing training code/title or an invalid URL) are reported and skipped; the rest import.
                </Text>
              </Box>
            )}

            {parseError && (
              <Box className="flex items-center gap-1.5 text-red-600">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <Text as="span" className="text-xs">{parseError}</Text>
              </Box>
            )}
          </Box>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          <Button variant="ghost" size="sm" onClick={downloadTemplate} className="text-slate-500 hover:text-slate-700">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Download template
          </Button>
          <Box className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { onOpenChange(false); reset(); }} disabled={submitting}>
              {result ? "Close" : "Cancel"}
            </Button>
            {!result && (
              <Button size="sm" onClick={submit} disabled={submitting || !rows?.length}
                className="bg-violet-600 hover:bg-violet-700 text-white">
                {submitting ? "Importing…" : `Import ${rows ? rows.length : ""}`.trim()}
              </Button>
            )}
          </Box>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
