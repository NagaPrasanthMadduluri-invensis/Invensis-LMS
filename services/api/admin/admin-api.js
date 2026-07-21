import { apiClient } from "@/lib/api-client";

/* ──────────────────────────────────────
   TRAININGS (Training IDs)  — new TMS backend
   ────────────────────────────────────── */

/** GET /admin/trainings → { trainings: [...] } */
export async function fetchAdminTrainings({ token }) {
  return apiClient("/admin/trainings", { token });
}

/**
 * GET /admin/trainings/:trainingRef → full detail (schedule, trainer, participants)
 * `trainingRef` may be the training UUID or its code (e.g. "TRN-2026-0001").
 */
export async function fetchAdminTrainingDetail({ token, trainingRef }) {
  return apiClient(`/admin/trainings/${trainingRef}`, { token });
}

/**
 * GET /admin/trainers → { trainers: [...] }
 * Each trainer: { id, name, email, bio, experience, rate, certificates,
 *   specializations, city, country, is_remote, location, is_active }.
 * Defaults to active trainers only (for the assignment picker). Pass
 * includeInactive=true for the admin management table so deactivated trainers
 * remain visible/editable.
 */
export async function fetchTrainers({ token, includeInactive = false } = {}) {
  const qs = includeInactive ? "?include_inactive=true" : "";
  return apiClient(`/admin/trainers${qs}`, { token });
}

/**
 * GET /admin/participants?search=&location=&job_title=&page=&limit=
 *   → { participants: [...], total, page, limit, filters: { job_titles, locations } }
 * Paginated list of all participants (learners), searchable by name/email and
 * filterable by location and job title.
 */
export async function fetchParticipants({ token, search = "", location = "", jobTitle = "", page = 1, limit = 20 }) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
  if (location) params.set("location", location);
  if (jobTitle) params.set("job_title", jobTitle);
  return apiClient(`/admin/participants?${params.toString()}`, { token });
}

/**
 * PATCH /admin/trainings/:trainingRef
 * Generic training update. Two independent, both-optional operations — pass any
 * of: trainer_id, meeting_url, meeting_platform ("zoom"|"teams"|"other"),
 * meeting_released, min_seats_override. At least one field required.
 * Returns { training } with the updated meeting/trainer state.
 */
export async function updateTraining({ token, trainingRef, data }) {
  return apiClient(`/admin/trainings/${trainingRef}`, {
    method: "PATCH",
    token,
    body: data,
  });
}

/** PATCH /admin/trainings/:trainingRef { trainer_id } → assigns a trainer */
export async function assignTrainer({ token, trainingRef, trainerId }) {
  return updateTraining({ token, trainingRef, data: { trainer_id: trainerId } });
}

/**
 * PATCH /admin/trainings/:trainingRef — set/release the meeting link.
 * data = { meeting_url?, meeting_platform?, meeting_released?, min_seats_override? }
 * Releasing (meeting_released: true) requires enrolled_count ≥ min_seats unless
 * min_seats_override is set — otherwise the API returns 422.
 */
export async function updateMeeting({ token, trainingRef, data }) {
  return updateTraining({ token, trainingRef, data });
}

/**
 * POST /admin/trainings/:trainingRef/participants
 * data = { name, email, phone?, job_title? }
 */
export async function addParticipant({ token, trainingRef, data }) {
  return apiClient(`/admin/trainings/${trainingRef}/participants`, {
    method: "POST",
    token,
    body: data,
  });
}

/* ──────────────────────────────────────
   SURVEYS (post/pre-training feedback)  — API §3.7
   ────────────────────────────────────── */

/**
 * POST /admin/trainings/:trainingRef/surveys  (API §3.7.1)
 * Create (assign) a survey for a training. `trainingRef` may be the UUID or code.
 * body = { type: "pre_training"|"post_training", title, questions[] } — `questions`
 * is a non-empty array of question objects (frontend-owned shape). Returns
 * { survey: { id, training_id, type, title, questions, assigned_at } }.
 */
