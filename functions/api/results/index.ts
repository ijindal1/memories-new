import type { Env, UserData } from "../../types";

// POST /api/results — save a quiz result (upserts user first)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const user = context.data.user as UserData | undefined;
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { app_slug, dimensions, generated_prompt, answers } = body;

  if (!app_slug || !dimensions || !generated_prompt || !answers) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = context.env.DB;
  try {
    // Upsert user
    await db
      .prepare(
        `INSERT INTO users (id, email, name) VALUES (?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET email = excluded.email, name = excluded.name, updated_at = datetime('now')`
      )
      .bind(user.sub, user.email ?? null, user.name ?? null)
      .run();

    // Insert quiz result
    const result = await db
      .prepare(
        `INSERT INTO quiz_results (user_id, app_slug, dimensions, generated_prompt, answers)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(
        user.sub,
        app_slug,
        JSON.stringify(dimensions),
        generated_prompt,
        JSON.stringify(answers)
      )
      .run();

    return Response.json({ success: true, id: result.meta.last_row_id });
  } catch (error) {
    console.error("[results] Failed to save quiz result", {
      userSub: user.sub,
      appSlug: app_slug,
      error,
    });
    return Response.json({ error: "Failed to save result" }, { status: 500 });
  }
};

// GET /api/results — list all results for authenticated user
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const user = context.data.user as UserData | undefined;
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { results } = await context.env.DB
    .prepare(
      `SELECT id, app_slug, dimensions, generated_prompt, answers, created_at
       FROM quiz_results WHERE user_id = ? ORDER BY created_at DESC`
    )
    .bind(user.sub)
    .all();

  return Response.json({ results });
};
