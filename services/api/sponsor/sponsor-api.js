import { apiClient } from "@/lib/api-client";

/* ──────────────────────────────────────
   SPONSOR PORTAL
   ──────────────────────────────────────
   A sponsor is the buyer of ≥1 order (API.md §1.5). They see:
     • the learners they sponsored
     • invoices & payment receipts

   ⚠️ NOTE: As of the current API.md, the backend exposes the `sponsor`
   relationship only from the *learner's* side (the `sponsor` object on
   login/refresh/me = "who paid for me"). There is no documented endpoint yet
   to (a) list the learners a sponsor paid for, or (b) list a sponsor's
   invoices/receipts.

   These functions are written against the expected shapes so wiring is a
   one-line change once the endpoints ship. Until then they throw
   `SponsorEndpointPending` and the UI renders a "coming soon" placeholder.
   ────────────────────────────────────── */

export class SponsorEndpointPending extends Error {
  constructor(endpoint) {
    super(`Sponsor endpoint not implemented yet: ${endpoint}`);
    this.name = "SponsorEndpointPending";
    this.pending = true;
    this.endpoint = endpoint;
  }
}

// Flip to false (and confirm the paths) once the backend ships these.
const ENDPOINTS_READY = false;

/**
 * GET /sponsor/learners  (proposed)
 * Learners this sponsor paid for.
 * Expected: { learners: [{ id, name, email, training_code, training_title, status, enrolled_at }] }
 */
export async function fetchSponsoredLearners({ token }) {
  if (!ENDPOINTS_READY) throw new SponsorEndpointPending("/sponsor/learners");
  return apiClient("/sponsor/learners", { token });
}

/**
 * GET /sponsor/invoices  (proposed)
 * Invoices & payment receipts for this sponsor's orders.
 * Expected: { invoices: [{ id, order_number, course_name, amount, currency_code,
 *                          status, issued_at, receipt_url }] }
 */
export async function fetchSponsorInvoices({ token }) {
  if (!ENDPOINTS_READY) throw new SponsorEndpointPending("/sponsor/invoices");
  return apiClient("/sponsor/invoices", { token });
}

/**
 * GET /sponsor/dashboard  (proposed)
 * Summary counts for the sponsor landing page.
 * Expected: { learners_count, active_count, invoices_count, outstanding_amount, currency_code }
 */
export async function fetchSponsorDashboard({ token }) {
  if (!ENDPOINTS_READY) throw new SponsorEndpointPending("/sponsor/dashboard");
  return apiClient("/sponsor/dashboard", { token });
}
