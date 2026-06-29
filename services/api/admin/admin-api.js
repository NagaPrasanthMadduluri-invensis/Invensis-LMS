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

/** PATCH /admin/trainings/:trainingRef { trainer_id } → assigns a trainer */
export async function assignTrainer({ token, trainingRef, trainerId }) {
  return apiClient(`/admin/trainings/${trainingRef}`, {
    method: "PATCH",
    token,
    body: { trainer_id: trainerId },
  });
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
