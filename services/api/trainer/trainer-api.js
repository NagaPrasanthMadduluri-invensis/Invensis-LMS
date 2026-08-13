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

/* ──────────────────────────────────────
   SELF-SERVICE PROFILE
   ────────────────────────────────────── */

/**
 * GET /trainer/profile — the logged-in trainer's own profile.
 * Returns { trainer: { id, name, email, bio, experience, rate, certificates,
 *   specializations, city, country, is_remote, location, resume_key,
 *   resume_url (short-lived presigned GET or null), is_active } }.
 */
export async function fetchMyTrainerProfile({ token }) {
  return apiClient("/trainer/profile", { token });
}

/**
 * PATCH /trainer/profile — update own details.
 * Body: any subset of { name, bio, experience, certificates, specializations,
 *   city, country, is_remote, resume_key }. Send null to clear a nullable field.
 * `rate`, `is_active`, and `email` are admin-only and not accepted here.
 * Returns the same shape as fetchMyTrainerProfile.
 */
export async function updateMyTrainerProfile({ token, data }) {
  return apiClient("/trainer/profile", { method: "PATCH", token, body: data });
}

/**
 * POST /trainer/profile/resume-upload-url
 * Body: { content_type: "application/pdf" }
 * Returns { upload_url, resume_key, method, headers, expires_in } — a presigned
 * PUT URL for direct-to-storage upload. The API never receives the file bytes.
 */
export async function getResumeUploadUrl({ token }) {
  return apiClient("/trainer/profile/resume-upload-url", {
    method: "POST",
    token,
    body: { content_type: "application/pdf" },
  });
}

/**
 * PUT the raw PDF bytes to the presigned URL from getResumeUploadUrl.
 * Bypasses apiClient — different origin (object storage), no auth header.
 */
export async function uploadResumeFile({ uploadUrl, headers, file }) {
  const res = await fetch(uploadUrl, { method: "PUT", headers, body: file });
  if (!res.ok) throw new Error("Failed to upload resume. Please try again.");
}

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

/**
 * GET /trainer/sessions/:sessionId/attendance  (API.md §3.8.1)
 * Roster for a session with each participant's current status.
 * Returns: { session: { id, day_number, start_time, end_time, status },
 *   participants: [{ participant_id, name, job_title, status: "present"|"absent"|"late"|"excused"|null }] }
 * 403 if the caller isn't the assigned trainer; 404 if the session doesn't exist.
 */
export async function fetchSessionAttendance({ token, sessionId }) {
  return apiClient(`/trainer/sessions/${sessionId}/attendance`, { token });
}

/**
 * PUT /trainer/sessions/:sessionId/attendance  (API.md §3.8.2)
 * Bulk mark/update attendance (idempotent upsert). Rolls up each affected
 * enrolment's overall status on the backend.
 * Body: { records: [{ participant_id, status: "present"|"absent"|"late"|"excused" }] } (≥1)
 * Returns: { session_id, marked, records: [{ participant_id, status }] }
 */
export async function markSessionAttendance({ token, sessionId, records }) {
  return apiClient(`/trainer/sessions/${sessionId}/attendance`, {
    method: "PUT",
    token,
    body: { records },
  });
}
