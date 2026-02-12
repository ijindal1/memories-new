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
  return res.json();
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

export function getResults() {
  return apiFetch("/api/results");
}

export function postEvents(events) {
  return apiFetch("/api/events", {
    method: "POST",
    body: JSON.stringify({ events }),
  });
}
