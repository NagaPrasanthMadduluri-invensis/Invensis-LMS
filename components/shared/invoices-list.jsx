"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Receipt, FileText, CreditCard, AlertCircle, RefreshCw } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchInvoices } from "@/services/api/invoices/invoices-api";

/* Status → badge style. Finance app sends: draft, pending, partial, paid, overdue. */
const STATUS_STYLE = {
  paid: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  partial: "bg-sky-100 text-sky-700",
  overdue: "bg-rose-100 text-rose-700",
  draft: "bg-slate-100 text-slate-600",
};

const DOC_STYLE = {
  invoice: "bg-violet-100 text-violet-700",
  proforma: "bg-slate-100 text-slate-600",
};

function cap(s = "") {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";
}

function money(amount, currency) {
  if (amount == null) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency || ""} ${amount}`.trim();
  }
}

function fmtDate(d) {
  if (!d) return "—";
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function TableSkeleton() {
  return (
    <Box className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-md" />
      ))}
    </Box>
  );
}

export function InvoicesList() {
  const { user } = useAuth();
  const [data, setData] = useState(null); // { client, invoices }
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    setData(null);
    fetchInvoices()
      .then((res) => setData({ client: res.client ?? null, invoices: res.invoices ?? [] }))
      .catch((err) => setError(err?.message || "Something went wrong."));
  }, []);

  useEffect(() => {
    if (!user) return; // wait for auth hydration; the route reads the session cookie
    load();
  }, [user, load]);

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Box className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
            <AlertCircle className="h-6 w-6 text-rose-600" />
          </Box>
          <Text as="h3" className="text-sm font-semibold">Couldn&apos;t load invoices</Text>
          <Text as="p" className="mt-1 max-w-sm text-xs text-muted-foreground">{error}</Text>
          <Button size="sm" variant="outline" className="mt-4 gap-1.5 text-xs" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5" /> Try again
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) return <TableSkeleton />;

  const rows = data.invoices;

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Box className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100">
            <Receipt className="h-6 w-6 text-violet-600" />
          </Box>
          <Text as="h3" className="text-sm font-semibold">No invoices yet</Text>
          <Text as="p" className="mt-1 max-w-sm text-xs text-muted-foreground">
            Invoices and proforma invoices for your purchases will appear here.
          </Text>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        {data.client && (
          <Box className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-5 py-3">
            <Box>
              <Text as="span" className="text-[11px] uppercase tracking-wide text-muted-foreground">Billed to</Text>
              <Text as="p" className="text-sm font-semibold text-slate-800">
                {data.client.name}
                {data.client.company ? <span className="font-normal text-slate-500"> · {data.client.company}</span> : null}
              </Text>
            </Box>
            <Text as="span" className="text-xs text-muted-foreground">
              {rows.length} document{rows.length !== 1 ? "s" : ""}
            </Text>
          </Box>
        )}

        <Box className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Document</TableHead>
                <TableHead>Program</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((inv) => {
                const hasBalance = inv.balance_due != null && inv.balance_due > 0;
                return (
                  <TableRow key={inv.id}>
                    <TableCell>
                      <Box className="flex items-center gap-2">
                        <Text as="p" className="font-mono text-sm font-medium text-slate-800">
                          {inv.number || inv.invoice_number || inv.proforma_number || `#${inv.id}`}
                        </Text>
                        <Badge className={`border-0 text-[10px] font-semibold ${DOC_STYLE[inv.document_type] || "bg-slate-100 text-slate-600"}`}>
                          {inv.document_type === "proforma" ? "Proforma" : "Invoice"}
                        </Badge>
                      </Box>
                      <Text as="span" className="text-[11px] text-muted-foreground">
                        {fmtDate(inv.issue_date || inv.created_at)}
                        {inv.due_date ? ` · due ${fmtDate(inv.due_date)}` : ""}
                      </Text>
                    </TableCell>

                    <TableCell className="text-sm text-slate-700">{inv.program_name || "—"}</TableCell>

                    <TableCell>
                      <Text as="p" className="text-sm font-semibold text-slate-800">
                        {money(inv.total_amount, inv.currency)}
                      </Text>
                      {hasBalance && (
                        <Text as="span" className="text-[11px] font-medium text-amber-600">
                          {money(inv.balance_due, inv.currency)} due
                        </Text>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge className={`border-0 text-[10px] font-semibold ${STATUS_STYLE[inv.status] || "bg-slate-100 text-slate-600"}`}>
                        {cap(inv.status)}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Box className="flex items-center justify-end gap-2">
                        {inv.payment_link && hasBalance && (
                          <a
                            href={inv.payment_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-7 items-center gap-1 rounded-lg bg-violet-600 px-2.5 text-xs font-semibold text-white transition-colors hover:bg-violet-700"
                          >
                            <CreditCard className="h-3.5 w-3.5" /> Pay now
                          </a>
                        )}
                        {inv.pdf_url ? (
                          <a
                            href={inv.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-7 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50"
                          >
                            <FileText className="h-3.5 w-3.5" /> PDF
                          </a>
                        ) : (
                          <span className="inline-flex h-7 cursor-not-allowed items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-medium text-slate-300">
                            <FileText className="h-3.5 w-3.5" /> PDF
                          </span>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </CardContent>
    </Card>
  );
}
