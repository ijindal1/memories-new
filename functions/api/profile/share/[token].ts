import type { Env } from "../../../types";
import { decodeShareToken } from "../_helpers";

// GET /api/profile/share/:token — public read endpoint for a shared profile snapshot
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const token = context.params.token as string;
  const profile = decodeShareToken(token);

  if (!profile) {
    return Response.json({ error: "Invalid share token" }, { status: 400 });
  }

  return Response.json({ profile });
};
