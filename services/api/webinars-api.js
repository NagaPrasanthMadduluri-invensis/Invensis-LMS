import { apiClient } from "@/lib/api-client";

/** GET /webinars/current → { webinar } (the one the banner should show, or null). */
export async function fetchCurrentWebinar({ token }) {
  return apiClient("/webinars/current", { token });
}

/* ── Admin management ── */

export async function fetchWebinars({ token }) {
  return apiClient("/webinars", { token });
}

export async function createWebinar({ token, data }) {
  return apiClient("/webinars", { method: "POST", token, body: data });
}

export async function updateWebinar({ token, id, data }) {
  return apiClient(`/webinars/${id}`, { method: "PATCH", token, body: data });
}

export async function deleteWebinar({ token, id }) {
  return apiClient(`/webinars/${id}`, { method: "DELETE", token });
}
