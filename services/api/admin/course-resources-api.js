import { apiClient } from "@/lib/api-client";

/* ──────────────────────────────────────────────────────────
   COURSE CATALOGUE + COURSE RESOURCES  (Server: /api/courses)
   ──────────────────────────────────────────────────────────
   Courses are a local mirror of the CMS (synced on demand). Resources are
   admin-uploaded courseware stored in R2:
     • predefined  → attached to a course (Course Catalog)
     • supplementary → attached to a training run (Training detail)
   Files upload directly to R2 via a short-lived presigned PUT; the API only
   ever stores metadata. External links carry a URL instead of a file.
   ────────────────────────────────────────────────────────── */

/* ── Catalogue ── */

/** GET /courses → { courses: [...] } (local mirror). */
export async function fetchCourses({ token }) {
  return apiClient("/courses", { token });
}

/** POST /courses/sync → pull the catalogue from the CMS. */
export async function syncCourses({ token }) {
  return apiClient("/courses/sync", { method: "POST", token });
}

/** GET /courses/:courseRef → { course }. `courseRef` = slug or UUID. */
export async function fetchCourse({ token, courseRef }) {
  return apiClient(`/courses/${courseRef}`, { token });
}

/* ── Predefined resources (per course) ── */

export async function fetchCourseResources({ token, courseRef }) {
  return apiClient(`/courses/${courseRef}/resources`, { token });
}

/* ── Supplementary resources (per training run) ── */

export async function fetchTrainingResources({ token, trainingRef }) {
  return apiClient(`/courses/trainings/${trainingRef}/resources`, { token });
}

/* ── Shared resource ops ── */

export async function updateResource({ token, resourceId, data }) {
  return apiClient(`/courses/resources/${resourceId}`, { method: "PATCH", token, body: data });
}

export async function deleteResource({ token, resourceId }) {
  return apiClient(`/courses/resources/${resourceId}`, { method: "DELETE", token });
}

/* ── Enrolled-learner / trainer read ── */

/** GET /courses/my/trainings/:trainingRef/resources → { predefined, supplementary }. */
export async function fetchMyTrainingResources({ token, trainingRef }) {
  return apiClient(`/courses/my/trainings/${trainingRef}/resources`, { token });
}

/* ──────────────────────────────────────────────────────────
   Upload orchestration — presign → PUT to R2 → save metadata.
   `scope` is "course" (predefined) or "training" (supplementary).
   ────────────────────────────────────────────────────────── */

function uploadBase(scope, ref) {
  return scope === "training"
    ? `/courses/trainings/${ref}/resources`
    : `/courses/${ref}/resources`;
}

// Coarse resource type from a File, matching the server's resource_type enum.
const EXT_TYPE = {
  pdf: "pdf",
  zip: "zip", rar: "zip", "7z": "zip",
  doc: "word", docx: "word",
  xls: "excel", xlsx: "excel", csv: "excel",
  ppt: "ppt", pptx: "ppt",
  mp4: "video", mov: "video", avi: "video", mkv: "video", webm: "video",
  png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image",
};
export function inferType(fileName = "") {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return EXT_TYPE[ext] || "other";
}

/**
 * Upload a file resource: get a presigned URL, PUT the bytes straight to R2,
 * then persist the metadata row.
 * @param {File} file
 * @param {(pct:number)=>void} [onProgress]
 */
export async function uploadFileResource({ token, scope, ref, file, title, description }) {
  const presign = await apiClient(`${uploadBase(scope, ref)}/upload-url`, {
    method: "POST",
    token,
    body: { file_name: file.name, content_type: file.type || "application/octet-stream" },
  });

  const putRes = await fetch(presign.upload_url, {
    method: "PUT",
    headers: presign.headers || { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!putRes.ok) throw new Error("Upload to storage failed. Please try again.");

  return apiClient(uploadBase(scope, ref), {
    method: "POST",
    token,
    body: {
      title,
      description: description || null,
      type: inferType(file.name),
      storage_key: presign.storage_key,
      file_name: file.name,
      file_size: file.size,
      content_type: file.type || "application/octet-stream",
    },
  });
}

/** Create an external-link resource (e.g. a hosted video). */
export async function createLinkResource({ token, scope, ref, title, description, url }) {
  return apiClient(uploadBase(scope, ref), {
    method: "POST",
    token,
    body: { title, description: description || null, type: "link", external_url: url },
  });
}