export async function createTrainingSurvey({ token, trainingRef, type = "post_training", title, questions }) {
  return apiClient(`/admin/trainings/${trainingRef}/surveys`, {
    method: "POST",
    token,
    body: { type, title, questions },
  });
}

/**
 * GET /admin/trainings/:trainingRef/surveys  (API §3.7.2)
 * List a training's surveys, each with a `response_count`.
 * Returns { surveys: [{ id, training_id, type, title, questions, assigned_at, response_count }] }.
 */
export async function fetchTrainingSurveys({ token, trainingRef }) {
  return apiClient(`/admin/trainings/${trainingRef}/surveys`, { token });
}

/**
 * GET /admin/surveys/:surveyId/responses  (API §3.7.3)
 * All responses for a survey (analytics). Returns
 * { survey: {...}, responses: [{ id, participant_id, name, email, answers, submitted_at }] }.
 */
export async function fetchSurveyResponses({ token, surveyId }) {
  return apiClient(`/admin/surveys/${surveyId}/responses`, { token });
}

/* ──────────────────────────────────────
   TRAINERS (onboard / profile / edit)
   ────────────────────────────────────── */

/**
 * POST /admin/trainers — onboard a trainer (creates the users account if new).
 * data = { name, email, password?, bio?, experience?, rate?, certificates?,
 *   specializations?, city?, country?, is_remote? }
 * Only name + email are required. Returns { trainer }.
 */
export async function createTrainer({ token, data }) {
  return apiClient("/admin/trainers", { method: "POST", token, body: data });
}

/** GET /admin/trainers/:trainerId → trainer profile + assignment history */
export async function fetchTrainerDetail({ token, trainerId }) {
  return apiClient(`/admin/trainers/${trainerId}`, { token });
}

/**
 * PATCH /admin/trainers/:trainerId — edit / deactivate.
 * data = any subset of { name, email, bio, experience, rate, certificates,
 *   specializations, city, country, is_remote, is_active }
 * Changing email re-points the login identity (guarded against duplicates).
 * Returns { trainer }.
 */
export async function updateTrainer({ token, trainerId, data }) {
  return apiClient(`/admin/trainers/${trainerId}`, { method: "PATCH", token, body: data });
}

/* ──────────────────────────────────────
   PARTICIPANTS & ENROLMENTS
   ────────────────────────────────────── */

/**
 * GET /admin/participants/:participantId — full participant profile plus every
 * training they enrolled in. Returns { participant, enrolments: [{ enrolment_id,
 * training_id, training_code, title, bucket, delivery_mode, training_status,
 * status, attendance_status, start_date, end_date, enrolled_at, added_manually,
 * certificate_issued, certificate_code, category }], summary: { total, completed,
 * ongoing, upcoming, inactive, certificates } }. `category` is one of
 * completed | ongoing | upcoming | cancelled | transferred | failed.
 */
export async function fetchParticipantDetail({ token, participantId }) {
  return apiClient(`/admin/participants/${participantId}`, { token });
}

/**
 * PATCH /admin/participants/:participantId — edit a participant.
 * data = any subset of { name, phone, job_title } (email is not editable).
 * Returns { participant }.
 */
export async function updateParticipant({ token, participantId, data }) {
  return apiClient(`/admin/participants/${participantId}`, { method: "PATCH", token, body: data });
}

/**
 * PATCH /admin/enrolments/:enrolmentId/cancel — cancel an enrolment (frees seat).
 * Reason is required and audited. Returns { id, status }.
 */
export async function cancelEnrolment({ token, enrolmentId, reason }) {
  return apiClient(`/admin/enrolments/${enrolmentId}/cancel`, {
    method: "PATCH",
    token,
    body: { reason },
  });
}

