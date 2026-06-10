import { apiClient } from "@/lib/api-client";

/**
 * GET /lms/dashboard?user_id=X
 */
export async function fetchDashboard({ token, userId }) {
  return apiClient(`/lms/dashboard?user_id=${userId}`, { token });
}

/**
 * GET /lms/courses?user_id=X
 * Returns { courses: [...] }
 */
export async function fetchMyCourses({ token, userId }) {
  return apiClient(`/lms/courses`, { token });
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
