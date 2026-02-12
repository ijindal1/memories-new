import type { Env, UserData } from "../../types";
import { loadProfileData } from "./_helpers";

// GET /api/profile — combined profile across all completed apps for authenticated user
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const user = context.data.user as UserData | undefined;
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await loadProfileData(context.env, user);
  return Response.json({ profile });
};