/**
 * PATCH /admin/enrolments/:enrolmentId/transfer — move a participant to another
 * training. trainingId accepts a UUID or code. Reason required and audited.
 * Returns { from_enrolment_id, to_enrolment_id, to_training, status }.
 */
export async function transferEnrolment({ token, enrolmentId, trainingId, reason }) {
  return apiClient(`/admin/enrolments/${enrolmentId}/transfer`, {
    method: "PATCH",
    token,
    body: { training_id: trainingId, reason },
  });
}

/**
 * PATCH /admin/enrolments/:enrolmentId/complete — mark one enrolment
 * 'completed' (learner successfully finished the training). One-way; only a
 * confirmed enrolment can be completed. Drives certificate eligibility in the
 * learner portal. Returns { id, status }.
 */
export async function completeEnrolment({ token, enrolmentId }) {
  return apiClient(`/admin/enrolments/${enrolmentId}/complete`, {
    method: "PATCH",
    token,
  });
}

/**
 * PATCH /admin/trainings/:trainingRef/enrolments/complete-all — mark every
 * currently-confirmed participant in the training 'completed' in one go.
 * Already-completed / cancelled / transferred enrolments are skipped.
 * Returns { training_id, completed } (count actually completed).
 */
export async function completeAllEnrolments({ token, trainingRef }) {
  return apiClient(`/admin/trainings/${trainingRef}/enrolments/complete-all`, {
    method: "PATCH",
    token,
  });
}

/* ──────────────────────────────────────
   COURSES
   ────────────────────────────────────── */

/**
 * GET /lms/admin/courses
 * Returns { courses: [...] }
 */
export async function fetchAdminCourses({ token }) {
  return apiClient("/lms/admin/courses", { token });
}

/* ──────────────────────────────────────
   DASHBOARD
   ────────────────────────────────────── */

/**
 * GET /admin/dashboard  (§3.2.0)
 * Single overview snapshot for the admin dashboard landing page.
 * Returns { generated_at, users, trainers, courses, enrolments, certificates,
 *           tickets, upcoming_trainings, completed_trainings,
 *           recent_enrolments, recent_trainers }
 */
export async function fetchAdminOverview({ token }) {
  return apiClient("/admin/dashboard", { token });
}

/**
 * GET /admin/analytics
 * Filterable analytics snapshot powering the dynamic dashboard charts.
 * `filters` = { from?, to?, delivery_mode?, bucket?, status?, trainer_id? }
 * (any subset; empty/blank values are dropped). Returns { generated_at,
 * filters, summary, enrolments_over_time, participant_growth,
 * trainings_over_time, sessions_over_time, trainings_by_status,
 * trainings_by_delivery_mode, trainings_by_bucket, enrolments_by_status,
 * sessions_by_status, capacity_by_bucket, top_trainers, upcoming_trainings,
 * trainer_options }.
 */
export async function fetchAdminAnalytics({ token, filters = {} }) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value != null && value !== "") params.set(key, value);
  }
  const qs = params.toString();
  return apiClient(`/admin/analytics${qs ? `?${qs}` : ""}`, { token });
}

/**
 * GET /admin/certificates
 * Completed trainings + their certificate-issuance status. Returns
 * { generated_at, summary: { completed_trainings, certificates_issued, eligible,
 * issuance_rate }, trainings: [{ id, code, title, delivery_mode, bucket,
 * start_date, end_date, trainer_name, participants, eligible, issued, status }] }.
 */
export async function fetchAdminCertificates({ token }) {
  return apiClient("/admin/certificates", { token });
}

/**
 * GET /lms/admin/dashboard
 * Returns { stats, recent_users, recent_orders }
 */
export async function fetchAdminDashboard({ token }) {
  return apiClient("/lms/admin/dashboard", { token });
}

export async function fetchAdminDashboardStats({ token }) {
  const data = await fetchAdminDashboard({ token });
  return data.stats;
}

