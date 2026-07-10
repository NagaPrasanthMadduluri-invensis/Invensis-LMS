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

/** GET /admin/trainers → { trainers: [...] } (active trainers for assignment) */
export async function fetchTrainers({ token }) {
  return apiClient("/admin/trainers", { token });
}

/**
 * GET /admin/participants?search=&page=&limit= → { participants: [...], total, page, limit }
 * Paginated list of all participants (learners), searchable by name/email.
 */
export async function fetchParticipants({ token, search = "", page = 1, limit = 20 }) {
  const params = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (search) params.set("search", search);
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
   TRAINERS (onboard / profile / edit)
   ────────────────────────────────────── */

/**
 * POST /admin/trainers — onboard a trainer (creates the users account if new).
 * data = { name, email, password?, bio?, experience?, rate?, certificates? }
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
 * data = any subset of { name, bio, experience, rate, certificates, is_active }
 * Returns { trainer }.
 */
export async function updateTrainer({ token, trainerId, data }) {
  return apiClient(`/admin/trainers/${trainerId}`, { method: "PATCH", token, body: data });
}

/* ──────────────────────────────────────
   PARTICIPANTS & ENROLMENTS
   ────────────────────────────────────── */

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
