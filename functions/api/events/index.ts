import type { Env, UserData } from "../../types";

// POST /api/events — batch insert events (auth optional)
export const onRequestPost: PagesFunction<Env> = async (context) => {
  let body: any;
  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { events } = body;

  if (!Array.isArray(events) || events.length === 0) {
    return Response.json({ error: "Events array required" }, { status: 400 });
  }

  if (events.length > 50) {
    return Response.json({ error: "Max 50 events per request" }, { status: 400 });
  }

  const user = context.data.user as UserData | undefined;
  const db = context.env.DB;

  const stmt = db.prepare(
    `INSERT INTO events (user_id, event_type, app_slug, payload) VALUES (?, ?, ?, ?)`
  );

  const batch = events.map((e: any) =>
    stmt.bind(
      user?.sub ?? null,
      e.event_type,
      e.app_slug ?? null,
      e.payload ? JSON.stringify(e.payload) : null
    )
  );

  await db.batch(batch);

  return Response.json({ success: true, count: events.length });
};