export async function fetchRecentUsers({ token }) {
  const data = await fetchAdminDashboard({ token });
  return data.recent_users;
}

export async function fetchRecentOrders({ token }) {
  const data = await fetchAdminDashboard({ token });
  return data.recent_orders;
}

/* ──────────────────────────────────────
   SUPPORT TICKETS
   ────────────────────────────────────── */

/**
 * GET /admin/tickets?status=&category=&search=
 * All learner-raised tickets, newest first, each with the raiser + related
 * training joined. Returns { tickets: [{ id, code, category, priority, status,
 * subject, description, training: { id, code, title } | null, learner: { id,
 * name, email }, created_at, updated_at, resolved_at }],
 * summary: { total, open, in_progress, resolved, closed } }.
 */
export async function fetchAdminTickets({ token, status = "", category = "", search = "" } = {}) {
  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  if (category) qs.set("category", category);
  if (search) qs.set("search", search);
  const q = qs.toString();
  return apiClient(`/admin/tickets${q ? `?${q}` : ""}`, { token });
}

/** GET /admin/tickets/:ticketId → { ticket } (full detail). */
export async function fetchAdminTicket({ token, ticketId }) {
  return apiClient(`/admin/tickets/${ticketId}`, { token });
}

/**
 * PATCH /admin/tickets/:ticketId { status } — move a ticket through its
 * lifecycle (open → in_progress → resolved → closed). Returns { ticket }.
 */
export async function updateTicketStatus({ token, ticketId, status }) {
  return apiClient(`/admin/tickets/${ticketId}`, { method: "PATCH", token, body: { status } });
}

/**
 * POST /admin/tickets/:ticketId/messages { body } — admin reply on the ticket's
 * conversation thread. Returns the full { ticket } including its messages[].
 */
export async function replyToAdminTicket({ token, ticketId, body }) {
  return apiClient(`/admin/tickets/${ticketId}/messages`, { method: "POST", token, body: { body } });
}

/* ──────────────────────────────────────
   ORDERS (proxied from xCRM)
   ────────────────────────────────────── */

export async function fetchOrders({ token, page = 1, limit = 20, search = "", status = "" }) {
  const qs = new URLSearchParams({ page, limit });
  if (search) qs.set("search", search);
  if (status) qs.set("status", status);
  return apiClient(`/lms/admin/orders?${qs.toString()}`, { token });
}

/* ──────────────────────────────────────
   RESOURCES CRUD
   ────────────────────────────────────── */

export async function fetchResources({ token, courseId }) {
  return apiClient(`/lms/admin/courses/${courseId}/resources`, { token });
}
export async function createResource({ token, courseId, data }) {
  return apiClient(`/lms/admin/courses/${courseId}/resources`, { method: "POST", token, body: data });
}
export async function updateResource({ token, resourceId, data }) {
  return apiClient(`/lms/admin/resources/${resourceId}`, { method: "PUT", token, body: data });
}
export async function deleteResource({ token, resourceId }) {
  return apiClient(`/lms/admin/resources/${resourceId}`, { method: "DELETE", token });
}

/* ──────────────────────────────────────
   ENROLLMENT RESOURCE ASSIGNMENT
   ────────────────────────────────────── */

export async function fetchCourseEnrollments({ token, courseId }) {
  return apiClient(`/lms/admin/courses/${courseId}/enrollments`, { token });
}
export async function assignResourceToEnrollment({ token, enrollmentId, resourceId }) {
  return apiClient(`/lms/admin/enrollments/${enrollmentId}/resources`, {
    method: "POST", token, body: { resource_id: resourceId },
  });
}
export async function unassignResourceFromEnrollment({ token, enrollmentId, resourceId }) {
  return apiClient(`/lms/admin/enrollments/${enrollmentId}/resources/${resourceId}`, {
    method: "DELETE", token,
  });
}

/* ──────────────────────────────────────
   MODULES CRUD
   ────────────────────────────────────── */

