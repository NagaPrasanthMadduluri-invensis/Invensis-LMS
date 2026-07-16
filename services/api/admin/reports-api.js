import { apiClient } from "@/lib/api-client";

/*
 * Reports (admin) — a sales/revenue-first snapshot, distinct from analytics.
 * Backend: Server/src/modules/reports. Admin-only (Bearer token).
 */

function toQuery(filters = {}) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value != null && value !== "") params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

/**
 * GET /reports/sales
 * `filters` = { from?, to?, delivery_mode?, bucket?, status?, trainer_id?,
 * location?, duration?, sponsorship? } (any subset; blanks dropped).
 * Returns { generated_at, filters, currency, summary, sales_over_time,
 * sales_by_location, low_performing_locations, sales_by_course, sales_by_tier,
 * sales_by_sponsorship, sales_by_bucket, sales_by_delivery_mode,
 * trainer_options, location_options, duration_options }.
 */
export async function fetchSalesReport({ token, filters = {} }) {
  return apiClient(`/reports/sales${toQuery(filters)}`, { token });
}

/**
 * GET /reports/sales/records
 * Same filters plus { page?, limit? }. Returns { generated_at, page, limit,
 * total, returned, truncated, records: [...] } — one row per enrolment.
 */
export async function fetchSalesRecords({ token, filters = {} }) {
  return apiClient(`/reports/sales/records${toQuery(filters)}`, { token });
}
