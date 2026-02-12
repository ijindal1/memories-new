import { getSessionToken } from "@descope/react-sdk";

async function apiFetch(path, options = {}) {
  const token = getSessionToken();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(path, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
  return data;
}

export function saveResult({ app_slug, dimensions, generated_prompt, answers }) {
  return apiFetch("/api/results", {
    method: "POST",
    body: JSON.stringify({ app_slug, dimensions, generated_prompt, answers }),
  });
}

export function getResultByApp(appSlug) {
  return apiFetch(`/api/results/${appSlug}`);
}

export function getResultHistoryByApp(appSlug) {
  return apiFetch(`/api/results/${appSlug}/history`);
}

export function getResults() {
  return apiFetch("/api/results");
}

export function getProfile() {
  return apiFetch("/api/profile");
}

export function getProfileShareLink() {
  return apiFetch("/api/profile/share");
}

export function getSharedProfile(token) {
  return apiFetch(`/api/profile/share/${token}`);
}

export function postEvents(events) {
  return apiFetch("/api/events", {
    method: "POST",
    body: JSON.stringify({ events }),
  });
}
