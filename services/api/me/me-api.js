import { apiClient } from "@/lib/api-client";

/**
 * GET /me/profile  (API.md §3.5.1)
 * Any authenticated user, self-scoped.
 * Returns { user, profile }. `profile.avatar_url` is a short-lived (1h)
 * presigned GET URL, null if no photo set. All profile fields are null
 * until the user sets them.
 */
export async function fetchMyProfile({ token }) {
  return apiClient("/me/profile", { token });
}

/**
 * PATCH /me/profile  (API.md §3.5.2)
 * Body: any subset of first_name, last_name, phone, country, time_zone,
 * preferred_language, company_name, job_title, department,
 * years_experience (int 0-80), linkedin_url (valid URL), avatar_key.
 * `email` is not accepted — it's read-only. Send null to clear a field.
 * Returns the same shape as fetchMyProfile (updated).
 */
export async function updateMyProfile({ token, data }) {
  return apiClient("/me/profile", { method: "PATCH", token, body: data });
}

/**
 * POST /me/profile/avatar-upload-url  (API.md §3.5.3)
 * Body: { content_type: "image/jpeg" | "image/png" | "image/webp" }
 * Returns { upload_url, avatar_key, method, headers, expires_in } — a
 * presigned PUT URL for direct-to-storage upload. The API never receives
 * the file bytes.
 */
export async function getAvatarUploadUrl({ token, contentType }) {
  return apiClient("/me/profile/avatar-upload-url", {
    method: "POST",
    token,
    body: { content_type: contentType },
  });
}

/**
 * PUT the raw file bytes to the presigned URL from getAvatarUploadUrl.
 * Deliberately bypasses apiClient — this is a different origin (object
 * storage), needs no Authorization header or credentials, and must send
 * exactly the headers the presign call returned.
 */
export async function uploadAvatarFile({ uploadUrl, headers, file }) {
  const res = await fetch(uploadUrl, { method: "PUT", headers, body: file });
  if (!res.ok) throw new Error("Failed to upload photo. Please try again.");
}
