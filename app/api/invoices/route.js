import { cookies } from "next/headers";

/**
 * GET /api/invoices
 *
 * Server-side proxy to the xCRM Client Invoices API. Runs only on the Next.js
 * server, so the CRM Bearer token (XCRM_TOKEN) is never shipped to the browser.
 * The invoices are keyed by the signed-in user's email (read from the session
 * cookie), so a user only ever sees their own invoices.
 *
 * CRM contract: GET {XCRM_API_URL}/client-invoices?email={email}
 * Returns: { client, count, invoices: [...] }  (normalized)
 */

// cookies() makes this dynamic already; keep it explicit so it is never cached.
export const dynamic = "force-dynamic";

const XCRM_API_URL = process.env.XCRM_API_URL;
const XCRM_TOKEN = process.env.XCRM_TOKEN;

function toNumber(v) {
  return v == null ? null : Number(v);
}

// Whitelist the fields the UI needs — avoids leaking unexpected CRM payload keys.
function normalizeInvoice(inv) {
  return {
    id: inv.id,
    document_type: inv.document_type ?? null, // "invoice" | "proforma"
    number: inv.number ?? inv.invoice_number ?? inv.proforma_number ?? null,
    invoice_number: inv.invoice_number ?? null,
    proforma_number: inv.proforma_number ?? null,
    parent_proforma_id: inv.parent_proforma_id ?? null,
    status: inv.status ?? null,
    program_name: inv.program_name ?? null,
    issue_date: inv.issue_date ?? null,
    due_date: inv.due_date ?? null,
    currency: inv.currency ?? null,
    subtotal: toNumber(inv.subtotal),
    tax_amount: toNumber(inv.tax_amount),
    total_amount: toNumber(inv.total_amount),
    paid_amount: toNumber(inv.paid_amount),
    balance_due: toNumber(inv.balance_due),
    payment_link: inv.payment_link ?? null,
    pdf_url: inv.pdf_url ?? null,
    created_at: inv.created_at ?? null,
  };
}

export async function GET() {
  // The signed-in user's email comes from the session cookie (`lms_user`),
  // written at login as encodeURIComponent(JSON.stringify(user)).
  const store = await cookies();
  const raw = store.get("lms_user")?.value;
  let email = null;
  if (raw) {
    try {
      email = JSON.parse(decodeURIComponent(raw))?.email ?? null;
    } catch {
      email = null;
    }
  }

  if (!email) {
    return Response.json({ error: "Not authenticated." }, { status: 401 });
  }
  if (!XCRM_API_URL || !XCRM_TOKEN) {
    return Response.json({ error: "The invoice service is not configured yet." }, { status: 503 });
  }

  const url = `${XCRM_API_URL}/client-invoices?email=${encodeURIComponent(email)}`;

  let res;
  try {
    res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${XCRM_TOKEN}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
  } catch {
    // Network error / timeout — CRM unreachable (e.g. prod still rolling out).
    return Response.json(
      { error: "Could not reach the invoice service. Please try again shortly." },
      { status: 502 }
    );
  }

  // No CRM client + no invoices for this email → an empty list, not an error.
  if (res.status === 404) {
    return Response.json({ client: null, count: 0, invoices: [] });
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    // 401 (bad integration token) / 5xx are our problem, not the caller's — mask as 502.
    const masked = res.status === 401 || res.status >= 500;
    return Response.json(
      { error: masked ? "The invoice service is temporarily unavailable." : (data?.error || "Could not load invoices.") },
      { status: masked ? 502 : res.status }
    );
  }

  const invoices = Array.isArray(data?.invoices) ? data.invoices.map(normalizeInvoice) : [];
  return Response.json({
    client: data?.client ?? null,
    count: data?.count ?? invoices.length,
    invoices,
  });
}
