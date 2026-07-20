/**
 * Client invoices — served by the Next.js route handler at /api/invoices,
 * which proxies the xCRM Client Invoices API server-side (the CRM token never
 * reaches the browser). Keyed by the signed-in user's email from the session.
 *
 * This hits the SAME Next.js origin (not the Express backend), so it does not
 * go through `apiClient` (which targets NEXT_PUBLIC_API_URL).
 *
 * Returns: {
 *   client: { id, name, email, company, status } | null,
 *   count: number,
 *   invoices: [{ id, document_type, number, invoice_number, proforma_number,
 *                parent_proforma_id, status, program_name, issue_date, due_date,
 *                currency, subtotal, tax_amount, total_amount, paid_amount,
 *                balance_due, payment_link, pdf_url, created_at }]
 * }
 */
export async function fetchInvoices() {
  const res = await fetch("/api/invoices", {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "include",
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.error || "Could not load invoices.");
  }
  return data;
}
