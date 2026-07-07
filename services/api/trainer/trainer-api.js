import { apiClient } from "@/lib/api-client";

/* ──────────────────────────────────────
   TRAINER PORTAL
   ──────────────────────────────────────
   A trainer manages the trainings an admin has assigned to them and sets the
   day-wise session topics. The ONLY documented trainer endpoint (API.md §3.3) is
   the write:

     PATCH /trainer/sessions/:sessionId/topics   ← implemented for real below

   To drive the UI we also need two reads that aren't in the doc yet. They follow
   directly from the admin "assignment history" (GET /admin/trainers/:id), but
   scoped to the logged-in trainer and exposing session IDs:

     GET /trainer/trainings              → trainings where I'm the assigned trainer
     GET /trainer/trainings/:trainingRef → that training + its sessions (with id)

   Both are live as of API.md §3.3.1 / §3.3.2, so ENDPOINTS_READY is true. The
   pending machinery below is kept as a safety net (flip to false to fall back to
   the "waiting on endpoint" placeholder if a deploy ever lags).
   ────────────────────────────────────── */

export class TrainerEndpointPending extends Error {
  constructor(endpoint) {
    super(`Trainer endpoint not implemented yet: ${endpoint}`);
    this.name = "TrainerEndpointPending";
    this.pending = true;
    this.endpoint = endpoint;
  }
}

// Live (API.md §3.3.1 / §3.3.2). Set false only to force the placeholder state.
export const ENDPOINTS_READY = true;

/**
 * GET /trainer/trainings  (API.md §3.3.1 — trainings assigned to the caller)
 * Returns: { trainings: [{ id, code, title, status, delivery_mode, bucket,
 *   capacity, enrolled_count, start_date, end_date, timezone }] }
 * Only active assignments; empty list if none.
 */
export async function fetchMyTrainings({ token }) {
  if (!ENDPOINTS_READY) throw new TrainerEndpointPending("/trainer/trainings");
  return apiClient("/trainer/trainings", { token });
}

/**
 * GET /trainer/trainings/:trainingRef  (API.md §3.3.2 — UUID or code)
 * Returns a FLAT training object with `sessions[]` and `participants[]`:
 *   { id, training_id, title, delivery_mode, bucket, status, start_date, end_date,
 *     timezone, batch_type, venue,
 *     sessions: [{ id, day_number, planned_topics, start_time, end_time, status }],
 *     participants: [{ enrolment_id, participant_id, name, job_title, status, enrolled_at }] }
 * `sessions[].id` is the sessionId used by PATCH /trainer/sessions/:id/topics.
 * Roster privacy: `participants[]` intentionally omits email/phone/account state —
 * that's admin-only (API.md §3.2.11).
 * 403 if the caller isn't the currently-assigned trainer for this training.
 */
export async function fetchTrainerTrainingSessions({ token, trainingRef }) {
  if (!ENDPOINTS_READY) throw new TrainerEndpointPending(`/trainer/trainings/${trainingRef}`);
  return apiClient(`/trainer/trainings/${trainingRef}`, { token });
}

/**
 * PATCH /trainer/sessions/:sessionId/topics   (API.md §3.3 — REAL)
 * Body: { planned_topics }
 * The server enforces that the caller is the currently-assigned trainer for the
 * session's training (else 403). Returns { session: { id, day_number, planned_topics } }.
 */
export async function updateSessionTopics({ token, sessionId, plannedTopics }) {
  return apiClient(`/trainer/sessions/${sessionId}/topics`, {
    method: "PATCH",
    token,
    body: { planned_topics: plannedTopics },
  });
}
