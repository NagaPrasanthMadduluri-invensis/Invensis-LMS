import { apiClient } from "@/lib/api-client";

/* ──────────────────────────────────────
   SPONSOR PORTAL  (API.md §3.6)
   ──────────────────────────────────────
   A sponsor is the buyer of ≥1 order (API.md §1.5). They see:
     • the learners they sponsored
     • invoices & payment receipts

   These endpoints are capability-based: any authenticated user may call them
   and everything is scoped to the caller's own sponsored orders. A user who
   has sponsored nothing gets zeros / empty lists.

   ⚠️ Pricing note (API.md §3.6): invoice `amount` / `currency_code`,
   `outstanding_amount`, and `receipt_url` are currently `null`/`0` — the CRM
   order payload doesn't yet carry pricing and no receipt PDFs are generated.
   The UI already renders these gracefully ("—" / disabled download) so they
   light up automatically once pricing is populated.
   ────────────────────────────────────── */

/**
 * Retained for backwards compatibility with callers that branch on `err.pending`.
 * No longer thrown now that the endpoints are live (API.md §3.6).
 */
export class SponsorEndpointPending extends Error {
  constructor(endpoint) {
    super(`Sponsor endpoint not implemented yet: ${endpoint}`);
    this.name = "SponsorEndpointPending";
    this.pending = true;
    this.endpoint = endpoint;
  }
}

/**
 * GET /sponsor/learners  (API.md §3.6.2)
 * Learners this sponsor paid for (one row per enrolment; excludes transferred).
 * Returns: { learners: [{ id, name, email, training_code, training_title, status, enrolled_at }] }
 */
export async function fetchSponsoredLearners({ token }) {
  return apiClient("/sponsor/learners", { token });
}

/**
 * GET /sponsor/invoices  (API.md §3.6.3)
 * One invoice per order the sponsor placed, newest first.
 * Returns: { invoices: [{ id, order_number, course_name, amount, currency_code,
 *                         status, issued_at, receipt_url }] }
 */
export async function fetchSponsorInvoices({ token }) {
  return apiClient("/sponsor/invoices", { token });
}

/**
 * GET /sponsor/dashboard  (API.md §3.6.1)
 * Summary counts for the sponsor landing page.
 * Returns: { learners_count, active_count, invoices_count, outstanding_amount, currency_code }
 */
export async function fetchSponsorDashboard({ token }) {
  return apiClient("/sponsor/dashboard", { token });
}
