import type { Env, UserData } from "../../types";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

interface UserRow {
  id: string;
  email: string | null;
  name: string | null;
  created_at: string;
  updated_at: string;
}

interface ResultRow {
  id: number;
  user_id: string;
  app_slug: string;
  dimensions: string | JsonValue;
  generated_prompt: string;
  answers: string | JsonValue;
  created_at: string;
}

function parseJsonField(value: string | JsonValue): JsonValue {
  if (typeof value !== "string") {
    return value;
  }

  try {
    return JSON.parse(value) as JsonValue;
  } catch {
    return value;
  }
}

function encodeUtf8Base64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeUtf8Base64Url(token: string): string {
  const padded = token.replace(/-/g, "+").replace(/_/g, "/");
  const padding = padded.length % 4 === 0 ? "" : "=".repeat(4 - (padded.length % 4));
  const binary = atob(padded + padding);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export function buildUserShape(user: UserData, dbUser: UserRow | null) {
  return {
    id: user.sub,
    email: dbUser?.email ?? user.email ?? null,
    name: dbUser?.name ?? user.name ?? null,
    created_at: dbUser?.created_at ?? null,
    updated_at: dbUser?.updated_at ?? null,
  };
}

export async function loadProfileData(env: Env, user: UserData) {
  const dbUser = await env.DB
    .prepare(`SELECT id, email, name, created_at, updated_at FROM users WHERE id = ? LIMIT 1`)
    .bind(user.sub)
    .first<UserRow>();

  const { results: rawResults } = await env.DB
    .prepare(
      `SELECT id, user_id, app_slug, dimensions, generated_prompt, answers, created_at
       FROM quiz_results
       WHERE user_id = ?
       ORDER BY created_at DESC, id DESC`
    )
    .bind(user.sub)
    .all<ResultRow>();

  const results = (rawResults ?? []).map((row) => ({
    id: row.id,
    user_id: row.user_id,
    app_slug: row.app_slug,
    dimensions: parseJsonField(row.dimensions),
    generated_prompt: row.generated_prompt,
    answers: parseJsonField(row.answers),
    created_at: row.created_at,
  }));

  const appMap = new Map<
    string,
    {
      app_slug: string;
      attempts: number;
      latest_result: (typeof results)[number];
    }
  >();

  for (const result of results) {
    const existing = appMap.get(result.app_slug);
    if (!existing) {
      appMap.set(result.app_slug, {
        app_slug: result.app_slug,
        attempts: 1,
        latest_result: result,
      });
      continue;
    }
    existing.attempts += 1;
  }

  const apps = Array.from(appMap.values()).sort((a, b) => a.app_slug.localeCompare(b.app_slug));

  return {
    user: buildUserShape(user, dbUser ?? null),
    totals: {
      results: results.length,
      apps_completed: apps.length,
    },
    latest_result_at: results[0]?.created_at ?? null,
    apps,
    results,
  };
}

export function buildSharePayload(profile: Awaited<ReturnType<typeof loadProfileData>>) {
  return {
    generated_at: new Date().toISOString(),
    user: {
      name: profile.user.name,
    },
    totals: profile.totals,
    latest_result_at: profile.latest_result_at,
    apps: profile.apps.map((app) => ({
      app_slug: app.app_slug,
      attempts: app.attempts,
      latest_result: {
        created_at: app.latest_result.created_at,
        dimensions: app.latest_result.dimensions,
      },
    })),
  };
}

export function encodeShareToken(payload: ReturnType<typeof buildSharePayload>) {
  return encodeUtf8Base64Url(JSON.stringify(payload));
}

export function decodeShareToken(token: string): ReturnType<typeof buildSharePayload> | null {
  try {
    const decoded = decodeUtf8Base64Url(token);
    return JSON.parse(decoded) as ReturnType<typeof buildSharePayload>;
  } catch {
    return null;
  }
}
