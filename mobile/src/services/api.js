import { API_BASE_URL } from "../config";
import { getToken } from "./auth";

async function request(path, options) {
  const token = await getToken();
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export function getMe() {
  return request("/api/me");
}

export function listRuns() {
  return request("/api/runs");
}

export function getRun(id) {
  return request(`/api/runs/${id}`);
}

export function createRun(run) {
  return request("/api/runs", {
    method: "POST",
    body: JSON.stringify(run),
  });
}

export function deleteRun(id) {
  return request(`/api/runs/${id}`, { method: "DELETE" });
}
