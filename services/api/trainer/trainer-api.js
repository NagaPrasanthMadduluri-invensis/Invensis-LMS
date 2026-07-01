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

   Until the backend ships those two, they throw `TrainerEndpointPending` and the
   UI shows a clear "waiting on endpoint" state. Flip ENDPOINTS_READY to true (and
   confirm the paths/shapes) to light the portal up — no other change needed.
   ────────────────────────────────────── */

export class TrainerEndpointPending extends Error {
  constructor(endpoint) {
    super(`Trainer endpoint not implemented yet: ${endpoint}`);
    this.name = "TrainerEndpointPending";
    this.pending = true;
    this.endpoint = endpoint;
  }
}

// Flip to true once GET /trainer/trainings and GET /trainer/trainings/:ref ship.
export const ENDPOINTS_READY = false;

/**
 * GET /trainer/trainings  (derived from assignment history, scoped to me)
 * Expected: { trainings: [{ id, code, title, status, delivery_mode,
 *   start_date, end_date, timezone, enrolled_count, capacity, assigned_at }] }
 */
export async function fetchMyTrainings({ token }) {
  if (!ENDPOINTS_READY) throw new TrainerEndpointPending("/trainer/trainings");
  return apiClient("/trainer/trainings", { token });
}

/**
 * GET /trainer/trainings/:trainingRef
 * Expected: {
 *   training: { id, training_id, title, delivery_mode, status, start_date, end_date,
 *               start_time, end_time, timezone, session_dates },
 *   sessions: [{ id, day_number, planned_topics, start_time, end_time, status }]
 * }
 * `sessions[].id` is required so the trainer can PATCH each session's topics.
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
