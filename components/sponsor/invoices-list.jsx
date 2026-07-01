"use client";

import { useEffect, useState } from "react";
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
import { Receipt, Download } from "lucide-react";
import Text from "@/components/ui/text";
import Box from "@/components/ui/box";
import { useAuth } from "@/hooks/use-auth";
import { fetchSponsorInvoices } from "@/services/api/sponsor/sponsor-api";

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
  const { token, user } = useAuth();
  const [invoices, setInvoices] = useState(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token || !user) return;

    fetchSponsorInvoices({ token })
      .then((res) => setInvoices(res.invoices ?? []))
      .catch((err) => {
        if (err?.pending) setPending(true);
        else setError(err.message);
      });
  }, [token, user]);

  if (error) {
    return (
      <Card className="p-6">
        <Text as="p" className="text-red-600">Failed to load invoices: {error}</Text>
      </Card>
    );
  }

  if (!invoices && !pending) return <TableSkeleton />;

  const rows = invoices ?? [];

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Box className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
            <Receipt className="h-6 w-6 text-amber-600" />
          </Box>
          <Text as="h3" className="text-sm font-semibold">No invoices yet</Text>
          <Text as="p" className="text-xs text-muted-foreground mt-1 max-w-sm">
            {pending
              ? "Your invoices and payment receipts will appear here once this becomes available."
              : "Invoices for courses you've purchased will appear here."}
          </Text>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Receipt</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell>
                  <Text as="p" className="text-sm font-medium">{inv.order_number || inv.id}</Text>
                  <Text as="span" className="text-[11px] text-muted-foreground">
                    {inv.issued_at ? new Date(inv.issued_at).toLocaleDateString() : ""}
                  </Text>
                </TableCell>
                <TableCell className="text-sm">{inv.course_name || "—"}</TableCell>
                <TableCell className="text-sm">
                  {`${inv.currency_code || ""} ${inv.amount ?? ""}`.trim() || "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className={inv.status === "paid"
                      ? "bg-emerald-100 text-emerald-700 text-[10px]"
                      : "bg-red-100 text-red-700 text-[10px]"}
                  >
                    {inv.status || "—"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    asChild={!!inv.receipt_url}
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 px-3"
                    disabled={!inv.receipt_url}
                  >
                    {inv.receipt_url ? (
                      <a href={inv.receipt_url} target="_blank" rel="noopener noreferrer">
                        <Download className="h-3.5 w-3.5 mr-1" /> Download
                      </a>
                    ) : (
                      <span><Download className="h-3.5 w-3.5 mr-1" /> Download</span>
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