/**
 * GET /lms/admin/courses/{courseId}/assessments
 * Returns { assessments: [...] }
 */
export async function fetchAssessments({ token, courseId }) {
  return apiClient(`/lms/admin/courses/${courseId}/assessments`, { token });
}

/**
 * GET /lms/admin/courses/{courseId}/modules
 * Returns { modules: [...] }
 */
export async function fetchModules({ token, courseId }) {
  return apiClient(`/lms/admin/courses/${courseId}/modules`, { token });
}

/**
 * POST /lms/admin/courses/{courseId}/modules
 * Returns { module: {...} }
 */
export async function createModule({ token, courseId, data }) {
  return apiClient(`/lms/admin/courses/${courseId}/modules`, {
    method: "POST",
    token,
    body: data,
  });
}

/**
 * PUT /lms/admin/modules/{moduleId}
 * Returns { module: {...} }
 */
export async function updateModule({ token, moduleId, data }) {
  return apiClient(`/lms/admin/modules/${moduleId}`, {
    method: "PUT",
    token,
    body: data,
  });
}

/**
 * DELETE /lms/admin/modules/{moduleId}
 * Returns 204 No Content
 */
export async function deleteModule({ token, moduleId }) {
  return apiClient(`/lms/admin/modules/${moduleId}`, {
    method: "DELETE",
    token,
  });
}

/* ──────────────────────────────────────
   LESSONS CRUD
   ────────────────────────────────────── */

/**
 * GET /lms/admin/modules/{moduleId}/lessons
 * Returns { lessons: [...] }
 */
export async function fetchLessons({ token, moduleId }) {
  return apiClient(`/lms/admin/modules/${moduleId}/lessons`, { token });
}

/**
 * POST /lms/admin/modules/{moduleId}/lessons
 * Returns { lesson: {...} }
 */
export async function createLesson({ token, moduleId, data }) {
  return apiClient(`/lms/admin/modules/${moduleId}/lessons`, {
    method: "POST",
    token,
    body: data,
  });
}

/**
 * PUT /lms/admin/lessons/{lessonId}
 * Returns { lesson: {...} }
 */
export async function updateLesson({ token, lessonId, data }) {
  return apiClient(`/lms/admin/lessons/${lessonId}`, {
    method: "PUT",
    token,
    body: data,
  });
}

/**
 * DELETE /lms/admin/lessons/{lessonId}
 * Returns 204 No Content
 */
export async function deleteLesson({ token, lessonId }) {
  return apiClient(`/lms/admin/lessons/${lessonId}`, {
    method: "DELETE",
    token,
  });
}

/* ──────────────────────────────────────
   ATTENDANCE  (API.md §3.8.3 / §3.8.5)
   ────────────────────────────────────── */

/**
 * GET /admin/trainings/:trainingRef/attendance  (API.md §3.8.3, ref = UUID or code)
 * Attendance matrix (sessions × participants) for one training.
 * Returns: {
 *   training_id, title,
 *   sessions: [{ id, day_number, start_time, status }],
 *   participants: [{ participant_id, name, email, overall_status: "present"|"partial"|"absent",
 *     attended, total_sessions, attendance: { "<sessionId>": "present"|"absent"|"late"|"excused"|null } }]
 * }
 */
export async function fetchTrainingAttendance({ token, trainingRef }) {
  return apiClient(`/admin/trainings/${trainingRef}/attendance`, { token });
}

/**
 * GET /reports/attendance?format=csv&training_id=:ref  (API.md §3.8.5)
 * Streams a CSV attendance export. `apiClient` returns the raw Response for
 * non-JSON content types, so the caller reads `.blob()` and triggers a download.
 */
export async function downloadTrainingAttendanceCsv({ token, trainingRef }) {
  return apiClient(`/reports/attendance?format=csv&training_id=${encodeURIComponent(trainingRef)}`, { token });
}
