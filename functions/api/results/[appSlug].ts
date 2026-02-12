import type { Env, UserData } from "../../types";

// GET /api/results/:appSlug — get latest result for a specific app
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const user = context.data.user as UserData | undefined;
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const appSlug = context.params.appSlug as string;

  const result = await context.env.DB
    .prepare(
      `SELECT id, app_slug, dimensions, generated_prompt, answers, created_at
       FROM quiz_results WHERE user_id = ? AND app_slug = ?
       ORDER BY created_at DESC LIMIT 1`
    )
    .bind(user.sub, appSlug)
    .first();

  if (!result) {
    return Response.json({ result: null });
  }

  return Response.json({ result });
};
