import { apiClient } from "@/lib/api-client";

/**
 * GET /learner/dashboard  (API.md §3.1.0)
 * Single overview snapshot for the learner landing page. Scoped to the caller's
 * own enrolments (not role-gated). Returns:
 *   { generated_at, learner, stats, my_courses{in_progress[],upcoming[],completed[]},
 *     certificates[], journey[], upcoming_cohorts[] }
 */
export async function fetchLearnerDashboard({ token }) {
  return apiClient(`/learner/dashboard`, { token });
}

/**
 * GET /lms/courses?user_id=X
 * Returns { courses: [...] }
 */
export async function fetchMyCourses({ token, userId }) {
  return apiClient(`/lms/courses`, { token });
}

/**
 * GET /learner/trainings
 * Every training the caller is enrolled in (their "My Enrolments" list),
 * newest first. Each item:
 *   { id, code, title, delivery_mode, status, start_date, end_date, timezone,
 *     enrolment_status, meeting_released, enrolled_at, trainer_name,
 *     sponsorship, sponsor_email, certificate_id, certificate_issued,
 *     certificate_issued_at }
 * `trainer_name`/`sponsor_email`/`certificate_id` are null when absent.
 */
export async function fetchMyTrainings({ token }) {
  return apiClient(`/learner/trainings`, { token });
}

/**
 * GET /learner/certificates
 * The caller's training certificates (one per completed enrolment). Each item:
 *   { training_id, training_code, title, delivery_mode, start_date, end_date,
 *     participant_name, activity_id, certificate_id, issued, issued_at,
 *     completed_at }
 * `issued` is true once the learner has submitted the feedback survey.
 */
export async function fetchCertificates({ token }) {
  return apiClient(`/learner/certificates`, { token });
}

/**
 * GET /learner/certificates/:trainingRef
 * Printable certificate data. 403 until the survey has been submitted.
 */
export async function fetchCertificate({ token, trainingRef }) {
  return apiClient(`/learner/certificates/${trainingRef}`, { token });
}

/**
 * GET /learner/surveys  (API §3.7.4)
 * Post/pre-training surveys attached to the caller's enrolled trainings
 * (excludes cancelled/transferred enrolments). Capability-based (no role gate).
 * Each item: { id, type, title, questions[], training_code, training_title,
 *   assigned_at, answered }. `answered` flips to true once the caller submits.
 */
export async function fetchLearnerSurveys({ token }) {
  return apiClient(`/learner/surveys`, { token });
}

/**
 * POST /learner/surveys/:surveyId/responses  (API §3.7.5)
 * Submit a survey response. `answers` is a non-empty { questionId: answer } map.
 * The backend stores it against the training + participant; one response per
 * participant per survey. Returns { id, survey_id, submitted_at }.
 */
export async function submitSurveyResponse({ token, surveyId, answers }) {
  return apiClient(`/learner/surveys/${surveyId}/responses`, {
    method: "POST",
    token,
    body: { answers },
  });
}

/**
 * GET /learner/training/:trainingRef
 * `trainingRef` may be the training UUID or its code (e.g. "TRN-2026-0001").
 * Returns the full training schedule detail:
 *   { training_id, title, delivery_mode, bucket, status, duration_hours,
 *     capacity, min_seats, enrolled_count, batch_type, timezone,
 *     start_date, end_date, start_time, end_time, session_dates, venue,
 *     trainer, sessions[], days_left, meeting? }
 * Requires role `learner` with a confirmed enrolment.
 */
export async function fetchTrainingDetail({ token, trainingRef }) {
  return apiClient(`/learner/training/${trainingRef}`, { token });
}

/**
 * GET /lms/courses/:courseId?user_id=X
 * Returns { course, enrollment, modules[] }
 */
export async function fetchCourseDetail({ token, courseId, userId }) {
  const query = userId ? `?user_id=${userId}` : "";
  return apiClient(`/lms/courses/${courseId}${query}`, { token });
}

/**
 * GET /lms/courses/:courseId/lessons/:lessonId?user_id=X
 * Returns { lesson, progress_status }
 */
export async function fetchLessonContent({ token, courseId, lessonId, userId }) {
  const query = userId ? `?user_id=${userId}` : "";
  return apiClient(`/lms/courses/${courseId}/lessons/${lessonId}${query}`, { token });
}

/**
 * GET /lms/courses/:courseId/resources
 * Returns { resources: [...] } — requires active enrollment
 */
export async function fetchCourseResources({ token, courseId }) {
  return apiClient(`/lms/courses/${courseId}/resources`, { token });
}

/**
 * GET /lms/courses/:courseId/assessments
 * Returns { assessments: [...] } — requires active enrollment
 */
export async function fetchCourseAssessments({ token, courseId }) {
  return apiClient(`/lms/courses/${courseId}/assessments`, { token });
}

/**
 * POST /lms/courses/:courseId/lessons/:lessonId/complete
 */
export async function markLessonComplete({ token, courseId, lessonId, userId }) {
  return apiClient(`/lms/courses/${courseId}/lessons/${lessonId}/complete`, {
    method: "POST",
    token,
    body: { user_id: userId },
  });
}

/**
 * Placeholder — course catalog (public / ISR)
 */
export async function fetchCourseCatalog() {
  return [
    { name: "PMP Certification Prep", hours: "35 hrs", modules: "8 modules", rating: 4.8, stars: 4, price: "₹49,999", tier: "Gold", tierBg: "bg-gradient-to-r from-amber-400 to-amber-600", gradient: "from-indigo-400/60 to-purple-500/60" },
    { name: "ITIL 4 Foundation", hours: "24 hrs", modules: "6 modules", rating: 4.6, stars: 4, price: "₹34,999", tier: "Silver", tierBg: "bg-gradient-to-r from-gray-400 to-gray-600", gradient: "from-emerald-400/60 to-teal-500/60" },
    { name: "Scrum Master (CSM)", hours: "20 hrs", modules: "5 modules", rating: 4.5, stars: 4, price: "₹19,999", tier: "Bronze", tierBg: "bg-gradient-to-r from-orange-300 to-orange-500", gradient: "from-orange-400/60 to-red-500/60" },
    { name: "Six Sigma Green Belt", hours: "30 hrs", modules: "7 modules", rating: 4.7, stars: 5, price: "₹39,999", tier: "Gold", tierBg: "bg-gradient-to-r from-amber-400 to-amber-600", gradient: "from-cyan-400/60 to-blue-500/60" },
    { name: "PRINCE2 Foundation", hours: "22 hrs", modules: "6 modules", rating: 4.4, stars: 4, price: "₹29,999", tier: "Silver", tierBg: "bg-gradient-to-r from-gray-400 to-gray-600", gradient: "from-pink-400/60 to-rose-500/60" },
    { name: "PMI-ACP Certification", hours: "28 hrs", modules: "7 modules", rating: 4.6, stars: 4, price: "₹44,999", tier: "Gold", tierBg: "bg-gradient-to-r from-amber-400 to-amber-600", gradient: "from-violet-400/60 to-purple-600/60" },
  ];
}
